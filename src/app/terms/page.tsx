import Link from 'next/link';

const sections = [
  ['1. Aceite e escopo', 'Ao criar uma conta ou continuar após o primeiro acesso, você aceita estes Termos. A G KONG oferece ferramentas para organizar alunos, fichas, execuções, avaliações, agenda, mensagens e indicadores de acompanhamento. O serviço não substitui avaliação médica, atendimento de emergência nem a decisão técnica de um profissional habilitado.'],
  ['2. Cadastro e segurança', 'Cada usuário deve fornecer informações verdadeiras, manter seu código em sigilo e comunicar suspeitas de acesso indevido. O personal é responsável por entregar cada código apenas ao aluno correspondente. A conta é pessoal; tentativas de burlar limites, bloqueios ou controles de acesso podem resultar em suspensão.'],
  ['3. Responsabilidade do personal', 'O personal responde por sua habilitação, prescrições, orientações, adequação dos exercícios e legitimidade dos dados cadastrados. Antes de inserir informações de um aluno, deve explicar a finalidade do cadastro e possuir autorização válida. O aluno confirma diretamente, no primeiro acesso, a Política de Privacidade e estes Termos.'],
  ['4. Responsabilidade do aluno', 'O aluno deve informar limitações relevantes, seguir orientações profissionais e interromper a atividade diante de dor, mal-estar ou risco. Registros de carga, repetição, percepção de esforço e feedback devem refletir a execução real. Em situação de urgência, procure atendimento apropriado.'],
  ['5. Uso aceitável', 'Não é permitido acessar dados de terceiros, compartilhar credenciais, automatizar tentativas de código, inserir conteúdo ilícito, assediar usuários, explorar falhas, prejudicar a disponibilidade do serviço ou usar a plataforma para finalidade incompatível com estes Termos.'],
  ['6. Conteúdo e dados', 'Você mantém os direitos sobre o conteúdo que fornece e autoriza seu tratamento na medida necessária para operar o serviço. É responsável por ter autorização para materiais de terceiros. Exportação e exclusão estão disponíveis na própria conta, conforme a Política de Privacidade e as retenções legalmente exigidas.'],
  ['7. Disponibilidade e alterações', 'A G KONG busca manter o serviço disponível e seguro, mas pode realizar manutenção, corrigir falhas ou alterar funcionalidades. Interrupções e perda de disponibilidade podem ocorrer. Mudanças relevantes destes Termos serão informadas no serviço, com nova solicitação de aceite quando necessário.'],
  ['8. Planos, cancelamento e encerramento', 'Não há cobrança automática dentro da versão atual do serviço. Qualquer oferta futura paga deverá apresentar preço, periodicidade, renovação e cancelamento antes da contratação. O usuário pode excluir sua conta pelos controles integrados. A G KONG pode suspender uso abusivo ou ilegal, preservados os direitos aplicáveis.'],
  ['9. Limites e legislação', 'Na extensão permitida pela lei, a G KONG não responde por decisões profissionais, uso fora da finalidade, falhas causadas por terceiros ou eventos inevitáveis. Estes Termos seguem a legislação brasileira, inclusive normas de consumo e proteção de dados; permanece assegurado o foro legalmente competente do usuário.'],
  ['10. Suporte', 'Dúvidas operacionais podem ser tratadas pela página Ajuda e pelos controles integrados da conta. Solicitações sobre dados pessoais seguem o canal descrito na Política de Privacidade.'],
];

export default function TermsPage() {
  return <main className="min-h-screen bg-background px-4 py-12"><article className="mx-auto max-w-3xl space-y-8">
    <div><Link href="/" className="text-sm font-medium text-primary hover:underline">← Voltar ao início</Link><h1 className="mt-6 text-3xl font-bold">Termos de Uso</h1><p className="mt-2 text-sm text-muted-foreground">Última atualização: 8 de agosto de 2026 · versão 2026-08-08</p></div>
    <p className="rounded-lg border bg-muted/20 p-4 leading-relaxed text-muted-foreground">Estes Termos regulam o uso da plataforma G KONG por personal trainers e alunos.</p>
    {sections.map(([title, text]) => <section key={title} className="space-y-3"><h2 className="text-xl font-semibold">{title}</h2><p className="leading-relaxed text-muted-foreground">{text}</p></section>)}
    <p className="text-sm text-muted-foreground">Consulte também a <Link href="/privacy" className="text-primary underline">Política de Privacidade</Link>.</p>
  </article></main>;
}
