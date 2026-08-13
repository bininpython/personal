'use client';

import { useId } from 'react';
import { Info, Link2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  TRAINING_METHOD_GROUPS,
  TRAINING_METHODS,
  isTrainingMethodId,
  type TrainingMethodId,
} from '@/lib/workouts/training-methods';

interface TrainingMethodFieldsProps {
  method: TrainingMethodId;
  methodNotes: string;
  onMethodChange(method: TrainingMethodId): void;
  onMethodNotesChange(notes: string): void;
}

const COMBINATION_METHODS = new Set<TrainingMethodId>([
  'biset',
  'triset',
  'superset',
  'giant_set',
  'circuit',
  'pre_exhaustion',
  'post_exhaustion',
]);

export function TrainingMethodFields({
  method,
  methodNotes,
  onMethodChange,
  onMethodNotesChange,
}: TrainingMethodFieldsProps) {
  const selectId = useId();
  const notesId = useId();
  const details = TRAINING_METHODS[method];

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-border/60 bg-background p-3">
      <div className="space-y-1.5">
        <Label htmlFor={selectId} className="text-xs font-bold">Método de treino</Label>
        <Select
          value={method}
          onValueChange={(value) => {
            if (isTrainingMethodId(value)) onMethodChange(value);
          }}
        >
          <SelectTrigger id={selectId} className="h-11 w-full" aria-describedby={`${selectId}-description`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[min(28rem,var(--available-height))]">
            {TRAINING_METHOD_GROUPS.map((group) => (
              <SelectGroup key={group}>
                <SelectLabel>{group}</SelectLabel>
                {Object.entries(TRAINING_METHODS).flatMap(([id, option]) => (
                  option.group === group
                    ? [<SelectItem key={id} value={id}>{option.label}</SelectItem>]
                    : []
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <p id={`${selectId}-description`} className="text-xs leading-5 text-muted-foreground">
          {details.summary}
        </p>
      </div>

      <div className="rounded-lg border border-[#9fdb00]/25 bg-[#c9ff32]/10 px-3 py-2.5">
        <div className="flex gap-2">
          <Info className="mt-0.5 size-4 shrink-0 text-[#668f00]" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.1em] text-[#668f00]">Como executar</p>
            <p className="mt-1 text-xs leading-5">{details.instruction}</p>
          </div>
        </div>
      </div>

      {COMBINATION_METHODS.has(method) ? (
        <div className="flex gap-2 rounded-lg border border-info/20 bg-info-wash px-3 py-2 text-xs leading-5 text-muted-foreground">
          <Link2 className="mt-0.5 size-4 shrink-0 text-info" />
          Informe abaixo quais exercícios formam o bloco e quando o aluno deve descansar.
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor={notesId} className="text-xs font-bold">Orientação personalizada <span className="font-normal text-muted-foreground">(opcional)</span></Label>
        <Textarea
          id={notesId}
          value={methodNotes}
          onChange={(event) => onMethodNotesChange(event.target.value)}
          placeholder={details.notePlaceholder}
          maxLength={500}
          rows={2}
          className="min-h-20 resize-y text-sm"
        />
        <p className="text-right text-[10px] text-muted-foreground">{methodNotes.length}/500</p>
      </div>
    </div>
  );
}
