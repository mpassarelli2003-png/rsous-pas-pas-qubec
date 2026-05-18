import { useState } from 'react';
import { Card, Button, Textarea } from '@/lib/ui';
import { RotateCcw, HelpCircle, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import { PlanTable, PlanRow } from './PlanTable';
import { HintPanel } from './HintPanel';

interface Step5SolveProps {
  problem: any;
  onUpdate: (data: any) => void;
  savedData?: any;
  planData?: any;    // réponses étape 4
  step3Data?: any;   // réponses étape 3 (données importantes notées par l'élève)
  currentStep?: number;
}

/**
 * Extrait les nombres depuis le texte des données importantes (étape 3).
 * Reconnaît : entiers, décimaux avec virgule ou point, nombres avec $ ou %.
 * Déduplique et conserve l'ordre d'apparition.
 */
function extractNumbers(text: string): string[] {
  if (!text) return [];
  // Regex : nombre optionnellement suivi de $ ou %, ou précédé de $
  const raw = text.match(/\d+(?:[,.]\d+)*/g) ?? [];
  // Déduplique en conservant l'ordre
  const seen = new Set<string>();
  return raw.filter(n => {
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });
}

const MATH_SYMBOLS = ['+', '−', '×', '÷', '=', '%', '$', ',', '.', '(', ')'];

export function Step5Solve({ problem, onUpdate, savedData, planData, step3Data, currentStep = 5 }: Step5SolveProps) {
  const [calculation, setCalculation] = useState(savedData?.calculation || '');
  const [showPlan, setShowPlan] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);

  const planRows: PlanRow[] = planData?.planRows || [];
  const estimation: string = planData?.estimation || '';

  // Nombres repérés dans les données importantes de l'étape 3
  const step3Numbers = extractNumbers(step3Data?.important ?? '');

  const addSymbol = (symbol: string) => {
    const next = calculation + (calculation.endsWith(' ') || calculation === '' ? '' : ' ') + symbol + ' ';
    setCalculation(next);
    onUpdate({ calculation: next });
  };

  const handleCalcChange = (val: string) => {
    setCalculation(val);
    onUpdate({ calculation: val });
  };

  const handleHintButtonClick = () => {
    setShowHint(true);
  };

  const handleNextHintLevel = () => {
    setHintLevel(prev => Math.min(prev + 1, 3));
  };

  const handleCloseHint = () => {
    setShowHint(false);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h3 className="text-2xl font-bold text-primary">Ma démarche</h3>
        <p className="text-muted-foreground">Fais tes calculs ici en suivant ton plan. Explique chaque étape.</p>
      </div>

      {/* Rappel du plan de l'étape 4 */}
      <div className="rounded-2xl border-2 border-primary/20 overflow-hidden shadow-sm">
        <button
          className="w-full flex items-center justify-between px-5 py-3 bg-primary/5 hover:bg-primary/10 transition-colors font-bold text-primary text-sm"
          onClick={() => setShowPlan(v => !v)}
        >
          <span className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Rappel de mon plan (étape 4)
            {estimation && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                Estimation : <strong>{estimation}</strong>
              </span>
            )}
          </span>
          {showPlan ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showPlan && (
          <div className="p-4">
            {planRows.length > 0 ? (
              <PlanTable rows={planRows} readOnly />
            ) : (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                Tu n'as pas rempli le tableau de planification à l'étape 4. C'est correct — tu peux quand même faire tes calculs ici.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Zone de calcul texte */}
      <div className="space-y-4">
        <Card className="p-0 border-2 border-primary/20 overflow-hidden shadow-lg bg-white">
          <div className="bg-primary/5 p-3 border-b border-primary/10 flex justify-between items-center">
            <span className="text-sm font-bold text-primary uppercase tracking-tight">Espace de calcul — texte</span>
            <Button variant="ghost" size="sm" onClick={() => handleCalcChange('')} className="h-8 text-muted-foreground">
              <RotateCcw className="h-3 w-3 mr-1" /> Effacer
            </Button>
          </div>
          <Textarea
            placeholder={'Écris tes calculs ici...\nEx: 15 × 2,50 = 37,50 $ (billets à 2,50 $)\n    8 × 5,00 = 40,00 $ (billets à 5,00 $)'}
            className="min-h-[220px] text-xl font-mono p-6 resize-none border-none focus-visible:ring-0 leading-relaxed"
            value={calculation}
            onChange={e => handleCalcChange(e.target.value)}
          />
        </Card>

        {/* Nombres repérés à l'étape 3 */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-green-700 flex items-center gap-1.5">
            <span>🔢</span> Nombres repérés à l'étape 3
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

        {/* Clavier mathématique */}
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

      {/* Bouton d'indice + panneau */}
      <div className="space-y-3">
        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            onClick={handleHintButtonClick}
            className="h-14 border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-yellow-400 hover:text-yellow-700 hover:bg-yellow-50 transition-all gap-2"
          >
            <HelpCircle className="h-4 w-4" /> J'ai besoin d'un indice
          </Button>
        </div>

        {showHint && (
          <HintPanel
            currentStep={currentStep}
            hintLevel={hintLevel}
            onNextLevel={handleNextHintLevel}
            onClose={handleCloseHint}
          />
        )}
      </div>

      <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm italic text-green-800">
        "Chaque calcul doit correspondre à une étape de ton plan. Ajoute toujours l'unité ($, m, kg...) après ton résultat."
      </div>
    </div>
  );
}
