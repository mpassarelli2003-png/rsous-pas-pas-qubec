import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/lib/ui';

type ReminderKey = 'list' | 'table' | 'schema' | 'money' | 'clock' | 'shape' | 'operation';

const REMINDERS: Record<ReminderKey, { title: string; use: string; keywords: string[]; questions: string[]; strategies: string[]; parent: string[] }> = {
  list: {
    title: 'Organiser les données',
    use: 'À repérer les informations importantes avant de choisir les calculs.',
    keywords: ['nombre', 'quantité', 'mesure', 'prix', 'durée', 'condition'],
    questions: ['Qu’est-ce que je cherche ?', 'Quelles données répondent à la question ?', 'Y a-t-il une information inutile ?'],
    strategies: ['Surligner les nombres utiles.', 'Reformuler chaque donnée avec ses mots.', 'Garder seulement ce qui aide à répondre.'],
    parent: ['Demander : « Est-ce que cette information aide à répondre à la question ? »', 'Éviter de choisir l’opération à la place de l’enfant.'],
  },
  table: {
    title: 'Lire un tableau',
    use: 'À ranger les données pour mieux voir les liens entre les informations.',
    keywords: ['ligne', 'colonne', 'donnée', 'catégorie', 'comparaison'],
    questions: ['Que représente chaque colonne ?', 'Quelles lignes sont utiles ?', 'Est-ce que je dois comparer ?'],
    strategies: ['Lire le titre des colonnes.', 'Associer chaque nombre à ce qu’il représente.', 'Chercher les données manquantes ou inutiles.'],
    parent: ['Demander : « Ce nombre parle de quoi ? »', 'Faire lire les titres de colonnes avant de calculer.'],
  },
  schema: {
    title: 'Faire un croquis',
    use: 'À représenter des groupes, des parties, un partage, un trajet ou un changement.',
    keywords: ['groupe', 'partage', 'partie', 'total', 'reste', 'flèche'],
    questions: ['Est-ce que je peux dessiner des groupes ?', 'Est-ce que je dois montrer un changement ?', 'Est-ce que je dois partager également ?'],
    strategies: ['Dessiner seulement les éléments utiles.', 'Utiliser des flèches pour montrer ce qui change.', 'Écrire le nombre près de chaque élément.'],
    parent: ['Encourager un dessin simple, même s’il n’est pas beau.', 'Demander : « Ton dessin montre quoi ? »'],
  },
  money: {
    title: 'Argent',
    use: 'À comprendre un achat, une vente, une économie, une dépense ou une monnaie à rendre.',
    keywords: ['prix', 'coût', 'total', 'budget', 'rabais', 'monnaie', 'reste', 'différence'],
    questions: ['Est-ce que je cherche le coût total ?', 'Est-ce que je dois rendre la monnaie ?', 'Est-ce qu’un même prix revient plusieurs fois ?', 'Est-ce que je compare deux montants ?'],
    strategies: ['+ pour mettre des montants ensemble.', '- pour trouver ce qui reste ou la différence.', '× pour répéter le même prix.', '÷ pour partager un montant également.'],
    parent: ['Demander : « Qu’est-ce qu’on cherche avec l’argent ? »', 'Éviter de dire directement : « Fais une multiplication. »'],
  },
  clock: {
    title: 'Temps',
    use: 'À comprendre un départ, une durée, une arrivée ou un changement dans le temps.',
    keywords: ['heure', 'durée', 'avant', 'après', 'début', 'fin', 'minutes'],
    questions: ['Quelle est l’heure de départ ?', 'Quelle est la durée ?', 'Est-ce que j’avance ou je recule dans le temps ?'],
    strategies: ['Écrire départ → durée → arrivée.', 'Faire attention aux heures et aux minutes.', 'Utiliser une ligne du temps au besoin.'],
    parent: ['Demander : « On part de quelle heure ? »', 'Faire verbaliser si on avance ou si on recule.'],
  },
  shape: {
    title: 'Périmètre, aire et géométrie',
    use: 'À distinguer les mesures d’une forme et ce qu’on cherche.',
    keywords: ['côté', 'longueur', 'largeur', 'périmètre', 'aire', 'surface', 'angle'],
    questions: ['Est-ce que je cherche le tour ou la surface ?', 'Quelles mesures sont données ?', 'Quelle formule peut m’aider ?'],
    strategies: ['Périmètre = faire le tour.', 'Aire = remplir la surface.', 'Écrire la formule avant de calculer.'],
    parent: ['Demander : « Est-ce qu’on fait le tour ou l’intérieur ? »', 'Faire pointer les mesures sur la figure.'],
  },
  operation: {
    title: 'Choisir une opération',
    use: 'À décider quoi faire avec les informations utiles.',
    keywords: ['en tout', 'reste', 'différence', 'fois', 'partage', 'chaque'],
    questions: ['Est-ce que je mets ensemble ?', 'Est-ce que je cherche ce qui reste ?', 'Est-ce qu’un groupe se répète ?', 'Est-ce que je partage également ?'],
    strategies: ['+ mettre ensemble.', '- enlever, comparer ou chercher ce qui manque.', '× répéter un même groupe.', '÷ partager ou faire des groupes égaux.'],
    parent: ['Faire nommer l’action avant l’opération.', 'Demander : « Qu’est-ce qui se passe dans l’histoire ? »'],
  },
};

export function ConceptReminder({ context = 'operation' }: { context?: ReminderKey | string }) {
  const [open, setOpen] = useState(false);
  const key = (context in REMINDERS ? context : 'operation') as ReminderKey;
  const reminder = REMINDERS[key];

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3">
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(!open)} className="w-full justify-between gap-2 text-amber-950 hover:bg-amber-100">
        <span className="flex items-center gap-2 font-bold"><HelpCircle className="h-4 w-4" /> ? Rappel — {reminder.title}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      {open && (
        <div className="mt-3 grid gap-3 text-sm text-amber-950 lg:grid-cols-2">
          <div className="space-y-2">
            <p><strong>À quoi ça sert ?</strong><br />{reminder.use}</p>
            <p><strong>Mots-clés :</strong><br />{reminder.keywords.join(', ')}</p>
            <div><strong>Questions à me poser :</strong><ul className="ml-5 list-disc">{reminder.questions.map(item => <li key={item}>{item}</li>)}</ul></div>
          </div>
          <div className="space-y-2">
            <div><strong>Stratégies utiles :</strong><ul className="ml-5 list-disc">{reminder.strategies.map(item => <li key={item}>{item}</li>)}</ul></div>
            <div className="rounded-lg border border-amber-200 bg-white/70 p-2"><strong>Pour le parent :</strong><ul className="ml-5 list-disc">{reminder.parent.map(item => <li key={item}>{item}</li>)}</ul></div>
          </div>
        </div>
      )}
    </div>
  );
}
