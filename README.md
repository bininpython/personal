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
- `CRON_SECRET` — texto aleatório longo que protege a geração diária de alertas no Vercel

Nunca exponha a chave secreta em variáveis que começam com `NEXT_PUBLIC_`.

## Módulos operacionais

- Mensagens diretas entre personal e aluno, com atualização automática e confirmação de leitura.
- Agenda com verificação de conflito, conclusão e cancelamento de compromissos.
- Alertas automáticos de inatividade, baixa constância e feedback de treino preocupante.
- Prazo configurável para cada ficha, com alerta de vencimento sem retirar o treino do aluno.
- Edição de fichas com publicação de uma nova versão e preservação do histórico anterior.
- Edição, arquivamento e reativação de alunos.
- Indicadores de constância, adesão, risco, evolução de peso e percentual de gordura.
- Relatório detalhado com exportação pelo comando de impressão do navegador em PDF.

Em um banco que já está em produção, aplique também a migração
`supabase/migrations/20260805_zz_operational_features.sql`. Ela ativa a proteção das tabelas
de mensagens, notificações e agenda, além de criar os índices usados pelos painéis.
O arquivo `vercel.json` agenda a análise diária às 10h UTC. O Vercel envia automaticamente
o `CRON_SECRET` configurado nas variáveis do projeto para autorizar essa tarefa.

## Verificação

```bash
npm run test:auth
npm run test:catalog
npm run test:analytics
npm run test:plans
npm run test:routes
npm run lint
npx tsc --noEmit --incremental false
npm run build
```
