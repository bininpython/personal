import { writeFile } from 'node:fs/promises';
import { expect, test, type BrowserContext } from '@playwright/test';

test.skip(process.env.RUN_LIBRARY_E2E !== '1', 'Executado manualmente com o banco de validação.');
test.setTimeout(300_000);

async function expectPdf(context: BrowserContext, path: string) {
  const response = await context.request.get(path);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
  const bytes = await response.body();
  expect(bytes.subarray(0, 4).toString()).toBe('%PDF');
  return { bytes, headers: response.headers() };
}

async function closeTutorialIfVisible(page: import('@playwright/test').Page) {
  const closeButton = page.getByRole('button', { name: 'Fechar tutorial' });
  const appeared = await closeButton.waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true)
    .catch(() => false);
  if (appeared) {
    await closeButton.click();
    await expect(closeButton).toBeHidden();
  }
}

test('biblioteca respeita os acessos de personal, aluno e individual', async ({ browser, baseURL }, testInfo) => {
  const stamp = `${Date.now()}`.slice(-10);
  const trainerName = `Personal Biblioteca ${stamp}`;
  const studentName = `Aluno Biblioteca ${stamp}`;
  const individualName = `Individual Biblioteca ${stamp}`;
  const testIp = `198.51.${Number(stamp.slice(-4, -2)) + 1}.${Number(stamp.slice(-2)) + 1}`;
  const contextOptions = { baseURL, locale: 'pt-BR', extraHTTPHeaders: { 'x-forwarded-for': testIp } };
  const trainerContext = await browser.newContext(contextOptions);
  const studentContext = await browser.newContext(contextOptions);
  const individualContext = await browser.newContext(contextOptions);
  let trainerCreated = false;
  let individualCreated = false;

  try {
    const trainerRegistration = await trainerContext.request.post('/api/auth/trainer/register', {
      data: {
        full_name: trainerName,
        city: 'Goiânia',
        nickname: 'Biblioteca QA',
        password: `Qa!${stamp}`,
        age: 30,
        terms_accepted: true,
      },
    });
    expect(trainerRegistration.status()).toBe(201);
    trainerCreated = true;

    const studentCreation = await trainerContext.request.post('/api/students', {
      data: {
        full_name: studentName,
        nickname: 'Aluno QA',
        experience_level: 'beginner',
        gender: 'other',
        notes: 'Conta temporária para validar a Biblioteca.',
        privacy_consent: true,
      },
    });
    expect(studentCreation.status()).toBe(201);
    const student = await studentCreation.json() as { student: { id: string; access_code: string } };

    const trainerLibrary = await trainerContext.request.get('/api/workout-library');
    expect(trainerLibrary.status()).toBe(200);
    const trainerLibraryBody = await trainerLibrary.json() as {
      templates: Array<{ id: string; title: string; previewExercises: unknown[] }>;
    };
    expect(trainerLibraryBody.templates).toHaveLength(22);
    expect(trainerLibraryBody.templates.every((template) => template.previewExercises.length > 0)).toBe(true);
    const template = trainerLibraryBody.templates.find((item) => item.id === 'mulheres-hipertrofia-mes-01')
      ?? trainerLibraryBody.templates[0];

    const detail = await trainerContext.request.get(`/api/workout-library/${template.id}`);
    expect(detail.status()).toBe(200);
    const trainerPdf = await expectPdf(trainerContext, `/api/workout-library/${template.id}/pdf`);
    expect(trainerPdf.headers['content-disposition'].toLowerCase()).toContain('modelo-profissional');

    const assignment = await trainerContext.request.post(`/api/workout-library/${template.id}/assign`, {
      data: { studentId: student.student.id },
    });
    expect(assignment.status()).toBe(201);
    const assigned = await assignment.json() as { plan: { id: string } };

    const trainerPage = await trainerContext.newPage();
    await trainerPage.goto('/library', { waitUntil: 'domcontentloaded' });
    await closeTutorialIfVisible(trainerPage);
    await expect(trainerPage.getByRole('heading', { name: 'Biblioteca de fichas' })).toBeVisible();
    await expect(trainerPage.getByText('22 fichas prontas').first()).toBeVisible();

    const studentLogin = await studentContext.request.post('/api/auth/student/login', {
      data: { name: studentName, access_code: student.student.access_code, remember: false },
    });
    expect(studentLogin.status()).toBe(200);
    const onboarding = await studentContext.request.patch(`/api/students/${student.student.id}`, {
      data: {
        gender: 'other',
        experience_level: 'beginner',
        goal: 'Condicionamento',
        restrictions: '',
        privacy_consent: true,
        terms_accepted: true,
      },
    });
    expect(onboarding.status()).toBe(200);

    const studentLibrary = await studentContext.request.get('/api/workout-library');
    expect(studentLibrary.status()).toBe(200);
    const studentLibraryBody = await studentLibrary.json() as {
      assignments: Array<{ id: string; templateId: string; name: string }>;
    };
    expect(studentLibraryBody.assignments).toHaveLength(1);
    expect(studentLibraryBody.assignments[0]).toMatchObject({
      id: assigned.plan.id,
      templateId: template.id,
      name: template.title,
    });
    expect((await studentContext.request.get(`/api/workout-library/${template.id}`)).status()).toBe(401);
    expect((await studentContext.request.get(`/api/workout-library/${template.id}/pdf`)).status()).toBe(401);
    const studentPdf = await expectPdf(studentContext, `/api/workout-plans/${assigned.plan.id}/pdf`);
    expect(studentPdf.headers['content-disposition'].toLowerCase()).toContain('ficha');

    const studentPage = await studentContext.newPage();
    await studentPage.goto('/student-library', { waitUntil: 'domcontentloaded' });
    await closeTutorialIfVisible(studentPage);
    await expect(studentPage.getByRole('heading', { name: 'Biblioteca', exact: true })).toBeVisible();
    await expect(studentPage.getByText(template.title).first()).toBeVisible();
    await expect(studentPage.getByText('Acesso controlado pelo seu personal')).toBeVisible();

    const individualRegistration = await individualContext.request.post('/api/auth/individual/register', {
      data: {
        full_name: individualName,
        email: `biblioteca.${stamp}@example.com`,
        password: `Qa!${stamp}individual`,
        goal: 'Hipertrofia',
        level: 'intermediate',
        terms_accepted: true,
      },
    });
    expect(individualRegistration.status()).toBe(201);
    individualCreated = true;

    const individualLibrary = await individualContext.request.get('/api/workout-library');
    expect(individualLibrary.status()).toBe(200);
    expect(((await individualLibrary.json()) as { templates: unknown[] }).templates).toHaveLength(22);
    const individualPdf = await expectPdf(individualContext, `/api/workout-library/${template.id}/pdf`);
    expect(individualPdf.headers['content-disposition'].toLowerCase()).toContain('individual-biblioteca');
    const pdfPath = testInfo.outputPath('ficha-biblioteca-individual.pdf');
    await writeFile(pdfPath, individualPdf.bytes);
    await testInfo.attach('ficha-biblioteca-individual.pdf', { path: pdfPath, contentType: 'application/pdf' });

    const adoption = await individualContext.request.post(`/api/workout-library/${template.id}/adopt`);
    expect(adoption.status()).toBe(201);
    const plans = await individualContext.request.get('/api/individual/workout-plans');
    expect(plans.status()).toBe(200);
    const plansBody = await plans.json() as { plans: Array<{ libraryTemplateId: string | null; status: string }> };
    expect(plansBody.plans.some((plan) => plan.libraryTemplateId === template.id && plan.status === 'active')).toBe(true);

    const individualPage = await individualContext.newPage();
    await individualPage.goto('/my-library', { waitUntil: 'domcontentloaded' });
    await closeTutorialIfVisible(individualPage);
    await expect(individualPage.getByRole('heading', { name: 'Biblioteca de fichas' })).toBeVisible();
    await expect(individualPage.getByText('22 fichas prontas').first()).toBeVisible();
    await individualPage.goto('/my-plans', { waitUntil: 'domcontentloaded' });
    await expect(individualPage.getByText('Biblioteca G KONG').first()).toBeVisible();
  } finally {
    if (individualCreated) {
      expect((await individualContext.request.delete('/api/account', {
        data: { confirmation: individualName },
      })).status()).toBe(200);
    }
    if (trainerCreated) {
      expect((await trainerContext.request.delete('/api/account', {
        data: { confirmation: trainerName },
      })).status()).toBe(200);
    }
    await Promise.all([trainerContext.close(), studentContext.close(), individualContext.close()]);
  }
});
