# FitControl Pro

Plataforma para personal trainers cadastrarem alunos, montarem fichas e acompanharem a execução e a evolução dos treinos.

## Desenvolvimento

1. Copie `.env.example` para `.env.local`.
2. Preencha as chaves públicas do Supabase e a chave secreta usada apenas no servidor.
3. Aplique `supabase_schema.sql` em um banco novo. Em um banco existente, aplique as migrações em `supabase/migrations` na ordem dos arquivos.
4. Instale as dependências e inicie o projeto:

```bash
npm install
npm run dev
```

## Variáveis necessárias

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY` — somente no servidor

Nunca exponha a chave secreta em variáveis que começam com `NEXT_PUBLIC_`.

## Verificação

```bash
npm run test:auth
npx tsc --noEmit --incremental false
npm run build
```
