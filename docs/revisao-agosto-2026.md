# Revisão da plataforma G KONG — segunda passagem

Revisão de produto e engenharia — 11 de agosto de 2026
Base: `claude/montador-mobile-entrega-codigo-1oj725`, sobre a análise de 10 de agosto
(`docs/analise-ux-plataforma.md`).

---

## Resumo

A Onda 1 está quase toda entregue, e o efeito é visível: o produto já fala uma língua só.
Dos cinco críticos, **quatro estão fechados** — sistema visual unificado, navegação renomeada e
agrupada, checklist de ativação no painel, e o montador funcionando no celular. A entrega do
código pelo WhatsApp (A1) também saiu.

Sobra um crítico, e é o mais caro: **o produto continua não sendo instalável e não funciona
sem conexão** (C3). Todo o resto do que falta se divide em duas famílias:

1. **A tela de treino não foi tratada para a condição real de uso.** O cronômetro morre com a
   tela apagada, o aluno não vê quanto levantou da última vez, e o registro depende de uma
   conexão que a academia não tem. É a tela que o aluno abre quatro vezes por semana.
2. **O acesso a dados foi escrito assumindo base pequena.** Nenhuma consulta de histórico tem
   recorte de data ou paginação, e três telas fazem *polling* em cima disso. Hoje é invisível;
   com seis meses de uso por personal vira lentidão constante — e a conta chega primeiro no
   celular do aluno, em bateria e dados.

Nada aqui é reconstrução. O item 1 é uma onda de trabalho; o item 2 são quatro consultas.

---

## O que foi fechado desde a análise anterior

| # | Item | Situação |
|---|---|---|
| C1 | Duas linguagens visuais | **Fechado.** 19 telas usam `PageHeader`/`dk-*`. Sobram cores cruas pontuais (ver B4) |
| C2 | Montador não funciona no celular | **Fechado.** Fluxo de três etapas com barra fixa abaixo de `xl` |
| C4 | Tarefa central escondida em "Exercícios" | **Parcial.** O rótulo virou "Montar ficha"; a URL continua `/exercises` (ver B5) |
| C5 | Personal novo não é conduzido | **Fechado.** `components/trainer/activation-checklist.tsx` |
| A1 | Entrega do código sem suporte | **Fechado.** `components/students/access-invite.tsx` no perfil e no cadastro |
| M2 | Tooltip com `hsl()` sobre `oklch` | **Fechado** no painel. Sobrevive em código morto (B8) |
| M6 | Menu sem hierarquia | **Fechado.** Grupos *Operação* e *Análise* |

Continuam abertos, sem alteração: **C3, A2, A3, A4, A5, A6, A7, M1, M3, M4, M5, M7**.

---

## Achados desta revisão

Numeração nova (`B`) para não colidir com a análise anterior. Os itens que apenas confirmam um
achado antigo estão marcados como tal.

> **Estado em 11/08, fim do dia.** O primeiro bloco da ordem sugerida foi executado:
> **B2, B3, B9, B4, B10, B11** e **B12** estão fechados, e a verificação em navegador
> descobriu mais dois defeitos, também corrigidos: **B15** (o menu "..." da lista de alunos
> nunca funcionou) e **B16** (as rotas de metadata eram redirecionadas para `/login`).
> Continuam abertos: **B1, B5, B6, B7, B8, B13, B14**.

### Bloqueadores

#### B1 · A tela de treino não sobrevive à academia — *confirma C3, A4, A5*

Três problemas somados na mesma tela, e é a tela mais usada do produto:

- **O cronômetro para quando a tela apaga.** `setInterval` de 250 ms
  (`src/app/(student)/workout/page.tsx:268`) e, ao fim, `navigator.vibrate` + toast
  (`:136-139`). Sem Wake Lock, sem `Notification`, sem áudio. Com o celular no bolso — a
  posição normal durante o descanso — o navegador congela o intervalo e nada acontece.
- **Sem histórico de carga.** Cada série grava repetições, carga e RPE, mas nada volta para a
  execução. O aluno vê "3 × 10–12, 60s" e decide a carga de memória. O dado que sustenta
  sobrecarga progressiva é coletado e não é devolvido.
