import { expect, test } from '@playwright/test';

test('ciclo real: cadastro, sessão, rota protegida, exportação e exclusão', async ({ page }) => {
  test.skip(process.env.E2E_ALLOW_DATABASE_MUTATIONS !== 'true', 'Exige banco de testes isolado e migrações aplicadas.');
  const name = `Personal E2E ${Date.now()}`;
  await page.goto('/register');
  await page.getByLabel('Nome completo').fill(name);
  await page.getByLabel('Cidade').fill('Goiânia');
  await page.getByLabel('Idade').fill('30');
  await page.getByLabel('Senha de recuperação').fill('senha-e2e-segura');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Criar conta e gerar código' }).click();
  await expect(page.getByRole('heading', { name: 'Seu código G KONG' })).toBeVisible();
  await page.getByRole('button', { name: 'Acessar meu painel' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const exportResponse = await page.request.get('/api/account/export');
  expect(exportResponse.ok()).toBeTruthy();
  const deleteResponse = await page.request.delete('/api/account', { data: { confirmation: name } });
  expect(deleteResponse.ok()).toBeTruthy();
});
