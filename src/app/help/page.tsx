import Link from 'next/link';
import { Dumbbell, KeyRound, PlayCircle, ShieldCheck, UserPlus, UserRound } from 'lucide-react';
import { BrandMark } from '@/components/brand/brand-mark';
import { PublicBackLink } from '@/components/navigation/public-back-link';
import { GuidedTutorialButton } from '@/components/onboarding/product-tutorial';

const trainerTutorials = [
  ['Salve seu acesso', 'No cadastro, guarde o código pessoal de 6 números. Sua senha e idade servem somente para recuperar o acesso.'],
  ['Cadastre o aluno', 'Abra Alunos → Novo aluno, confirme a autorização e entregue ao aluno exatamente o nome cadastrado e o código individual gerado.'],
  ['Oriente o primeiro acesso', 'O aluno entra sem e-mail, lê os documentos e confirma diretamente os Termos e a Política de Privacidade antes de usar a ficha.'],
  ['Monte e publique', 'Abra Montar ficha, escolha o aluno, crie os dias, adicione exercícios, configure séries, repetições, carga, descanso e o método de treino e publique.'],
  ['Baixe o PDF completo', 'Em Gerenciar fichas, use Baixar PDF para gerar uma versão pronta para consulta ou impressão. Baixe novamente depois de alterar o plano.'],
  ['Envie a ficha para outro aluno', 'Na ficha pronta, escolha Enviar para outro aluno, selecione o destino e confirme. O app cria uma cópia independente para você personalizar.'],
  ['Acompanhe e ajuste', 'Início, Relatórios, Avaliações e o perfil do aluno mostram frequência, conclusão, volume e alertas para orientar mudanças.'],
  ['Recupere ou troque acessos', 'Em Configurações, troque seu código pessoal. No perfil do aluno, gere um novo código quando ele perder o anterior.'],
];

const studentTutorials = [
  ['Entre sem dados de contato', 'Informe somente seu nome e o código individual enviado pelo personal. Nenhum e-mail ou telefone é solicitado.'],
  ['Conclua o primeiro acesso', 'Leia e confirme os documentos. Peso, altura, gênero e restrições podem ser omitidos quando não forem necessários ao acompanhamento.'],
  ['Confira a ficha ativa', 'Em Início, confirme o plano e o treino do dia. Se uma atualização não aparecer, recarregue a tela e fale com o personal.'],
  ['Registre o treino', 'Em Treino, confira o método e a orientação do personal, informe repetições, carga e esforço de cada série, marque o que concluiu e use o temporizador de descanso.'],
  ['Baixe sua ficha', 'Use Baixar ficha em PDF para consultar dias, exercícios e orientações. Para registrar a execução, continue usando o app.'],
  ['Conclua e acompanhe', 'Ao finalizar, avalie o treino. O Histórico guarda duração, conclusão e volume; Evolução mostra sua constância.'],
  ['Peça orientação', 'Use Mensagens para dúvidas. Se sentir dor, pare o exercício e informe qual movimento, região e momento causaram o desconforto.'],
  ['Controle seus dados', 'Em Perfil, exporte uma cópia ou exclua permanentemente sua conta. Para trocar o código, fale com seu personal.'],
];

const individualTutorials = [
  ['Confira sua área', 'A Visão geral reúne suas fichas pessoais e os atalhos para continuar organizando a própria rotina.'],
  ['Monte e salve sua ficha', 'Abra Montar ficha, dê um nome ao plano, distribua os dias e configure exercícios, séries, repetições, carga, descanso e o método de treino.'],
  ['Organize seus planos', 'Em Minhas fichas, confira os dias e a validade e mantenha sua rotina atual fácil de encontrar.'],
  ['Baixe o PDF completo', 'Na ficha desejada, use Baixar PDF. Gere uma nova versão sempre que atualizar exercícios ou orientações.'],
  ['Cuide da conta', 'Em Meu perfil, atualize os dados, exporte uma cópia das informações e encontre os controles de privacidade e acesso.'],
];

function Tutorial({
  eyebrow,
  title,
  icon: Icon,
  steps,
}: {
  eyebrow: string;
  title: string;
  icon: typeof Dumbbell;
  steps: string[][];
}) {
  return (
    <section className="rounded-[1.75rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-black text-[#c9ff32]">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-black/45">{eyebrow}</p>
          <h2 className="text-xl font-black tracking-[-0.03em]">{title}</h2>
        </div>
      </div>
      <ol className="mt-6 space-y-3">
        {steps.map(([title, text], index) => (
          <li key={title} className="grid grid-cols-[2rem_1fr] gap-3 rounded-2xl bg-[#f6f6f1] p-4">
            <span className="font-mono text-sm font-black text-[#5c7f00]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="font-bold">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-black/55">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f6f6f1] text-[#0a0a0a]">
      <PublicBackLink href="/" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[#5c7f00]">Ajuda</p>
          <h1 className="mt-4 text-[clamp(2.5rem,6vw,4rem)] font-black leading-[1.02] tracking-[-0.06em]">
            PRIMEIROS PASSOS,<br />SEM ENROLAÇÃO.
          </h1>
          <p className="mt-5 text-base leading-7 text-black/60">
            Um guia completo para aprender somente as ferramentas disponíveis no seu tipo de conta.
          </p>
        </div>

        <section className="mt-8 flex flex-col gap-5 rounded-[1.75rem] bg-[#090a08] p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.14)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex max-w-2xl items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#c9ff32] text-black">
              <PlayCircle className="size-5" />
            </span>
            <div>
              <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-[#c9ff32]">Tour interativo</p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.03em]">Prefere aprender dentro do sistema?</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Entre na sua conta e siga instruções práticas em cada etapa. Você pode fechá-lo e voltar aqui quando quiser.
              </p>
            </div>
          </div>
          <GuidedTutorialButton className="shrink-0 bg-[#c9ff32] px-4 text-black hover:bg-[#d7ff65]" />
        </section>

        <div className="mt-10 grid gap-5 xl:grid-cols-3">
          <Tutorial eyebrow="Personal" title="Como colocar sua operação de pé" icon={UserPlus} steps={trainerTutorials} />
          <Tutorial eyebrow="Aluno" title="Como usar seu treino" icon={Dumbbell} steps={studentTutorials} />
          <Tutorial eyebrow="Atleta independente" title="Como montar sua rotina" icon={UserRound} steps={individualTutorials} />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-black/10 bg-white p-6">
            <KeyRound className="size-5" />
            <h2 className="mt-3 font-black">Perdeu o acesso?</h2>
            <p className="mt-2 text-sm leading-6 text-black/55">
              Personal: use nome, senha e idade em{' '}
              <Link href="/recover" className="font-bold text-black underline">recuperar acesso</Link>.
              Aluno: peça ao personal um novo código.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-black/10 bg-white p-6">
            <ShieldCheck className="size-5" />
            <h2 className="mt-3 font-black">Boas práticas</h2>
            <p className="mt-2 text-sm leading-6 text-black/55">
              Não envie códigos em grupos. Troque o código se houver suspeita de acesso e nunca
              compartilhe sua senha de recuperação.
            </p>
          </div>
        </div>
      </main>

      <footer className="px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 border-t border-black/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark compact />
          <div className="flex gap-5 text-xs font-semibold text-black/55">
            <Link href="/terms" className="hover:text-black">Termos</Link>
            <Link href="/privacy" className="hover:text-black">Privacidade</Link>
            <Link href="/plans" className="hover:text-black">Planos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
