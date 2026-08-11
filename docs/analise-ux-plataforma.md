# Análise da plataforma G KONG

Auditoria de produto, design e experiência de uso — 10 de agosto de 2026
Base: `main` no commit `93ea9f8`, ~9.300 linhas de interface em 30 telas.

---

## Resumo executivo

O G KONG tem uma coisa que a maioria dos concorrentes não tem: **uma ideia forte e um
diferencial real**. Entrar sem e-mail, com nome e um código de seis números, elimina o maior
atrito de adoção do segmento — aluno de academia não cria conta, não confirma e-mail, não
lembra senha. E a identidade visual nova (preto, volt, tipografia display) é a primeira coisa
nesse mercado que não parece um sistema de gestão de clínica.

O problema é que **essa ideia só chegou em um terço do produto**. Nove telas falam a língua
G KONG. As outras vinte ainda são o app genérico anterior. O usuário atravessa duas
plataformas diferentes usando o mesmo login, e a promessa da landing se desfaz no segundo
clique.

Abaixo do visual há três lacunas que custam usuários de verdade:

1. **O celular é onde o produto vive, e é onde ele está pior.** O montador de fichas só
   funciona acima de 1280px de largura. A tela de treino não é instalável, não funciona
   offline e o cronômetro de descanso morre quando a tela apaga — dentro de uma academia,
   com o celular no bolso e sinal ruim no subsolo.
2. **Ninguém é conduzido.** O personal se cadastra e cai num painel com seis zeros. O aluno
   depende de o personal descobrir sozinho como entregar o código.
3. **Nada sai da plataforma.** Sem imagem de compartilhamento, sem card de treino concluído,
   sem SEO. Um produto que se propaga por indicação e WhatsApp não tem nenhuma peça pronta
   para circular no WhatsApp.

Nada disso é reconstrução. É um trimestre de trabalho focado, na ordem certa.

---

## O que já está bom

**Autenticação sem e-mail é um diferencial de produto, não um detalhe técnico.**
Nome + código `000-000`, com formatação automática enquanto digita, `autocomplete="one-time-code"`,
alternância de visibilidade e opção de permanecer conectado. É o fluxo de login mais curto
que existe nessa categoria e deveria ser o centro da comunicação.

**A execução do treino é a melhor parte do produto.** Marcação série a série, campos de
repetições, carga e RPE embutidos na própria série, descanso automático disparado ao concluir
uma série, botão de +15s, pular descanso, e persistência em `localStorage` por ciclo semanal —
o aluno fecha o app no meio do treino, volta e não perde nada. Isso é maturidade de produto.

**A anatomia interativa é uma assinatura visual.** Clicar no músculo para filtrar exercícios é
memorável e praticamente inexistente nos concorrentes brasileiros.

**A camada de segurança e privacidade está acima do esperado para o porte.** Códigos com
aleatoriedade criptográfica e guardados só como hash bcrypt, sessão assinada e revogável em
cookie HttpOnly, rate limit com bloqueio, CSP restritiva, cabeçalhos de segurança, e LGPD
levada a sério — consentimento explícito, exportação e exclusão pelo próprio titular.

**A inteligência de acompanhamento existe e é o que vende para o personal.** Alertas
automáticos diários de inatividade, queda de constância e feedback preocupante; score de risco
por aluno; constância, adesão e evolução de peso e percentual de gordura.

**Fichas com prazo e versionamento.** Publicar uma nova versão preserva o histórico e o aluno
não fica sem treino quando o prazo vence — decisão de produto correta e nada óbvia.

**A base técnica é moderna e coerente.** App Router com grupos de rota por papel, autorização
centralizada por rota, tokens de design em `oklch`, tema escuro, `prefers-reduced-motion` e
`safe-area-inset` na navegação inferior.

---

## O que precisa mudar

Cada achado tem um identificador para referência nas tarefas.

### Críticos

#### C1 · Duas linguagens visuais dentro do mesmo produto

Apenas nove arquivos usam o sistema G KONG (`dk-hero-panel`, `dk-kicker`, `dk-display`,
`dk-metric`, volt). São eles: painel do personal, configurações, perfil do aluno visto pelo
personal, e todas as telas do aluno.

