import { Card } from '@/lib/ui';

interface StrategyRecommendationsProps {
  selectedStrategies?: string[];
  estimation?: string;
}

export function StrategyRecommendations({ selectedStrategies = [], estimation = '' }: StrategyRecommendationsProps) {
  const has = (id: string) => selectedStrategies.includes(id);
  if (selectedStrategies.length === 0) return null;

  return (
    <Card className="p-4 border-2 border-violet-200 bg-violet-50/70 shadow-sm space-y-3">
      <div>
        <p className="text-sm font-bold uppercase tracking-tight text-violet-950">Outils recommandés selon ta stratégie</p>
        <p className="text-xs text-violet-800">Le choix fait à l’étape 4 influence les outils mis en évidence à l’étape 5.</p>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {has('organiser') && <div className="rounded-xl border border-emerald-200 bg-white p-3 text-sm text-emerald-950"><strong>J’organise :</strong> commence par le tableau de traces. Écris une ligne par petite étape.</div>}
        {has('representer') && <div className="rounded-xl border border-blue-200 bg-white p-3 text-sm text-blue-950"><strong>Je représente :</strong> utilise le stylet pour faire un dessin, une droite ou un schéma avant le calcul.</div>}
        {has('estimer') && <div className="rounded-xl border border-amber-200 bg-white p-3 text-sm text-amber-950"><strong>J’estime :</strong> compare ton résultat avec ton estimation{estimation ? ` : ${estimation}` : ''}.</div>}
        {has('essais') && <div className="rounded-xl border border-purple-200 bg-white p-3 text-sm text-purple-950"><strong>J’essaie et j’ajuste :</strong> fais un essai, vérifie, puis ajoute une nouvelle trace si tu corriges.</div>}
        {has('rebours') && <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-950"><strong>Je travaille à rebours :</strong> pars de la fin et écris l’opération inverse.</div>}
      </div>
    </Card>
  );
}
