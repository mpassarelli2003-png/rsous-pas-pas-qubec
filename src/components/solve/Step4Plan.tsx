import { useState } from 'react';
import { Card, Button, Input } from '@/lib/ui';
import { Plus, Minus, X, Divide, Calculator, ListOrdered, Target, Sparkles, Highlighter, Route, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlanTable, PlanRow, emptyPlanRows } from './PlanTable';

interface Step4PlanProps {
  problem: any;
  onUpdate: (data: any) => void;
  savedData?: any;
  /** Données notées par l'élève à l'étape 3 (lecture seule) */
  step3Data?: { important?: string; organizer?: string };
}

const OPERATIONS = [
  {
    id: 'addition',
    label: 'Addition',
    symbol: '+',
    icon: <Plus className="h-5 w-5" />,
    color: 'bg-blue-500',
    light: 'bg-blue-50',
    border: 'border-blue-300',
    ring: 'ring-blue-400',
    text: 'Je cherche un total.',
    definition: "Je l’utilise quand je cherche un total ou quand j’ajoute des quantités.",
    keywords: ['total', 'en tout'],
    moreKeywords: ['somme', 'plus', 'ajouter', 'réunir'],
  },
  {
    id: 'soustraction',
    label: 'Soustraction',
    symbol: '−',
    icon: <Minus className="h-5 w-5" />,
    color: 'bg-red-500',
    light: 'bg-red-50',
    border: 'border-red-300',
    ring: 'ring-red-400',
    text: 'Je cherche ce qui reste.',
    definition: "Je l’utilise quand je cherche ce qui reste, ce qui manque ou la différence.",
    keywords: ['reste', 'différence'],
    moreKeywords: ['manque', 'écart', 'de moins', 'enlever'],
  },
  {
    id: 'multiplication',
    label: 'Multiplication',
    symbol: '×',
    icon: <X className="h-5 w-5" />,
    color: 'bg-orange-500',
    light: 'bg-orange-50',
    border: 'border-orange-300',
    ring: 'ring-orange-400',
    text: 'Des groupes égaux.',
    definition: 'Je l’utilise quand le même groupe se répète plusieurs fois.',
    keywords: ['groupes', 'chaque'],
    moreKeywords: ['fois', 'par', 'produit', 'double'],
  },
  {
    id: 'division',
    label: 'Division',
    symbol: '÷',
    icon: <Divide className="h-5 w-5" />,
    color: 'bg-purple-500',
    light: 'bg-purple-50',
    border: 'border-purple-300',
    ring: 'ring-purple-400',
    text: 'Je partage également.',
    definition: "Je l’utilise quand je partage également ou quand je cherche combien il y a dans chaque groupe.",
    keywords: ['partager', 'chacun'],
    moreKeywords: ['par équipe', 'moyenne', 'quotient', 'moitié'],
  },
];

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
  return text
    .split('\n')
    .map(line => line.replace(/^\s*•\s*/, '').trim())
    .filter(Boolean);
}

function inferEstimationType(problem: any) {
  const text = `${problem?.theme || ''} ${problem?.notion || ''} ${problem?.title || ''} ${problem?.question || ''}`.toLowerCase();
  if (/probabil|hasard|chance|tir|piger|billet|dé|jeton/.test(text)) return 'probabilite';
  if (/mesure|longueur|mètre|metre|cm|centim|kg|masse|litre|temps|durée|heure|min|température|aire|volume|périmètre/.test(text)) return 'mesure';
  if (/fraction|rapport|proportion|recette|ingrédient|ingredient/.test(text)) return 'proportion';
  return 'arithmetique';
}

