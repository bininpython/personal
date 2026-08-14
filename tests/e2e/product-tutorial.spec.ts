import { expect, test, type Page } from '@playwright/test';

const users = {
  trainer: {
    id: '11111111-1111-4111-8111-111111111111',
    role: 'trainer',
    name: 'Personal Tutorial',
    trainer_id: '11111111-1111-4111-8111-111111111111',
  },
  student: {
    id: '22222222-2222-4222-8222-222222222222',
    role: 'student',
    name: 'Aluno Tutorial',
    trainer_id: '11111111-1111-4111-8111-111111111111',
  },
  individual: {
    id: '33333333-3333-4333-8333-333333333333',
    role: 'individual',
    name: 'Atleta Tutorial',
    trainer_id: '33333333-3333-4333-8333-333333333333',
  },
} as const;

async function mockUser(page: Page, user: (typeof users)[keyof typeof users]) {
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user }),
    });
  });
}

test('trainer can complete every step of the first-access tutorial', async ({ page }) => {
  await mockUser(page, users.trainer);
  await page.goto('/help');

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Coloque sua operação para rodar' })).toBeVisible();

  const steps = [
    'Comece pela visão geral',
    'Cadastre e convide seu aluno',
    'Monte e publique a ficha',
    'Baixe a ficha completa em PDF',
    'Reutilize a ficha com outro aluno',
    'Registre avaliações com contexto',
    'Mantenha o acompanhamento próximo',
    'Acompanhe os resultados',
  ];

  for (const [index, title] of steps.entries()) {
    await expect(dialog.getByRole('heading', { name: title })).toBeVisible();
    await expect(dialog.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(index + 1));
    if (index < steps.length - 1) await dialog.getByRole('button', { name: 'Próximo' }).click();
  }

  await expect(dialog.getByRole('button', { name: 'Cadastrar primeiro aluno' })).toBeVisible();
});

test('student can dismiss and reopen the tutorial on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockUser(page, users.student);
  await page.goto('/help');

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Sua ficha, passo a passo' })).toBeVisible();
  await expect(dialog.getByText('A sequência é semanal', { exact: false })).toBeHidden();
  await dialog.getByRole('button', { name: 'Ver depois' }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: 'Abrir tutorial guiado' }).click();
  await expect(dialog.getByRole('heading', { name: 'Conclua seu primeiro acesso' })).toBeVisible();
  await expect(dialog.getByText('Digite seu nome da mesma forma', { exact: false })).toBeVisible();
  await dialog.getByRole('button', { name: 'Próximo' }).click();
  await expect(dialog.getByRole('heading', { name: 'Confira a ficha do dia' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Próximo' }).click();
  await expect(dialog.getByText('A sequência é semanal', { exact: false })).toBeVisible();
});

test('independent athlete receives only the self-service tutorial', async ({ page }) => {
  await mockUser(page, users.individual);
  await page.goto('/help');

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Monte sua própria rotina' })).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Use sua visão geral' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Abrir visão geral' })).toBeVisible();
  await expect(dialog.getByText('gestão de alunos', { exact: false })).toBeVisible();
});
