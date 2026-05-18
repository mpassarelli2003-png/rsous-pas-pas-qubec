import { useState } from 'react';
import { Checkbox } from '@blinkdotnew/ui';
import { cn } from '@/lib/utils';

interface Step1ReadProps {
  problem: any;
  onUpdate: (data: any) => void;
  savedData?: any;
}

export function Step1Read({ problem, onUpdate, savedData }: Step1ReadProps) {
  const [readCount, setReadCount] = useState(savedData?.readCount || { read1: false, read2: false });

  const toggleRead = (key: 'read1' | 'read2') => {
    const next = { ...readCount, [key]: !readCount[key] };
    setReadCount(next);
    onUpdate({ readCount: next });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8 items-start">
      {/* ── Colonne gauche fixe : Aide-mémoire de lecture ── */}
      <aside className="w-full lg:sticky lg:top-28 lg:self-start rounded-2xl border-2 border-blue-300 bg-blue-50 p-5 shadow-sm z-[1]">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-800 flex items-center gap-2 mb-4">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          Aide-mémoire de lecture
        </p>

        <div className="space-y-3">
          <p className="text-sm font-bold text-blue-950">Comment bien lire un problème :</p>

          <ol className="space-y-3 text-sm text-blue-950">
            <li className="grid grid-cols-[2rem_1fr] gap-2 items-start">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-400 bg-white text-blue-700 font-bold text-sm">1</span>
              <p className="leading-relaxed">
                Lis la <strong className="font-extrabold text-blue-900">zone bleue en haut</strong> de la page.
              </p>
            </li>

            <li className="grid grid-cols-[2rem_1fr] gap-2 items-start">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-400 bg-white text-blue-700 font-bold text-sm">2</span>
              <p className="leading-relaxed">
                Cherche les nombres et les mots importants.
              </p>
            </li>

            <li className="grid grid-cols-[2rem_1fr] gap-2 items-start">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-400 bg-white text-blue-700 font-bold text-sm">3</span>
              <p className="leading-relaxed">
                Relis la question à la fin.
              </p>
            </li>
          </ol>
        </div>
      </aside>

      {/* ── Zone principale : rappel compact + cases à cocher + message ── */}
      <div className="min-w-0 space-y-4">
        <div className="inline-flex w-full items-start gap-2 rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-3 text-sm font-medium text-blue-900">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">!</span>
          <p className="leading-relaxed">
            Lis une fois pour comprendre l’histoire, puis relis pour trouver la question.
          </p>
        </div>

        <div className="space-y-3 pt-1 border-t border-dashed">
          <h3 className="font-semibold text-muted-foreground flex items-center gap-2">
            <CheckCircleIcon /> Ma progression de lecture
          </h3>
          <div className="grid gap-3">
            <label className="flex items-center gap-3 p-4 rounded-xl border-2 hover:bg-secondary/50 cursor-pointer transition-colors border-primary/20">
              <Checkbox checked={readCount.read1} onCheckedChange={() => toggleRead('read1')} />
              <span className={cn('text-sm md:text-base', readCount.read1 && 'line-through opacity-50')}>
                J'ai lu le problème une première fois pour comprendre l'histoire.
              </span>
            </label>
            <label className="flex items-center gap-3 p-4 rounded-xl border-2 hover:bg-secondary/50 cursor-pointer transition-colors border-primary/20">
              <Checkbox checked={readCount.read2} onCheckedChange={() => toggleRead('read2')} />
              <span className={cn('text-sm md:text-base', readCount.read2 && 'line-through opacity-50')}>
                J'ai relu le problème pour trouver la question.
              </span>
            </label>
          </div>
        </div>

        <div className={cn(
          'rounded-xl p-3 border-2 text-sm font-medium transition-all',
          readCount.read1 && readCount.read2
            ? 'bg-green-50 border-green-300 text-green-800'
            : 'bg-secondary/30 border-secondary text-muted-foreground'
        )}>
          {readCount.read1 && readCount.read2
            ? '✓ Excellent ! Tu es prêt à passer à l\'étape suivante.'
            : 'Coche les cases ci-dessus quand tu as fini de lire.'}
        </div>
      </div>
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
