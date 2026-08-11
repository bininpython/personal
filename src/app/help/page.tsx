import Link from 'next/link';
import { Dumbbell, KeyRound, ShieldCheck, UserPlus } from 'lucide-react';
import { BrandMark } from '@/components/brand/brand-mark';
import { PublicBackLink } from '@/components/navigation/public-back-link';

const trainerTutorials = [
  ['Salve seu código', 'No cadastro, guarde o código pessoal de 6 números. Sua senha e idade servem somente para recuperar o acesso.'],
  ['Cadastre um aluno', 'Abra Alunos → Novo aluno, confirme a autorização de privacidade e entregue ao aluno o nome cadastrado e o código individual.'],
  ['Publique a ficha', 'Abra Montar ficha, escolha o aluno, adicione dias e exercícios, configure séries, repetições e descanso e publique.'],
  ['Acompanhe resultados', 'Início, Relatórios e o perfil do aluno mostram frequência, conclusão, volume, avaliações e alertas.'],
  ['Recupere ou troque acessos', 'Em Configurações, troque seu código pessoal. No perfil do aluno, gere um novo código individual quando ele perder o anterior.'],
];

const studentTutorials = [
  ['Entre sem dados de contato', 'Informe somente seu nome e o código individual enviado pelo personal. Nenhum e-mail ou telefone é solicitado.'],
  ['Complete seu perfil', 'Autorize o tratamento para acompanhamento. Peso, altura, gênero e restrições podem ser omitidos quando não forem necessários.'],
  ['Execute o treino', 'Em Treino, informe repetições e carga de cada série, marque-a como concluída e use o temporizador de descanso.'],
  ['Conclua e acompanhe', 'Ao finalizar, avalie o treino. O Histórico guarda duração, conclusão e volume; Evolução mostra sua constância.'],
  ['Controle seus dados', 'Em Perfil, exporte uma cópia ou exclua permanentemente sua conta. Para trocar o código, fale com seu personal.'],
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
            Dois caminhos curtos: um para quem treina os outros, outro para quem treina.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <Tutorial eyebrow="Personal" title="Como colocar sua operação de pé" icon={UserPlus} steps={trainerTutorials} />
          <Tutorial eyebrow="Aluno" title="Como usar seu treino" icon={Dumbbell} steps={studentTutorials} />
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