const HELP_CONTENT: Record<string, { title: string; steps: string[]; example: string[]; tryText: string }> = {
  arithmetique: {
    title: 'Comment estimer en arithmétique',
    steps: [
      'Je regarde les nombres importants.',
      'Je choisis des nombres plus faciles à calculer.',
      'Je fais un calcul rapide.',
      'Je garde cette réponse pour vérifier si mon vrai résultat a du sens.',
    ],
    example: [
      'Exemple avec d’autres nombres : 327 + 189',
      '327 ≈ 300 et 189 ≈ 200',
      '300 + 200 = 500',
      'Mon estimation est environ 500.',
    ],
    tryText: 'À ton tour : choisis des nombres faciles avec les nombres de ton problème.',
  },
  mesure: {
    title: 'Comment estimer en mesure',
    steps: [
      'Je regarde l’unité : cm, m, kg, L, minutes, degrés…',
      'Je choisis une mesure proche et facile.',
      'Je vérifie si l’unité de ma réponse est logique.',
    ],
    example: [
      'Exemple avec d’autres nombres : une corde mesure 198 cm.',
      '198 cm est proche de 200 cm.',
      'Mon estimation est environ 200 cm.',
    ],
    tryText: 'À ton tour : garde la bonne unité et choisis une mesure proche.',
  },
  probabilite: {
    title: 'Comment estimer en probabilité',
    steps: [
      'Je compare les quantités possibles.',
      'Je regarde ce qui est le plus nombreux, le moins nombreux ou impossible.',
      'Je prévois ce qui est le plus probable sans faire un long calcul.',
    ],
    example: [
      'Exemple avec d’autres nombres : 10 jetons verts et 3 jetons jaunes.',
      'Il y a plus de jetons verts que de jetons jaunes.',
      'J’estime qu’il est plus probable de piger un jeton vert.',
    ],
    tryText: 'À ton tour : compare les quantités de ton problème.',
  },
  proportion: {
    title: 'Comment estimer avec une proportion',
    steps: [
      'Je repère la relation de départ.',
      'Je cherche un multiplicateur facile.',
      'Je prévois une réponse proche avant de calculer exactement.',
    ],
    example: [
      'Exemple avec d’autres nombres : une recette pour 4 personnes doit servir 12 personnes.',
      '12 est 3 fois plus grand que 4.',
      'J’estime qu’il faudra environ 3 fois chaque ingrédient.',
    ],
    tryText: 'À ton tour : cherche si les quantités augmentent ou diminuent ensemble.',
  },
};

