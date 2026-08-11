'use client';

import Link from 'next/link';
import { ArrowRight, Check, KeyRound, ListChecks, NotebookPen, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export interface OnboardingState {
  hasStudent: boolean;
  hasPlan: boolean;
  studentSignedIn: boolean;
  firstStudentId: string | null;
}

/**
 * Os três passos que separam uma conta recém-criada de uma conta em uso.
 * O card desaparece sozinho quando todos estão concluídos.
 */
export function ActivationChecklist({ state }: { state: OnboardingState }) {
  const steps = [
    {
      icon: UserPlus,
      title: 'Cadastre seu primeiro aluno',
      description: 'Leva menos de um minuto. O código individual é gerado na hora.',
      done: state.hasStudent,
      href: '/students/new',
      action: 'Cadastrar aluno',
    },
    {
      icon: NotebookPen,
      title: 'Monte a primeira ficha',
      description: 'Escolha o músculo no diagrama, adicione os exercícios e publique.',
      done: state.hasPlan,
      href: '/exercises',
      action: 'Abrir montador',
    },
    {
      icon: KeyRound,
      title: 'Entregue o código ao aluno',
      description: 'Ele entra com o nome e o código — sem e-mail, sem senha, sem cadastro.',
      done: state.studentSignedIn,
      href: state.firstStudentId ? `/students/${state.firstStudentId}` : '/students',
      action: 'Ver código do aluno',
    },
  ];

  const completed = steps.filter((step) => step.done).length;
  if (completed === steps.length) return null;

  const nextStep = steps.find((step) => !step.done);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListChecks className="size-5 text-volt-ink" />
            <h2 className="text-lg font-black tracking-tight">Comece por aqui</h2>
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {completed} de {steps.length} concluídos
          </span>
        </div>
        <Progress value={(completed / steps.length) * 100} className="mt-3" />

        <ol className="mt-5 space-y-2">
          {steps.map((step, index) => {
            const isNext = step === nextStep;
            return (
              <li
                key={step.title}
                className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${
                  step.done
                    ? 'border-ok/30 bg-ok-wash'
                    : isNext
                      ? 'border-volt-strong/40 bg-volt-wash'
                      : 'border-border'
                }`}
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                    step.done
                      ? 'bg-ok text-white'
                      : isNext
                        ? 'bg-black text-[#c9ff32] dark:bg-[#c9ff32] dark:text-black'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.done ? <Check className="size-5" /> : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`font-bold ${step.done ? 'text-muted-foreground line-through' : ''}`}>
                    {step.title}
                  </p>
                  {!step.done && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
                  )}
                </div>
                {!step.done && (
                  <Button
                    nativeButton={false}
                    variant={isNext ? 'default' : 'outline'}
                    className="h-11 shrink-0"
                    render={<Link href={step.href} />}
                  >
                    <step.icon className="mr-2 size-4" />
                    {step.action}
                    {isNext && <ArrowRight className="ml-2 size-4" />}
                  </Button>
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