Todo o resto — **Alunos, Fichas de Treino, Montador, Avaliações, Agenda, Mensagens do
personal, Alertas, Relatórios, Planos e Ajuda** — continua no visual genérico anterior:
`h1 text-2xl font-bold`, `text-primary`, azul `#2563eb` na anatomia, `text-blue-600` nos links
de vídeo.

O efeito prático: o personal entra num painel preto e volt com tipografia de 5rem e, ao clicar
em "Alunos", cai num painel branco corporativo. Ele não pensa "o app tem duas telas
diferentes" — ele pensa "o app é inacabado".

Agrava: as cores semânticas foram improvisadas por tela (`emerald`, `amber`, `red`, `blue`
direto no JSX), enquanto os tokens `--chart-1` a `--chart-5` definidos em `globals.css` são
monocromáticos e não são usados por nenhum gráfico.

#### C2 · O montador de fichas não funciona no celular

`src/app/(trainer)/exercises/page.tsx:446` usa `xl:grid-cols-[330px_minmax(360px,1fr)_minmax(390px,1fr)]`.
Abaixo de 1280px, as três colunas viram uma pilha vertical — e duas delas contêm
`ScrollArea` com **altura fixa de 690px** (linhas 534 e 639).

Resultado no celular: a lista de exercícios e a ficha em construção viram duas caixas de
rolagem gigantes empilhadas, com rolagem dentro de rolagem. Montar uma ficha de três dias
nesse formato é impraticável — e montar ficha no celular, na academia, entre atendimentos, é
exatamente o que o personal faz.

Essa é a tarefa central do produto e ela só existe de verdade no desktop.

#### C3 · Não é instalável e não funciona offline

Não há `manifest`, nem service worker, nem ícone maskable. O favicon é o
`public/gkong-logo.jpg` de 161 KB servido também como ícone de iOS.

Consequências no uso real:

- O aluno não consegue colocar o app na tela inicial. Toda sessão começa pelo navegador.
- Na tela de treino, o `fetch` de sincronização roda a cada 10 segundos
  (`src/app/(student)/workout/page.tsx:240`). Em academia de subsolo, com sinal ruim, isso
  falha em loop.
- O registro do treino só é enviado ao final, num único POST. Se a conexão cair naquele
  momento, o aluno vê um erro e a sessão inteira — todas as cargas digitadas — depende de o
  `localStorage` ter guardado tudo.

Para um app usado de pé, com uma mão, dentro de um prédio com concreto, isso não é um detalhe
de infraestrutura: é a diferença entre ser usado e ser abandonado.

#### C4 · A tarefa central do personal está escondida numa aba chamada "Exercícios"

`/workouts/new` é um `redirect('/exercises')` de cinco linhas. A tela "Fichas de Treino" só
lista fichas; para criar ou editar uma, o usuário precisa ir em "Exercícios" — ou clicar em
"Nova ficha", que o joga para lá sem explicação.

O menu tem "Fichas de Treino" e "Exercícios" como itens irmãos, e o mais importante dos dois
está com o nome errado. Ninguém descobre isso sozinho; descobre porque foi ensinado.

#### C5 · O personal novo não é conduzido a lugar nenhum

Depois do cadastro, o usuário cai no painel com seis indicadores em zero, um gráfico vazio
("Sem alunos cadastrados") e um ranking vazio. O único caminho é o botão "Novo aluno" dentro
do bloco preto.

Falta o essencial: um checklist de ativação com três passos — cadastrar o primeiro aluno,
montar a primeira ficha, entregar o código — com estado de progresso. É a diferença entre um
cadastro que vira uso e um cadastro que vira nada.

### Altos

#### A1 · A entrega do código do aluno não tem suporte no produto

O momento mais frágil de toda a adoção é o personal transmitir o nome e o código para o aluno.
Hoje o produto mostra o código no perfil do aluno e para por aí. Não há botão de compartilhar
no WhatsApp, não há cartão de acesso pronto, não há QR, não há mensagem sugerida.

O cadastro do aluno acontece na plataforma; a ativação acontece fora dela, sem apoio.

#### A2 · Polling agressivo no lugar de tempo real

