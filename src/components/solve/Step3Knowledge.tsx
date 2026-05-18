import { useState } from 'react';
import { Card, Button, Textarea } from '@blinkdotnew/ui';
import { ListTodo, Layout, Table as TableIcon, HelpCircle, Coins, Clock, Square, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HintPanel } from './HintPanel';

interface Step3KnowledgeProps {
  problem: any;
  onUpdate: (data: any) => void;
  savedData?: any;
}

type OrganizerId = 'list' | 'table' | 'schema' | 'money' | 'clock' | 'shape';

const ORGANIZERS: { id: OrganizerId; label: string; icon: JSX.Element; helper: string }[] = [
  { id: 'list', label: 'Liste', icon: <ListTodo className="h-4 w-4" />, helper: 'Écrire les données importantes une sous l’autre.' },
  { id: 'table', label: 'Tableau', icon: <TableIcon className="h-4 w-4" />, helper: 'Classer les données pour mieux les comparer.' },
  { id: 'schema', label: 'Schéma', icon: <Layout className="h-4 w-4" />, helper: 'Représenter la situation avec des mots, flèches ou groupes.' },
  { id: 'money', label: 'Argent', icon: <Coins className="h-4 w-4" />, helper: 'Organiser les prix, quantités et totaux.' },
  { id: 'clock', label: 'Temps', icon: <Clock className="h-4 w-4" />, helper: 'Organiser les heures, durées et arrivées.' },
  { id: 'shape', label: 'Géométrie', icon: <Square className="h-4 w-4" />, helper: 'Organiser les mesures, formes, formules et unités.' },
];

const ORGANIZER_TEMPLATES: Record<OrganizerId, { title: string; instruction: string; placeholder: string; example: string }> = {
  list: {
    title: 'Liste des données importantes',
    instruction: 'Écris seulement les nombres et les informations qui peuvent t’aider à répondre à la question.',
    placeholder: 'Ex. :\n8 boîtes\n24 crayons par boîte\n36 crayons gardés\n6 équipes',
    example: 'Exemple : 15 billets à 2,50 $ chacun.',
  },
  table: {
    title: 'Tableau de tri',
    instruction: 'Classe les données. Tu peux écrire ce que chaque donnée veut dire et si elle est utile.',
    placeholder: 'Donnée | Ce que ça veut dire | Utile ?\n8 boîtes | nombre de boîtes achetées | oui\n24 crayons | crayons par boîte | oui\n36 crayons | crayons gardés | oui',
    example: 'Exemple : 8 boîtes | nombre de boîtes | oui.',
  },
  schema: {
    title: 'Schéma de la situation',
    instruction: 'Représente la situation avec des mots, des flèches, des groupes ou un petit dessin écrit.',
    placeholder: 'Ex. :\n8 boîtes → 24 crayons dans chaque boîte\nTotal de crayons → enlever 36 crayons\nReste → partager en 6 équipes',
    example: 'Exemple : total → enlever → partager.',
  },
  money: {
    title: 'Organisateur argent',
    instruction: 'Utilise cet organisateur pour les prix, rabais, dépenses, budgets ou montants restants.',
    placeholder: 'Article | Quantité | Prix unitaire | Total\nBillets | 15 | 2,50 $ | ?\nBillets | 8 | 5,00 $ | ?\nBudget ou montant disponible | | 45,00 $ |',
    example: 'Exemple : billets | 15 | 2,50 $ | ?',
  },
  clock: {
    title: 'Organisateur temps',
    instruction: 'Utilise cet organisateur pour les heures, durées, calendriers ou écarts de température.',
    placeholder: 'Départ ou départ de la mesure | Durée ou changement | Arrivée ou résultat\n8 h 15 | + 45 minutes | ?\n-6 °C | + 9 °C | ?',
    example: 'Exemple : 8 h 15 | +45 min | ?.',
  },
  shape: {
    title: 'Organisateur géométrie',
    instruction: 'Utilise cet organisateur pour les formes, mesures, périmètres, aires, angles ou unités.',
    placeholder: 'Forme | Mesures utiles | Formule ou idée | Ce que je cherche\nRectangle | longueur 12 m, largeur 5 m | aire = longueur × largeur | aire\nRectangle | longueur 12 m, largeur 8 m | périmètre = tour | clôture',
    example: 'Exemple : rectangle | 12 m et 5 m | aire = L × l.',
  },
};

export function Step3Knowledge({ problem, onUpdate, savedData }: Step3KnowledgeProps) {
  const [important, setImportant] = useState(savedData?.important || '');
  const [organizer, setOrganizer] = useState<OrganizerId>(savedData?.organizer || 'list');
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);

  const selectedTemplate = ORGANIZER_TEMPLATES[organizer];

  const handleChange = (val: string) => {
    setImportant(val);
    onUpdate({ important: val, organizer });
  };

  const handleOrganizerChange = (id: OrganizerId) => {
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
          className="min-h-[130px] resize-none border-2 border-green-100 focus:border-green-500 bg-green-50/20"
          value={important}
          onChange={(e) => handleChange(e.target.value)}
        />
        <p className="mt-2 text-xs text-green-600 italic">
          Exemple : 15 billets à 2,50 $ chacun.
        </p>
      </Card>

      <div className="space-y-4">
        <h4 className="font-bold flex items-center gap-2">
          <Layout className="h-5 w-5 text-primary" />
          Choisis comment organiser tes informations
        </h4>
        <p className="text-sm text-muted-foreground">
          Clique sur le format qui t’aide le mieux. L’espace de travail s’adapte à ton choix.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {ORGANIZERS.map((org) => (
            <Button
              key={org.id}
              variant={organizer === org.id ? 'primary' : 'outline'}
              className={cn(
                'h-24 flex flex-col gap-2 transition-all text-center px-2',
                organizer === org.id ? 'scale-105 shadow-md' : 'hover:border-primary/50'
              )}
              onClick={() => handleOrganizerChange(org.id)}
            >
              {org.icon}
              <span className="text-xs font-bold">{org.label}</span>
              <span className="text-[10px] leading-tight opacity-80 hidden md:block">{org.helper}</span>
            </Button>
          ))}
        </div>
      </div>

      <Card className="p-6 border-2 border-primary/20 bg-primary/5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h4 className="font-bold text-primary flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              {selectedTemplate.title}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">{selectedTemplate.instruction}</p>
          </div>
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-white border border-primary/20 text-primary whitespace-nowrap">
            {ORGANIZERS.find(org => org.id === organizer)?.label}
          </span>
        </div>

        <Textarea
          placeholder={selectedTemplate.placeholder}
          className="min-h-[190px] resize-none border-2 border-primary/20 focus:border-primary bg-white font-mono text-sm"
          value={important}
          onChange={(e) => handleChange(e.target.value)}
        />
        <p className="mt-2 text-xs text-primary italic">{selectedTemplate.example}</p>
      </Card>

      <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-sm italic">
        "Une donnée importante est une information qui t'aide à répondre à la question."
      </div>

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
