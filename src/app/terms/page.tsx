import Link from 'next/link';

export default function TermsPage() {
  return <main className="min-h-screen bg-background px-4 py-12"><article className="mx-auto max-w-3xl space-y-8">
    <div><Link href="/" className="text-sm font-medium text-primary hover:underline">← Voltar ao início</Link><h1 className="mt-6 text-3xl font-bold">Termos de Uso</h1><p className="mt-2 text-sm text-muted-foreground">Última atualização: 8 de agosto de 2026.</p></div>
    <section><h2 className="text-xl font-semibold">1. Serviço</h2><p className="mt-3 leading-relaxed text-muted-foreground">A D KONG organiza alunos, fichas, execuções, avaliações, agenda e comunicação. Ela não substitui avaliação médica nem decisão profissional.</p></section>
    <section><h2 className="text-xl font-semibold">2. Conta e códigos</h2><p className="mt-3 leading-relaxed text-muted-foreground">O personal entra com nome e código pessoal; o aluno usa nome e código individual. Senha e idade são usadas somente para recuperação. O usuário deve trocar o código diante de suspeita de acesso indevido.</p></section>
    <section><h2 className="text-xl font-semibold">3. Responsabilidade profissional</h2><p className="mt-3 leading-relaxed text-muted-foreground">O personal responde pela prescrição, orientação, habilitação profissional, adequação individual, consentimento e exatidão dos dados cadastrados.</p></section>
    <section><h2 className="text-xl font-semibold">4. Uso aceitável</h2><p className="mt-3 leading-relaxed text-muted-foreground">É proibido tentar acessar contas alheias, automatizar tentativas de códigos, inserir conteúdo ilícito, explorar falhas ou usar o serviço para finalidade incompatível.</p></section>
    <section><h2 className="text-xl font-semibold">5. Disponibilidade e dados</h2><p className="mt-3 leading-relaxed text-muted-foreground">Podem ocorrer manutenções. O usuário deve manter cópias de informações essenciais usando a exportação integrada. Privacidade e exclusão seguem a Política de Privacidade.</p></section>
    <section><h2 className="text-xl font-semibold">6. Versão comercial</h2><p className="mt-3 leading-relaxed text-muted-foreground">Antes da venda, estes termos precisam receber identificação da empresa, regras de cobrança, cancelamento, suporte, disponibilidade, jurisdição e revisão jurídica.</p></section>
  </article></main>;
}
