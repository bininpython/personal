import { expect, test } from '@playwright/test';

test('login do personal usa somente nome e código de acesso', async ({ page }) => {
  await page.goto('/login/trainer');
  await expect(page.getByRole('heading', { name: 'Acesso do Personal' })).toBeVisible();
  await expect(page.getByLabel('Seu nome profissional')).toBeVisible();
  await expect(page.getByLabel('Código de acesso')).toBeVisible();
  await expect(page.getByPlaceholder('XXXX-XXXX')).toBeVisible();
  await expect(page.locator('input[type="email"], input[type="tel"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Recuperar acesso' })).toHaveAttribute('href', '/recover');
});

test('login do aluno exige escopo do personal e código individual', async ({ page }) => {
  await page.goto('/login/student');
  await expect(page.getByLabel('Seu nome')).toBeVisible();
  await expect(page.getByLabel('Código público do personal')).toBeVisible();
  await expect(page.getByLabel('Seu código individual')).toBeVisible();
  await expect(page.locator('input[type="email"], input[type="tel"]')).toHaveCount(0);
});

test('rotas protegidas e exportação rejeitam visitante', async ({ page, request }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
  const exportResponse = await request.get('/api/account/export');
  expect(exportResponse.status()).toBe(401);
});

test('páginas recebem cabeçalhos de segurança', async ({ request }) => {
  const response = await request.get('/login');
  expect(response.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  expect(response.headers()['x-frame-options']).toBe('DENY');
  expect(response.headers()['x-powered-by']).toBeUndefined();
});

test('recuperação não solicita contato pessoal', async ({ page }) => {
  await page.goto('/recover');
  await expect(page.getByLabel('Nome profissional')).toBeVisible();
  await expect(page.getByLabel('Código público')).toBeVisible();
  await expect(page.getByLabel('Chave de recuperação')).toBeVisible();
  await expect(page.locator('input[type="email"], input[type="tel"]')).toHaveCount(0);
});
