import { useState } from 'react';
import { Textarea, Badge } from '@blinkdotnew/ui';
import { Search, Highlighter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step2QuestionProps {
  problem: any;
  onUpdate: (data: any) => void;
  savedData?: any;
  highlightedTokenIds?: string[];
}

function tokenizeText(text: string) {
  return text.split(/(\s+)/).filter(part => part.length > 0);
}

function cleanToken(token: string) {
  return token.trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

function getHighlightedContentTokens(content: string, highlightedTokenIds: string[] = []) {
  const highlightedSet = new Set(highlightedTokenIds.filter(id => id.startsWith('content-')));
  const seen = new Set<string>();

  return tokenizeText(content)
    .map((token, index) => ({ token: cleanToken(token), id: `content-${index}` }))
    .filter(({ token, id }) => token && highlightedSet.has(id))
    .filter(({ token }) => {
      const key = token.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(({ token }) => token);
}

function normalizeText(value: unknown) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isProbabilityProblem(problem: any) {
  const fieldsToCheck = [
    problem?.mathDomain,
    problem?.mainConcept,
    problem?.subConcept,
    problem?.theme,
    problem?.title,
    problem?.question,
  ];

  return fieldsToCheck.some(field => normalizeText(field).includes('probabil'));
}

export function Step2Question({ problem, onUpdate, savedData, highlightedTokenIds = [] }: Step2QuestionProps) {
  const [answer, setAnswer] = useState(savedData?.answer || '');
  const highlightedContentTokens = getHighlightedContentTokens(problem.content || '', highlightedTokenIds);
  const showProbabilityStarter = isProbabilityProblem(problem);

  const handleAnswerChange = (val: string) => {
    setAnswer(val);
    onUpdate({ answer: val });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-5 items-start">
      {/* ── Colonne gauche fixe : aide compacte, même esprit que l'étape 1 ── */}
      <aside className="w-full lg:sticky lg:top-28 lg:self-start space-y-3 z-[1]">
        <div className="rounded-xl border border-blue-300 bg-blue-50 p-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-800 flex items-center gap-2 mb-2">
            <Search className="h-4 w-4 shrink-0" />
            Aide-mémoire
          </p>

          <p className="text-sm font-bold text-blue-950 leading-snug mb-2">
            Débuts de phrases
          </p>

          <ul className="space-y-2 text-sm text-blue-950">
            <li className="leading-snug">• Je cherche combien...</li>
            <li className="leading-snug">• Je cherche le nombre de...</li>
            <li className="leading-snug">• Je cherche le total de...</li>
            {showProbabilityStarter && (
              <li className="leading-snug">• Je cherche ce qui est le plus probable.</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-yellow-800 flex items-center gap-2 mb-2">
            <Highlighter className="h-4 w-4 shrink-0" />
            Infos surlignées
          </p>

          {highlightedContentTokens.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {highlightedContentTokens.map((token, index) => (
                <span key={`${token}-${index}`} className="rounded-md bg-yellow-200 px-2 py-1 text-sm font-semibold text-yellow-950">
                  {token}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-yellow-900 leading-snug">
              Les nombres et infos surlignés dans l'énoncé apparaîtront ici.
            </p>
          )}
        </div>
      </aside>

      {/* ── Zone principale : consigne + réponse ── */}
      <div className="min-w-0">
        <div className="rounded-xl border-2 border-primary/20 bg-white px-4 py-3 shadow-sm">
          <div className="space-y-2">
            <div className="space-y-0.5 text-center">
              <h3 className="text-xl md:text-2xl font-bold text-primary">Qu'est-ce qu'on cherche ?</h3>
              <p className="text-sm text-muted-foreground">Écris ce que la question te demande de trouver.</p>
            </div>

            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ta réponse :</label>
            <Textarea
              placeholder="Exemple : Je cherche le nombre de caisses..."
              className="min-h-[64px] text-base md:text-lg resize-none border-2 focus:border-primary"
              value={answer}
              onChange={(e) => handleAnswerChange(e.target.value)}
            />
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
              <p className="text-xs text-muted-foreground italic">
                Tu dis ce qu'on cherche, pas encore le calcul.
              </p>
              <Badge
                variant="outline"
                className={cn(
                  'w-fit',
                  answer.length > 5 ? 'bg-green-50 text-green-800 border-green-200' : 'bg-primary/5'
                )}
              >
                {answer.length > 5 ? 'Bonne voie' : 'Continue d’écrire...'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
