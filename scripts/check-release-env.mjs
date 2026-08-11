import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const required = [
  ['NEXT_PUBLIC_SUPABASE_URL', 10],
  ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  ['SUPABASE_SECRET_KEY', 20, 'SUPABASE_SERVICE_ROLE_KEY'],
  ['SESSION_SECRET', 32],
  ['RATE_LIMIT_SECRET', 32],
  ['CRON_SECRET', 32],
];

let failed = false;
const resolved = new Map();
for (const [name, minimum, alternative] of required) {
  const value = process.env[name] || (alternative ? process.env[alternative] : undefined);
  resolved.set(name, value);
  if (!value || value.length < minimum) {
    failed = true;
    console.error(`FALHA: ${name}${alternative ? ` (ou ${alternative})` : ''} precisa ter pelo menos ${minimum} caracteres.`);
  } else {
    console.log(`OK: ${name}`);
  }
}

const independentSecrets = ['SESSION_SECRET', 'RATE_LIMIT_SECRET', 'CRON_SECRET']
  .map((name) => resolved.get(name))
  .filter(Boolean);
if (new Set(independentSecrets).size !== independentSecrets.length) {
  failed = true;
  console.error('FALHA: SESSION_SECRET, RATE_LIMIT_SECRET e CRON_SECRET devem ser diferentes.');
}

if (failed) process.exitCode = 1;
else console.log('Ambiente de publicação configurado sem expor valores secretos.');
