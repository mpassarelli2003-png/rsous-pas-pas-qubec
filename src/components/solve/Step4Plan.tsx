import { useState } from 'react';
import { Card, Button, Input } from '@/lib/ui';
import { Plus, Minus, X, Divide, Calculator, ListOrdered, Target, Sparkles, Highlighter, Route, HelpCircle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlanTable, PlanRow, emptyPlanRows } from './PlanTable';
import { HintPanel } from './HintPanel';
import { StrategyChoice, STRATEGY_OPTIONS } from './StrategyChoice';

interface Step4PlanProps {
  problem: any;
  onUpdate: (data: any) => void;
  savedData?: any;
  step3Data?: { important?: string; organizer?: string };
}

const OPERATIONS = [
  {
    id: 'addition', label: 'Addition', symbol: '+', icon: <Plus className="h-5 w-5" />,
    color: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-300', ring: 'ring-blue-400',
    text: 'Je cherche un total.', definition: "Je l’utilise quand je cherche un total ou quand j’ajoute des quantités.",
    keywords: ['total', 'en tout'], moreKeywords: ['somme', 'plus', 'ajouter', 'réunir'],
  },
  {
    id: 'soustraction', label: 'Soustraction', symbol: '−', icon: <Minus className="h-5 w-5" />,
    color: 'bg-red-500', light: 'bg-red-50', border: 'border-red-300', ring: 'ring-red-400',
    text: 'Je cherche ce qui reste.', definition: "Je l’utilise quand je cherche ce qui reste, ce qui manque ou la différence.",
    keywords: ['reste', 'différence'], moreKeywords: ['manque', 'écart', 'de moins', 'enlever'],
  },
  {
    id: 'multiplication', label: 'Multiplication', symbol: '×', icon: <X className="h-5 w-5" />,
    color: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-300', ring: 'ring-orange-400',
    text: 'Des groupes égaux.', definition: 'Je l’utilise quand le même groupe se répète plusieurs fois.',
    keywords: ['groupes', 'chaque'], moreKeywords: ['fois', 'par', 'produit', 'double'],
  },
  {
    id: 'division', label: 'Division', symbol: '÷', icon: <Divide className="h-5 w-5" />,
    color: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-300', ring: 'ring-purple-400',
    text: 'Je partage également.', definition: "Je l’utilise quand je partage également ou quand je cherche combien il y a dans chaque groupe.",
    keywords: ['partager', 'chacun'], moreKeywords: ['par équipe', 'moyenne', 'quotient', 'moitié'],
  },
];

const ESTIMATION_SYMBOLS = ['+', '−', '×', '÷', '=', '≈'];

function extractNumbers(text: string): string[] {
  if (!text) return [];
  const raw = text.match(/\d+(?:[,.]\d+)*/g) ?? [];
  const seen = new Set<string>();
  return raw.filter(n => {
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });
}

function extractImportantItems(text: string): string[] {
  if (!text) return [];
  return text.split('\n').map(line => line.replace(/^\s*•\s*/, '').trim()).filter(Boolean);
}

function initialEstimationSteps(savedData: any): string[] {
  if (Array.isArray(savedData?.estimationSteps) && savedData.estimationSteps.length > 0) return savedData.estimationSteps;
  if (typeof savedData?.quickCalculation === 'string' && savedData.quickCalculation.trim()) return savedData.quickCalculation.split('\n');
  return [''];
}

function buildPlanPreview(rows: PlanRow[]) {
  const filledRows = rows.map((row, index) => ({ ...row, index })).filter(row => row.action?.trim());
  if (filledRows.length === 0) return '';
  return filledRows.map(row => ` Étape ${row.index + 1} : ${row.action.trim()}.`).join('');
}