- **Sem rede, sem registro.** O envio é um único POST no fim (`:395`). O `localStorage` salva o
  progresso, mas não há fila de reenvio: se a conexão cair na hora de concluir, o aluno vê erro.

Enquanto isso o `setInterval` de 10 s (`:240`) tenta ressincronizar a ficha durante o treino
inteiro — o comportamento exatamente oposto ao que a situação pede.

**Encaminhamento:** Wake Lock + `Notification` + áudio curto no fim do descanso; "última vez:
4×10 @ 32 kg" e marca de recorde por exercício; fila de envio persistida com reenvio ao voltar
a conexão; trocar o polling de 10 s por revalidação ao voltar o foco (o `visibilitychange` já
está lá, em `:242`).

#### B2 · Nenhuma consulta de histórico tem recorte de data — *achado novo*

Quatro pontos leem a base inteira desde o primeiro dia, sem `limit`, sem janela, sem paginação:

| Onde | O que carrega |
|---|---|
| `src/app/api/messages/route.ts:52` | **todas** as mensagens do ator, em toda a história |
| `src/app/api/students/route.ts:165` | todos os `workout_sessions` de todos os alunos |
| `src/lib/analytics/trainer-analytics.ts:26` | idem, mais avaliações físicas |
| `src/lib/students/progress.ts:40` | histórico completo do aluno, com `join` de dias e fichas |

O de mensagens é o mais grave, porque as duas telas de conversa recarregam **a cada 3 segundos**
(`(trainer)/messages/page.tsx:76`, `(student)/student-messages/page.tsx:44`). Um personal com
dez alunos e três meses de conversa baixa a tabela inteira 1.200 vezes por hora de tela aberta.
Pior: no ramo do personal, o servidor busca tudo e depois filtra por contato em JavaScript
(`isConversationMessage`), ou seja, o custo é multiplicado pelo número de alunos.

Os outros três recortam as janelas de 7 e 30 dias **depois** de trazer tudo para a memória.

Hoje isso não aparece porque as bases são novas. É uma degradação que só cresce, e o primeiro a
sentir é o aluno, no 4G da academia.

**Encaminhamento:** `.gte()` de 90 dias nas consultas de sessão e avaliação; mensagens com
`limit` + cursor por `created_at`, filtrando o par de conversa no banco em vez de em JS.

#### B3 · O gerador de alertas roda em série sobre todos os personais — *achado novo*

`src/app/api/cron/alerts/route.ts:27` percorre todos os treinadores ativos num `for` sequencial,
e cada volta faz várias consultas (`lib/notifications/generate.ts`). O limite é
`maxDuration = 60`. Não há paginação, cursor, nem retomada: quando o tempo estourar, os
personais do fim da lista simplesmente param de receber alertas — sem erro visível, porque a
rota devolve 500 e o Vercel só registra a falha.

Os alertas são o argumento comercial do produto. Falhar em silêncio é o pior modo de falhar.

**Encaminhamento:** processar em lotes com cursor por `id`, devolver 200 com `hasMore`, e
agendar o cron com frequência maior; ou disparar por fila.

### Altos

#### B4 · A unificação visual parou a um passo do fim — *estende C1*

19 telas migraram, mas as cores semânticas ainda são escritas na mão em pontos de destaque:

- `src/components/students/student-progress-dashboard.tsx:69` — `text-red-600` / `text-amber-600`
  / `text-emerald-600` para risco, enquanto existem `--ok`, `--warn`, `--danger`. Esse
  componente aparece **no perfil do aluno e no relatório impresso**, os dois lugares onde a cor
  vira decisão.
- `(student)/workout/page.tsx` — `emerald` para série concluída, `amber` para prazo vencido.
- `(trainer)/students/[id]/page.tsx:190` — card de observações em `amber`.
- `(trainer)/assessments/new/page.tsx:135` — ícone em `text-blue-500`, o último azul do produto.

São dez linhas. Deixá-las é manter duas paletas convivendo justamente nos estados que o usuário
precisa distinguir rápido.

