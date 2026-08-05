import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <article className="mx-auto max-w-3xl space-y-8">
        <div>
          <Link href="/" className="text-sm font-medium text-primary hover:underline">← Voltar ao início</Link>
          <h1 className="mt-6 text-3xl font-bold">Política de Privacidade</h1>
          <p className="mt-2 text-sm text-muted-foreground">Última atualização: 5 de agosto de 2026.</p>
        </div>
        <section className="space-y-3"><h2 className="text-xl font-semibold">Dados utilizados</h2><p className="leading-relaxed text-muted-foreground">A plataforma utiliza os dados cadastrados pelo personal, como nome, cidade e estado, e os dados necessários para os perfis dos alunos, fichas e avaliações.</p></section>
        <section className="space-y-3"><h2 className="text-xl font-semibold">Finalidade</h2><p className="leading-relaxed text-muted-foreground">Os dados são usados para autenticação por código, organização da consultoria, entrega das fichas e acompanhamento das informações registradas no sistema.</p></section>
        <section className="space-y-3"><h2 className="text-xl font-semibold">Proteção</h2><p className="leading-relaxed text-muted-foreground">As credenciais administrativas permanecem no servidor. Senhas não são publicadas no GitHub nem enviadas ao navegador. O acesso aos dados é limitado ao personal responsável e ao próprio aluno.</p></section>
        <section className="space-y-3"><h2 className="text-xl font-semibold">Responsabilidade do personal</h2><p className="leading-relaxed text-muted-foreground">O personal deve informar seus alunos sobre o uso dos dados, evitar informações desnecessárias e solicitar a correção ou remoção quando aplicável.</p></section>
      </article>
    </main>
  );
}
