'use client';

import { Check, Copy, MessageCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { markAccessShared } from '@/lib/activation';

interface StudentAccessCardProps {
  studentName: string;
  accessCode: string;
  onDismiss?: () => void;
}

function accessMessage(studentName: string, accessCode: string) {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return [
    'Seu acesso ao D KONG está pronto.',
    '',
    `Nome: ${studentName}`,
    `Código: ${accessCode}`,
    `Entrar: ${origin}/login/student`,
    '',
    'Use somente este nome e código. Não é necessário e-mail ou telefone.',
  ].join('\n');
}

export function StudentAccessCard({ studentName, accessCode, onDismiss }: StudentAccessCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(accessMessage(studentName, accessCode));
      setCopied(true);
      markAccessShared();
      toast.success('Convite completo copiado.');
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error('Não foi possível copiar o convite.');
    }
  }

  function openWhatsApp() {
    markAccessShared();
    window.open(`https://wa.me/?text=${encodeURIComponent(accessMessage(studentName, accessCode))}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <Card className="overflow-hidden border-[#9fdb00]/40 bg-[#c9ff32]/12">
      <CardContent className="p-0">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-black"><ShieldCheck className="size-5 text-[#668f00]" /> Acesso criado com segurança</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Envie o nome e o código agora. Por segurança, o código completo não poderá ser consultado novamente.</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-black">{studentName}</span>
              <code className="text-2xl font-black tracking-[0.16em] sm:text-3xl">{accessCode}</code>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Button type="button" onClick={openWhatsApp} className="bg-[#167d3f] px-5 text-white hover:bg-[#126a35]">
              <MessageCircle className="mr-2 size-4" /> Enviar no WhatsApp
            </Button>
            <Button type="button" variant="outline" onClick={() => void copyInvite()}>
              {copied ? <Check className="mr-2 size-4 text-[#147a42]" /> : <Copy className="mr-2 size-4" />}
              {copied ? 'Convite copiado' : 'Copiar convite'}
            </Button>
            {onDismiss && <Button type="button" variant="ghost" onClick={onDismiss}>Já salvei o acesso</Button>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