| Tela | Intervalo |
|---|---|
| Mensagens (aluno e personal) | 3 s |
| Ficha do aluno e início | 10 s |
| Contador de alertas | 60 s |

Com dez alunos ativos e uso normal, isso passa de dezenas de milhares de requisições por dia
sem nenhum evento novo — consumindo bateria e dados do celular do aluno **durante o treino**.
O `@supabase/supabase-js` já está no projeto e resolve mensagens e ficha com subscription.

#### A3 · O aluno não vê as próprias avaliações nem conquistas

`src/proxy.ts` autoriza `/student-assessments`, `/anatomy` e `/achievements` para o papel de
aluno. **Nenhuma dessas páginas existe.** O personal registra avaliação física com peso,
percentual de gordura e medidas, e o aluno só enxerga isso indiretamente, num gráfico de peso
em "Evolução".

O dado que mais motiva quem treina — "eu mudei" — está no banco e não chega a quem treina.

#### A4 · Falta a informação mais pedida durante o treino: quanto levantei da última vez

Cada série concluída grava repetições, carga e RPE. Nada disso volta para a tela de execução.
O aluno abre o supino e vê "3 × 10–12, 60s" — a mesma coisa que veria num papel. Não vê
"da última vez: 4×10 com 32 kg", não vê recorde pessoal, não vê sugestão de progressão.

O produto coleta o dado que sustenta a sobrecarga progressiva e não o devolve no único momento
em que ele é útil.

#### A5 · O cronômetro de descanso não sobrevive à tela apagada

O timer é um `setInterval` de 250 ms com vibração e toast ao terminar
(`src/app/(student)/workout/page.tsx:267-286`). Com o celular no bolso e a tela apagada, o
navegador congela o intervalo: sem som, sem notificação, sem Wake Lock. O aluno precisa manter
o celular aceso e a aba visível — no meio da série.

#### A6 · Contraste e alvos de toque abaixo do mínimo

- Texto em `text-white/38`, `text-white/35`, `text-black/35` e `text-black/25` fica abaixo de
  4,5:1. É usado justamente em rótulos, metadados e rodapé.
- `#668f00` sobre branco fica em torno de 4:1 — abaixo do mínimo para texto pequeno, e é
  aplicado em rótulos de 10px com `tracking-[0.2em]`.
- Alvos menores que 44px: estrelas de avaliação do treino, botão de olho nos campos de código,
  botões `h-7`/`h-8` e os chips de músculo (`px-2 py-1`, 11px).
- Rótulos de 10px com espaçamento de letra alto são bonitos parados e difíceis de ler em
  movimento, que é a condição real de uso.
- O fim do descanso não é anunciado por leitor de tela (sem `aria-live`).

#### A7 · A landing não mostra o produto, e o link não sobrevive ao WhatsApp

A hero tem uma boa manchete e, no lugar onde deveria estar o produto, uma foto do logotipo num
card branco. Os dois diferenciais visuais — a anatomia interativa e a tela de execução — não
aparecem em lugar nenhum. Os números escolhidos são fracos ("24/7 acesso" não significa nada)
e não há prova social.

Não existem `openGraph`, `metadataBase`, `sitemap` nem `robots`. O link colado no WhatsApp sai
sem imagem e sem descrição — para um produto que cresce por indicação, é a peça de marketing
mais barata que existe e ela está faltando.

### Médios

**M1 · Tudo carrega no cliente, sem esqueleto.** Todas as telas são `'use client'` com
`useEffect` + `fetch`, e o estado de carregamento é sempre um spinner com "Carregando...". A
tela aparece vazia, pisca e salta quando os dados chegam. Nenhum Server Component busca dados,
apesar do App Router.

**M2 · Bug de cor no gráfico do painel.** `src/app/(trainer)/dashboard/page.tsx:160` usa
`background: 'hsl(var(--card))'`, mas os tokens são `oklch`. `hsl(oklch(1 0 0))` é inválido —
o tooltip do gráfico de objetivos não recebe o fundo pretendido.

**M3 · `window.confirm` para arquivar aluno** (`src/app/(trainer)/students/page.tsx:67`) —
caixa nativa do sistema no meio de uma interface autoral, ruim no celular.

