import Link from 'next/link';
import { ArrowLeft, Dumbbell, KeyRound, ShieldCheck, UserPlus } from 'lucide-react';
import { BrandMark } from '@/components/brand/brand-mark';

const trainerTutorials = [
  ['1. Salve seu código', 'No cadastro, guarde o código pessoal de 6 números. Sua senha e idade servem somente para recuperar o acesso.'],
  ['2. Cadastre um aluno', 'Abra Alunos → Novo aluno, confirme a autorização para o cadastro e entregue ao aluno o nome cadastrado e o código individual. No primeiro acesso, o aluno aceita diretamente os Termos e a Política de Privacidade.'],
  ['3. Publique a ficha', 'Abra Montar ficha, escolha o aluno, adicione dias e exercícios, configure séries, repetições e descanso e publique.'],
  ['4. Acompanhe resultados', 'Visão geral, Relatórios e o perfil do aluno mostram frequência, conclusão, volume, avaliações e alertas.'],
  ['5. Recupere ou troque acessos', 'Em Configurações, troque seu código pessoal. No perfil do aluno, gere um novo código individual quando ele perder o anterior.'],
];

const studentTutorials = [
  ['1. Entre sem dados de contato', 'Informe somente seu nome e o código individual enviado pelo personal. Nenhum e-mail ou telefone é solicitado.'],
  ['2. Complete seu perfil', 'Autorize o tratamento para acompanhamento. Peso, altura, gênero e restrições podem ser omitidos quando não forem necessários.'],
  ['3. Execute o treino', 'Em Treino, informe repetições e carga de cada série, marque-a como concluída e use o temporizador de descanso.'],
  ['4. Conclua e acompanhe', 'Ao finalizar, avalie o treino. O Histórico guarda duração, conclusão e volume; Evolução mostra sua constância.'],
  ['5. Controle seus dados', 'Em Perfil, exporte uma cópia ou exclua permanentemente sua conta. Para trocar o código, fale com seu personal.'],
];

export default function HelpPage() {
  return <main className="dk-app dk-app-surface min-h-screen px-4 py-6 sm:py-10"><div className="relative z-10 mx-auto max-w-6xl space-y-8">
    <nav className="flex items-center justify-between"><BrandMark /><Link href="/" className="flex min-h-11 items-center gap-2 rounded-full border bg-background px-4 text-sm font-bold"><ArrowLeft className="size-4" /> Voltar</Link></nav>
    <header className="dk-hero-panel p-7 sm:p-10"><div className="relative z-10"><p className="dk-kicker text-[#c9ff32]">Suporte D KONG</p><h1 className="dk-display mt-6 text-[clamp(3rem,8vw,6rem)]">AJUDA DIRETA.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-white/70">Encontre o próximo passo para cadastrar, treinar, acompanhar e recuperar seu acesso.</p></div></header>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-[1.75rem] border bg-card p-5 shadow-sm sm:p-7"><div className="mb-6 flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-full bg-black text-[#c9ff32]"><UserPlus className="size-5" /></span><div><p className="dk-kicker text-muted-foreground">Operação</p><h2 className="mt-1 text-2xl font-black">Para o personal</h2></div></div><ol className="space-y-3">{trainerTutorials.map(([title, text]) => <li key={title} className="rounded-2xl border border-black/8 bg-muted/25 p-4"><h3 className="font-black">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></li>)}</ol></section>
      <section className="rounded-[1.75rem] border bg-card p-5 shadow-sm sm:p-7"><div className="mb-6 flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-full bg-[#c9ff32] text-black"><Dumbbell className="size-5" /></span><div><p className="dk-kicker text-muted-foreground">Performance</p><h2 className="mt-1 text-2xl font-black">Para o aluno</h2></div></div><ol className="space-y-3">{studentTutorials.map(([title, text]) => <li key={title} className="rounded-2xl border border-black/8 bg-muted/25 p-4"><h3 className="font-black">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></li>)}</ol></section>
    </div>
    <section className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border bg-card p-5"><KeyRound className="mb-3 size-5 text-[#9a5d00]" /><h2 className="font-black">Perdeu o acesso?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Personal: use nome, senha e idade em <Link href="/recover" className="font-bold text-foreground underline">Recuperar acesso</Link>. Aluno: peça ao personal um novo código.</p></div><div className="rounded-2xl border bg-card p-5"><ShieldCheck className="mb-3 size-5 text-[#147a42]" /><h2 className="font-black">Boas práticas</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Não envie códigos em grupos. Troque o código se houver suspeita de acesso e nunca compartilhe sua senha de recuperação.</p></div></section>
    <div className="flex gap-4 pb-6 text-sm"><Link href="/privacy" className="font-bold underline">Privacidade</Link><Link href="/terms" className="font-bold underline">Termos de uso</Link></div>
  </div></main>;
}
