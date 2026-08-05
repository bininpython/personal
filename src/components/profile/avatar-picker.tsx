'use client';

import { useRef, useState } from 'react';
import { Camera, Check, ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AVATAR_COUNT, AVATAR_OPTIONS, type AvatarCategory } from '@/lib/profile/avatars';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AvatarPickerProps {
  name: string;
  avatarUrl?: string;
  onChange: (avatarUrl: string) => void | Promise<void>;
  sizeClassName?: string;
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'FC';
}

const CATEGORY_OPTIONS: Array<{ value: 'all' | AvatarCategory; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'people', label: 'Pessoas' },
  { value: 'weights', label: 'Pesos' },
  { value: 'gear', label: 'Acessórios' },
  { value: 'movement', label: 'Movimento' },
  { value: 'achievements', label: 'Conquistas' },
];

export function AvatarPicker({ name, avatarUrl, onChange, sizeClassName = 'size-20' }: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState<'all' | AvatarCategory>('all');
  const visibleAvatars = category === 'all'
    ? AVATAR_OPTIONS
    : AVATAR_OPTIONS.filter((avatar) => avatar.category === category);

  async function selectAvatar(url: string) {
    setSaving(true);
    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: url }),
      });
      const data = await response.json() as { avatar_url?: string; error?: string };
      if (!response.ok || !data.avatar_url) throw new Error(data.error || 'Não foi possível salvar o avatar.');
      await onChange(data.avatar_url);
      toast.success('Avatar atualizado.');
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o avatar.');
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(file?: File) {
    if (!file) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const response = await fetch('/api/profile/avatar', { method: 'POST', body: formData });
      const data = await response.json() as { avatar_url?: string; error?: string };
      if (!response.ok || !data.avatar_url) throw new Error(data.error || 'Não foi possível enviar a foto.');
      await onChange(data.avatar_url);
      toast.success('Foto de perfil atualizada.');
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar a foto.');
    } finally {
      setSaving(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <>
      <button type="button" className="group relative rounded-full" onClick={() => setOpen(true)} aria-label="Alterar foto ou avatar">
        <Avatar className={sizeClassName}>
          {avatarUrl && <AvatarImage src={avatarUrl} alt={`Avatar de ${name}`} />}
          <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">{initials(name)}</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm">
          <Camera className="size-3.5" />
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Foto de perfil</DialogTitle>
            <DialogDescription>Envie uma foto ou escolha um dos {AVATAR_COUNT} avatares.</DialogDescription>
          </DialogHeader>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void uploadPhoto(event.target.files?.[0])} />
          <Button type="button" variant="outline" disabled={saving} onClick={() => inputRef.current?.click()}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ImagePlus className="mr-2 size-4" />}
            Enviar minha foto
          </Button>
          <p className="text-xs text-muted-foreground">JPG, PNG ou WebP, com até 3 MB.</p>
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Categorias de avatares">
            {CATEGORY_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={category === option.value ? 'default' : 'outline'}
                disabled={saving}
                onClick={() => setCategory(option.value)}
                className="shrink-0"
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
            {visibleAvatars.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                disabled={saving}
                onClick={() => void selectAvatar(avatar.url)}
                className="relative rounded-full ring-offset-2 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={avatar.label}
              >
                <Avatar className="size-12">
                  <AvatarImage src={avatar.url} alt={avatar.label} />
                  <AvatarFallback>{avatar.id}</AvatarFallback>
                </Avatar>
                {avatarUrl === avatar.url && <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-3" /></span>}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
