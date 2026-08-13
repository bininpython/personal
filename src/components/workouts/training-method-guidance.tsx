import { Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { trainingMethodDetails } from '@/lib/workouts/training-methods';

interface TrainingMethodGuidanceProps {
  method: string;
  methodNotes?: string | null;
  noteLabel?: string;
}

export function TrainingMethodGuidance({
  method,
  methodNotes,
  noteLabel = 'Orientação do personal',
}: TrainingMethodGuidanceProps) {
  const details = trainingMethodDetails(method);

  return (
    <section className="rounded-xl border border-[#9fdb00]/30 bg-[#c9ff32]/10 p-3" aria-label={`Método de treino: ${details.label}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Zap className="size-4 text-[#668f00]" />
        <span className="text-xs font-black uppercase tracking-[0.1em] text-[#668f00]">Método</span>
        <Badge className="border-0 bg-black text-[#c9ff32] dark:bg-[#c9ff32] dark:text-black">
          {details.label}
        </Badge>
      </div>
      <p className="mt-2 text-sm font-semibold">{details.summary}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{details.instruction}</p>
      {methodNotes ? (
        <p className="mt-2 border-t border-[#9fdb00]/20 pt-2 text-xs leading-5">
          <strong>{noteLabel}:</strong> {methodNotes}
        </p>
      ) : null}
    </section>
  );
}
