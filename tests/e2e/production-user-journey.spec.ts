import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test';

test.skip(process.env.RUN_PRODUCTION_E2E !== '1', 'Executado manualmente apenas contra a produção.');
test.setTimeout(600_000);

interface JourneyReport {
  trainerTutorialSteps: string[];
  studentTutorialSteps: string[];
  individualTutorialSteps: string[];
  checkedRoutes: string[];
  runtimeErrors: string[];
}

function monitor(page: Page, label: string, report: JourneyReport) {
  page.on('pageerror', (error) => report.runtimeErrors.push(`${label}: ${error.message}`));
  page.on('response', (response) => {
    if (response.status() >= 500) {
      report.runtimeErrors.push(`${label}: ${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });
}

async function gotoReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toBeVisible();
}

async function fillStable(field: Locator, value: string) {
  await expect(field).toBeVisible();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await field.fill(value);
    await field.page().waitForTimeout(350);
    if ((await field.inputValue()) === value) return;
  }
  await expect(field).toHaveValue(value);
}

async function completeTutorial(page: Page, title: string, startLabel: string) {
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: title })).toBeVisible({ timeout: 20_000 });
  const steps: string[] = [];

  for (let index = 0; index < 12; index += 1) {
    const stepHeading = dialog.locator('h2').last();
    const heading = (await stepHeading.textContent())?.trim();
    if (heading && !steps.includes(heading)) steps.push(heading);

    const next = dialog.getByRole('button', { name: 'Próximo' });
    if (!(await next.isVisible().catch(() => false))) break;
    await next.click();
  }

  await dialog.getByRole('button', { name: startLabel }).click();
  await expect(dialog).toBeHidden();
  return steps;
}

async function verifyPdf(context: BrowserContext, path: string) {
  const response = await context.request.get(path);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
  const body = await response.body();
  expect(body.subarray(0, 4).toString()).toBe('%PDF');
}

async function visitRoutes(page: Page, routes: string[], report: JourneyReport) {
  for (const route of routes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText('Erro interno do servidor');
    report.checkedRoutes.push(route);
  }
}

test('jornada real de personal, aluno vinculado e atleta individual', async ({ browser, baseURL }, testInfo) => {
  expect(baseURL).toMatch(/^https:\/\//);
  const stamp = Date.now().toString().slice(-9);
  const trainerName = `Personal QA ${stamp}`;
  const trainerPassword = `Qa${stamp}!forte`;
  const studentName = `Aluno QA ${stamp}`;
  const secondStudentName = `Aluno Destino QA ${stamp}`;
  const individualName = `Individual QA ${stamp}`;
  const individualEmail = `qa.individual.${stamp}@example.com`;
  const individualPassword = `Qa${stamp}!individual`;
  const planName = `Ficha QA ${stamp}`;
  const individualPlanName = `Ficha Individual QA ${stamp}`;
  const endDate = new Date(Date.now() + 35 * 86_400_000).toISOString().slice(0, 10);
  const report: JourneyReport = {
    trainerTutorialSteps: [],
    studentTutorialSteps: [],
    individualTutorialSteps: [],
    checkedRoutes: [],
    runtimeErrors: [],
  };

  let trainerContext: BrowserContext | null = null;
  let studentContext: BrowserContext | null = null;
  let individualContext: BrowserContext | null = null;
  let trainerCreated = false;
  let individualCreated = false;

  try {
    trainerContext = await browser.newContext({ baseURL, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
    const trainerPage = await trainerContext.newPage();
    monitor(trainerPage, 'personal', report);
    console.log('[produção] cadastro do personal');
    await gotoReady(trainerPage, '/register');
    await trainerPage.locator('#full_name').fill(trainerName);
    await trainerPage.locator('#city').fill('Goiânia');
    await trainerPage.locator('#nickname').fill(`QA ${stamp}`);
    await trainerPage.locator('#age').fill('30');
    await trainerPage.locator('#password').fill(trainerPassword);
    await trainerPage.locator('input[type="checkbox"]').check();
    const [trainerRegistration] = await Promise.all([
      trainerPage.waitForResponse((response) => (
        response.url().endsWith('/api/auth/trainer/register') && response.request().method() === 'POST'
      ), { timeout: 20_000 }),
      trainerPage.getByRole('button', { name: 'Criar conta e gerar código' }).click(),
    ]);
    expect(trainerRegistration.status()).toBe(201);
    const trainer = await trainerRegistration.json() as { access_code: string; user: { id: string } };
    trainerCreated = true;
    await expect(trainerPage.getByText('Seu código G KONG')).toBeVisible();
    await trainerPage.getByRole('button', { name: 'Acessar meu painel' }).click();
    await trainerPage.waitForURL('**/dashboard');
    console.log('[produção] tutorial do personal');
    report.trainerTutorialSteps = await completeTutorial(
      trainerPage,
      'Coloque sua operação para rodar',
      'Cadastrar primeiro aluno',
    );

    await trainerPage.locator('#full_name').fill(studentName);
    await trainerPage.locator('#nickname').fill('Aluno QA');
    await trainerPage.locator('textarea').fill('Cadastro temporário para validação de produção.');
    await trainerPage.locator('input[type="checkbox"]').check();
    console.log('[produção] cadastro do aluno vinculado');
    const [studentRegistration] = await Promise.all([
      trainerPage.waitForResponse((response) => (
        response.url().endsWith('/api/students') && response.request().method() === 'POST'
      ), { timeout: 20_000 }),
      trainerPage.getByRole('button', { name: 'Cadastrar e gerar código' }).click(),
    ]);
    expect(studentRegistration.status()).toBe(201);
    const firstStudent = await studentRegistration.json() as {
      student: { id: string; access_code: string };
    };
    await expect(trainerPage.getByText('Aluno cadastrado!', { exact: true })).toBeVisible();

    const secondStudentResponse = await trainerContext.request.post('/api/students', { data: {
      full_name: secondStudentName,
      nickname: 'Destino QA',
      notes: 'Recebe a cópia da ficha no teste de produção.',
      experience_level: 'beginner',
      gender: 'other',
      privacy_consent: true,
    } });
    expect(secondStudentResponse.status()).toBe(201);

    const exercisesResponse = await trainerContext.request.get('/api/exercises?search=supino');
    expect(exercisesResponse.status()).toBe(200);
    const exercises = await exercisesResponse.json() as { exercises: Array<{ key: string }> };
    expect(exercises.exercises.length).toBeGreaterThan(0);
    const exerciseKey = exercises.exercises[0].key;

    const planResponse = await trainerContext.request.post('/api/workout-plans', { data: {
      studentId: firstStudent.student.id,
      name: planName,
      goal: 'Validar a jornada profissional',
      daysPerWeek: 1,
      endDate,
      days: [{
        label: 'A',
        name: 'Treino A QA',
        exercises: [{
          exerciseKey,
          sets: 1,
          reps: '8',
          restTime: 0,
          method: 'dropset',
          methodNotes: 'Reduzir 20% da carga na última série.',
        }],
      }],
    } });
    expect(planResponse.status()).toBe(201);
    console.log('[produção] ficha, PDF e envio para outro aluno');
    const createdPlan = await planResponse.json() as { plan: { id: string } };

    await trainerPage.goto('/workouts');
    await expect(trainerPage.getByText(planName).first()).toBeVisible();
    await expect(trainerPage.getByRole('button', { name: 'PDF' }).first()).toBeVisible();
    await verifyPdf(trainerContext, `/api/workout-plans/${createdPlan.plan.id}/pdf`);

    await trainerPage.getByRole('button', { name: 'Enviar' }).first().click();
    const copyDialog = trainerPage.getByRole('dialog');
    await copyDialog.getByRole('combobox').click();
    await trainerPage.getByRole('option', { name: secondStudentName }).click();
    const copyPromise = trainerPage.waitForResponse((response) => (
      response.url().endsWith(`/api/workout-plans/${createdPlan.plan.id}/copy`)
      && response.request().method() === 'POST'
    ));
    await copyDialog.getByRole('button', { name: 'Enviar e publicar' }).click();
    expect((await copyPromise).status()).toBe(201);
    await expect(copyDialog).toBeHidden();

    const trainerExport = await trainerContext.request.get('/api/account/export');
    expect(trainerExport.status()).toBe(200);
    expect(trainerExport.headers()['content-type']).toContain('application/json');

    const trainerLoginContext = await browser.newContext({ baseURL, locale: 'pt-BR' });
    const trainerLoginPage = await trainerLoginContext.newPage();
    monitor(trainerLoginPage, 'login do personal', report);
    console.log('[produção] novo login do personal');
    await trainerLoginPage.goto('/login/trainer', { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await expect(trainerLoginPage.locator('#name')).toBeVisible();
    await trainerLoginPage.waitForTimeout(1_500);
    await fillStable(trainerLoginPage.locator('#name'), trainerName);
    await fillStable(trainerLoginPage.locator('#access_code'), trainer.access_code);
    await expect(trainerLoginPage.locator('#name')).toHaveValue(trainerName);
    await expect(trainerLoginPage.locator('#access_code')).toHaveValue(trainer.access_code.replace(/\D/g, '').replace(/(\d{3})(\d{3})/, '$1-$2'));
    const [trainerLoginResponse] = await Promise.all([
      trainerLoginPage.waitForResponse((response) => (
        response.url().endsWith('/api/auth/trainer/login') && response.request().method() === 'POST'
      ), { timeout: 20_000 }),
      trainerLoginPage.getByRole('button', { name: 'Entrar como personal' }).click(),
    ]);
    console.log(`[produção] resposta do novo login do personal: ${trainerLoginResponse.status()}`);
    expect(trainerLoginResponse.status()).toBe(200);
    await trainerLoginPage.waitForURL('**/dashboard', { timeout: 20_000 });
    await expect(trainerLoginPage.getByText(trainerName).first()).toBeVisible();

    studentContext = await browser.newContext({
      baseURL,
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
      viewport: { width: 390, height: 844 },
    });
    const studentPage = await studentContext.newPage();
    monitor(studentPage, 'aluno', report);
    console.log('[produção] login, ativação e treino do aluno');
    await studentPage.goto('/login/student', { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await expect(studentPage.locator('#name')).toBeVisible();
    await studentPage.waitForTimeout(1_500);
    await fillStable(studentPage.locator('#name'), studentName);
    await fillStable(studentPage.locator('#access_code'), firstStudent.student.access_code);
    await expect(studentPage.locator('#name')).toHaveValue(studentName);
    const [studentLoginResponse] = await Promise.all([
      studentPage.waitForResponse((response) => (
        response.url().endsWith('/api/auth/student/login') && response.request().method() === 'POST'
      ), { timeout: 20_000 }),
      studentPage.getByRole('button', { name: 'Abrir meu treino' }).click(),
    ]);
    console.log(`[produção] resposta do login do aluno: ${studentLoginResponse.status()}`);
    expect(studentLoginResponse.status()).toBe(200);
    const onboardingResponse = await studentContext.request.patch(`/api/students/${firstStudent.student.id}`, { data: {
      gender: 'other',
      experience_level: 'beginner',
      goal: 'Condicionamento',
      restrictions: '',
      privacy_consent: true,
      terms_accepted: true,
    } });
    console.log(`[produção] resposta da ativação do aluno: ${onboardingResponse.status()}`);
    expect(onboardingResponse.status()).toBe(200);
    await gotoReady(studentPage, '/home');
    report.studentTutorialSteps = await completeTutorial(
      studentPage,
      'Seu treino, passo a passo',
      'Abrir meu treino',
    );
    await studentPage.waitForURL('**/workout', { timeout: 20_000 });
    await expect(studentPage.getByText(planName).first()).toBeVisible();
    const studentPdfLink = studentPage.locator(`a[download][href="/api/workout-plans/${createdPlan.plan.id}/pdf"]`);
    await expect(studentPdfLink).toBeVisible();
    await verifyPdf(studentContext, `/api/workout-plans/${createdPlan.plan.id}/pdf`);

    await studentPage.getByLabel('Repetições da série 1').fill('8');
    await studentPage.getByLabel('Carga da série 1').fill('10');
    await studentPage.getByLabel('RPE da série 1').fill('6');
    await studentPage.getByRole('button', { name: 'Série 1' }).click();
    await studentPage.getByRole('button', { name: '4 estrela(s)' }).click();
    const [completeWorkoutResponse] = await Promise.all([
      studentPage.waitForResponse((response) => (
        response.url().endsWith('/api/workout-sessions') && response.request().method() === 'POST'
      ), { timeout: 20_000 }),
      studentPage.getByRole('button', { name: 'Concluir e salvar treino' }).click(),
    ]);
    expect(completeWorkoutResponse.status()).toBe(201);
    await expect(studentPage.getByRole('heading', { name: /Treino concluído hoje|Meta deste treino concluída/ })).toBeVisible();

    const studentExport = await studentContext.request.get('/api/account/export');
    expect(studentExport.status()).toBe(200);
    await visitRoutes(studentPage, ['/home', '/history', '/progress', '/student-messages', '/profile'], report);

    individualContext = await browser.newContext({ baseURL, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
    const individualPage = await individualContext.newPage();
    monitor(individualPage, 'individual', report);
    console.log('[produção] cadastro e ficha individual');
    await gotoReady(individualPage, '/register/individual');
    await individualPage.locator('#full_name').fill(individualName);
    await individualPage.locator('#email').fill(individualEmail);
    await individualPage.locator('#goal').fill('Condicionamento');
    await individualPage.locator('#level').selectOption('intermediate');
    await individualPage.locator('#password').fill(individualPassword);
    await individualPage.locator('input[type="checkbox"]').check();
    const [individualRegistration] = await Promise.all([
      individualPage.waitForResponse((response) => (
        response.url().endsWith('/api/auth/individual/register') && response.request().method() === 'POST'
      ), { timeout: 20_000 }),
      individualPage.getByRole('button', { name: 'Criar minha área G KONG' }).click(),
    ]);
    expect(individualRegistration.status()).toBe(201);
    individualCreated = true;
    await individualPage.waitForURL('**/my');
    report.individualTutorialSteps = await completeTutorial(
      individualPage,
      'Monte sua própria rotina',
      'Montar minha primeira ficha',
    );

    const individualPlanResponse = await individualContext.request.post('/api/individual/workout-plans', { data: {
      name: individualPlanName,
      goal: 'Validar a área individual',
      daysPerWeek: 1,
      endDate,
      days: [{
        label: 'A',
        name: 'Treino Individual QA',
        exercises: [{ exerciseKey, sets: 1, reps: '10', restTime: 0, method: 'rest_pause', methodNotes: 'Pausa curta entre os miniblocos.' }],
      }],
    } });
    expect(individualPlanResponse.status()).toBe(201);
    const individualPlan = await individualPlanResponse.json() as { plan: { id: string } };
    await individualPage.goto('/my-plans');
    await expect(individualPage.getByText(individualPlanName).first()).toBeVisible();
    await expect(individualPage.locator(`a[download][href="/api/individual/workout-plans/${individualPlan.plan.id}/pdf"]`).first()).toBeVisible();
    await verifyPdf(individualContext, `/api/individual/workout-plans/${individualPlan.plan.id}/pdf`);
    const individualExport = await individualContext.request.get('/api/account/export');
    expect(individualExport.status()).toBe(200);
    await visitRoutes(individualPage, ['/my', '/my-exercises', '/my-plans', '/my-profile'], report);

    const individualLoginContext = await browser.newContext({ baseURL, locale: 'pt-BR' });
    const individualLoginPage = await individualLoginContext.newPage();
    monitor(individualLoginPage, 'login individual', report);
    console.log('[produção] novo login individual');
    await individualLoginPage.goto('/login/individual', { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await expect(individualLoginPage.locator('#email')).toBeVisible();
    await individualLoginPage.waitForTimeout(1_500);
    await fillStable(individualLoginPage.locator('#email'), individualEmail);
    await fillStable(individualLoginPage.locator('#password'), individualPassword);
    await expect(individualLoginPage.locator('#email')).toHaveValue(individualEmail);
    await expect(individualLoginPage.locator('#password')).toHaveValue(individualPassword);
    const [individualLoginResponse] = await Promise.all([
      individualLoginPage.waitForResponse((response) => (
        response.url().endsWith('/api/auth/individual/login') && response.request().method() === 'POST'
      ), { timeout: 20_000 }),
      individualLoginPage.getByRole('button', { name: 'Entrar na minha área' }).click(),
    ]);
    console.log(`[produção] resposta do novo login individual: ${individualLoginResponse.status()}`);
    expect(individualLoginResponse.status()).toBe(200);
    await individualLoginPage.waitForURL('**/my', { timeout: 20_000 });
    await expect(individualLoginPage.getByText(individualName).first()).toBeVisible();

    await visitRoutes(trainerPage, ['/dashboard', '/students', '/workouts', '/reports', '/messages', '/schedule', '/settings'], report);
    expect(report.runtimeErrors, report.runtimeErrors.join('\n')).toEqual([]);
  } finally {
    if (individualCreated && individualContext) {
      const deletion = await individualContext.request.delete('/api/account', {
        data: { confirmation: individualName },
        timeout: 30_000,
      });
      expect(deletion.status(), 'A conta individual de QA deve ser removida.').toBe(200);
    }
    if (trainerCreated && trainerContext) {
      const deletion = await trainerContext.request.delete('/api/account', {
        data: { confirmation: trainerName },
        timeout: 30_000,
      });
      expect(deletion.status(), 'A conta do personal de QA e seus alunos devem ser removidos.').toBe(200);
    }
    await testInfo.attach('production-journey-report.json', {
      body: Buffer.from(JSON.stringify(report, null, 2)),
      contentType: 'application/json',
    });
  }
});
