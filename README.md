# FitControl Pro

Plataforma para personal trainers cadastrarem alunos, montarem fichas e acompanharem a execução e a evolução dos treinos.

## Acesso

- A autenticação não coleta e-mail nem telefone e não cria contas sintéticas.
- O personal entra com nome e um código diário de 8 caracteres (`XXXX-XXXX`). Um código público separado identifica sua carteira para os alunos.
- Cada aluno entra com nome, código público do personal e código individual.
- Códigos de acesso são aleatórios, têm 40 bits de entropia, são armazenados apenas como hash bcrypt e exibidos uma única vez. Rate limit e bloqueio protegem contra tentativas automatizadas.
- O personal recebe uma chave de recuperação de uso controlado; o código do aluno pode ser redefinido pelo personal.
- Sessões são assinadas, registradas no banco, revogáveis e protegidas por cookie HttpOnly.
- Cada personal pode manter até 10 alunos **ativos**; alunos arquivados não consomem o limite.

## Desenvolvimento

1. Copie `.env.example` para `.env.local`.
2. Preencha as chaves públicas do Supabase e a chave secreta usada apenas no servidor.
3. Aplique `supabase_schema.sql` em um banco novo e depois todas as migrações em `supabase/migrations` na ordem. Em banco existente, aplique somente as migrações pendentes, incluindo obrigatoriamente `20260808_commercial_security.sql`.
4. Instale as dependências e inicie o projeto:

```bash
npm install
npm run dev
```

## Variáveis necessárias

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY` — somente no servidor
- `SESSION_SECRET` — segredo aleatório com pelo menos 32 caracteres para assinar sessões
- `RATE_LIMIT_SECRET` — pepper independente recomendado para identificadores de bloqueio
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
- Registro de cada série com repetições, carga, RPE, volume e duração persistente.
- Exportação e exclusão de dados pelo próprio titular.
- Fotos privadas, consentimento para dados de saúde e tutoriais integrados em `/help`.

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
npm run test:security
npm run test:e2e
npm run lint
npx tsc --noEmit --incremental false
npm run build
```

O teste E2E destrutivo de ciclo completo fica desativado por padrão. Execute-o somente com um banco de testes isolado, migrações aplicadas e `E2E_ALLOW_DATABASE_MUTATIONS=true`.

## Checklist antes de publicar

- Configure `SESSION_SECRET`, `RATE_LIMIT_SECRET` e `CRON_SECRET` no ambiente de produção.
- Aplique a migração comercial e confirme que o bucket `profile-images-private` não é público.
- Preencha nos Termos e na Política a razão social, CNPJ, endereço, canal de suporte e encarregado de dados.
- Use banco separado para staging/E2E, backup com restauração testada, HTTPS e monitoramento de erros.
