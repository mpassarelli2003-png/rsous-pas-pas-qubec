import { useState } from 'react';
import { Card, Button, Textarea, Badge } from '@blinkdotnew/ui';
import { HelpCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HintPanel } from './HintPanel';

interface Step2QuestionProps {
  problem: any;
  onUpdate: (data: any) => void;
  savedData?: any;
}

export function Step2Question({ problem, onUpdate, savedData }: Step2QuestionProps) {
  const [answer, setAnswer] = useState(savedData?.answer || '');
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);

  const handleAnswerChange = (val: string) => {
    setAnswer(val);
    onUpdate({ answer: val });
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
    <div className="space-y-6">
      <div className="space-y-2 text-center py-4">
        <h3 className="text-2xl font-bold text-primary">Qu'est-ce qu'on cherche ?</h3>
        <p className="text-muted-foreground">Identifie la question ou l'ordre donné dans le problème.</p>
      </div>

      <Card className="p-6 border-2 border-primary/20 bg-white">
        <div className="space-y-4">
          <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ta réponse :</label>
          <Textarea
            placeholder="Exemple: Je cherche le prix total des billets..."
            className="min-h-[120px] text-lg resize-none border-2 focus:border-primary"
            value={answer}
            onChange={(e) => handleAnswerChange(e.target.value)}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground italic">
              Conseil : Commence ta phrase par "Je cherche…"
            </p>
            <Badge variant="outline" className="bg-primary/5">
              {answer.length > 5 ? 'Bravo !' : 'Continue d\'écrire...'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Bouton d'indice + panneau */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          onClick={handleHintButtonClick}
          className="gap-2 text-yellow-700 hover:text-yellow-800 hover:bg-yellow-50"
        >
          <HelpCircle className="h-4 w-4" />
          Besoin d'un indice ?
        </Button>

        {showHint && (
          <HintPanel
            currentStep={2}
            hintLevel={hintLevel}
            onNextLevel={handleNextHintLevel}
            onClose={handleCloseHint}
          />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 pt-6">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            <Search className="h-4 w-4" /> Exemples de phrases
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Je cherche le prix total.</li>
            <li>• Je cherche combien il reste de pommes.</li>
            <li>• Je cherche combien chaque personne reçoit.</li>
          </ul>
        </div>
        <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center">
          <p className="text-sm text-green-800 italic">
            "Si la réponse contient l'idée principale de la question, félicitations ! Tu es sur la bonne voie."
          </p>
        </div>
      </div>
    </div>
  );
}
