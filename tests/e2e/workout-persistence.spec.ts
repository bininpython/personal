import { expect, test } from '@playwright/test';
import { setOptimisticSession } from './helpers';

const studentId = '10000000-0000-4000-8000-000000000001';
const trainerId = '20000000-0000-4000-8000-000000000001';
const planId = '30000000-0000-4000-8000-000000000001';
const dayId = '40000000-0000-4000-8000-000000000001';
const exerciseId = '50000000-0000-4000-8000-000000000001';

test.beforeEach(async ({ context, page }) => {
  await setOptimisticSession(context, 'student', studentId, trainerId);
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user: { id: studentId, role: 'student', name: 'Aluno Teste', trainer_id: trainerId } } }));
  await page.route('**/api/students/**', (route) => route.fulfill({ json: { student: { id: studentId, privacy_consent_at: '2026-08-08T12:00:00Z', height: 0, current_weight: 0 } } }));
  await page.route('**/api/notifications', (route) => route.fulfill({ json: { unread: 0 } }));
  await page.route('**/api/workout-plans', (route) => route.fulfill({ json: {
    plan: {
      id: planId,
      name: 'Ficha E2E',
      goal: 'Força',
      daysPerWeek: 1,
      startDate: '2026-08-01',
      endDate: '2026-12-01',
      isExpired: false,
      updatedAt: '2026-08-08T10:00:00Z',
      week: { currentDate: '2026-08-08', startDate: '2026-08-03', endDate: '2026-08-09', target: 1, completed: 0, isComplete: false, nextWorkoutDayId: dayId },
      days: [{ id: dayId, label: 'A', name: 'Treino A', weeklyAllowance: 1, weeklyCompletions: 0, completedThisWeek: false, completedToday: false, lastCompletedAt: null, exercises: [{ id: exerciseId, exerciseId, name: 'Agachamento', muscle: 'quadriceps', instructions: 'Execução controlada', videoUrl: null, sets: 1, reps: '10', restTime: 0, method: '' }] }],
    },
  } }));
});

test('envia séries, repetições, carga, RPE, duração e idempotência', async ({ page }) => {
  let submitted: Record<string, unknown> | null = null;
  await page.route('**/api/workout-sessions', async (route) => {
    if (route.request().method() === 'POST') {
      submitted = route.request().postDataJSON();
      await route.fulfill({ status: 201, json: { success: true, session: { id: 'session-e2e' } } });
    } else await route.fulfill({ json: { history: [], progress: {} } });
  });

  await page.goto('/workout');
  await page.getByLabel('Repetições da série 1').fill('10');
  await page.getByLabel('Carga da série 1').fill('42.5');
  await page.getByLabel('RPE da série 1').fill('8');
  await page.getByRole('button', { name: /Série 1/ }).click();
  await page.getByRole('button', { name: 'Concluir e salvar treino' }).click();
  await expect.poll(() => submitted).not.toBeNull();

  const body = submitted as unknown as {
    clientSessionId: string;
    startedAt: string;
    durationSeconds: number;
    exercises: Array<{ sets: Array<Record<string, unknown>> }>;
  };
  expect(body.clientSessionId).toMatch(/^[0-9a-f-]{36}$/);
  expect(Date.parse(body.startedAt)).not.toBeNaN();
  expect(body.durationSeconds).toBeGreaterThanOrEqual(0);
  expect(body.exercises[0].sets[0]).toMatchObject({
    setNumber: 1,
    completed: true,
    performedRepetitions: 10,
    performedLoad: 42.5,
    rpe: 8,
  });
});
