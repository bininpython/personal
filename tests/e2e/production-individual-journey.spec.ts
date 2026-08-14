import { expect, test, type Locator } from '@playwright/test';

test.skip(process.env.RUN_PRODUCTION_E2E !== '1', 'Executado manualmente apenas contra a produção.');
test.setTimeout(180_000);

async function fillStable(field: Locator, value: string) {
  await expect(field).toBeVisible();
  await field.page().waitForTimeout(1_500);
  await field.fill(value);
  await expect(field).toHaveValue(value);
}

async function completeIndividualTutorial(page: import('@playwright/test').Page) {
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Monte sua própria rotina' })).toBeVisible({ timeout: 20_000 });
  const steps: string[] = [];

  for (let index = 0; index < 12; index += 1) {
    const heading = (await dialog.locator('h2').last().textContent())?.trim();
    if (heading && !steps.includes(heading)) steps.push(heading);
    const next = dialog.getByRole('button', { name: 'Próximo' });
    if (!(await next.isVisible().catch(() => false))) break;
    await next.click();
  }

  await dialog.getByRole('button', { name: 'Montar minha primeira ficha' }).click();
  await expect(dialog).toBeHidden();
  return steps;
}

test('jornada real da conta individual', async ({ browser, baseURL }, testInfo) => {
  expect(baseURL).toMatch(/^https:\/\//);
  const stamp = Date.now().toString().slice(-9);
  const name = `Individual QA ${stamp}`;
  const email = `qa.individual.${stamp}@example.com`;
  const password = `Qa${stamp}!individual`;
  const planName = `Ficha Individual QA ${stamp}`;
  const endDate = new Date(Date.now() + 35 * 86_400_000).toISOString().slice(0, 10);
  const report = { tutorialSteps: [] as string[], checkedRoutes: [] as string[], errors: [] as string[] };
  const context = await browser.newContext({ baseURL, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
  const page = await context.newPage();
  let created = false;

  page.on('pageerror', (error) => report.errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 500) report.errors.push(`${response.status()} ${response.url()}`);
  });

  try {
    console.log('[produção] cadastro individual');
    await page.goto('/register/individual', { waitUntil: 'networkidle' });
    await page.locator('#full_name').fill(name);
    await page.locator('#email').fill(email);
    await page.locator('#goal').fill('Condicionamento');
    await page.locator('#level').selectOption('intermediate');
    await page.locator('#password').fill(password);
    await page.locator('input[type="checkbox"]').check();
    const [registration] = await Promise.all([
      page.waitForResponse((response) => (
        response.url().endsWith('/api/auth/individual/register') && response.request().method() === 'POST'
      ), { timeout: 20_000 }),
      page.getByRole('button', { name: 'Criar minha área G KONG' }).click(),
    ]);
    console.log(`[produção] resposta do cadastro individual: ${registration.status()}`);
    expect(registration.status()).toBe(201);
    created = true;
    await page.waitForURL('**/my', { timeout: 20_000 });
    report.tutorialSteps = await completeIndividualTutorial(page);

    const exerciseResponse = await context.request.get('/api/exercises?search=supino');
    expect(exerciseResponse.status()).toBe(200);
    const exerciseData = await exerciseResponse.json() as { exercises: Array<{ key: string }> };
    expect(exerciseData.exercises.length).toBeGreaterThan(0);
    const planResponse = await context.request.post('/api/individual/workout-plans', { data: {
      name: planName,
      goal: 'Validar a área individual',
      daysPerWeek: 2,
      endDate,
      days: [{
        label: 'A',
        name: 'Treino Individual QA A',
        exercises: [{
          exerciseKey: exerciseData.exercises[0].key,
          sets: 1,
          reps: '10',
          restTime: 0,
          method: 'rest_pause',
          methodNotes: 'Pausa curta entre os miniblocos.',
        }],
      }, {
        label: 'B',
        name: 'Treino Individual QA B',
        exercises: [{
          exerciseKey: exerciseData.exercises[0].key,
          sets: 1,
          reps: '12',
          restTime: 0,
          method: 'traditional',
          methodNotes: 'Execução controlada.',
        }],
      }],
    } });
    console.log(`[produção] resposta da ficha individual: ${planResponse.status()}`);
    expect(planResponse.status()).toBe(201);
    const plan = await planResponse.json() as { plan: { id: string } };

    await page.goto('/my-plans', { waitUntil: 'networkidle' });
    await expect(page.getByText(planName).first()).toBeVisible();
    await expect(page.locator(`a[download][href="/api/individual/workout-plans/${plan.plan.id}/pdf"]`).first()).toBeVisible();
    const pdf = await context.request.get(`/api/individual/workout-plans/${plan.plan.id}/pdf`);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()['content-type']).toContain('application/pdf');
    expect(pdf.headers()['content-disposition']).toContain('individual-qa');
    const pdfBody = await pdf.body();
    expect(pdfBody.subarray(0, 4).toString()).toBe('%PDF');
    await testInfo.attach('ficha-individual.pdf', { body: pdfBody, contentType: 'application/pdf' });

    const activeWorkoutResponse = await context.request.get('/api/individual/workout');
    expect(activeWorkoutResponse.status()).toBe(200);
    const activeWorkout = await activeWorkoutResponse.json() as {
      plan: {
        week: { nextWorkoutDayId: string; completedToday: boolean };
        days: Array<{ id: string; label: string; exercises: Array<{ id: string; sets: number }> }>;
      };
    };
    const workoutA = activeWorkout.plan.days.find((day) => day.label === 'A');
    const workoutB = activeWorkout.plan.days.find((day) => day.label === 'B');
    expect(workoutA).toBeTruthy();
    expect(workoutB).toBeTruthy();
    expect(activeWorkout.plan.week.nextWorkoutDayId).toBe(workoutA!.id);

    const completedAt = new Date();
    const startedAt = new Date(completedAt.getTime() - 60_000);
    const workoutSessionResponse = await context.request.post('/api/individual/workout-sessions', { data: {
      clientSessionId: crypto.randomUUID(),
      workoutDayId: workoutA!.id,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationSeconds: 60,
      rating: 5,
      feedback: 'Validação automatizada da rotação individual.',
      exercises: workoutA!.exercises.map((exercise) => ({
        workoutExerciseId: exercise.id,
        sets: Array.from({ length: exercise.sets }, (_, index) => ({
          setNumber: index + 1,
          completed: true,
          performedRepetitions: 10,
          performedLoad: 20,
          rpe: 8,
        })),
      })),
    } });
    expect(workoutSessionResponse.status()).toBe(201);

    const rotatedWorkoutResponse = await context.request.get('/api/individual/workout');
    expect(rotatedWorkoutResponse.status()).toBe(200);
    const rotatedWorkout = await rotatedWorkoutResponse.json() as {
      plan: { week: { nextWorkoutDayId: string; completedToday: boolean } };
    };
    expect(rotatedWorkout.plan.week.nextWorkoutDayId).toBe(workoutB!.id);
    expect(rotatedWorkout.plan.week.completedToday).toBe(true);

    const historyResponse = await context.request.get('/api/individual/workout-sessions');
    expect(historyResponse.status()).toBe(200);
    const history = await historyResponse.json() as { summary: { completedWorkouts: number } };
    expect(history.summary.completedWorkouts).toBe(1);

    await page.goto('/my-workout', { waitUntil: 'networkidle' });
    await expect(page.getByText('Próxima ficha do dia: Ficha B')).toBeVisible();
    await page.goto('/my-history', { waitUntil: 'networkidle' });
    await expect(page.getByText('Treino Individual QA A')).toBeVisible();

    const dataExport = await context.request.get('/api/account/export');
    expect(dataExport.status()).toBe(200);
    for (const route of ['/my', '/my-workout', '/my-history', '/my-exercises', '/my-plans', '/my-profile']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).not.toContainText('Erro interno do servidor');
      report.checkedRoutes.push(route);
    }

    const loginContext = await browser.newContext({ baseURL, locale: 'pt-BR' });
    const loginPage = await loginContext.newPage();
    console.log('[produção] novo login individual');
    await loginPage.goto('/login/individual', { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await fillStable(loginPage.locator('#email'), email);
    await fillStable(loginPage.locator('#password'), password);
    const [login] = await Promise.all([
      loginPage.waitForResponse((response) => (
        response.url().endsWith('/api/auth/individual/login') && response.request().method() === 'POST'
      ), { timeout: 20_000 }),
      loginPage.getByRole('button', { name: 'Entrar na minha área' }).click(),
    ]);
    console.log(`[produção] resposta do novo login individual: ${login.status()}`);
    expect(login.status()).toBe(200);
    await loginPage.waitForURL('**/my', { timeout: 20_000 });
    await expect(loginPage.getByText(name).first()).toBeVisible();
    expect(report.errors, report.errors.join('\n')).toEqual([]);
  } finally {
    if (created) {
      const deletion = await context.request.delete('/api/account', {
        data: { confirmation: name },
        timeout: 30_000,
      });
      expect(deletion.status(), 'A conta individual de QA deve ser removida.').toBe(200);
    }
    await testInfo.attach('production-individual-report.json', {
      body: Buffer.from(JSON.stringify(report, null, 2)),
      contentType: 'application/json',
    });
  }
});
