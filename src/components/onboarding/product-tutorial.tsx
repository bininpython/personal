'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CircleHelp,
  Dumbbell,
  History,
  Home,
  LayoutDashboard,
  MessageSquare,
  PlayCircle,
  ShieldCheck,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import {
  isProductTutorialPath,
  isProductTutorialStatus,
  PRODUCT_TUTORIAL_OPEN_EVENT,
  PRODUCT_TUTORIALS,
  readProductTutorialStatus,
  writeProductTutorialStatus,
  type TutorialIcon,
  type TutorialStatus,
} from '@/lib/product-tutorial';

const ICONS = {
  dashboard: LayoutDashboard,
  'user-plus': UserPlus,
  dumbbell: Dumbbell,
  message: MessageSquare,
  chart: BarChart3,
  home: Home,
  history: History,
  profile: UserRound,
  'book-open': BookOpen,
} satisfies Record<TutorialIcon, typeof LayoutDashboard>;

async function saveRemoteStatus(status: TutorialStatus) {
  try {
    await fetch('/api/tutorial-progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
      keepalive: true,
    });
  } catch {
    // O estado local permanece como contingência para uso sem conexão.
  }
}

export function ProductTutorialHost() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const role = user?.role;
  const tutorial = role ? PRODUCT_TUTORIALS[role] : null;
  const step = tutorial?.steps[stepIndex];
  const progress = tutorial ? ((stepIndex + 1) / tutorial.steps.length) * 100 : 0;

  useEffect(() => {
    const openTutorial = () => {
      if (!user || !isProductTutorialPath(user.role, pathname)) return;
      setStepIndex(0);
      setOpen(true);
    };

    window.addEventListener(PRODUCT_TUTORIAL_OPEN_EVENT, openTutorial);
    let autoOpenTimer: number | undefined;
    const controller = new AbortController();

    async function synchronizeTutorial() {
      if (isLoading || !user || !isProductTutorialPath(user.role, pathname)) return;
      const localStatus = readProductTutorialStatus(window.localStorage, user.role, user.id);
      let remoteStatus: TutorialStatus | null = null;

      try {
        const response = await fetch('/api/tutorial-progress', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json() as { status?: unknown };
          remoteStatus = isProductTutorialStatus(data.status) ? data.status : null;
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }

      if (controller.signal.aborted) return;
      if (remoteStatus) {
        try {
          writeProductTutorialStatus(window.localStorage, user.role, user.id, remoteStatus);
        } catch {
          // A sincronização remota já preserva o estado quando o armazenamento local falha.
        }
        return;
      }

      if (localStatus) {
        void saveRemoteStatus(localStatus);
        return;
      }

      autoOpenTimer = window.setTimeout(() => {
        setStepIndex(0);
        setOpen(true);
      }, 0);
    }

    void synchronizeTutorial();

    return () => {
      window.removeEventListener(PRODUCT_TUTORIAL_OPEN_EVENT, openTutorial);
      controller.abort();
      if (autoOpenTimer !== undefined) window.clearTimeout(autoOpenTimer);
    };
  }, [isLoading, pathname, user]);

  if (!user || !tutorial || !step) return null;

  const StepIcon = ICONS[step.icon];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === tutorial.steps.length - 1;
  const startHref = tutorial.startHref;

  function remember(status: TutorialStatus) {
    if (!user) return;
    try {
      writeProductTutorialStatus(window.localStorage, user.role, user.id, status);
    } catch {
      // O tutorial continua utilizável mesmo quando o navegador bloqueia armazenamento local.
    }
    void saveRemoteStatus(status);
  }

  function closeWithStatus(status: TutorialStatus) {
    remember(status);
    setOpen(false);
  }

  function visit(href: string) {
    closeWithStatus('started');
    router.push(href);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && open) remember('dismissed');
    setOpen(nextOpen);
  }

  function advance() {
    if (isLastStep) {
      remember('completed');
      setOpen(false);
      router.push(startHref);
      return;
    }
    setStepIndex((current) => current + 1);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] gap-0 overflow-y-auto rounded-[1.75rem] p-0 sm:max-w-xl" showCloseButton={false}>
        <DialogClose
          render={<Button variant="ghost" size="icon-sm" className="absolute right-4 top-4 z-10 text-white/60 hover:bg-white/10 hover:text-white" />}
        >
          <X className="size-4" />
          <span className="sr-only">Fechar tutorial</span>
        </DialogClose>
        <DialogHeader className="rounded-t-[1.75rem] bg-[#090a08] px-6 pb-5 pt-6 pr-14 text-white sm:px-8 sm:pb-6 sm:pt-8 sm:pr-16">
          <div className="flex items-center gap-2 text-[0.62rem] font-black uppercase tracking-[0.2em] text-[#c9ff32]">
            <PlayCircle className="size-4" />
            Tutorial para {tutorial.roleLabel}
          </div>
          <DialogTitle className="mt-3 text-2xl font-black leading-tight tracking-[-0.04em] sm:text-3xl">
            {tutorial.title}
          </DialogTitle>
          <DialogDescription className="mt-1 max-w-lg leading-6 text-white/60">
            {tutorial.description}
          </DialogDescription>
          <div className="mt-5" aria-label={`Etapa ${stepIndex + 1} de ${tutorial.steps.length}`}>
            <div className="mb-2 flex items-center justify-between text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/55">
              <span>Etapa {stepIndex + 1}</span>
              <span>{tutorial.steps.length} etapas</span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-white/12"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={tutorial.steps.length}
              aria-valuenow={stepIndex + 1}
            >
              <div className="h-full rounded-full bg-[#c9ff32] transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 sm:px-8 sm:py-8" aria-live="polite">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#c9ff32] text-black shadow-[0_12px_28px_rgba(201,255,50,0.22)]">
              <StepIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
                {String(stepIndex + 1).padStart(2, '0')} · Primeiros passos
              </p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.025em]">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[#c9ff32]/40 bg-[#c9ff32]/10 p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#5c7f00] dark:text-[#c9ff32]" />
              <p className="text-sm leading-6"><span className="font-black">Dica:</span> {step.tip}</p>
            </div>
          </div>

          <Button variant="outline" className="mt-5 h-11 w-full" onClick={() => visit(step.href)}>
            {step.actionLabel}
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>

        <DialogFooter className="mx-0 mb-0 grid grid-cols-2 gap-2 rounded-b-[1.75rem] px-6 py-3 sm:flex sm:px-8 sm:py-4">
          <Button variant="ghost" className="col-span-2 h-10 sm:mr-auto sm:h-11" onClick={() => closeWithStatus('dismissed')}>
            Ver depois
          </Button>
          <Button variant="outline" className="h-10 sm:h-11" disabled={isFirstStep} onClick={() => setStepIndex((current) => current - 1)}>
            <ArrowLeft className="mr-2 size-4" />
            Voltar
          </Button>
          <Button className="h-10 bg-black px-3 text-[#c9ff32] hover:bg-black/85 sm:h-11 sm:px-4 dark:bg-[#c9ff32] dark:text-black" onClick={advance}>
            {isLastStep ? tutorial.startLabel : 'Próximo'}
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function GuidedTutorialButton({ className = '' }: { className?: string }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Button className={`h-11 ${className}`} disabled>Preparando tutorial...</Button>;
  }

  if (!user) {
    return (
      <Button nativeButton={false} className={`h-11 ${className}`} render={<Link href="/login" />}>
        <CircleHelp className="mr-2 size-4" />
        Entrar para iniciar
      </Button>
    );
  }

  return (
    <Button
      className={`h-11 ${className}`}
      onClick={() => window.dispatchEvent(new Event(PRODUCT_TUTORIAL_OPEN_EVENT))}
    >
      <PlayCircle className="mr-2 size-4" />
      Abrir tutorial guiado
    </Button>
  );
}
