import { useState } from 'react';
import { Card, Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@blinkdotnew/ui';
import { Plus, Minus, X, Divide, Calculator, ListOrdered, Target, Sparkles, Lightbulb, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlanTable, PlanRow, emptyPlanRows } from './PlanTable';

interface Step4PlanProps {
  problem: any;
  onUpdate: (data: any) => void;
  savedData?: any;
  /** Données notées par l'élève à l'étape 3 (lecture seule) */
  step3Data?: { important?: string; organizer?: string };
}

// ─── Définition enrichie de chaque opération ─────────────────────────────────
// Les ids ('addition', 'soustraction', etc.) sont stables — ils sont sauvegardés
// dans selectedOps et ne doivent pas changer.
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
    definition: "J'additionne quand j'ajoute des quantités ou quand je cherche un total.",
    keywords: ['somme', 'total', 'en tout', 'plus'],
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
    definition: "Je soustrais quand j'enlève une quantité, quand je compare ou quand je cherche ce qui reste.",
    keywords: ['reste', 'différence', 'de moins', 'écart'],
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
    definition: 'Je multiplie quand le même groupe se répète plusieurs fois.',
    keywords: ['fois', 'chaque', 'groupes égaux', 'produit'],
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
    definition: "Je divise quand je partage également ou quand je cherche combien il y a dans chaque groupe.",
    keywords: ['partager', 'chacun', 'par équipe', 'quotient'],
  },
];

/**
 * Extrait les nombres depuis le texte des données importantes (étape 3).
 * Reconnaît entiers et décimaux (virgule ou point). Déduplique, ordre d'apparition.
 */
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

export function Step4Plan({ problem, onUpdate, savedData, step3Data }: Step4PlanProps) {
  const [selectedOps, setSelectedOps] = useState<string[]>(savedData?.selectedOps || []);
  const [estimation, setEstimation] = useState(savedData?.estimation || '');
  const [whyOps, setWhyOps] = useState<Record<string, string>>(savedData?.whyOps || {});
  const [planRows, setPlanRows] = useState<PlanRow[]>(
    savedData?.planRows || emptyPlanRows(1)
  );

  const pushUpdate = (patch: any) => {
    onUpdate({
      selectedOps,
      estimation,
      whyOps,
      planRows,
      stepsCount: String(planRows.length),
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

  const updateWhyOp = (opId: string, value: string) => {
    const next = { ...whyOps, [opId]: value };
    setWhyOps(next);
    pushUpdate({ whyOps: next });
  };

  const handleAddRow = () => {
    const next = [...planRows, { action: '', operation: '', why: '' }];
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

  // Texte noté par l'élève à l'étape 3
  const importantFromStep3 = step3Data?.important?.trim();
  // Nombres repérés dans les données importantes
  const step3Numbers = extractNumbers(step3Data?.important ?? '');

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

      {/* ── Bande gauche : Mes infos utiles ── */}
      <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24 lg:self-start space-y-4 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
          <BookOpen className="h-4 w-4" /> Mes infos utiles
        </p>

        {/* Question du problème */}
        {problem?.question && (
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary/70">
              Question
            </p>
            <p className="text-sm text-slate-800 leading-snug">
              {problem.question}
            </p>
          </div>
        )}

        {/* Ce que j'ai noté à l'étape 3 */}
        <div className="space-y-1 pt-1 border-t border-slate-200">
          <p className="text-[11px] font-bold uppercase tracking-wider text-green-700">
            📋 Ce que j'ai noté
          </p>
          {importantFromStep3 ? (
            <p className="text-sm text-slate-800 whitespace-pre-wrap leading-snug">
              {importantFromStep3}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Aucune information notée à l'étape 3.
            </p>
          )}
        </div>

        {/* Nombres repérés */}
        {step3Numbers.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-slate-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              🔢 Nombres repérés
            </p>
            <div className="flex flex-wrap gap-1.5">
              {step3Numbers.map(num => (
                <span
                  key={num}
                  className="inline-block px-2 py-0.5 rounded-md bg-green-100 border border-green-300 text-green-800 text-xs font-mono font-bold"
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ── Zone principale : 4A, 4B, 4C, plan final ── */}
      <div className="flex-1 min-w-0 space-y-12">

        {/* ── 4A: Opérations ── */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              4A. Je choisis les opérations utiles
            </h3>
            <p className="text-muted-foreground text-sm italic">
              Coche l'opération ou les opérations dont tu auras besoin.
            </p>
          </div>

          {/* Liste verticale compacte — une ligne par opération */}
          <div className="space-y-2">
            {OPERATIONS.map(op => {
              const selected = selectedOps.includes(op.id);
              return (
                <div
                  key={op.id}
                  onClick={() => toggleOp(op.id)}
                  role="checkbox"
                  aria-checked={selected}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleOp(op.id); } }}
                  className={cn(
                    'cursor-pointer rounded-xl border-2 p-3 flex items-start gap-3 transition-all select-none',
                    selected
                      ? cn(op.border, op.light, 'shadow-sm ring-2', op.ring)
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  {/* Case à cocher + symbole */}
                  <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
                    <div className={cn(
                      'h-5 w-5 rounded border-2 flex items-center justify-center transition-colors',
                      selected ? cn(op.color, 'border-transparent') : 'border-slate-300 bg-white'
                    )}>
                      {selected && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className={cn(
                      'text-lg font-black leading-none',
                      selected ? 'text-slate-700' : 'text-slate-400'
                    )}>
                      {op.symbol}
                    </span>
                  </div>

                  {/* Nom + définition + mots-clés */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className={cn(
                      'font-bold text-sm leading-tight',
                      selected ? 'text-slate-900' : 'text-slate-600'
                    )}>
                      {op.label}
                    </p>
                    <p className="text-xs text-slate-600 leading-snug">
                      {op.definition}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {op.keywords.map(k => (
                        <span
                          key={k}
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full border font-medium',
                            selected
                              ? cn(op.light, op.border, 'text-slate-700')
                              : 'bg-slate-100 border-slate-200 text-slate-500'
                          )}
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 4B: Tableau de planification ── */}
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
            <PlanTable
              rows={planRows}
              onChange={handlePlanRowsChange}
              onAddRow={handleAddRow}
              onDeleteRow={handleDeleteRow}
            />
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 flex gap-2">
              <span className="font-bold shrink-0">💡</span>
              <span>Exemple : Étape 1 — calculer le rabais (×) — pour trouver combien je sauve.</span>
            </div>
          </div>
        </section>

        {/* ── 4C: Estimation ── */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              4C. Je fais une estimation
            </h3>
            <p className="text-muted-foreground text-sm">
              Avant de calculer, j'estime ma réponse. Elle sert à vérifier si mon résultat final a du sens.
            </p>
          </div>
          <div className="flex gap-4 items-center flex-wrap">
            <span className="text-lg font-medium whitespace-nowrap">Environ :</span>
            <Input
              placeholder="Ex: 80 $"
              className="max-w-[200px] h-12 text-lg font-bold border-2 focus:border-primary"
              value={estimation}
              onChange={e => { setEstimation(e.target.value); pushUpdate({ estimation: e.target.value }); }}
            />
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl flex gap-3">
            <Lightbulb className="h-5 w-5 text-yellow-600 shrink-0" />
            <div className="text-sm text-yellow-900">
              <p className="font-bold">Astuces pour estimer :</p>
              <ul className="list-disc list-inside ml-2">
                <li>Arrondis les nombres.</li>
                <li>Demande-toi si la réponse sera plus grande ou plus petite.</li>
                <li>Pense à une réponse proche.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Mon plan final ── */}
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
    </div>
  );
}
