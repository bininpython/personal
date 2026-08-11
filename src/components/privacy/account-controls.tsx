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
  const [newAccessCode, setNewAccessCode] = useState<string | null>(null);

  async function rotateCodes() {
    setRotating(true);
    try {
      const response = await fetch('/api/auth/trainer/rotate-codes', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível trocar o código.');
      setNewAccessCode(data.access_code);
      toast.success('Código trocado. Todas as outras sessões foram encerradas.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível trocar o código.');
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
      {newAccessCode && (
        <div className="space-y-3 rounded-lg border border-warn/30 bg-warn-wash p-4">
          <p className="font-medium">Salve agora. Este código aparece uma única vez.</p>
          <div><span className="text-xs text-muted-foreground">NOVO CÓDIGO PESSOAL</span><code className="mt-1 block font-mono text-2xl font-bold tracking-[0.16em]">{newAccessCode}</code></div>
          <p className="text-xs text-muted-foreground">Sua senha e idade continuam válidas para recuperação.</p>
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
