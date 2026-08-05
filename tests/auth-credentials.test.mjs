import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildStudentAuthPassword,
  buildSyntheticEmail,
  canonicalizeStudentAccessCode,
  generateNumericAccessCode,
  isDuplicateAccountError,
  normalizeAuthCode,
} from '../src/lib/auth/credentials.ts';

test('normaliza códigos sem depender de caixa ou separadores', () => {
  assert.equal(normalizeAuthCode(' #PRO-Abner '), 'proabner');
  assert.equal(buildSyntheticEmail('trainer', '#PRO-Abner'), 'trainer_proabner@example.com');
});

test('mantém o código numérico do aluno consistente', () => {
  assert.equal(canonicalizeStudentAccessCode(' 4821 '), '4821');
  assert.equal(buildSyntheticEmail('student', '4821'), 'student_4821@example.com');
  assert.equal(buildStudentAuthPassword('4821'), 'FitAluno!4821#');
  assert.throws(() => buildStudentAuthPassword('48A1'), /inválido/);
});

test('gera códigos aleatórios apenas com números e no tamanho solicitado', () => {
  for (let index = 0; index < 100; index += 1) {
    assert.match(generateNumericAccessCode(4), /^\d{4}$/);
    assert.match(generateNumericAccessCode(6), /^\d{6}$/);
  }
});

test('rejeita códigos que ficam curtos depois da normalização', () => {
  assert.throws(() => buildSyntheticEmail('student', '---A1'), /inválido/);
});

test('identifica conflitos retornados pelo provedor de autenticação', () => {
  assert.equal(isDuplicateAccountError({ code: 'email_exists' }), true);
  assert.equal(isDuplicateAccountError({ message: 'User already registered' }), true);
  assert.equal(isDuplicateAccountError({ message: 'Temporary failure' }), false);
});
