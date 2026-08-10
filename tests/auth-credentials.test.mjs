import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatAccessCodeInput,
  generateStudentPrivateCode,
  generateTrainerPrivateCode,
  getCodeHint,
  normalizeAuthCode,
} from '../src/lib/auth/credentials.ts';

test('normaliza códigos numéricos sem depender do hífen', () => {
  assert.equal(normalizeAuthCode(' 564-625 '), '564625');
});

test('formata progressivamente o código para digitação', () => {
  assert.equal(formatAccessCodeInput('564'), '564');
  assert.equal(formatAccessCodeInput('564625'), '564-625');
  assert.equal(formatAccessCodeInput('564-6259'), '564-625');
});

test('gera códigos criptograficamente aleatórios com seis números', () => {
  const generated = new Set();
  for (let index = 0; index < 50; index += 1) {
    const trainer = generateTrainerPrivateCode();
    const student = generateStudentPrivateCode();
    assert.match(trainer, /^\d{3}-\d{3}$/);
    assert.match(student, /^\d{3}-\d{3}$/);
    generated.add(`${trainer}|${student}`);
  }
  assert.equal(generated.size, 50);
});

test('a dica revela somente os dois números finais', () => {
  const hint = getCodeHint('564-625');
  assert.equal(hint.endsWith('25'), true);
  assert.equal(hint.includes('564'), false);
  assert.equal(hint.length, 6);
});