export function Step4Plan({ problem, onUpdate, savedData, step3Data }: Step4PlanProps) {
  const [selectedOps, setSelectedOps] = useState<string[]>(savedData?.selectedOps || []);
  const [estimation, setEstimation] = useState(savedData?.estimation || '');
  const [whyOps] = useState<Record<string, string>>(savedData?.whyOps || {});
  const [planRows, setPlanRows] = useState<PlanRow[]>(savedData?.planRows || emptyPlanRows(1));
  const [easyNumbers, setEasyNumbers] = useState<Record<string, string>>(savedData?.easyNumbers || {});
  const [quickCalculation, setQuickCalculation] = useState(savedData?.quickCalculation || '');
  const [showEstimationHelp, setShowEstimationHelp] = useState(false);
  const [openOperationHelp, setOpenOperationHelp] = useState<string | null>(null);

  const pushUpdate = (patch: any) => {
    onUpdate({
      selectedOps,
      estimation,
      whyOps,
      planRows,
      stepsCount: String(planRows.length),
      easyNumbers,
      quickCalculation,
      ...patch
    });
  };

  const toggleOp = (id: string) => {
    const next = selectedOps.includes(id)
      ? selectedOps.filter(op => op !== id)
      : [...selectedOps, id];
    setSelectedOps(next);
    pushUpdate({ selectedOps: next });
  };

  const handleAddRow = () => {
    const next = [...planRows, { action: '', operation: '' }];
    setPlanRows(next);
    pushUpdate({ planRows: next });
  };

  const handleDeleteRow = (index: number) => {
    if (planRows.length <= 1) return;
    const next = planRows.filter((_, i) => i !== index);
    setPlanRows(next);
    pushUpdate({ planRows: next });
  };

  const handlePlanRowsChange = (rows: PlanRow[]) => {
    setPlanRows(rows);
    pushUpdate({ planRows: rows });
  };

  const updateEasyNumber = (num: string, value: string) => {
    const next = { ...easyNumbers, [num]: value };
    setEasyNumbers(next);
    pushUpdate({ easyNumbers: next });
  };

  const updateQuickCalculation = (value: string) => {
    setQuickCalculation(value);
    pushUpdate({ quickCalculation: value });
  };

  const updateEstimation = (value: string) => {
    setEstimation(value);
    pushUpdate({ estimation: value });
  };

  const importantFromStep3 = step3Data?.important?.trim();
  const importantItems = extractImportantItems(step3Data?.important ?? '');
  const step3Numbers = extractNumbers(step3Data?.important ?? '');
  const estimationType = inferEstimationType(problem);
  const help = HELP_CONTENT[estimationType] || HELP_CONTENT.arithmetique;

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-5 items-start">
      <aside className="w-full lg:sticky lg:top-28 lg:self-start space-y-3 z-[1]">
        <div className="rounded-xl border border-blue-300 bg-blue-50 p-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-800 flex items-center gap-2 mb-2">
            <Route className="h-4 w-4 shrink-0" />
            Aide-mémoire
          </p>
          <ol className="space-y-2 text-sm text-blue-950">
            <li className="grid grid-cols-[1.45rem_1fr] gap-2 items-start"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-400 bg-white text-blue-700 font-bold text-[11px]">1</span><p className="leading-snug">Je regarde ce que je cherche.</p></li>
            <li className="grid grid-cols-[1.45rem_1fr] gap-2 items-start"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-400 bg-white text-blue-700 font-bold text-[11px]">2</span><p className="leading-snug">Je regarde les infos utiles.</p></li>
            <li className="grid grid-cols-[1.45rem_1fr] gap-2 items-start"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-400 bg-white text-blue-700 font-bold text-[11px]">3</span><p className="leading-snug">Je choisis l’opération.</p></li>
            <li className="grid grid-cols-[1.45rem_1fr] gap-2 items-start"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-400 bg-white text-blue-700 font-bold text-[11px]">4</span><p className="leading-snug">Je prévois mes étapes.</p></li>
            <li className="grid grid-cols-[1.45rem_1fr] gap-2 items-start"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-400 bg-white text-blue-700 font-bold text-[11px]">5</span><p className="leading-snug">J’estime avant de calculer.</p></li>
          </ol>
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
          ) : importantFromStep3 ? (
            <p className="text-sm text-yellow-900 whitespace-pre-wrap leading-snug">{importantFromStep3}</p>
          ) : (
            <p className="text-sm text-yellow-900 leading-snug">Les infos retenues à l’étape 3 apparaîtront ici.</p>
          )}
        </div>
      </aside>

      <div className="min-w-0 space-y-10">
        <section className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              4A. Je choisis les opérations utiles
            </h3>
            <p className="text-muted-foreground text-sm italic">
              Coche l'opération ou les opérations dont tu auras besoin. Clique sur ? pour un rappel.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {OPERATIONS.map(op => {
              const selected = selectedOps.includes(op.id);
              const helpOpen = openOperationHelp === op.id;
              return (
                <div
                  key={op.id}
                  className={cn(
                    'relative rounded-xl border-2 bg-white transition-all',
                    selected ? cn(op.border, op.light, 'shadow-sm ring-2', op.ring) : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleOp(op.id)}
                    role="checkbox"
                    aria-checked={selected}
                    className="w-full min-h-[76px] p-3 text-left flex items-center gap-3"
                  >
                    <span className={cn('h-8 w-8 rounded-lg flex items-center justify-center text-lg font-black text-white shrink-0', selected ? op.color : 'bg-slate-400')}>
                      {selected ? '✓' : op.symbol}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-slate-900 leading-tight">{op.label}</span>
                      <span className="block text-sm text-slate-600 leading-snug">{op.text}</span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {op.keywords.map(k => (
                          <span key={k} className="rounded-md border border-slate-200 bg-white/80 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{k}</span>
                        ))}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-expanded={helpOpen}
                    aria-label={`Aide pour ${op.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenOperationHelp(helpOpen ? null : op.id);
                    }}
                    className="absolute right-2 top-2 h-7 w-7 rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-800 flex items-center justify-center font-bold"
                  >
                    ?
                  </button>

                  {helpOpen && (
                    <div className="mx-3 mb-3 rounded-xl border border-blue-200 bg-white p-3 shadow-sm text-sm text-slate-700">
                      <p className="font-bold text-slate-900 mb-1">Quand l’utiliser ?</p>
                      <p className="leading-snug">{op.definition}</p>
                      <p className="font-bold text-slate-900 mt-2 mb-1">Mots utiles</p>
                      <div className="flex flex-wrap gap-1">
                        {[...op.keywords, ...op.moreKeywords].map(k => (
                          <span key={k} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ListOrdered className="h-5 w-5 text-primary" />
              4B. Ma planification
            </h3>
            <p className="text-muted-foreground text-sm italic">
              Combien d'étapes de calcul faudra-t-il ? Ajoute autant de lignes que nécessaire.
            </p>
          </div>

          <div className="space-y-4 animate-fade-in">
            <PlanTable rows={planRows} onChange={handlePlanRowsChange} onAddRow={handleAddRow} onDeleteRow={handleDeleteRow} />
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 flex gap-2">
              <span className="font-bold shrink-0">💡</span>
              <span>Exemple : Étape 1 — calculer le rabais (×).</span>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                4C. Je fais une estimation
              </h3>
              <Button variant="outline" size="sm" onClick={() => setShowEstimationHelp(true)} className="gap-2 border-blue-200 text-blue-800 hover:bg-blue-50">
                <HelpCircle className="h-4 w-4" /> Comment estimer ?
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              Je prévois une réponse proche. Elle m’aidera à vérifier si mon calcul final a du sens.
            </p>
          </div>

          <Card className="p-4 border-2 border-yellow-200 bg-yellow-50/70 space-y-4">
            <div>
              <p className="text-sm font-bold text-yellow-900">Mes nombres utiles</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {step3Numbers.length > 0 ? step3Numbers.map(num => (
                  <span key={num} className="rounded-md bg-yellow-200 px-2 py-1 text-sm font-semibold text-yellow-950">{num}</span>
                )) : <span className="text-sm text-yellow-900 italic">Les nombres retenus à l’étape 3 apparaîtront ici.</span>}
              </div>
            </div>

            {estimationType === 'probabilite' ? (
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-yellow-900">Je compare</label>
                  <Input value={quickCalculation} onChange={e => updateQuickCalculation(e.target.value)} placeholder="Ex: Il y a plus de... que de..." className="mt-1 bg-white" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-yellow-900">Mon estimation</label>
                  <Input value={estimation} onChange={e => updateEstimation(e.target.value)} placeholder="Ex: Le plus probable est..." className="mt-1 bg-white" />
                </div>
              </div>
            ) : (
              <>
                {step3Numbers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-yellow-900">Je transforme en nombres faciles</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {step3Numbers.map(num => (
                        <div key={num} className="grid grid-cols-[auto_1fr] items-center gap-2 rounded-lg bg-white/80 border border-yellow-200 p-2">
                          <span className="font-bold text-yellow-950">{num} ≈</span>
                          <Input value={easyNumbers[num] || ''} onChange={e => updateEasyNumber(num, e.target.value)} placeholder="nombre facile" className="h-9 bg-white" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-yellow-900">Mon calcul rapide</label>
                    <Input value={quickCalculation} onChange={e => updateQuickCalculation(e.target.value)} placeholder="Ex: 250 + 140 + 30" className="mt-1 bg-white" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-yellow-900">Mon estimation</label>
                    <Input value={estimation} onChange={e => updateEstimation(e.target.value)} placeholder="Ex: environ 420" className="mt-1 bg-white font-bold" />
                  </div>
                </div>
              </>
            )}
          </Card>
        </section>

        <section className="space-y-4 pt-6 border-t border-dashed">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Mon plan final
          </h3>
          <Card className="p-6 bg-primary/5 border-2 border-primary/20 italic">
            <p className="text-base text-primary/80 leading-relaxed">
              "Pour résoudre ce problème, je vais effectuer{' '}
              <strong>{planRows.length}</strong> étape{planRows.length > 1 ? 's' : ''}.
              {planRows[0]?.action ? ` D'abord : ${planRows[0].action}.` : ''}
              {planRows[1]?.action ? ` Ensuite : ${planRows[1].action}.` : ''}
              {planRows[2]?.action ? ` Finalement : ${planRows[2].action}.` : ''}
              {' '}Je pense que ma réponse sera environ{' '}
              <strong>{estimation || '_______'}</strong>."
            </p>
          </Card>
        </section>
      </div>

      {showEstimationHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-primary text-primary-foreground px-5 py-4 flex items-center justify-between gap-3">
              <h4 className="font-bold text-lg">{help.title}</h4>
              <button type="button" onClick={() => setShowEstimationHelp(false)} className="rounded-full bg-white/15 hover:bg-white/25 h-8 w-8 flex items-center justify-center" aria-label="Fermer">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                <p className="font-bold text-blue-950 mb-2">Ce que je fais</p>
                <ol className="space-y-1 text-sm text-blue-950 list-decimal list-inside">
                  {help.steps.map(step => <li key={step}>{step}</li>)}
                </ol>
              </div>
              <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3">
                <p className="font-bold text-yellow-950 mb-2">Exemple avec d’autres nombres</p>
                <div className="space-y-1 text-sm text-yellow-950">
                  {help.example.map(line => <p key={line}>{line}</p>)}
                </div>
              </div>
              <p className="text-sm font-medium text-slate-700">{help.tryText}</p>
              <div className="flex justify-end">
                <Button onClick={() => setShowEstimationHelp(false)}>Je comprends</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