**M4 · Microcopy inconsistente.** "Cadastrar Aluno" convive com "Novo aluno"; "Fichas de
Treino" com "Montador de Fichas". O card do aluno mostra "Final do código" sem explicar por
que só o final aparece. Os erros são todos toasts genéricos no canto superior direito — longe
do polegar no celular e sumindo antes de serem lidos.

**M5 · Restos da versão anterior.** `package.json` ainda se chama `fitcontrol-pro`, e a chave
de progresso do treino gravada no aparelho do aluno é `fitcontrol-workout-progress:...`.
`src/components/ui/muscle-anatomy.tsx` (126 linhas) e `src/lib/demo-data.ts` não são importados
por ninguém — e o primeiro usa `hsl(var(--...))` sobre tokens `oklch`, ou seja, nunca
funcionaria.

**M6 · Menu sem hierarquia.** Nove itens de peso visual idêntico na lateral, misturando o uso
diário (Alunos, Fichas) com o eventual (Relatórios, Avaliações). Sem agrupamento, o usuário lê
os nove toda vez.

**M7 · `/plans` e `/help` ficaram para trás.** A página de planos usa o visual antigo, diz
"Gratuito" e não posiciona valor nenhum; o limite de 10 alunos ativos — que é o gargalo
comercial do produto — aparece como restrição, não como caminho de crescimento. A Ajuda é uma
lista de textos sem imagem, sem vídeo e sem busca.

---

## Plano de ação

### Onda 1 — Consertar a base (2 a 3 semanas)

O objetivo é que o produto pareça um só produto e funcione no aparelho em que é usado.

1. **Unificar o sistema visual (C1).** Promover as variáveis `--dk-*` a tokens de primeira
   classe, definir cores semânticas (`--ok`, `--atencao`, `--critico`) e migrar as dez telas
   remanescentes. Extrair um componente `PageHeader` com kicker + título display para acabar
   com as dez variações de cabeçalho. Corrigir M2 no caminho.
2. **Reconstruir o montador para o celular (C2).** Abaixo de `xl`, virar um fluxo de três
   etapas com barra inferior fixa ("Músculo → Exercícios → Ficha"), altura fluida em vez de
   690px fixos, e o contador de exercícios sempre visível.
3. **Renomear e reorganizar a navegação (C4, M6).** "Exercícios" vira **"Montar ficha"** e
   passa a ser subitem de Treinos. Agrupar o menu em *Operação* (Alunos, Treinos, Agenda,
   Mensagens) e *Análise* (Relatórios, Avaliações, Alertas).
4. **Transformar em PWA (C3).** Manifest, ícones maskable em PNG, service worker guardando a
   ficha ativa, e fila de envio para o registro de treino feito sem conexão. Substituir o JPG
   de 161 KB por SVG/PNG otimizado.
5. **Checklist de ativação no painel (C5)** e **compartilhamento do código do aluno (A1)** —
   botão de WhatsApp com mensagem pronta e cartão de acesso imprimível.
6. **Passe de acessibilidade (A6).** Piso de opacidade em 55% para texto, `#5c7f00` como verde
   mínimo sobre claro, alvos de 44px, `aria-live` no cronômetro.

### Onda 2 — Diferenciar (3 a 5 semanas)

7. **Modo Academia (C3, A4, A5).** A execução do treino em tela cheia, alto contraste, números
   grandes; "última vez: 4×10 @ 32 kg" e marca de recorde em cada exercício; cronômetro com
   Wake Lock, som e notificação funcionando com a tela apagada.
8. **Tempo real no lugar do polling (A2).** Supabase Realtime para mensagens e ficha; manter um
   polling longo apenas como rede de segurança.
9. **Devolver os dados ao aluno (A3).** Página de avaliações do aluno com linha do tempo de
   peso, percentual de gordura e medidas; conquistas e sequência de semanas cumpridas.
10. **Server Components e esqueletos (M1)** nas listas e no painel.
11. **Alertas acionáveis.** Cada alerta ganha ação de um toque: enviar mensagem pronta, renovar
    ficha, agendar avaliação.

### Onda 3 — Crescer (contínuo)

