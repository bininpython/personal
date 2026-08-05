import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <article className="mx-auto max-w-3xl space-y-8">
        <div>
          <Link href="/" className="text-sm font-medium text-primary hover:underline">← Voltar ao início</Link>
          <h1 className="mt-6 text-3xl font-bold">Termos de Uso</h1>
          <p className="mt-2 text-sm text-muted-foreground">Última atualização: 5 de agosto de 2026.</p>
        </div>
        <section className="space-y-3"><h2 className="text-xl font-semibold">Uso da plataforma</h2><p className="leading-relaxed text-muted-foreground">O FitControl Pro auxilia o personal a organizar alunos, avaliações e fichas de treino. O personal é responsável pela prescrição, pela avaliação das limitações individuais e pela orientação segura de cada exercício.</p></section>
        <section className="space-y-3"><h2 className="text-xl font-semibold">Contas e códigos</h2><p className="leading-relaxed text-muted-foreground">O código e a senha do personal são pessoais. O código de quatro números do aluno deve ser entregue somente ao aluno correspondente. O usuário deve comunicar qualquer suspeita de acesso indevido.</p></section>
        <section className="space-y-3"><h2 className="text-xl font-semibold">Dados inseridos</h2><p className="leading-relaxed text-muted-foreground">O personal deve inserir somente informações necessárias à prestação do serviço e manter os dados de seus alunos corretos. Informações médicas ou sensíveis exigem cuidado e autorização adequada.</p></section>
        <section className="space-y-3"><h2 className="text-xl font-semibold">Disponibilidade</h2><p className="leading-relaxed text-muted-foreground">O serviço pode receber manutenção e atualizações. Recursos identificados como indisponíveis ou em desenvolvimento não fazem parte da versão ativa.</p></section>
      </article>
    </main>
  );
}
