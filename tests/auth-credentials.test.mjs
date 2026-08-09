import assert from 'node:assert/strict';
import test from 'node:test';
import {
  generateRecoveryCode,
  generateStudentPrivateCode,
  generateTrainerPrivateCode,
  generateTrainerPublicCode,
  getCodeHint,
  normalizeAuthCode,
} from '../src/lib/auth/credentials.ts';

test('normaliza códigos sem depender de caixa ou separadores', () => {
  assert.equal(normalizeAuthCode(' FC-Ab2-9 '), 'fcab29');
});

test('gera códigos criptograficamente aleatórios nos formatos comerciais', () => {
  const generated = new Set();
  for (let index = 0; index < 200; index += 1) {
    const trainer = generateTrainerPrivateCode();
    const student = generateStudentPrivateCode();
    const publicCode = generateTrainerPublicCode();
    const recovery = generateRecoveryCode();
    assert.match(trainer, /^[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){3}$/);
    assert.match(student, /^[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){2}$/);
    assert.match(publicCode, /^FC-[A-HJ-NP-Z2-9]{8}$/);
    assert.match(recovery, /^[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){5}$/);
    generated.add(`${trainer}|${student}|${publicCode}|${recovery}`);
  }
  assert.equal(generated.size, 200);
});

test('não usa caracteres visualmente ambíguos', () => {
  const values = Array.from({ length: 100 }, () => [
    generateTrainerPrivateCode(),
    generateStudentPrivateCode(),
    generateRecoveryCode(),
  ].join(''));
  assert.equal(values.some((value) => /[01IO]/.test(value)), false);
});

test('a dica revela somente os quatro caracteres finais', () => {
  const code = 'ABCD-EFGH-JKLM';
  const hint = getCodeHint(code);
  assert.equal(hint.endsWith('JKLM'), true);
  assert.equal(hint.includes('ABCD'), false);
});