12. **Landing com o produto à mostra (A7):** a anatomia interativa rodando de verdade na hero e
    a tela de execução em vídeo curto; trocar as métricas vazias por número de exercícios,
    tempo médio para publicar uma ficha e um depoimento real.
13. **SEO e compartilhamento (A7):** `metadataBase`, imagem OG gerada, sitemap, robots.
14. **Demonstração sem cadastro:** um personal fictício com três alunos, para o visitante
    experimentar antes de criar conta. Boa parte da estrutura já existe em `demo-data.ts`.
15. **Posicionamento comercial (M7):** transformar o limite de 10 alunos em degrau de plano,
    com página de planos no visual novo.

---

## Cinco apostas para o produto ser diferente dos outros

**1. Levar o "sem fricção" até o fim: acesso por link.**
O código já é curto. O passo seguinte é o personal enviar um link de convite de uso único e
prazo curto pelo WhatsApp — o aluno toca e já está dentro, sem digitar nada. O login sem
e-mail é a bandeira do produto; hoje ela para no meio do caminho.

**2. Modo Academia como aplicativo dentro do aplicativo.**
A tela que o aluno abre quatro vezes por semana merece tratamento próprio: tela cheia, offline,
números legíveis a um braço de distância, cronômetro que funciona no bolso e o histórico de
carga ao lado de cada exercício. Hoje é a tela mais capaz do produto e a menos otimizada para a
condição real de uso.

**3. O corpo como identidade, não como filtro.**
A anatomia interativa está escondida no montador e pintada de azul genérico. Ela deveria ser a
assinatura do produto: no perfil do aluno, um mapa de calor do corpo mostrando o volume por
grupo muscular das últimas quatro semanas. É informação útil para o personal, é motivação para
o aluno e é a imagem mais compartilhável que o produto pode gerar.

**4. Piloto automático para o personal.**
Os alertas de risco já existem — o valor está em fechar o ciclo. Um card de alerta com "Enviar
mensagem", "Renovar ficha" e "Agendar avaliação" transforma o produto de painel de leitura em
ferramenta que trabalha. É o argumento que justifica cobrar.

**5. Provas que circulam sozinhas.**
Card de treino concluído, mapa muscular do mês, sequência de semanas — gerados como imagem,
com a marca. Um produto sem verba de marketing cresce pelo que os usuários postam; hoje não há
nada para postar.

---

## Correções rápidas

Baixo esforço, efeito imediato:

| # | Correção | Onde |
|---|---|---|
| 1 | Tooltip do gráfico com cor inválida (`hsl` sobre `oklch`) | `src/app/(trainer)/dashboard/page.tsx:160` |
| 2 | Trocar `window.confirm` por diálogo do sistema visual | `src/app/(trainer)/students/page.tsx:67` |
| 3 | Renomear "Exercícios" para "Montar ficha" no menu | `src/app/(trainer)/layout.tsx:25` |
| 4 | Elevar opacidades de texto abaixo de 45% | telas com `text-white/35`, `text-black/25` |
| 5 | Toasts para baixo no celular (perto do polegar) | `src/app/layout.tsx:39` |
| 6 | Remover código morto | `src/components/ui/muscle-anatomy.tsx`, `src/lib/demo-data.ts` |
| 7 | Renomear o pacote de `fitcontrol-pro` para `g-kong` | `package.json:2` |
| 8 | Ícone e favicon em PNG/SVG otimizado no lugar do JPG de 161 KB | `src/app/layout.tsx:25` |
| 9 | `metadataBase` + imagem OG | `src/app/layout.tsx:21` |
| 10 | Padronizar rótulos de ação em minúsculas de frase | telas do personal |

---

### Como medir se funcionou

| Indicador | Por que importa |
|---|---|
| Personais que publicam a primeira ficha em 24 h | mede o efeito de C5 e A1 |
| Fichas criadas pelo celular | mede o efeito de C2 |
| Treinos registrados por aluno ativo por semana | mede o efeito do Modo Academia |
| Alunos que voltam na segunda semana | mede se o produto virou hábito |
| Alertas que geram ação em vez de leitura | mede o valor percebido pelo personal |
