# FitControl Pro

Plataforma para personal trainers cadastrarem alunos, montarem fichas e acompanharem a execução e a evolução dos treinos.

## Acesso

- O personal cria a conta somente com nome, cidade, estado e senha. O sistema gera um código numérico exclusivo de 6 dígitos.
- Cada personal pode cadastrar até 10 alunos.
- Cada aluno recebe um código aleatório e globalmente exclusivo de 4 dígitos. O código fica reservado para sempre e não é reutilizado.
- O aluno entra somente com o nome cadastrado e o código. E-mails técnicos usados pela autenticação nunca são exibidos nem solicitados.

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
