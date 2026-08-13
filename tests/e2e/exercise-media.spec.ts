import { expect, test } from '@playwright/test';
import { IMPORTED_EXERCISES } from '../../src/lib/exercises/imported-media';
import { setOptimisticSession } from './helpers';

const trainerId = '20000000-0000-4000-8000-000000000003';
const demonstration = IMPORTED_EXERCISES.find((exercise) => exercise.primaryMuscle === 'chest');

test('personal abre uma demonstração importada no catálogo', async ({ context, page }, testInfo) => {
  expect(demonstration).toBeTruthy();
  if (!demonstration) return;

  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await setOptimisticSession(context, 'trainer', trainerId);
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: {
    user: { id: trainerId, role: 'trainer', name: 'Personal Teste', trainer_id: trainerId },
  } }));
  await page.route('**/api/students**', (route) => route.fulfill({ json: { students: [] } }));
  await page.route('**/api/notifications', (route) => route.fulfill({ json: { notifications: [], unread: 0 } }));
  await page.route('**/api/tutorial-progress', (route) => route.fulfill({ json: { status: 'completed' } }));
  await page.route('**/api/exercises?muscle=chest', (route) => route.fulfill({ json: {
    exercises: [demonstration],
    total: 1,
  } }));

  await page.goto('/exercises');
  if ((page.viewportSize()?.width ?? 1280) < 1280) {
    await page.getByRole('button', { name: 'Peito', exact: true }).click();
  }
  await expect(page.getByRole('heading', { name: demonstration.name })).toBeVisible();
  await expect(page.getByText('Com vídeo')).toBeVisible();

  const mediaResponse = page.waitForResponse((response) => (
    response.url().endsWith(demonstration.videoUrl)
    && [200, 206].includes(response.status())
  ));
  await page.getByRole('button', { name: 'Ver execução' }).click();
  await mediaResponse;

  const video = page.locator('video');
  await expect(video).toBeVisible();
  await expect.poll(() => video.evaluate(
    (element) => (element as HTMLVideoElement).readyState,
  )).toBeGreaterThan(0);
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: `Adicionar ${demonstration.name}` }).click();
  if ((page.viewportSize()?.width ?? 1280) < 1280) {
    await page.getByRole('button', { name: /Passo 3 Ficha/ }).click();
  }
  await page.getByLabel('Método de treino').click();
  await page.getByRole('option', { name: 'Drop-set' }).click();
  await expect(page.getByText('Continue a série após reduzir a carga.')).toBeVisible();
  const methodNotes = page.getByLabel(/Orientação personalizada/);
  await methodNotes.fill('Na última série, reduzir 20% da carga duas vezes.');
  await expect(methodNotes).toHaveValue('Na última série, reduzir 20% da carga duas vezes.');

  await expect(page.locator('[data-nextjs-dialog]')).toHaveCount(0);
  expect(browserErrors).toEqual([]);

  await page.screenshot({ path: testInfo.outputPath('exercise-media.png'), fullPage: true });
});
