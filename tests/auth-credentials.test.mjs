import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSyntheticEmail,
  canonicalizeStudentAccessCode,
  isDuplicateAccountError,
  normalizeAuthCode,
} from '../src/lib/auth/credentials.ts';

test('normaliza códigos sem depender de caixa ou separadores', () => {
  assert.equal(normalizeAuthCode(' #PRO-Abner '), 'proabner');
  assert.equal(buildSyntheticEmail('trainer', '#PRO-Abner'), 'trainer_proabner@example.com');
});

test('canoniza o código do aluno para autenticação consistente', () => {
  assert.equal(canonicalizeStudentAccessCode(' ab-23 cd '), 'AB23CD');
  assert.equal(buildSyntheticEmail('student', 'AB23CD'), 'student_ab23cd@example.com');
});

test('rejeita códigos que ficam curtos depois da normalização', () => {
  assert.throws(() => buildSyntheticEmail('student', '---A1'), /inválido/);
});

test('identifica conflitos retornados pelo provedor de autenticação', () => {
  assert.equal(isDuplicateAccountError({ code: 'email_exists' }), true);
  assert.equal(isDuplicateAccountError({ message: 'User already registered' }), true);
  assert.equal(isDuplicateAccountError({ message: 'Temporary failure' }), false);
});