#### B5 · "Montar ficha" ainda mora em `/exercises` — *estende C4*

O menu foi renomeado, mas a URL não: `/exercises` continua sendo a tela de montagem, e
`/workouts/new` é um `redirect` de cinco linhas para lá. O efeito é pequeno mas persistente —
o link que o personal copia, salva ou compartilha diz "exercises"; o histórico do navegador
também. E a tela "Fichas de treino" ainda manda o usuário para "o diagrama de exercícios" no
estado vazio.

**Encaminhamento:** mover a tela para `/workouts/new` (o nome que a navegação já promete) e
deixar `/exercises` como redirecionamento permanente, invertendo o que existe hoje.

#### B6 · A aba "Fichas" no perfil do aluno não mostra ficha nenhuma — *achado novo*

`src/app/(trainer)/students/[id]/page.tsx:191`: a aba renderiza um card vazio com dois botões,
"Ver fichas" (vai para a lista geral) e "Criar ficha" (vai para o montador). O personal abre o
perfil do aluno para saber **qual ficha esse aluno está fazendo, desde quando e até quando** — e
a aba que carrega esse nome não responde nada disso.

O dado já existe: `/api/workout-plans` devolve nome, estrutura, prazo e situação por aluno.

#### B7 · Os alertas continuam sendo leitura, não ação — *confirma o item 11 da Onda 2*

Cada card de alerta tem "Lido" e uma seta para `action_url`. O produto já sabe dizer "Marina
está há 12 dias sem treinar" e já tem mensagens, agenda e montador. Falta o passo de um toque:
enviar mensagem pronta, renovar a ficha, agendar avaliação. É a diferença entre um painel que
informa e uma ferramenta que trabalha — e é o que justifica cobrar.

#### B8 · Três rotas autorizadas que não existem — *confirma A3*

`src/proxy.ts:37-39` libera `/student-assessments`, `/anatomy` e `/achievements` para o papel de
aluno. **Nenhuma das três páginas existe.** Não há link para elas hoje, então ninguém cai num
404 por acidente — mas a autorização declara uma superfície que o produto não tem, e o aluno
segue sem ver as próprias avaliações, que é o dado que mais motiva quem treina.

Ou as páginas são construídas, ou as três linhas saem do `proxy.ts`. Manter as duas coisas
divergindo é o começo de um bug de permissão.

### Médios

**B9 · A janela de compartilhamento continua fechada (A7).** Sem `metadataBase`, sem
`openGraph`, sem `sitemap`, sem `robots`. O ícone declarado em `src/app/layout.tsx:26-27` é o
`gkong-logo.jpg` de **158 KB**, servido também como ícone de iOS. Agora que existe um botão de
WhatsApp no produto (A1), o link que ele carrega chega no celular do aluno **sem imagem e sem
descrição** — as duas peças foram feitas para trabalhar juntas e só uma existe.

**B10 · Toasts no topo, num app de polegar.** `src/app/layout.tsx:39` usa `position="top-right"`.
No celular, todo erro e toda confirmação aparecem no canto mais distante do polegar e somem
antes de serem lidos. Erros de formulário deveriam estar no campo; confirmações, embaixo.

**B11 · `window.confirm` para arquivar aluno.** `(trainer)/students/page.tsx:68` — caixa nativa
do sistema no meio de uma interface autoral, e a ação é destrutiva (arquivar derruba as sessões
do aluno). Merece o diálogo do próprio sistema visual, com o efeito escrito por extenso.

**B12 · Código morto e nome antigo.** `src/components/ui/muscle-anatomy.tsx` (126 linhas, usa
`hsl()` sobre tokens `oklch` — nunca funcionaria) e `src/lib/demo-data.ts` (**1.112 linhas**)
não são importados por ninguém. O `package.json` ainda se chama `fitcontrol-pro`, e a chave de
progresso gravada no aparelho do aluno é `fitcontrol-workout-progress:`. O `demo-data.ts` tem
uso possível — é a base da demonstração sem cadastro da Onda 3; hoje é peso morto no repositório.

