import { useState } from 'react';
import { Card, Button, Textarea } from '@/lib/ui';
import { RotateCcw, ClipboardList, Highlighter, Target, Lightbulb, Plus, HelpCircle } from 'lucide-react';
import { PlanTable, PlanRow } from './PlanTable';
import { HintPanel } from './HintPanel';
import { DrawingPad } from './DrawingPad';

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

interface TraceRow {
  id: string;
  target: string;
  calculation: string;
  result: string;
  reason: string;
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

function buildTraceText(rows: TraceRow[]): string {
  return rows
    .map((row, index) => {
      const hasContent = row.target.trim() || row.calculation.trim() || row.result.trim() || row.reason.trim();
      if (!hasContent) return '';
      return [
        `Trace ${index + 1}`,
        `Ce que je cherche : ${row.target}`,
        `Mon calcul : ${row.calculation}`,
        `Résultat : ${row.result}`,
        `Pourquoi : ${row.reason}`,
      ].join('\n');
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

function makeInitialTraceRows(savedData?: any): TraceRow[] {
  if (Array.isArray(savedData?.traceRows) && savedData.traceRows.length > 0) {
    return savedData.traceRows;
  }

  return [1, 2, 3].map(index => ({
    id: `trace-${index}`,
    target: '',
    calculation: '',
    result: '',
    reason: '',
  }));
}

const MATH_SYMBOLS = ['+', '−', '×', '÷', '=', '%', '$', ',', '.', '(', ')'];

export function Step5Solve({ problem, onUpdate, savedData, planData, step3Data, currentStep = 5 }: Step5SolveProps) {
  const [calculationLines, setCalculationLines] = useState<CalculationLine[]>(() => makeInitialLines(savedData));
  const [activeLineId, setActiveLineId] = useState(() => makeInitialLines(savedData)[0]?.id || 'calc-1');
  const [traceRows, setTraceRows] = useState<TraceRow[]>(() => makeInitialTraceRows(savedData));
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);
  const [showOperationHelp, setShowOperationHelp] = useState(true);
  const [calculationDrawing, setCalculationDrawing] = useState(savedData?.calculationDrawing || '');
  const [calculationDrawingHeight, setCalculationDrawingHeight] = useState(savedData?.calculationDrawingHeight || 260);
  const [calculationDrawingObjects, setCalculationDrawingObjects] = useState<any[]>(savedData?.calculationDrawingObjects || []);

  const planRows: PlanRow[] = planData?.planRows || [];
  const estimation: string = planData?.estimation || '';
  const importantItems = extractImportantItems(step3Data?.important ?? '');
  const step3Numbers = extractNumbers(step3Data?.important ?? '');
  const problemHints = problem?.hints ?? undefined;
  const operations = planRows.map(row => row.operation).filter(Boolean);

  const emitUpdate = (
    nextLines: CalculationLine[],
    drawingPatch?: { dataUrl?: string; height?: number; objects?: any[] },
    nextTraceRows: TraceRow[] = traceRows
  ) => {
    onUpdate({
      calculation: buildCalculationText(nextLines),
      calculationLines: nextLines,
      traceRows: nextTraceRows,
      calculationTrace: buildTraceText(nextTraceRows),
      calculationDrawing: drawingPatch?.dataUrl ?? calculationDrawing,
      calculationDrawingHeight: drawingPatch?.height ?? calculationDrawingHeight,
      calculationDrawingObjects: drawingPatch?.objects ?? calculationDrawingObjects,
    });
  };

  const updateLine = (lineId: string, patch: Partial<CalculationLine>) => {
    const next = calculationLines.map(line => line.id === lineId ? { ...line, ...patch } : line);
    setCalculationLines(next);
    emitUpdate(next);
  };

  const updateTraceRow = (rowId: string, patch: Partial<TraceRow>) => {
    const next = traceRows.map(row => row.id === rowId ? { ...row, ...patch } : row);
    setTraceRows(next);
    emitUpdate(calculationLines, undefined, next);
  };

  const addTraceRow = () => {
    const nextRow: TraceRow = {
      id: `trace-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      target: '',
      calculation: '',
      result: '',
      reason: '',
    };
    const next = [...traceRows, nextRow];
    setTraceRows(next);
    emitUpdate(calculationLines, undefined, next);
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

  const handleCalculationDrawingSave = (dataUrl: string, height: number, objects?: any[]) => {
    const safeObjects = objects || [];
    setCalculationDrawing(dataUrl);
    setCalculationDrawingHeight(height);
    setCalculationDrawingObjects(safeObjects);
    emitUpdate(calculationLines, { dataUrl, height, objects: safeObjects });
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

        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 shadow-sm">
          <button
            type="button"
            onClick={() => setShowOperationHelp(v => !v)}
            className="w-full flex items-center justify-between gap-2 text-left text-[11px] font-bold uppercase tracking-widest text-indigo-800"
          >
            <span className="flex items-center gap-2"><HelpCircle className="h-4 w-4 shrink-0" /> Pourquoi cette opération?</span>
            <span className="text-xs normal-case tracking-normal">{showOperationHelp ? 'Masquer' : 'Voir'}</span>
          </button>
          {showOperationHelp && (
            <div className="mt-2 space-y-1 text-sm text-indigo-950 leading-snug">
              <p><strong>Additionner :</strong> je réunis ou j’ajoute.</p>
              <p><strong>Soustraire :</strong> j’enlève, je compare ou je cherche ce qui manque.</p>
              <p><strong>Multiplier :</strong> je répète des groupes égaux.</p>
              <p><strong>Diviser :</strong> je partage également ou je cherche combien par groupe.</p>
            </div>
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

        {planRows.length > 0 && (
          <Card className="p-4 border-2 border-blue-200 bg-blue-50/70 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-700" />
              <div>
                <p className="text-sm font-bold uppercase tracking-tight text-blue-900">Mon plan</p>
                <p className="text-xs text-blue-800">Utilise ton plan pour faire tes calculs dans l’ordre.</p>
              </div>
            </div>
            <div className="rounded-lg bg-white border border-blue-100 overflow-hidden">
              <PlanTable rows={planRows} readOnly />
            </div>
          </Card>
        )}

        <Card className="p-4 border-2 border-emerald-200 bg-emerald-50/70 shadow-sm space-y-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-tight text-emerald-900">Mes traces de calcul</p>
            <p className="text-xs text-emerald-800">Pour chaque calcul, écris ce que tu cherches, ton calcul et pourquoi tu le fais.</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-emerald-200 bg-white">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-emerald-100 text-emerald-950">
                <tr>
                  <th className="border-b border-emerald-200 p-2 font-bold">Ce que je cherche</th>
                  <th className="border-b border-emerald-200 p-2 font-bold">Mon calcul</th>
                  <th className="border-b border-emerald-200 p-2 font-bold">Résultat</th>
                  <th className="border-b border-emerald-200 p-2 font-bold">Pourquoi je fais ce calcul</th>
                </tr>
              </thead>
              <tbody>
                {traceRows.map(row => (
                  <tr key={row.id} className="align-top">
                    <td className="border-t border-emerald-100 p-2">
                      <textarea
                        value={row.target}
                        onChange={e => updateTraceRow(row.id, { target: e.target.value })}
                        placeholder="ex. le total des billets"
                        className="min-h-[70px] w-full resize-y rounded-md border border-emerald-200 bg-white p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      />
                    </td>
                    <td className="border-t border-emerald-100 p-2">
                      <textarea
                        value={row.calculation}
                        onChange={e => updateTraceRow(row.id, { calculation: e.target.value })}
                        placeholder="ex. 4 × 10"
                        className="min-h-[70px] w-full resize-y rounded-md border border-emerald-200 bg-white p-2 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      />
                    </td>
                    <td className="border-t border-emerald-100 p-2">
                      <textarea
                        value={row.result}
                        onChange={e => updateTraceRow(row.id, { result: e.target.value })}
                        placeholder="ex. 40 $"
                        className="min-h-[70px] w-full resize-y rounded-md border border-emerald-200 bg-white p-2 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      />
                    </td>
                    <td className="border-t border-emerald-100 p-2">
                      <textarea
                        value={row.reason}
                        onChange={e => updateTraceRow(row.id, { reason: e.target.value })}
                        placeholder="ex. parce que j’ai 4 billets de 10 $"
                        className="min-h-[70px] w-full resize-y rounded-md border border-emerald-200 bg-white p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addTraceRow}
            className="w-full gap-2 border-dashed border-emerald-400 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-500"
          >
            <Plus className="h-4 w-4" /> Ajouter une trace de calcul
          </Button>
        </Card>

        <Card className="p-4 border-2 border-primary/20 shadow-lg bg-white space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-primary uppercase tracking-tight">Tableau de calculs</p>
              <p className="text-xs text-muted-foreground">Horizontal, posé / vertical, explication ou stylet.</p>
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

          <div className="rounded-xl border-2 border-slate-200 bg-slate-50/70 p-3 space-y-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Stylet de calcul</p>
              <p className="text-xs text-slate-600">Utilise cet espace pour poser une opération, faire une retenue, barrer, dessiner une droite ou écrire avec le stylet.</p>
            </div>
            <DrawingPad
              initialDataUrl={calculationDrawing}
              initialHeight={calculationDrawingHeight}
              initialObjects={calculationDrawingObjects}
              onSave={handleCalculationDrawingSave}
            />
          </div>
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