export function Step4Plan({ problem, onUpdate, savedData, step3Data }: Step4PlanProps) {
  const [selectedOps, setSelectedOps] = useState<string[]>(savedData?.selectedOps || []);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(savedData?.selectedStrategies || []);
  const [estimation, setEstimation] = useState(savedData?.estimation || '');
  const [planRows, setPlanRows] = useState<PlanRow[]>(savedData?.planRows || emptyPlanRows(1));
  const [easyNumbers, setEasyNumbers] = useState<Record<string, string>>(savedData?.easyNumbers || {});
  const [estimationSteps, setEstimationSteps] = useState<string[]>(initialEstimationSteps(savedData));
  const [openOperationHelp, setOpenOperationHelp] = useState<string | null>(null);
  const [activeEstimationStep, setActiveEstimationStep] = useState(0);
  const [showLocalHint, setShowLocalHint] = useState(false);
  const [localHintLevel, setLocalHintLevel] = useState(1);
  const [showEstimateHelp, setShowEstimateHelp] = useState(false);

  const importantFromStep3 = step3Data?.important?.trim();
  const importantItems = extractImportantItems(step3Data?.important ?? '');
  const step3Numbers = extractNumbers(step3Data?.important ?? '');
  const problemHints = problem?.hints ?? undefined;
  const quickCalculation = estimationSteps.filter(step => step.trim()).join('\n');
  const planPreview = buildPlanPreview(planRows);
  const strategyPreview = STRATEGY_OPTIONS
    .filter(strategy => selectedStrategies.includes(strategy.id))
    .map(strategy => strategy.label.toLowerCase())
    .join(', ');

  const pushUpdate = (patch: any) => {
    onUpdate({
      selectedOps,
      selectedStrategies,
      estimation,
      planRows,
      stepsCount: String(planRows.length),
      easyNumbers,
      estimationSteps,
      quickCalculation,
      ...patch,
    });
  };

  const toggleOp = (id: string) => {
    const next = selectedOps.includes(id) ? selectedOps.filter(op => op !== id) : [...selectedOps, id];
    setSelectedOps(next);
    pushUpdate({ selectedOps: next });
  };

  const handleStrategiesChange = (next: string[]) => {
    setSelectedStrategies(next);
    pushUpdate({ selectedStrategies: next });
  };

  const handlePlanRowsChange = (rows: PlanRow[]) => {
    setPlanRows(rows);
    pushUpdate({ planRows: rows, stepsCount: String(rows.length) });
  };

  const handleAddRow = () => {
    const next = [...planRows, { action: '', operation: '' }];
    handlePlanRowsChange(next);
  };

  const handleDeleteRow = (index: number) => {
    if (planRows.length <= 1) return;
    const next = planRows.filter((_, i) => i !== index);
    handlePlanRowsChange(next);
  };

  const updateEasyNumber = (num: string, value: string) => {
    const next = { ...easyNumbers, [num]: value };
    setEasyNumbers(next);
    pushUpdate({ easyNumbers: next });
  };

  const updateEstimationStep = (index: number, value: string) => {
    const next = estimationSteps.map((step, i) => i === index ? value : step);
    setEstimationSteps(next);
    pushUpdate({ estimationSteps: next, quickCalculation: next.filter(step => step.trim()).join('\n') });
  };

  const addEstimationStep = () => {
    const next = [...estimationSteps, ''];
    setEstimationSteps(next);
    setActiveEstimationStep(next.length - 1);
    pushUpdate({ estimationSteps: next, quickCalculation: next.filter(step => step.trim()).join('\n') });
  };

  const insertEstimationSymbol = (symbol: string) => {
    const index = Math.min(activeEstimationStep, estimationSteps.length - 1);
    const current = estimationSteps[index] || '';
    const nextValue = current.endsWith(' ') || current.length === 0 ? `${current}${symbol} ` : `${current} ${symbol} `;
    updateEstimationStep(index, nextValue);
  };

  const updateEstimation = (value: string) => {
    setEstimation(value);
    pushUpdate({ estimation: value });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-5 items-start">
      <aside className="w-full lg:sticky lg:top-28 lg:self-start space-y-3 z-[1]">
        <div className="rounded-xl border border-blue-300 bg-blue-50 p-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-800 flex items-center gap-2 mb-2"><Route className="h-4 w-4 shrink-0" />Aide-mémoire</p>
          <ol className="space-y-2 text-sm text-blue-950">
            {['Je choisis une stratégie.', 'Je choisis l’opération.', 'Je prévois mes étapes.', 'J’estime avant de calculer.'].map((txt, i) => (
              <li key={txt} className="grid grid-cols-[1.45rem_1fr] gap-2 items-start"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-400 bg-white text-blue-700 font-bold text-[11px]">{i + 1}</span><p className="leading-snug">{txt}</p></li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-yellow-800 flex items-center gap-2 mb-2"><Highlighter className="h-4 w-4 shrink-0" />Infos utiles</p>
          {importantItems.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">{importantItems.map((item, index) => <span key={`${item}-${index}`} className="rounded-md bg-yellow-200 px-2 py-1 text-sm font-semibold text-yellow-950">{item}</span>)}</div>
          ) : importantFromStep3 ? <p className="text-sm text-yellow-900 whitespace-pre-wrap leading-snug">{importantFromStep3}</p> : <p className="text-sm text-yellow-900 leading-snug">Les infos retenues à l’étape 3 apparaîtront ici.</p>}
        </div>

        <div className="space-y-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setShowLocalHint(true)} className="w-full justify-start gap-2 border-violet-300 bg-violet-50 text-violet-800 hover:bg-violet-100 hover:border-violet-400">
            <Lightbulb className="h-4 w-4" />Indice
          </Button>
          {showLocalHint && <HintPanel currentStep={4} hintLevel={localHintLevel} hints={problemHints} onNextLevel={() => setLocalHintLevel(prev => Math.min(prev + 1, 3))} onClose={() => setShowLocalHint(false)} />}
        </div>
      </aside>

      <div className="min-w-0 space-y-10">
        <StrategyChoice selectedStrategies={selectedStrategies} onChange={handleStrategiesChange} />

        <section className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" />4B. Je choisis les opérations utiles</h3>
            <p className="text-muted-foreground text-sm italic">Coche l'opération ou les opérations dont tu auras besoin. Clique sur ? pour un rappel.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {OPERATIONS.map(op => {
              const selected = selectedOps.includes(op.id);
              const helpOpen = openOperationHelp === op.id;
              return (
                <div key={op.id} className={cn('relative rounded-xl border-2 bg-white transition-all', selected ? cn(op.border, op.light, 'shadow-sm ring-2', op.ring) : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50')}>
                  <button type="button" onClick={() => toggleOp(op.id)} role="checkbox" aria-checked={selected} className="w-full min-h-[76px] p-3 pr-11 text-left grid grid-cols-[2rem_2.5rem_1fr] items-center gap-3">
                    <span className={cn('h-7 w-7 rounded-md border-2 flex items-center justify-center shrink-0', selected ? 'bg-primary border-primary text-white' : 'bg-white border-slate-400 text-transparent')}>✓</span>
                    <span className={cn('h-9 w-9 rounded-lg flex items-center justify-center text-lg font-black text-white shrink-0', selected ? op.color : 'bg-slate-500')}>{op.symbol}</span>
                    <span className="min-w-0 flex-1"><span className="block font-bold text-slate-900 leading-tight">{op.label}</span><span className="block text-sm text-slate-600 leading-snug">{op.text}</span><span className="mt-1 flex flex-wrap gap-1">{op.keywords.map(k => <span key={k} className="rounded-md border border-slate-200 bg-white/80 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{k}</span>)}</span></span>
                  </button>
                  <button type="button" aria-expanded={helpOpen} aria-label={`Aide pour ${op.label}`} onClick={(e) => { e.stopPropagation(); setOpenOperationHelp(helpOpen ? null : op.id); }} className="absolute right-2 top-2 h-7 w-7 rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-800 flex items-center justify-center font-bold">?</button>
                  {helpOpen && <div className="mx-3 mb-3 rounded-xl border border-blue-200 bg-white p-3 shadow-sm text-sm text-slate-700"><p className="font-bold text-slate-900 mb-1">Quand l’utiliser ?</p><p className="leading-snug">{op.definition}</p><p className="font-bold text-slate-900 mt-2 mb-1">Mots utiles</p><div className="flex flex-wrap gap-1">{[...op.keywords, ...op.moreKeywords].map(k => <span key={k} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{k}</span>)}</div></div>}
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2"><h3 className="text-xl font-bold flex items-center gap-2"><ListOrdered className="h-5 w-5 text-primary" />4C. Ma planification</h3><p className="text-muted-foreground text-sm italic">Combien d'étapes de calcul faudra-t-il ? Ajoute autant de lignes que nécessaire.</p></div>
          <div className="space-y-4 animate-fade-in"><PlanTable rows={planRows} onChange={handlePlanRowsChange} onAddRow={handleAddRow} onDeleteRow={handleDeleteRow} /></div>
        </section>

        <section className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 flex-wrap"><h3 className="text-xl font-bold flex items-center gap-2"><Target className="h-5 w-5 text-primary" />4D. Je fais une estimation</h3><Button variant="outline" size="sm" onClick={() => setShowEstimateHelp(v => !v)} className="gap-2 border-blue-200 text-blue-800 hover:bg-blue-50"><HelpCircle className="h-4 w-4" /> Comment estimer ?</Button></div>
            {showEstimateHelp && <p className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">Choisis des nombres plus faciles, fais un calcul rapide, puis garde cette réponse pour vérifier si ton résultat final a du sens.</p>}
            <p className="text-muted-foreground text-sm">Je prévois une réponse proche. Elle m’aidera à vérifier si mon calcul final a du sens.</p>
          </div>
          <Card className="p-4 border-2 border-yellow-200 bg-yellow-50/70 space-y-4">
            <div><p className="text-sm font-bold text-yellow-900">Mes nombres utiles</p><div className="mt-2 flex flex-wrap gap-1.5">{step3Numbers.length > 0 ? step3Numbers.map(num => <span key={num} className="rounded-md bg-yellow-200 px-2 py-1 text-sm font-semibold text-yellow-950">{num}</span>) : <span className="text-sm text-yellow-900 italic">Les nombres retenus à l’étape 3 apparaîtront ici.</span>}</div></div>
            {step3Numbers.length > 0 && <div className="space-y-2"><p className="text-sm font-bold text-yellow-900">Je transforme en nombres faciles</p><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{step3Numbers.map(num => <div key={num} className="grid grid-cols-[auto_1fr] items-center gap-2 rounded-lg bg-white/80 border border-yellow-200 p-2"><span className="font-bold text-yellow-950">{num} ≈</span><Input value={easyNumbers[num] || ''} onChange={e => updateEasyNumber(num, e.target.value)} placeholder="nombre facile" className="h-9 bg-white" /></div>)}</div></div>}
            <div className="space-y-3"><div className="flex items-center justify-between gap-3 flex-wrap"><label className="text-xs font-bold uppercase tracking-wide text-yellow-900">Mon calcul rapide</label><Button type="button" variant="outline" size="sm" onClick={addEstimationStep} className="h-8 gap-1 bg-white border-yellow-300 text-yellow-900 hover:bg-yellow-100"><Plus className="h-4 w-4" /> Ajouter une étape</Button></div><div className="space-y-2">{estimationSteps.map((step, index) => <div key={index} className="grid grid-cols-[2rem_1fr] items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-200 text-yellow-950 font-bold text-sm">{index + 1}</span><Input value={step} onFocus={() => setActiveEstimationStep(index)} onChange={e => updateEstimationStep(index, e.target.value)} placeholder="Ex: 300 + 200 = 500" className="bg-white" /></div>)}</div><div className="flex flex-wrap gap-2">{ESTIMATION_SYMBOLS.map(symbol => <button key={symbol} type="button" onClick={() => insertEstimationSymbol(symbol)} className="h-10 min-w-10 rounded-lg border border-yellow-300 bg-white px-3 text-lg font-black text-yellow-950 hover:bg-yellow-100">{symbol}</button>)}</div></div>
            <div><label className="text-xs font-bold uppercase tracking-wide text-yellow-900">Mon estimation</label><Input value={estimation} onChange={e => updateEstimation(e.target.value)} placeholder="Ex: environ 500" className="mt-1 bg-white font-bold" /></div>
          </Card>
        </section>

        <section className="space-y-4 pt-6 border-t border-dashed"><h3 className="text-xl font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Mon plan final</h3><Card className="p-6 bg-primary/5 border-2 border-primary/20 italic"><p className="text-base text-primary/80 leading-relaxed">"Pour résoudre ce problème, je vais utiliser {strategyPreview || 'une stratégie adaptée'}. Je vais effectuer <strong>{planRows.length}</strong> étape{planRows.length > 1 ? 's' : ''}.{planPreview || ' Je vais écrire mon plan dans le tableau.'} Je pense que ma réponse sera environ <strong>{estimation || '_______'}</strong>."</p></Card></section>
      </div>
    </div>
  );
}
