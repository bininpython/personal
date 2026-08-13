import assert from 'node:assert/strict';
import test from 'node:test';
import { STUDENT_LEVEL_LABELS, studentLevelLabel } from '../src/lib/students/level.ts';

test('translates the stored level into the label shown to the trainer', () => {
  assert.equal(studentLevelLabel('beginner'), 'Iniciante');
  assert.equal(studentLevelLabel('intermediate'), 'Intermediário');
  assert.equal(studentLevelLabel('advanced'), 'Avançado');
});

test('falls back to the most demanding level when it was never informed', () => {
  assert.equal(studentLevelLabel(null), 'Avançado');
  assert.equal(studentLevelLabel(undefined), 'Avançado');
  assert.equal(studentLevelLabel('qualquer-coisa'), 'Avançado');
});

// Reaproveitar uma ficha filtra os alunos comparando o rótulo devolvido por
// /api/students com o de /api/workout-plans. Se as duas listas usarem textos
// diferentes o filtro não casa nunca e nenhum aluno aparece.
test('keeps a single set of labels so the plan and student lists can be compared', () => {
  const planLevel = studentLevelLabel('advanced');
  const studentLevel = studentLevelLabel('advanced');
  assert.equal(planLevel, studentLevel);
  assert.deepEqual(
    Object.values(STUDENT_LEVEL_LABELS).sort(),
    ['Avançado', 'Iniciante', 'Intermediário'],
  );
});
