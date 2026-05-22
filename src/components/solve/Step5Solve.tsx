import { useState } from 'react';
import { Card, Button, Textarea } from '@/lib/ui';
import { RotateCcw, ClipboardList, Highlighter, Target, Lightbulb, Plus } from 'lucide-react';
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

type CalculationMode = 'horizontal' | 'vertical' | 'explanation';

interface CalculationLine {
  id: string;
  mode: CalculationMode;
  content: string;
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

function buildCalculationText(lines: CalculationLine[]): string {
  return lines
    .map((line, index) => {
      const content = line.content.trim();
      if (!content) return '';
      const modeLabel = line.mode === 'horizontal'
        ? 'horizontal'
        : line.mode === 'vertical'
        ? 'posé / vertical'
        : 'explication';
      return `Étape ${index + 1} (${modeLabel}) :\n${content}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

function makeInitialLines(savedData?: any): CalculationLine[] {
  if (Array.isArray(savedData?.calculationLines) && savedData.calculationLines.length > 0) {
    return savedData.calculationLines;
  }

  if (savedData?.calculation?.trim()) {
    return [{ id: 'calc-1', mode: 'horizontal', content: savedData.calculation }];
  }

  return [{ id: 'calc-1', mode: 'horizontal', content: '' }];
}

const MATH_SYMBOLS = ['+', '−', '×', '÷', '=', '%', '$', ',', '.', '(', ')'];

export function Step5Solve({ problem, onUpdate, savedData, planData, step3Data, currentStep = 5 }: Step5SolveProps) {
  const [calculationLines, setCalculationLines] = useState<CalculationLine[]>(() => makeInitialLines(savedData));
  const [activeLineId, setActiveLineId] = useState(() => makeInitialLines(savedData)[0]?.id || 'calc-1');
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);

  const planRows: PlanRow[] = planData?.planRows || [];
  const estimation: string = planData?.estimation || '';
  const importantItems = extractImportantItems(step3Data?.important ?? '');
  const step3Numbers = extractNumbers(step3Data?.important ?? '');
  const problemHints = problem?.hints ?? undefined;
  const operations = planRows.map(row => row.operation).filter(Boolean);

  const emitUpdate = (nextLines: CalculationLine[]) => {
    onUpdate({
      calculation: buildCalculationText(nextLines),
      calculationLines: nextLines,
    });
  };

  const updateLine = (lineId: string, patch: Partial<CalculationLine>) => {
    const next = calculationLines.map(line => line.id === lineId ? { ...line, ...patch } : line);
    setCalculationLines(next);
    emitUpdate(next);
  };

  const addLine = () => {
    const nextLine: CalculationLine = {
      id: `calc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      mode: 'horizontal',
      content: '',
    };
    const next = [...calculationLines, nextLine];
    setCalculationLines(next);
    setActiveLineId(nextLine.id);
    emitUpdate(next);
  };

  const clearAll = () => {
    const next = [{ id: 'calc-1', mode: 'horizontal' as CalculationMode, content: '' }];
    setCalculationLines(next);
    setActiveLineId('calc-1');
    emitUpdate(next);
  };

  const addSymbol = (symbol: string) => {
    const activeLine = calculationLines.find(line => line.id === activeLineId) || calculationLines[0];
    if (!activeLine) return;

    const nextContent = activeLine.content + (activeLine.content.endsWith(' ') || activeLine.content === '' ? '' : ' ') + symbol + ' ';
    updateLine(activeLine.id, { content: nextContent });
  };

  const handleNextHintLevel = () => {
    setHintLevel(prev => Math.min(prev + 1, 3));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-5 items-start">
      <aside className="w-full lg:sticky lg:top-28 lg:self-start space-y-3 z-[1]">
        <div className="rounded-xl border border-purple-300 bg-purple-50 p-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-purple-800 flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 shrink-0" />
            Ce que je cherche
          </p>
          <p className="text-sm text-purple-950 leading-snug font-medium">
            {problem?.question || 'La question du problème apparaîtra ici.'}
          </p>
        </div>

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
            Données utiles
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

        <div className="rounded-xl border border-slate-300 bg-slate-50 p-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-700 mb-2">
            Opérations prévues
          </p>
          {operations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {operations.map((operation, index) => (
                <span key={`${operation}-${index}`} className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-slate-300 bg-white px-2 text-lg font-bold text-slate-800">
                  {operation}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600 leading-snug italic">Les opérations choisies à l’étape 4 apparaîtront ici.</p>
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

      <div className="min-w-0 space-y-6">
        <div className="space-y-2 text-center">
          <h3 className="text-2xl font-bold text-primary">Mon calcul, étape par étape</h3>
          <p className="text-muted-foreground">Choisis une façon de calculer pour chaque étape de ton plan.</p>
        </div>

        <Card className="p-4 border-2 border-primary/20 shadow-lg bg-white space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-primary uppercase tracking-tight">Mode de calcul</p>
              <p className="text-xs text-muted-foreground">Horizontal, posé / vertical ou explication seulement.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 text-muted-foreground self-start sm:self-auto">
              <RotateCcw className="h-3 w-3 mr-1" /> Effacer
            </Button>
          </div>

          <div className="space-y-4">
            {calculationLines.map((line, index) => {
              const matchingPlan = planRows[index]?.action;
              const textareaClass = line.mode === 'vertical'
                ? 'min-h-[180px] font-mono text-lg leading-8 bg-[linear-gradient(to_bottom,transparent_31px,#e2e8f0_32px)] bg-[length:100%_32px]'
                : line.mode === 'explanation'
                ? 'min-h-[110px] text-lg leading-relaxed'
                : 'min-h-[92px] font-mono text-xl leading-relaxed';
              const placeholder = line.mode === 'vertical'
                ? 'Pose ton calcul ici.\n  245\n+ 138\n-----'
                : line.mode === 'explanation'
                ? 'Ex. : Je dois additionner les quantités pour trouver le total.'
                : 'Ex. : 245 + 138 = 383';

              return (
                <div key={line.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-bold text-slate-900">Étape {index + 1} — selon mon plan</p>
                      {matchingPlan && <p className="text-sm text-slate-600 leading-snug">{matchingPlan}</p>}
                    </div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      Mode :
                      <select
                        value={line.mode}
                        onFocus={() => setActiveLineId(line.id)}
                        onChange={e => updateLine(line.id, { mode: e.target.value as CalculationMode })}
                        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="horizontal">Horizontal</option>
                        <option value="vertical">Posé / vertical</option>
                        <option value="explanation">Explication seulement</option>
                      </select>
                    </label>
                  </div>

                  <Textarea
                    placeholder={placeholder}
                    className={`${textareaClass} resize-y border-slate-200 bg-white p-4 focus-visible:ring-primary/30`}
                    value={line.content}
                    onFocus={() => setActiveLineId(line.id)}
                    onChange={e => updateLine(line.id, { content: e.target.value })}
                  />
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addLine}
            className="w-full gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary"
          >
            <Plus className="h-4 w-4" /> Ajouter une ligne de calcul
          </Button>
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

        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm italic text-green-800">
          Chaque calcul doit correspondre à une étape de ton plan. Ajoute toujours l’unité ($, m, kg, °C...) après ton résultat.
        </div>
      </div>
    </div>
  );
}
