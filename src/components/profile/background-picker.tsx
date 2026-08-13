'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface BackgroundPickerProps {
  backgroundUrl?: string;
  onChange: (backgroundUrl: string | null) => void | Promise<void>;
}

export function BackgroundPicker({ backgroundUrl, onChange }: BackgroundPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  async function uploadPhoto(file?: File) {
    if (!file) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const response = await fetch('/api/profile/background', { method: 'POST', body: formData });
      const data = await response.json() as { background_url?: string; error?: string };
      if (!response.ok || !data.background_url) throw new Error(data.error || 'Não foi possível enviar a imagem.');
      await onChange(data.background_url);
      toast.success('Fundo personalizado atualizado.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar a imagem.');
    } finally {
      setSaving(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function removeBackground() {
    setSaving(true);
    try {
      const response = await fetch('/api/profile/background', { method: 'DELETE' });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Não foi possível remover a imagem.');
      await onChange(null);
      toast.success('Fundo padrão restaurado.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível remover a imagem.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {backgroundUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundUrl}
          alt="Fundo personalizado atual"
          className="h-32 w-full rounded-xl border border-border/60 object-cover"
        />
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void uploadPhoto(event.target.files?.[0])}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={saving} onClick={() => inputRef.current?.click()}>
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ImagePlus className="mr-2 size-4" />}
          Enviar imagem
        </Button>
        {backgroundUrl && (
          <Button type="button" variant="ghost" disabled={saving} onClick={() => void removeBackground()}>
            <Trash2 className="mr-2 size-4" /> Usar fundo padrão
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">JPG, PNG ou WebP, com até 5 MB.</p>
    </div>
  );
}
