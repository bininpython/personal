import Link from 'next/link';

const sections = [
  ['Quais dados usamos', 'Identificação mínima por nome e códigos; dados profissionais do personal; fichas, execuções, agenda e mensagens; e, somente quando autorizados, medidas, avaliações, limitações e fotos. Não exigimos e-mail nem telefone para autenticação.'],
  ['Finalidades', 'Autenticar o usuário, entregar e registrar treinos, permitir o acompanhamento pelo personal, manter a segurança da conta, prestar suporte e cumprir obrigações aplicáveis. Não vendemos dados pessoais.'],
  ['Dados de saúde e consentimento', 'Medidas, lesões, restrições e avaliações podem ser dados pessoais sensíveis. O sistema solicita confirmação antes do tratamento e permite omitir dados físicos opcionais. O personal deve cadastrar apenas o necessário e comprovar a autorização do aluno.'],
  ['Segurança e fotos', 'Códigos de acesso são armazenados em formato irreversível. Sessões podem ser revogadas e tentativas abusivas são bloqueadas. Fotos enviadas ficam em armazenamento privado e são entregues somente por rota autenticada; a foto anterior é removida quando substituída.'],
  ['Compartilhamento e operadores', 'Os dados do aluno são acessíveis ao próprio aluno e ao personal responsável. Provedores de banco, hospedagem e armazenamento podem tratar dados apenas para operar o serviço, sob configurações e contratos aplicáveis.'],
  ['Retenção', 'Mantemos dados enquanto a conta estiver ativa ou pelo prazo necessário à finalidade e a obrigações legais. A exclusão solicitada remove a conta e seus dados vinculados, ressalvadas retenções obrigatórias ou cópias de segurança temporárias.'],
  ['Seus direitos', 'Em Meu perfil ou Configurações você pode exportar uma cópia estruturada ou excluir a conta. Também pode solicitar confirmação, correção, informações sobre uso, revogação do consentimento e demais direitos aplicáveis.'],
  ['Responsabilidades', 'O personal é responsável pela legitimidade dos dados que cadastra de seus alunos e por mantê-los corretos. O FitControl Pro deve manter medidas técnicas e administrativas adequadas e comunicar incidentes quando exigido.'],
];

export default function PrivacyPage() {
  return <main className="min-h-screen bg-background px-4 py-12"><article className="mx-auto max-w-3xl space-y-8">
    <div><Link href="/" className="text-sm font-medium text-primary hover:underline">← Voltar ao início</Link><h1 className="mt-6 text-3xl font-bold">Política de Privacidade</h1><p className="mt-2 text-sm text-muted-foreground">Última atualização: 8 de agosto de 2026 · versão 2026-08-08</p></div>
    <p className="rounded-lg border bg-muted/20 p-4 leading-relaxed text-muted-foreground">Esta política explica de forma clara como o FitControl Pro trata dados. Ela deve ser revisada por assessoria jurídica antes da operação comercial e adaptada com a identificação e o canal oficial do controlador.</p>
    {sections.map(([title, text]) => <section key={title} className="space-y-3"><h2 className="text-xl font-semibold">{title}</h2><p className="leading-relaxed text-muted-foreground">{text}</p></section>)}
    <section className="space-y-3"><h2 className="text-xl font-semibold">Canal de privacidade</h2><p className="leading-relaxed text-muted-foreground">Use as funções integradas da sua conta. Antes do lançamento comercial, o operador deve publicar aqui o nome empresarial, CNPJ, endereço e canal do encarregado.</p></section>
  </article></main>;
}
