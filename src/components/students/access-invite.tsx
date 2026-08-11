'use client';

import { useState, useSyncExternalStore } from 'react';
import { Check, Copy, KeyRound, Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const STUDENT_LOGIN_PATH = '/login/student';

// A origem só existe no navegador e não muda enquanto a página vive. Ler por
// useSyncExternalStore mantém a renderização do servidor coerente com a do
// cliente, sem efeito nem estado intermediário.
const subscribeToNothing = () => () => {};
const readOrigin = () => window.location.origin;
const readServerOrigin = () => '';

/**
 * Convite de acesso do aluno.
 *
 * O cadastro acontece na plataforma, mas a ativação acontece no WhatsApp: o
 * personal precisa transmitir nome, código e endereço de entrada. Sem apoio,
 * esse recado sai truncado e o aluno não entra. Aqui a mensagem já vai pronta.
 */
export function buildAccessInviteMessage(studentName: string, accessCode: string, loginUrl: string) {
  const firstName = studentName.trim().split(/\s+/)[0] || studentName.trim();

  return [
    `Oi, ${firstName}! Seu treino já está pronto na plataforma.`,
    '',
    'Para entrar:',
    `1. Abra ${loginUrl}`,
    `2. Nome: ${studentName.trim()}`,
    `3. Código: ${accessCode}`,
    '',
    'Não precisa de e-mail nem de senha. Esse código é só seu — qualquer dúvida, me chama por aqui.',
  ].join('\n');
}

export function AccessInvite({
  studentName,
  accessCode,
  onGenerateCode,
  generatingCode = false,
  className = '',
}: {
  studentName: string;
  /** Vazio quando o código não está em mãos — ele é guardado com hash e só aparece uma vez. */
  accessCode: string;
  onGenerateCode?: () => void;
  generatingCode?: boolean;
  className?: string;
}) {
  const origin = useSyncExternalStore(subscribeToNothing, readOrigin, readServerOrigin);
  const [copied, setCopied] = useState(false);

  const loginUrl = `${origin}${STUDENT_LOGIN_PATH}`;
  const message = buildAccessInviteMessage(studentName, accessCode, loginUrl);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success('Mensagem copiada. Cole na conversa com o aluno.');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.');
    }
  };

  if (!accessCode) {
    return (
      <div className={`rounded-2xl border border-border bg-muted/30 p-4 ${className}`}>
        <p className="text-sm font-bold">Entregar o acesso pelo WhatsApp</p>
        <p className="mt-1 text-sm text-muted-foreground">
          O código atual é guardado com hash e não pode ser exibido de novo. Gere um novo código
          para montar a mensagem — o código anterior e as sessões abertas do aluno deixam de valer.
        </p>
        {onGenerateCode && (
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={onGenerateCode}
            disabled={generatingCode}
          >
            {generatingCode ? <Loader2 className="mr-2 size-4 animate-spin" /> : <KeyRound className="mr-2 size-4" />}
            Gerar código e montar convite
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-border bg-muted/30 p-4 ${className}`}>
      <p className="text-sm font-bold">Entregar o acesso pelo WhatsApp</p>
      <p className="mt-1 text-xs text-muted-foreground">
        A mensagem abaixo já leva o endereço, o nome cadastrado e o código.
      </p>

      <pre className="mt-3 max-h-52 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-background p-3 text-xs leading-relaxed text-muted-foreground">
        {message}
      </pre>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Button
          render={
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
          className="bg-[#25d366] text-black hover:bg-[#1fbb59]"
        >
          <MessageCircle className="mr-2 size-4" />
          Enviar pelo WhatsApp
        </Button>
        <Button type="button" variant="outline" onClick={() => void copyMessage()}>
          {copied ? <Check className="mr-2 size-4 text-ok" /> : <Copy className="mr-2 size-4" />}
          Copiar mensagem
        </Button>
      </div>
    </div>
  );
}
