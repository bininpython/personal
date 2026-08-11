import { expect, test } from '@playwright/test';
import { setOptimisticSession } from './helpers';

const studentId = '10000000-0000-4000-8000-000000000002';
const trainerId = '20000000-0000-4000-8000-000000000002';

test('aluno com aceite incompleto volta ao onboarding', async ({ context, page }) => {
  await setOptimisticSession(context, 'student', studentId, trainerId);
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: {
    user: { id: studentId, role: 'student', name: 'Aluno Consentimento', trainer_id: trainerId },
  } }));
  await page.route('**/api/students/**', (route) => route.fulfill({ json: {
    student: {
      id: studentId,
      privacy_consent_at: '2026-08-08T12:00:00Z',
      terms_accepted_at: null,
    },
  } }));
  await page.route('**/api/workout-plans', (route) => route.fulfill({ json: { plan: null } }));
  await page.route('**/api/appointments**', (route) => route.fulfill({ json: { appointments: [] } }));

  await page.goto('/home');
  await expect(page).toHaveURL(/\/onboarding$/, { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: /SEU CORPO/ })).toBeVisible();
  await expect(page.getByText('Li e aceito os')).toBeVisible();
});
