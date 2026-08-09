import Link from 'next/link';
import { BookOpen, Dumbbell, KeyRound, ShieldCheck, UserPlus } from 'lucide-react';

const trainerTutorials = [
  ['1. Salve seus códigos', 'No cadastro, guarde o código secreto e a chave de recuperação. Compartilhe somente o código público FC-XXXXXXXX.'],
  ['2. Cadastre um aluno', 'Abra Alunos → Novo aluno, confirme a autorização de privacidade e entregue ao aluno o código individual mostrado uma vez.'],
  ['3. Publique a ficha', 'Abra Fichas de Treino, escolha o aluno, adicione dias e exercícios, configure séries, repetições e descanso e publique.'],
  ['4. Acompanhe resultados', 'Dashboard, Relatórios e perfil do aluno mostram frequência, conclusão, volume, avaliações e alertas.'],
  ['5. Recupere ou troque acessos', 'Em Configurações, troque seus códigos. No perfil do aluno, gere um novo código individual quando ele perder o anterior.'],
];

const studentTutorials = [
  ['1. Entre sem dados de contato', 'Informe seu nome, o código público do personal e seu código individual. Nenhum e-mail ou telefone é solicitado.'],
  ['2. Complete seu perfil', 'Autorize o tratamento para acompanhamento. Peso, altura, gênero e restrições podem ser omitidos quando não forem necessários.'],
  ['3. Execute o treino', 'Em Treino, informe repetições e carga de cada série, marque-a como concluída e use o temporizador de descanso.'],
  ['4. Conclua e acompanhe', 'Ao finalizar, avalie o treino. O Histórico guarda duração, conclusão e volume; Evolução mostra sua constância.'],
  ['5. Controle seus dados', 'Em Perfil, exporte uma cópia ou exclua permanentemente sua conta. Para trocar o código, fale com seu personal.'],
];

export default function HelpPage() {
  return <main className="min-h-screen bg-background px-4 py-10"><div className="mx-auto max-w-5xl space-y-8">
    <div><Link href="/" className="text-sm text-primary hover:underline">← Voltar</Link><div className="mt-5 flex items-center gap-3"><BookOpen className="h-8 w-8 text-primary" /><div><h1 className="text-3xl font-bold">Ajuda e tutoriais</h1><p className="text-muted-foreground">Primeiros passos claros para personal e aluno.</p></div></div></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border bg-card p-6"><div className="mb-5 flex items-center gap-2"><UserPlus className="h-5 w-5 text-emerald-600" /><h2 className="text-xl font-bold">Tutorial do personal</h2></div><ol className="space-y-4">{trainerTutorials.map(([title, text]) => <li key={title} className="rounded-lg bg-muted/30 p-4"><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p></li>)}</ol></section>
      <section className="rounded-2xl border bg-card p-6"><div className="mb-5 flex items-center gap-2"><Dumbbell className="h-5 w-5 text-blue-600" /><h2 className="text-xl font-bold">Tutorial do aluno</h2></div><ol className="space-y-4">{studentTutorials.map(([title, text]) => <li key={title} className="rounded-lg bg-muted/30 p-4"><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p></li>)}</ol></section>
    </div>
    <section className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border p-5"><KeyRound className="mb-2 h-5 w-5 text-amber-600" /><h2 className="font-bold">Perdeu o acesso?</h2><p className="mt-2 text-sm text-muted-foreground">Personal: use nome, código público e chave de recuperação em <Link href="/recover" className="text-primary underline">Recuperar acesso</Link>. Aluno: peça ao personal um novo código.</p></div><div className="rounded-xl border p-5"><ShieldCheck className="mb-2 h-5 w-5 text-emerald-600" /><h2 className="font-bold">Boas práticas</h2><p className="mt-2 text-sm text-muted-foreground">Não envie código secreto ou chave de recuperação em grupos. Use um código diferente por conta e troque-o se houver suspeita de acesso.</p></div></section>
    <div className="flex gap-4 text-sm"><Link href="/privacy" className="text-primary underline">Privacidade</Link><Link href="/terms" className="text-primary underline">Termos de uso</Link></div>
  </div></main>;
}
