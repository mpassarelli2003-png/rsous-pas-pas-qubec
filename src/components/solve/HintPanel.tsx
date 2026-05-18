/**
 * HintPanel — Indices progressifs liés au problème.
 * Affiche les 3 indices du problème un à la fois, avec un rappel de l'étape actuelle.
 * Les indices sont identiques pour toutes les étapes — seul le rappel contextuel change.
 */
import { Button } from '@/lib/ui';
import { X, ChevronRight } from 'lucide-react';

interface ProblemHints {
  level1: string;
  level2: string;
  level3: string;
}

interface HintPanelProps {
  currentStep: number;
  hintLevel: number;       // 1, 2 ou 3
  onNextLevel: () => void; // passe au niveau suivant
  onClose: () => void;
  hints?: ProblemHints;    // indices du problème (depuis problems.json ou admin)
}

/** Rappel contextuel affiché AU-DESSUS de l'indice selon l'étape actuelle */
const STEP_CONTEXT: Record<number, string> = {
  2: "\u{1F4AD} Pense à ce qu'on cherche.",
  3: "\u{1F50D} Pense aux données importantes.",
  4: "\u{1F5FA}\uFE0F Pense à l'opération et au plan.",
  5: "\u{1F9EE} Suis ton plan une étape à la fois.",
  6: "\u270D\uFE0F Réponds avec une phrase complète.",
};

/** Indices par défaut si le problème n'en a pas encore */
const DEFAULT_HINTS: ProblemHints = {
  level1: "Relis la question et repère ce qu'on cherche.",
  level2: "Identifie les nombres utiles et choisis l'opération à faire.",
  level3: "Commence par la première étape de ton plan, sans chercher à tout calculer en même temps.",
};

export function HintPanel({ currentStep, hintLevel, onNextLevel, onClose, hints }: HintPanelProps) {
  const problemHints = hints ?? DEFAULT_HINTS;
  const hintTexts = [problemHints.level1, problemHints.level2, problemHints.level3];

  // hintLevel is 1-based; clamp to valid index
  const index = Math.min(Math.max(hintLevel, 1), 3) - 1;
  const hint = hintTexts[index];
  const isLast = hintLevel >= 3;

  const stepContext = STEP_CONTEXT[currentStep];

  return (
    <div className="animate-fade-in rounded-2xl border-2 border-yellow-200 bg-yellow-50 shadow-md overflow-hidden">
      {/* En-tête */}
      <div className="flex items-center justify-between px-4 py-3 bg-yellow-100 border-b border-yellow-200">
        <div className="flex items-center gap-2">
          <span className="text-xl">💡</span>
          <span className="font-bold text-yellow-800 text-sm uppercase tracking-wide">
            Indice {hintLevel}/3
          </span>
          {/* Indicateur de progression */}
          <div className="flex gap-1 ml-1">
            {[1, 2, 3].map((lvl) => (
              <div
                key={lvl}
                className={`h-2 w-2 rounded-full transition-colors ${
                  lvl <= hintLevel ? 'bg-yellow-500' : 'bg-yellow-200'
                }`}
              />
            ))}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-yellow-600 hover:text-yellow-800 transition-colors p-1 rounded-lg hover:bg-yellow-200"
          aria-label="Fermer l'indice"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Rappel contextuel de l'étape */}
      {stepContext && (
        <div className="px-5 pt-4 pb-0">
          <p className="text-yellow-700 text-sm font-semibold italic">{stepContext}</p>
        </div>
      )}

      {/* Contenu de l'indice */}
      <div className="px-5 py-4">
        <p className="text-yellow-900 text-base md:text-lg font-medium leading-relaxed">
          {hint}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-5 pb-4 gap-3">
        {!isLast ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onNextLevel}
            className="gap-2 border-yellow-300 text-yellow-800 hover:bg-yellow-100 hover:border-yellow-400"
          >
            Indice suivant <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <span className="text-xs text-yellow-600 italic font-semibold">
            Tu as vu tous les indices.
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100"
        >
          Fermer
        </Button>
      </div>
    </div>
  );
}
