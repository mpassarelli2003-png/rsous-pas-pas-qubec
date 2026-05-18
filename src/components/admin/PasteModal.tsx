/**
 * PasteModal — Modal "Coller un problème complet"
 * Permet à l'administrateur de coller un texte formaté et de remplir
 * automatiquement les champs du formulaire.
 */
import { useState } from 'react';
import { Button, Textarea } from '@/lib/ui';
import { ClipboardPaste, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { parseProblemText, type ParseResult } from '../../lib/parseProblem';

interface PasteModalProps {
  onApply: (result: ParseResult) => void;
  onClose: () => void;
}

type Phase = 'input' | 'preview';

export function PasteModal({ onApply, onClose }: PasteModalProps) {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = () => {
    if (!text.trim()) return;
    setAnalyzing(true);
    // Légère pause pour feedback visuel
    setTimeout(() => {
      const parsed = parseProblemText(text);
      setResult(parsed);
      setPhase('preview');
      setAnalyzing(false);
    }, 300);
  };

  const handleApply = () => {
    if (!result) return;
    onApply(result);
    onClose();
  };

  const handleBack = () => {
    setPhase('input');
    setResult(null);
  };

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm px-4 py-8 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-primary/20 w-full max-w-2xl animate-fade-in">

        {/* ── En-tête ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <ClipboardPaste className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base">Coller un problème complet</h2>
              <p className="text-xs text-muted-foreground">
                {phase === 'input'
                  ? 'Colle le texte généré par une IA, puis clique sur « Analyser ».'
                  : 'Vérifie les données extraites, puis applique-les au formulaire.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Corps ── */}
        <div className="px-6 py-5 space-y-5">

          {/* Phase 1 : zone de texte */}
          {phase === 'input' && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Colle ici le problème complet
                </label>
                <Textarea
                  className="min-h-[320px] font-mono text-sm leading-relaxed resize-y"
                  placeholder={[
                    'TITRE:',
                    'La sortie au zoo',
                    '',
                    'NIVEAU:',
                    '6e année',
                    '',
                    'NOTION:',
                    'Nombres naturels',
                    '',
                    'DIFFICULTÉ:',
                    'Moyen',
                    '',
                    'ÉNONCÉ:',
                    'Les élèves de 6e année vont au zoo...',
                    '',
                    'QUESTION:',
                    'Combien d\'autobus sont nécessaires ?',
                    '',
                    '— et ainsi de suite —',
                  ].join('\n')}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Aide format */}
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-800 space-y-1">
                <p className="font-bold">Format attendu — balises en majuscules suivies de :</p>
                <p className="font-mono opacity-80">
                  TITRE: · NIVEAU: · NOTION: · DIFFICULTÉ: · ÉNONCÉ: · QUESTION:
                  · DONNÉES IMPORTANTES: · OPÉRATIONS ATTENDUES: · CORRIGÉ:
                  · RÉPONSE FINALE: · PHRASE-RÉPONSE: · INDICE 1/2/3: · RÉTROACTION:
                </p>
              </div>
            </>
          )}

          {/* Phase 2 : aperçu du résultat */}
          {phase === 'preview' && result && (
            <div className="space-y-4">
              {/* Sections manquantes */}
              {result.missingFields.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Sections obligatoires manquantes
                  </div>
                  <ul className="space-y-1">
                    {result.missingFields.map(f => (
                      <li key={f} className="text-sm text-red-700 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                        Il manque la section : <strong>{f}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Succès */}
              {result.missingFields.length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Toutes les sections obligatoires ont été trouvées.
                </div>
              )}

              {/* Aperçu des champs extraits */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Aperçu des données extraites
                </p>
                {[
                  { label: 'Titre', value: result.fields.titre },
                  { label: 'Niveau', value: result.fields.niveau ? `${result.fields.niveau}e année` : undefined },
                  { label: 'Notion', value: result.fields.notion },
                  { label: 'Difficulté', value: result.fields.difficulte },
                  { label: 'Énoncé', value: result.fields.enonce },
                  { label: 'Question', value: result.fields.question },
                  { label: 'Données importantes', value: result.fields.donnees },
                  { label: 'Opérations attendues', value: result.fields.operations },
                  { label: 'Corrigé', value: result.fields.corrige },
                  { label: 'Réponse finale', value: result.fields.reponsefinale },
                  { label: 'Phrase-réponse', value: result.fields.phrasereponse },
                  { label: 'Indice 1', value: result.fields.indice1 },
                  { label: 'Indice 2', value: result.fields.indice2 },
                  { label: 'Indice 3', value: result.fields.indice3 },
                  { label: 'Rétroaction', value: result.fields.retroaction },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className={`flex gap-3 rounded-lg px-3 py-2 text-sm border ${
                      value
                        ? 'bg-green-50/60 border-green-100'
                        : 'bg-muted/30 border-muted/40'
                    }`}
                  >
                    <span className="font-semibold text-muted-foreground w-40 shrink-0">{label}</span>
                    <span className={`flex-1 truncate font-mono text-xs leading-relaxed ${value ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                      {value
                        ? (value.length > 120 ? value.slice(0, 120) + '…' : value)
                        : '— non renseigné —'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Pied de page ── */}
        <div className="flex gap-3 px-6 py-4 border-t bg-muted/20 rounded-b-2xl">
          {phase === 'input' ? (
            <>
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Annuler
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleAnalyze}
                disabled={!text.trim() || analyzing}
              >
                {analyzing
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyse en cours…</>
                  : <><ClipboardPaste className="h-4 w-4" /> Analyser et remplir le formulaire</>}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="flex-1" onClick={handleBack}>
                ← Modifier le texte
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleApply}
                disabled={!result}
              >
                <CheckCircle2 className="h-4 w-4" />
                Appliquer au formulaire
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
