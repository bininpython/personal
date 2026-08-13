import { expect, test } from '@playwright/test';
import { setOptimisticSession } from './helpers';

const trainerId = '61000000-0000-4000-8000-000000000001';
const sourceStudentId = '62000000-0000-4000-8000-000000000001';
const destinationStudentId = '62000000-0000-4000-8000-000000000002';
const planId = '63000000-0000-4000-8000-000000000001';

test.beforeEach(async ({ context, page }) => {
  await setOptimisticSession(context, 'trainer', trainerId);
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: {
    user: { id: trainerId, role: 'trainer', name: 'Personal Teste', trainer_id: trainerId },
  } }));
  await page.route('**/api/notifications', (route) => route.fulfill({ json: { unread: 0 } }));
  await page.route('**/api/workout-plans', (route) => route.fulfill({ json: { plans: [{
    id: planId,
    studentId: sourceStudentId,
    name: 'Ficha de hipertrofia',
    student: 'Aluno Origem',
    goal: 'Hipertrofia',
    days: 4,
    workoutDayCount: 2,
    exerciseCount: 8,
    status: 'active',
    startDate: '2026-08-01',
    endDate: '2026-09-01',
    isExpired: false,
  }] } }));
  await page.route('**/api/students', (route) => route.fulfill({ json: { students: [
    { id: sourceStudentId, name: 'Aluno Origem', status: 'active' },
    { id: destinationStudentId, name: 'Aluno Destino', status: 'active' },
  ] } }));
});

test('personal baixa a ficha e envia uma cópia para outro aluno', async ({ page }) => {
  let copiedTo = '';
  await page.route(`**/api/workout-plans/${planId}/copy`, async (route) => {
    copiedTo = (route.request().postDataJSON() as { studentId: string }).studentId;
    await route.fulfill({ status: 201, json: { success: true, message: 'Ficha enviada e publicada para o aluno.' } });
  });

  await page.goto('/workouts');

  const pdfLink = page.locator(`a[download][href="/api/workout-plans/${planId}/pdf"]`);
  await expect(pdfLink).toHaveAttribute('href', `/api/workout-plans/${planId}/pdf`);

  await page.getByRole('button', { name: 'Enviar' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Enviar ficha para outro aluno' })).toBeVisible();
  await dialog.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Aluno Destino' }).click();
  await dialog.getByRole('button', { name: 'Enviar e publicar' }).click();

  await expect.poll(() => copiedTo).toBe(destinationStudentId);
  await expect(dialog).toBeHidden();
});
