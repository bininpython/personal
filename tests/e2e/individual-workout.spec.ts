import { expect, test } from '@playwright/test';
import { setOptimisticSession } from './helpers';

const individualId = '11000000-0000-4000-8000-000000000001';
const planId = '22000000-0000-4000-8000-000000000001';
const dayAId = '33000000-0000-4000-8000-000000000001';
const dayBId = '33000000-0000-4000-8000-000000000002';
const exerciseAId = '44000000-0000-4000-8000-000000000001';
const exerciseBId = '44000000-0000-4000-8000-000000000002';

function workoutPlan(completed = false) {
  return {
    id: planId,
    name: 'Ficha Individual E2E',
    goal: 'Força e condicionamento',
    daysPerWeek: 2,
    isExpired: false,
    week: {
      currentDate: '2026-08-13',
      startDate: '2026-08-10',
      endDate: '2026-08-16',
      target: 2,
      completed: completed ? 1 : 0,
      isComplete: false,
      completedToday: completed,
      nextWorkoutDayId: completed ? dayBId : dayAId,
    },
    days: [
      {
        id: dayAId,
        label: 'A',
        name: 'Treino Superior',
        weeklyAllowance: 1,
        weeklyCompletions: completed ? 1 : 0,
        completedThisWeek: completed,
        completedToday: completed,
        lastCompletedAt: completed ? '2026-08-13T12:00:00.000Z' : null,
        exercises: [{
          id: exerciseAId,
          exerciseKey: 'supino-reto-barra',
          name: 'Supino reto',
          primaryMuscleLabel: 'Peitoral',
          equipment: 'Barra',
          instructions: 'Desça a barra com controle.',
          videoUrl: null,
          sets: 2,
          reps: '10',
          restTime: 30,
          method: 'dropset',
          methodNotes: 'Reduza a carga apenas na última série.',
          lastPerformance: null,
        }],
      },
      {
        id: dayBId,
        label: 'B',
        name: 'Treino Inferior',
        weeklyAllowance: 1,
        weeklyCompletions: 0,
        completedThisWeek: false,
        completedToday: false,
        lastCompletedAt: null,
        exercises: [{
          id: exerciseBId,
          exerciseKey: 'agachamento-livre',
          name: 'Agachamento livre',
          primaryMuscleLabel: 'Quadríceps',
          equipment: 'Barra',
          instructions: 'Mantenha o tronco firme.',
          videoUrl: null,
          sets: 1,
          reps: '12',
          restTime: 60,
          method: 'traditional',
          methodNotes: '',
          lastPerformance: null,
        }],
      },
    ],
  };
}

test.beforeEach(async ({ context, page }) => {
  await setOptimisticSession(context, 'individual', individualId);
  await page.route('**/api/auth/me', (route) => route.fulfill({
    json: { user: { id: individualId, role: 'individual', name: 'Atleta Individual' } },
  }));
  await page.route('**/api/tutorial-progress', (route) => route.fulfill({ json: { status: 'completed' } }));
});

test('executa a ficha com descanso e libera B somente no dia seguinte', async ({ page }) => {
  let completed = false;
  let submitted: Record<string, unknown> | null = null;

  await page.route('**/api/individual/workout', (route) => route.fulfill({ json: { plan: workoutPlan(completed) } }));
  await page.route('**/api/individual/workout-sessions', async (route) => {
    if (route.request().method() === 'POST') {
      submitted = route.request().postDataJSON();
      completed = true;
      await route.fulfill({ status: 201, json: { success: true, session: { id: 'session-individual-e2e' } } });
      return;
    }
    await route.fulfill({ json: { history: [], summary: { completedWorkouts: 0, totalVolume: 0 } } });
  });

  await page.goto('/my-workout');
  await expect(page.getByRole('heading', { name: 'Ficha Individual E2E' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Iniciar treino A' })).toBeVisible();
  await page.getByRole('button', { name: /Treino B.*Treino Inferior/ }).click();
  await expect(page.getByText('Ficha disponível somente para consulta')).toBeVisible();
  await expect(page.getByLabel('Repetições da série 1')).toBeDisabled();
  await page.getByRole('button', { name: /Treino A.*Treino Superior/ }).click();
  await page.getByRole('button', { name: 'Iniciar treino A' }).click();

  await page.getByLabel('Repetições da série 1').fill('10');
  await page.getByLabel('Carga da série 1').fill('40');
  await page.getByLabel('RPE da série 1').fill('8');
  await page.getByRole('button', { name: 'Série 1' }).click();
  await expect(page.getByText('Tempo de descanso')).toBeVisible();
  await page.getByRole('button', { name: 'Pular descanso' }).click();

  await page.getByLabel('Repetições da série 2').fill('9');
  await page.getByLabel('Carga da série 2').fill('40');
  await page.getByLabel('RPE da série 2').fill('9');
  await page.getByRole('button', { name: 'Série 2' }).click();
  await page.getByRole('button', { name: '4 estrela(s)' }).click();
  await page.getByPlaceholder('Como foi o treino? (opcional)').fill('Treino concluído com boa execução.');
  await page.getByRole('button', { name: 'Concluir e salvar treino' }).click();

  await expect.poll(() => submitted).not.toBeNull();
  const body = submitted as unknown as {
    workoutDayId: string;
    rating: number;
    exercises: Array<{ sets: Array<{ performedRepetitions: number; performedLoad: number; rpe: number }> }>;
  };
  expect(body.workoutDayId).toBe(dayAId);
  expect(body.rating).toBe(4);
  expect(body.exercises[0].sets).toEqual([
    expect.objectContaining({ performedRepetitions: 10, performedLoad: 40, rpe: 8 }),
    expect.objectContaining({ performedRepetitions: 9, performedLoad: 40, rpe: 9 }),
  ]);

  await expect(page.getByText('Próximo da rotação: Treino B')).toBeVisible();
  await expect(page.getByText(/disponível amanhã/)).toBeVisible();
  await expect(page.getByLabel('Repetições da série 1')).toBeDisabled();
});
