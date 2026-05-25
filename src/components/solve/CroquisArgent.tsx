import { useState } from 'react';
import { Button } from '@/lib/ui';

type ObjetArgent = {
  id: string;
  texte: string;
  type: 'billet' | 'piece' | 'etiquette';
  x: number;
  y: number;
};

interface CroquisArgentProps {
  objets?: ObjetArgent[];
  onChange?: (objets: ObjetArgent[]) => void;
}

const outils: { texte: string; type: ObjetArgent['type'] }[] = [
  { texte: 'Prix', type: 'etiquette' },
  { texte: 'Budget', type: 'etiquette' },
  { texte: 'Depense', type: 'etiquette' },
  { texte: 'Reste', type: 'etiquette' },
  { texte: 'Monnaie', type: 'etiquette' },
  { texte: 'Difference', type: 'etiquette' },
  { texte: '5 $', type: 'billet' },
  { texte: '10 $', type: 'billet' },
  { texte: '20 $', type: 'billet' },
  { texte: '1 $', type: 'piece' },
  { texte: '25 c', type: 'piece' },
  { texte: '10 c', type: 'piece' },
  { texte: '5 c', type: 'piece' },
];

const makeId = () => `argent-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function CroquisArgent({ objets = [], onChange }: CroquisArgentProps) {
  const [items, setItems] = useState<ObjetArgent[]>(objets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const commit = (next: ObjetArgent[]) => {
    setItems(next);
    onChange?.(next);
  };

  const add = (texte: string, type: ObjetArgent['type']) => {
    const offset = Math.min(items.length * 10, 100);
    const next = [...items, { id: makeId(), texte, type, x: 20 + offset, y: 20 + offset }];
    setSelectedId(next[next.length - 1].id);
    commit(next);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    const next = items.filter(item => item.id !== selectedId);
    setSelectedId(null);
    commit(next);
  };

  return (
    <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
      <div>
        <h5 className="text-sm font-bold text-emerald-950">Croquis argent</h5>
        <p className="text-xs text-emerald-900">Ajoute des reperes visuels pour representer un prix, un budget, une depense ou de la monnaie.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {outils.map(outil => (
          <Button key={outil.texte} type="button" variant="outline" size="sm" onClick={() => add(outil.texte, outil.type)}>
            {outil.texte}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setShowHelp(!showHelp)}>Aide cents et ecriture</Button>
        {selectedId && <Button type="button" variant="outline" size="sm" onClick={deleteSelected}>Supprimer l'objet</Button>}
        <Button type="button" variant="outline" size="sm" onClick={() => { setSelectedId(null); commit([]); }}>Effacer le croquis argent</Button>
      </div>

      {showHelp && (
        <div className="rounded-lg border border-emerald-200 bg-white p-3 text-sm text-emerald-950">
          <p><strong>Repere :</strong> 100 cents = 1,00 $. 25 cents = 0,25 $. 10 cents = 0,10 $. 5 cents = 0,05 $.</p>
          <p><strong>Ecriture :</strong> on garde 2 chiffres apres la virgule. 2 $ = 2,00 $. 2,5 $ = 2,50 $.</p>
        </div>
      )}

      <div
        className="relative min-h-[220px] overflow-hidden rounded-xl border-2 border-emerald-200 bg-white"
        onPointerMove={(event) => {
          if (!drag) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = Math.max(0, event.clientX - rect.left - drag.dx);
          const y = Math.max(0, event.clientY - rect.top - drag.dy);
          setItems(prev => prev.map(item => item.id === drag.id ? { ...item, x, y } : item));
        }}
        onPointerUp={() => { if (drag) onChange?.(items); setDrag(null); }}
        onPointerCancel={() => setDrag(null)}
        onPointerDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}
      >
        {items.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">Ajoute un billet, une piece ou une etiquette.</div>}
        {items.map(item => {
          const base = item.type === 'billet'
            ? 'rounded-md border-2 border-emerald-700 bg-emerald-100 px-5 py-2 text-emerald-950'
            : item.type === 'piece'
              ? 'rounded-full border-2 border-amber-700 bg-amber-100 px-3 py-3 text-amber-950 min-w-12 text-center'
              : 'rounded-lg border-2 border-blue-700 bg-blue-50 px-4 py-2 text-blue-950';
          return (
            <button
              key={item.id}
              type="button"
              className={`absolute touch-none select-none font-bold shadow-sm ${base} ${selectedId === item.id ? 'ring-4 ring-primary/30' : ''}`}
              style={{ left: item.x, top: item.y }}
              onPointerDown={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setSelectedId(item.id);
                setDrag({ id: item.id, dx: event.clientX - rect.left, dy: event.clientY - rect.top });
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
            >
              {item.texte}
            </button>
          );
        })}
      </div>
    </div>
  );
}
