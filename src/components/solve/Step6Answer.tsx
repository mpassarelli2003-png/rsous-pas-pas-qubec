import { useState } from 'react';
import { Card, Button, Textarea, Badge } from '@/lib/ui';
import { MessageSquare, CheckCircle2, Lightbulb, Search, BookOpen, ChevronDown, ChevronUp, AlertCircle, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step6AnswerProps {
  problem: any;
  onUpdate: (data: any) => void;
  savedData?: any;
}

/** Analyse basique de la réponse de l'élève vs réponse attendue */
function analyzeAnswer(studentAnswer: string, solution: any): { score: number; feedbacks: string[] } {
  if (!studentAnswer.trim()) return { score: 0, feedbacks: [] };
  const feedbacks: string[] = [];
  const ans = studentAnswer.toLowerCase();
  const model = (solution.final_answer || '').toLowerCase();

  // Vérifie si la réponse est une phrase complète (contient au moins un verbe courant ou est longue)
  const isPhraseComplete = studentAnswer.trim().split(' ').length >= 5;
  if (!isPhraseComplete) feedbacks.push("Ta réponse est trop courte. Essaie d'écrire une phrase complète.");

  // Cherche les chiffres clés dans la réponse modèle et la réponse de l'élève
  const modelNumbers = model.match(/\d+[,.]?\d*/g) || [];
  const studentNumbers = ans.match(/\d+[,.]?\d*/g) || [];
  const hasCorrectNumber = modelNumbers.some(n => studentNumbers.includes(n));
  if (!hasCorrectNumber && modelNumbers.length > 0) {
    feedbacks.push("Le nombre dans ta réponse ne correspond pas au résultat attendu. Vérifie tes calculs.");
  } else if (hasCorrectNumber) {
    feedbacks.push("✓ Tu as le bon résultat numérique !");
  }

  // Cherche unité ($ m g cm km kg min h)
  const hasUnit = /\$|mètre|gramme|centimètre|kilomètre|kilogramme|minute|heure| m | g | cm | kg | min | h |parts?/i.test(studentAnswer);
  if (!hasUnit) feedbacks.push("N'oublie pas d'ajouter l'unité ($, mètres, grammes, etc.) dans ta réponse.");
  else feedbacks.push("✓ Tu as inclus l'unité dans ta réponse.");

  // Score
  let score = 0;
  if (isPhraseComplete) score += 30;
  if (hasCorrectNumber) score += 50;
  if (hasUnit) score += 20;

  return { score, feedbacks };
}

export function Step6Answer({ problem, onUpdate, savedData }: Step6AnswerProps) {
  const [answer, setAnswer] = useState(savedData?.answer || '');
  const [showCorrection, setShowCorrection] = useState(false);
  const solution = problem.solution_data;

  const handleAnswerChange = (val: string) => {
    setAnswer(val);
    onUpdate({ answer: val });
  };

  const { score, feedbacks } = analyzeAnswer(answer, solution);

  const scoreColor =
    score >= 80 ? 'text-green-700 bg-green-50 border-green-200' :
    score >= 50 ? 'text-orange-700 bg-orange-50 border-orange-200' :
    'text-red-700 bg-red-50 border-red-200';

  const scoreLabel =
    score >= 80 ? 'Excellente réponse !' :
    score >= 50 ? 'Bonne tentative — quelques points à améliorer.' :
    answer.trim() ? 'Continue d\'essayer !' :
    '';

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h3 className="text-2xl font-bold text-primary">Ma réponse complète</h3>
        <p className="text-muted-foreground">Réponds à la question par une phrase complète qui a du sens.</p>
      </div>

      {/* Zone de réponse */}
      <Card className="p-8 border-4 border-primary/10 shadow-xl bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 bg-primary/10 rounded-bl-xl">
          <MessageSquare className="h-4 w-4 text-primary" />
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-lg border border-muted italic text-muted-foreground mb-4">
            Question : "{problem.question}"
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase text-primary tracking-widest">Ma phrase réponse :</label>
            <Textarea
              placeholder="Ex: Julie a assez d'argent car elle a récolté 87,50 $ au total."
              className="min-h-[120px] text-xl p-4 resize-none border-2 focus:border-primary bg-secondary/10"
              value={answer}
              onChange={e => handleAnswerChange(e.target.value)}
            />
          </div>

          {/* Rétroaction immédiate sur la réponse */}
          {answer.trim().length > 3 && (
            <div className={cn('rounded-xl border p-4 space-y-2 animate-fade-in', scoreColor)}>
              <div className="flex items-center gap-2 font-bold">
                {score >= 80 ? <PartyPopper className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                {scoreLabel}
                <span className="ml-auto text-sm font-medium opacity-70">{score}/100</span>
              </div>
              <ul className="text-sm space-y-1">
                {feedbacks.map((f, i) => (
                  <li key={i} className={cn('flex items-start gap-2', f.startsWith('✓') ? 'text-green-700' : '')}>
                    <span className="shrink-0 mt-0.5">{f.startsWith('✓') ? '✓' : '→'}</span>
                    <span>{f.replace('✓ ', '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="px-3 py-1">Contient un nombre</Badge>
            <Badge variant="secondary" className="px-3 py-1">Contient l'unité</Badge>
            <Badge variant="secondary" className="px-3 py-1">Phrase complète</Badge>
          </div>
        </div>
      </Card>

      {/* Aide à la structure */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl space-y-3">
          <h4 className="font-bold text-blue-900 flex items-center gap-2">
            <Search className="h-5 w-5" /> Aide pour la structure
          </h4>
          <p className="text-sm text-blue-800 leading-relaxed">
            Reprends les mots de la question pour commencer ta phrase.
          </p>
          <div className="bg-white/80 p-3 rounded-lg border border-blue-100 text-xs text-blue-900 space-y-1">
            <p>• Le prix total est de <strong>___ $</strong>.</p>
            <p>• Il reste <strong>___ [unité]</strong>.</p>
            <p>• [Personnage] a <strong>assez / pas assez</strong> d'argent.</p>
          </div>
        </div>
        <div className="p-5 bg-yellow-50 border border-yellow-200 rounded-2xl space-y-3">
          <h4 className="font-bold text-yellow-900 flex items-center gap-2">
            <Lightbulb className="h-5 w-5" /> Le savais-tu ?
          </h4>
          <p className="text-sm text-yellow-800 leading-relaxed">
            Une réponse complète aide ton enseignant(e) à comprendre que tu as bien saisi ce qu'on te demandait.
          </p>
          <div className="flex items-center gap-2 text-yellow-700 font-bold text-xs uppercase tracking-tighter">
            <CheckCircle2 className="h-4 w-4" /> Unité + Nombre + Phrase
          </div>
        </div>
      </div>

      {/* ─── Section CORRECTION ─── */}
      <div className="rounded-2xl overflow-hidden border-4 border-primary/30 shadow-xl mt-6">
        <button
          className="w-full flex items-center justify-between px-6 py-4 bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-colors"
          onClick={() => setShowCorrection(v => !v)}
        >
          <span className="flex items-center gap-3">
            <BookOpen className="h-5 w-5" />
            Voir la correction
          </span>
          {showCorrection ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {showCorrection && (
          <div className="p-6 bg-white space-y-8 animate-fade-in">
            {/* 1. Bonne réponse finale */}
            <div className="space-y-3">
              <h4 className="font-bold text-lg flex items-center gap-2 text-green-700">
                <span className="h-7 w-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                La bonne réponse finale
              </h4>
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-900 font-semibold text-lg leading-relaxed">
                {solution.final_answer}
              </div>
            </div>

            {/* 2. Calculs attendus */}
            <div className="space-y-3">
              <h4 className="font-bold text-lg flex items-center gap-2 text-blue-700">
                <span className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                Les calculs attendus
              </h4>
              <pre className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-900 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                {solution.expected_calculations}
              </pre>
            </div>

            {/* 3. Étapes de résolution */}
            <div className="space-y-3">
              <h4 className="font-bold text-lg flex items-center gap-2 text-purple-700">
                <span className="h-7 w-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                Les étapes de résolution
              </h4>
              <ol className="space-y-2">
                {(solution.expected_steps || []).map((step: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl text-purple-900 text-sm">
                    <span className="h-6 w-6 rounded-full bg-purple-200 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* 4. Phrase-réponse modèle */}
            <div className="space-y-3">
              <h4 className="font-bold text-lg flex items-center gap-2 text-orange-700">
                <span className="h-7 w-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-bold shrink-0">4</span>
                Une phrase-réponse complète modèle
              </h4>
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-900 text-sm leading-relaxed italic">
                "{solution.model_answer || solution.final_answer}"
              </div>
            </div>

            {/* 5. Comparaison avec la réponse de l'élève */}
            <div className="space-y-3">
              <h4 className="font-bold text-lg flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold shrink-0">5</span>
                Comparaison avec ta réponse
              </h4>
              {answer.trim() ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 border border-muted rounded-xl text-sm">
                    <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">Ta réponse :</p>
                    <p className="italic">{answer}</p>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm">
                    <p className="font-bold text-xs uppercase tracking-wider text-green-600 mb-2">Réponse modèle :</p>
                    <p className="italic text-green-900">{solution.model_answer || solution.final_answer}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted/30 border border-muted rounded-xl text-sm text-muted-foreground italic">
                  Tu n'as pas encore écrit ta réponse. Écris-la d'abord, puis consulte la correction.
                </div>
              )}

              {/* Rétroactions pédagogiques */}
              {answer.trim() && (
                <div className={cn('rounded-xl border p-4 space-y-3 mt-3', scoreColor)}>
                  <p className="font-bold">Rétroaction :</p>
                  <ul className="text-sm space-y-2">
                    {feedbacks.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="shrink-0 font-bold">{f.startsWith('✓') ? '✓' : '→'}</span>
                        <span>{f.replace('✓ ', '')}</span>
                      </li>
                    ))}
                    {score < 100 && (
                      <li className="flex items-start gap-2 text-muted-foreground mt-2 pt-2 border-t border-current/10">
                        <span className="shrink-0">💡</span>
                        <span>Compare ta démarche avec les étapes de résolution attendues ci-dessus. L'important est de comprendre le raisonnement, pas seulement le résultat.</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Message encourageant */}
            <div className="p-5 bg-primary/5 border-2 border-primary/20 rounded-2xl text-center text-primary font-semibold text-base">
              Peu importe ton score, chaque problème que tu pratiques te rend plus fort(e) en mathématiques. Continue comme ça !
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
