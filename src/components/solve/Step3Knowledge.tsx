import { useState } from 'react';
import { Card, Button, Textarea } from '@blinkdotnew/ui';
import { ListTodo, Layout, Table as TableIcon, HelpCircle, Coins, Clock, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HintPanel } from './HintPanel';

interface Step3KnowledgeProps {
  problem: any;
  onUpdate: (data: any) => void;
  savedData?: any;
}

const ORGANIZERS = [
  { id: 'list', label: 'Liste', icon: <ListTodo className="h-4 w-4" /> },
  { id: 'table', label: 'Tableau', icon: <TableIcon className="h-4 w-4" /> },
  { id: 'schema', label: 'Schéma', icon: <Layout className="h-4 w-4" /> },
  { id: 'money', label: 'Argent', icon: <Coins className="h-4 w-4" /> },
  { id: 'clock', label: 'Temps', icon: <Clock className="h-4 w-4" /> },
  { id: 'shape', label: 'Géométrie', icon: <Square className="h-4 w-4" /> },
];

export function Step3Knowledge({ problem, onUpdate, savedData }: Step3KnowledgeProps) {
  const [important, setImportant] = useState(savedData?.important || '');
  const [organizer, setOrganizer] = useState(savedData?.organizer || 'list');
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);

  const handleChange = (key: string, val: string) => {
    const next = { important, organizer, [key]: val };
    if (key === 'important') setImportant(val);
    onUpdate(next);
  };

  const handleOrganizerChange = (id: string) => {
    setOrganizer(id);
    onUpdate({ important, organizer: id });
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
        <h3 className="text-2xl font-bold text-primary">Ce que je sais</h3>
        <p className="text-muted-foreground">Trie les informations utiles et inutiles du problème.</p>
      </div>

      <Card className="p-6 border-2 border-green-200 bg-white">
        <div className="flex items-center gap-2 mb-4 text-green-700 font-bold">
          <ListTodo className="h-5 w-5" />
          <span>Données importantes</span>
        </div>
        <Textarea
          placeholder="Écris ici les nombres et informations qui t'aident à calculer..."
          className="min-h-[150px] resize-none border-2 border-green-100 focus:border-green-500 bg-green-50/20"
          value={important}
          onChange={(e) => handleChange('important', e.target.value)}
        />
        <p className="mt-2 text-xs text-green-600 italic">
          Exemple : 15 billets à 2,50 $ chacun.
        </p>
      </Card>

      <div className="space-y-4">
        <h4 className="font-bold flex items-center gap-2">
          <Layout className="h-5 w-5 text-primary" />
          Choisis ton organisateur visuel
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {ORGANIZERS.map((org) => (
            <Button
              key={org.id}
              variant={organizer === org.id ? 'primary' : 'outline'}
              className={cn(
                "h-20 flex flex-col gap-2 transition-all",
                organizer === org.id ? "scale-105 shadow-md" : "hover:border-primary/50"
              )}
              onClick={() => handleOrganizerChange(org.id)}
            >
              {org.icon}
              <span className="text-xs">{org.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-sm italic">
        "Une donnée importante est une information qui t'aide à répondre à la question."
      </div>

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
            currentStep={3}
            hintLevel={hintLevel}
            onNextLevel={handleNextHintLevel}
            onClose={handleCloseHint}
          />
        )}
      </div>
    </div>
  );
}