**B13 · Acessibilidade segue como estava (A6).** Textos em `text-white/38` e `text-black/25`
persistem em 10 telas (landing, login, registro, painel, perfil do aluno). Nenhum `aria-live`
no produto inteiro — o fim do descanso não é anunciado por leitor de tela. Alvos de toque abaixo
de 44px continuam nos chips de músculo, nas estrelas de avaliação e nos botões `size="icon"`.

**B14 · Tudo ainda carrega no cliente (M1).** Nenhum Server Component busca dados; toda tela é
`'use client'` + `useEffect` + `fetch`, com spinner e salto de layout quando os dados chegam.
Com o App Router e as consultas já isoladas em `src/lib/`, as listas e o painel são conversão
direta.

### Descobertos ao verificar as correções

#### B15 · O menu "..." da lista de alunos nunca funcionou

`DropdownMenuItem` é um `Menu.Item` do Base UI, que expõe `onClick` — não `onSelect`. As três
ações do menu (**Ver perfil**, **Editar**, **Arquivar**) estavam ligadas em `onSelect`, um
evento de seleção de texto do DOM: os manipuladores nunca rodavam.

E havia um segundo defeito embaixo do primeiro. O conteúdo do menu é renderizado num portal,
mas o evento continua subindo pela árvore do React até o card que abriu o menu — e o card é
clicável. Resultado: escolher qualquer item do menu valia como clique no card e navegava para
o perfil do aluno. Com só um dos dois defeitos corrigido, "Arquivar" continuava levando para
o perfil em vez de abrir a confirmação.

Corrigido nos dois níveis: `onClick` nos itens e `stopPropagation` no conteúdo do menu — este
no componente compartilhado, porque clique em menu nunca deveria contar como clique no que
está atrás.

#### B16 · As rotas de metadata caíam no `/login`

O `matcher` do `src/proxy.ts` exclui `api`, `_next` e extensões de imagem, mas não os arquivos
de metadata. Recém-criados, `robots.txt`, `sitemap.xml`, `opengraph-image` e `apple-icon`
respondiam **307 para `/login`** — ou seja, o rastreador e a prévia do WhatsApp não
alcançariam nenhum deles, e a correção B9 nasceria morta.

Passam direto agora, com um desvio explícito no proxy.

---

## Ordem sugerida

**Primeiro — três dias, e tira dívida que só cresce**

1. Recorte de data e paginação nas quatro consultas (B2). Meia dia cada, e resolve o consumo
   de bateria e dados do aluno junto.
2. Lotes no cron de alertas (B3).
3. `metadataBase`, `openGraph`, ícone otimizado (B9) — o botão de WhatsApp já está no ar
   esperando por isso.
4. Varredura das dez cores cruas (B4), toasts para baixo (B10), `window.confirm` (B11),
   remoção do código morto (B12).

**Depois — a onda que muda o uso: Modo Academia (B1)**

Wake Lock, notificação e som no cronômetro; "última vez" e recorde por exercício; fila de envio
offline. É a tela mais aberta do produto e a menos tratada. Puxa junto o PWA (C3), porque
instalar sem funcionar offline não resolve.

**Em paralelo, barato e de efeito direto no personal**

5. Aba "Fichas" do perfil mostrando as fichas do aluno (B6) — o dado já existe na API.
6. Ações de um toque nos alertas (B7).
7. Mover o montador para `/workouts/new` (B5).

**Decisão pendente**

8. As três rotas fantasma (B8): construir as páginas do aluno ou remover a autorização. Vale
   decidir antes que alguém publique um link para elas.

---

## Como medir

Os indicadores da análise anterior seguem válidos. Dois a acrescentar, ligados ao que foi
entregue e ao que falta:

| Indicador | Por que importa |
|---|---|
| Fichas publicadas a partir de tela < 1280px | mede se C2 mudou o comportamento, não só a tela |
| Convites de acesso enviados por aluno cadastrado | mede se A1 fechou o buraco da ativação |
| Treinos concluídos com o app em segundo plano | mede o efeito do Modo Academia (B1) |
| Tempo da resposta de `/api/messages` no percentil 95 | vira o alarme antecipado de B2 |
