const COMMERCIAL_SCHEMA_ERROR_CODES = new Set([
  '42P01', // undefined_table
  '42703', // undefined_column
  '42883', // undefined_function
  'PGRST202', // function not present in the PostgREST schema cache
  'PGRST204', // column not present in the PostgREST schema cache
]);

const COMMERCIAL_SCHEMA_MARKERS = [
  'consume_auth_rate_limit',
  'clear_auth_rate_limit',
  'app_sessions',
  'auth_rate_limits',
  'login_name_normalized',
  'access_code_hash',
  'recovery_code_hash',
  'recovery_password_hash',
  'nickname',
  'age',
  'public_code',
  'deleted_at',
];

export const DATABASE_UPDATE_REQUIRED = 'Atualização segura do sistema pendente. Tente novamente em alguns minutos.';

export function isCommercialSchemaMissing(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const value = error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown };
  const code = typeof value.code === 'string' ? value.code.toUpperCase() : '';
  if (COMMERCIAL_SCHEMA_ERROR_CODES.has(code)) return true;

  const description = [value.message, value.details, value.hint]
    .filter((part): part is string => typeof part === 'string')
    .join(' ')
    .toLowerCase();
  return COMMERCIAL_SCHEMA_MARKERS.some((marker) => description.includes(marker));
}
