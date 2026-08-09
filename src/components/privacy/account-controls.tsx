'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, KeyRound, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AccountControls({ name, trainer = false }: { name: string; trainer?: boolean }) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [codes, setCodes] = useState<{ access: string; recovery: string } | null>(null);

  async function rotateCodes() {
    setRotating(true);
    try {
      const response = await fetch('/api/auth/trainer/rotate-codes', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível trocar os códigos.');
      setCodes({ access: data.access_code, recovery: data.recovery_code });
      toast.success('Códigos trocados. Todas as outras sessões foram encerradas.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível trocar os códigos.');
    } finally {
      setRotating(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      const response = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível excluir a conta.');
      router.replace('/');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível excluir a conta.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" render={<a href="/api/account/export" download />}>
          <Download className="mr-2 size-4" /> Exportar meus dados
        </Button>
        {trainer && <Button variant="outline" onClick={() => void rotateCodes()} disabled={rotating}>
          {rotating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <KeyRound className="mr-2 size-4" />} Trocar código de acesso
        </Button>}
      </div>
      {codes && (
        <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="font-medium">Salve agora. Estes códigos aparecem uma única vez.</p>
          <div><span className="text-xs text-muted-foreground">NOVO CÓDIGO DE ACESSO (8 CARACTERES)</span><code className="block break-all font-bold">{codes.access}</code></div>
          <div><span className="text-xs text-muted-foreground">NOVA CHAVE DE RECUPERAÇÃO</span><code className="block break-all font-bold">{codes.recovery}</code></div>
        </div>
      )}
      {!showDelete ? (
        <Button variant="destructive" onClick={() => setShowDelete(true)}><Trash2 className="mr-2 size-4" /> Excluir minha conta</Button>
      ) : (
        <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm"><strong>A exclusão é permanente.</strong> Treinos, avaliações e fotos serão removidos. Exporte seus dados primeiro.</p>
          <p className="text-xs text-muted-foreground">Digite <strong>{name}</strong> para confirmar.</p>
          <Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={name} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setShowDelete(false); setConfirmation(''); }}>Cancelar</Button>
            <Button variant="destructive" disabled={deleting || confirmation.trim() !== name.trim()} onClick={() => void deleteAccount()}>
              {deleting && <Loader2 className="mr-2 size-4 animate-spin" />} Excluir definitivamente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
