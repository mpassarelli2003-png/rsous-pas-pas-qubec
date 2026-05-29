import { useState } from 'react';
import { Card, Button } from '@/lib/ui';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StrategyOption {
  id: string;
  label: string;
  symbol: string;
  text: string;
  help: string;
}

export const STRATEGY_OPTIONS: StrategyOption[] = [
  {
    id: 'organiser',
    label: 'J’organise',
    symbol: 'T',
    text: 'Je fais un tableau ou une liste.',
    help: 'Utile quand il y a plusieurs nombres ou plusieurs étapes.',
  },
  {
    id: 'representer',
    label: 'Je représente',
    symbol: 'D',
    text: 'Je fais un dessin ou un schéma.',
    help: 'Utile quand je dois voir les groupes, les parties, l’argent ou les mesures.',
  },
  {
    id: 'estimer',
    label: 'J’estime',
    symbol: '≈',
    text: 'Je prévois une réponse proche.',
    help: 'Utile pour vérifier si ma réponse finale a du sens.',
  },
  {
    id: 'essais',
    label: 'J’essaie et j’ajuste',
    symbol: '?',
    text: 'Je fais un essai, je vérifie, puis je corrige.',
    help: 'Utile quand je ne vois pas tout de suite le calcul exact.',
  },
  {
    id: 'rebours',
    label: 'Je travaille à rebours',
    symbol: '←',
    text: 'Je pars de la fin pour revenir au début.',
    help: 'Utile quand je connais le résultat final ou une situation finale.',
  },
];

interface StrategyChoiceProps {
  selectedStrategies: string[];
  onChange: (nextStrategies: string[]) => void;
}

export function StrategyChoice({ selectedStrategies, onChange }: StrategyChoiceProps) {
  const [showMore, setShowMore] = useState(false);
  const [openHelp, setOpenHelp] = useState<string | null>(null);
  const visibleStrategies = showMore ? STRATEGY_OPTIONS : STRATEGY_OPTIONS.slice(0, 3);

  const toggleStrategy = (id: string) => {
    const next = selectedStrategies.includes(id)
      ? selectedStrategies.filter(strategy => strategy !== id)
      : [...selectedStrategies, id];
    onChange(next);
  };

  return (
    <Card className="p-4 border-2 border-violet-200 bg-violet-50/70 shadow-sm space-y-4">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-violet-950">4A. Je choisis une stratégie</h3>
        <p className="text-sm text-violet-800">Choisis un outil pour organiser ta pensée. Une seule stratégie peut suffire.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibleStrategies.map(strategy => {
          const selected = selectedStrategies.includes(strategy.id);
          const helpOpen = openHelp === strategy.id;
          return (
            <div key={strategy.id} className={cn('relative rounded-xl border-2 bg-white transition-all', selected ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-300' : 'border-slate-200 hover:border-violet-200')}>
              <button
                type="button"
                onClick={() => toggleStrategy(strategy.id)}
                role="checkbox"
                aria-checked={selected}
                className="w-full min-h-[82px] p-3 pr-11 text-left grid grid-cols-[2rem_2.5rem_1fr] items-center gap-3"
              >
                <span className={cn('h-7 w-7 rounded-md border-2 flex items-center justify-center shrink-0', selected ? 'bg-primary border-primary text-white' : 'bg-white border-slate-400 text-transparent')}>✓</span>
                <span className={cn('h-9 w-9 rounded-lg flex items-center justify-center text-lg font-black text-white shrink-0', selected ? 'bg-violet-500' : 'bg-slate-500')}>{strategy.symbol}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-slate-900 leading-tight">{strategy.label}</span>
                  <span className="block text-sm text-slate-600 leading-snug">{strategy.text}</span>
                </span>
              </button>
              <button
                type="button"
                aria-expanded={helpOpen}
                aria-label={`Aide pour ${strategy.label}`}
                onClick={(event) => { event.stopPropagation(); setOpenHelp(helpOpen ? null : strategy.id); }}
                className="absolute right-2 top-2 h-7 w-7 rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-violet-50 hover:text-violet-800 flex items-center justify-center"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
              {helpOpen && (
                <div className="mx-3 mb-3 rounded-xl border border-violet-200 bg-white p-3 shadow-sm text-sm text-slate-700">
                  <p className="font-bold text-slate-900 mb-1">Quand l’utiliser ?</p>
                  <p className="leading-snug">{strategy.help}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={() => setShowMore(v => !v)} className="w-full border-violet-300 text-violet-800 hover:bg-violet-100">
        {showMore ? 'Afficher moins de stratégies' : 'Voir plus de stratégies'}
      </Button>
    </Card>
  );
}
