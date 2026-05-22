import { useState } from 'react';
import { Card, Button, Textarea } from '@/lib/ui';
import { RotateCcw, ClipboardList, Highlighter, Target, Lightbulb } from 'lucide-react';
import { PlanTable, PlanRow } from './PlanTable';
import { HintPanel } from './HintPanel';

interface Step5SolveProps {
  problem: any;
  onUpdate: (data: any) => void;
  savedData?: any;
  planData?: any;
  step3Data?: any;
  currentStep?: number;
}

function extractNumbers(text: string): string[] {
  if (!text) return [];
  const raw = text.match(/[+\-−–—]?\d+(?:[,.]\d+)*/g) ?? [];
  const seen = new Set<string>();
  return raw
    .map(n => n.replace(/[−–—]/g, '-'))
    .filter(n => {
      if (seen.has(n)) return false;
      seen.add(n);
      return true;
    });
}

function extractImportantItems(text: string): string[] {
  if (!text) return [];
  return text
    .split('\n')
    .map(line => line.replace(/^\s*•\s*/, '').trim())
    .filter(Boolean);
}

const MATH_SYMBOLS = ['+', '−', '×', '÷', '=', '%', '$', ',', '.', '(', ')'];

export function Step5Solve({ problem, onUpdate, savedData, planData, step3Data, currentStep = 5 }: Step5SolveProps) {
  const [calculation, setCalculation] = useState(savedData?.calculation || '');
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);

  const planRows: PlanRow[] = planData?.planRows || [];
  const estimation: string = planData?.estimation || '';
  const importantItems = extractImportantItems(step3Data?.important ?? '');
  const step3Numbers = extractNumbers(step3Data?.important ?? '');
  const problemHints = problem?.hints ?? undefined;

  const addSymbol = (symbol: string) => {
    const next = calculation + (calculation.endsWith(' ') || calculation === '' ? '' : ' ') + symbol + ' ';
    setCalculation(next);
    onUpdate({ calculation: next });
  };

  const handleCalcChange = (val: string) => {
    setCalculation(val);
    onUpdate({ calculation: val });
  };

  const handleNextHintLevel = () => {
    setHintLevel(prev => Math.min(prev + 1, 3));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-5 items-start">
      <aside className="w-full lg:sticky lg:top-28 lg:self-start space-y-3 z-[1]">
        <div className="rounded-xl border border-blue-300 bg-blue-50 p-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-800 flex items-center gap-2 mb-2">
            <ClipboardList className="h-4 w-4 shrink-0" />
            Mon plan
          </p>
          {planRows.length > 0 ? (
            <div className="rounded-lg bg-white/70 border border-blue-100 overflow-hidden">
              <PlanTable rows={planRows} readOnly />
            </div>
          ) : (
            <p className="text-sm text-blue-900 leading-snug italic">
              Ton plan de l’étape 4 apparaîtra ici.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-yellow-800 flex items-center gap-2 mb-2">
            <Highlighter className="h-4 w-4 shrink-0" />
            Infos utiles
          </p>
          {importantItems.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {importantItems.map((item, index) => (
                <span key={`${item}-${index}`} className="rounded-md bg-yellow-200 px-2 py-1 text-sm font-semibold text-yellow-950">
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-yellow-900 leading-snug italic">
              Les infos retenues à l’étape 3 apparaîtront ici.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-800 flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 shrink-0" />
            Mon estimation
          </p>
          {estimation ? (
            <div className="space-y-2">
              <p className="rounded-md bg-amber-100 px-2 py-1 text-sm font-semibold text-amber-950">{estimation}</p>
              <p className="text-xs text-amber-900 italic">Mon résultat final est-il proche ?</p>
            </div>
          ) : (
            <p className="text-sm text-amber-900 leading-snug italic">Ton estimation de l’étape 4 apparaîtra ici.</p>
          )}
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowHint(true)}
            className="w-full justify-start gap-2 border-violet-300 bg-violet-50 text-violet-800 hover:bg-violet-100 hover:border-violet-400"
          >
            <Lightbulb className="h-4 w-4" />
            Indice
          </Button>
          {showHint && (
            <HintPanel
              currentStep={currentStep}
              hintLevel={hintLevel}
              hints={problemHints}
              onNextLevel={handleNextHintLevel}
              onClose={() => setShowHint(false)}
            />
          )}
        </div>
      </aside>

      <div className="min-w-0 space-y-8">
        <div className="space-y-2 text-center">
          <h3 className="text-2xl font-bold text-primary">Ma démarche</h3>
          <p className="text-muted-foreground">Fais tes calculs ici en suivant ton plan. Explique chaque étape.</p>
        </div>

        <div className="space-y-4">
          <Card className="p-0 border-2 border-primary/20 overflow-hidden shadow-lg bg-white">
            <div className="bg-primary/5 p-3 border-b border-primary/10 flex justify-between items-center">
              <span className="text-sm font-bold text-primary uppercase tracking-tight">Espace de calcul — texte</span>
              <Button variant="ghost" size="sm" onClick={() => handleCalcChange('')} className="h-8 text-muted-foreground">
                <RotateCcw className="h-3 w-3 mr-1" /> Effacer
              </Button>
            </div>
            <Textarea
              placeholder={'Écris tes calculs ici...\nEx. : nombre utile + nombre utile = total\nEx. : total − quantité enlevée = résultat'}
              className="min-h-[240px] text-xl font-mono p-6 resize-none border-none focus-visible:ring-0 leading-relaxed"
              value={calculation}
              onChange={e => handleCalcChange(e.target.value)}
            />
          </Card>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-green-700 flex items-center gap-1.5">
              <span>🔢</span> Nombres utiles de l’étape 3
            </p>
            {step3Numbers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {step3Numbers.map(num => (
                  <Button
                    key={num}
                    variant="outline"
                    onClick={() => addSymbol(num)}
                    className="h-10 px-3 text-base font-mono font-bold border-2 border-green-300 text-green-800 bg-green-50 hover:bg-green-100 hover:border-green-500 transition-all active:scale-95"
                  >
                    {num}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Aucun nombre repéré à l'étape 3. Tu peux écrire ton calcul directement.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {MATH_SYMBOLS.map(symbol => (
              <Button
                key={symbol}
                variant="outline"
                onClick={() => addSymbol(symbol)}
                className="h-12 w-12 text-lg font-bold border-2 hover:bg-primary/5 hover:text-primary transition-all active:scale-95"
              >
                {symbol}
              </Button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm italic text-green-800">
          Chaque calcul doit correspondre à une étape de ton plan. Ajoute toujours l’unité ($, m, kg, °C...) après ton résultat.
        </div>
      </div>
    </div>
  );
}
