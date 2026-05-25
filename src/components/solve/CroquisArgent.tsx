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
  { texte: '50 $', type: 'billet' },
  { texte: '100 $', type: 'billet' },
  { texte: '2 $', type: 'piece' },
  { texte: '1 $', type: 'piece' },
  { texte: '50 c', type: 'piece' },
  { texte: '25 c', type: 'piece' },
  { texte: '10 c', type: 'piece' },
  { texte: '5 c', type: 'piece' },
];

const makeId = () => `argent-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getBillTheme = (value: string) => {
  if (value === '5 $') return { bg: 'from-sky-200 via-cyan-100 to-sky-300', border: 'border-sky-700', text: 'text-sky-950', accent: 'bg-sky-500/30' };
  if (value === '10 $') return { bg: 'from-violet-200 via-purple-100 to-indigo-200', border: 'border-violet-700', text: 'text-violet-950', accent: 'bg-violet-500/30' };
  if (value === '20 $') return { bg: 'from-emerald-200 via-green-100 to-lime-200', border: 'border-emerald-700', text: 'text-emerald-950', accent: 'bg-emerald-500/30' };
  if (value === '50 $') return { bg: 'from-rose-200 via-red-100 to-pink-200', border: 'border-rose-700', text: 'text-rose-950', accent: 'bg-rose-500/30' };
  if (value === '100 $') return { bg: 'from-amber-200 via-yellow-100 to-orange-200', border: 'border-amber-700', text: 'text-amber-950', accent: 'bg-amber-500/30' };
  return { bg: 'from-slate-200 via-slate-100 to-slate-200', border: 'border-slate-700', text: 'text-slate-950', accent: 'bg-slate-500/30' };
};

const getCoinStyle = (value: string) => {
  if (value === '2 $') return { sizePx: 62, outer: 'border-slate-500 bg-gradient-to-br from-slate-50 via-slate-200 to-slate-400 text-slate-950', inner: 'bg-gradient-to-br from-yellow-100 via-amber-200 to-yellow-400 border-yellow-700', icon: 'ours', label: '2 $' };
  if (value === '1 $') return { sizePx: 56, outer: 'border-yellow-700 bg-gradient-to-br from-yellow-100 via-amber-200 to-yellow-400 text-yellow-950', inner: 'bg-yellow-100/40 border-yellow-800/40', icon: 'huard', label: '1 $' };
  if (value === '50 c') return { sizePx: 54, outer: 'border-slate-500 bg-gradient-to-br from-slate-50 via-slate-200 to-slate-400 text-slate-950', inner: 'bg-white/20 border-slate-600/40', icon: 'armoiries', label: '50 c' };
  if (value === '25 c') return { sizePx: 50, outer: 'border-slate-500 bg-gradient-to-br from-slate-50 via-slate-200 to-slate-400 text-slate-950', inner: 'bg-white/20 border-slate-600/40', icon: 'caribou', label: '25 c' };
  if (value === '10 c') return { sizePx: 45, outer: 'border-slate-500 bg-gradient-to-br from-slate-50 via-slate-200 to-slate-400 text-slate-950', inner: 'bg-white/20 border-slate-600/40', icon: 'voilier', label: '10 c' };
  return { sizePx: 44, outer: 'border-slate-500 bg-gradient-to-br from-slate-50 via-slate-200 to-slate-400 text-slate-950', inner: 'bg-white/20 border-slate-600/40', icon: 'castor', label: '5 c' };
};

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

  const renderCoinIcon = (icon: string) => {
    if (icon === 'castor') return <span className="text-[14px] leading-none">▰</span>;
    if (icon === 'voilier') return <span className="text-[14px] leading-none">⛵</span>;
    if (icon === 'caribou') return <span className="text-[14px] leading-none">♞</span>;
    if (icon === 'armoiries') return <span className="text-[12px] leading-none">♜</span>;
    if (icon === 'huard') return <span className="text-[14px] leading-none">◒</span>;
    if (icon === 'ours') return <span className="text-[15px] leading-none">◓</span>;
    return null;
  };

  const renderMoneyObject = (item: ObjetArgent) => {
    if (item.type === 'etiquette') {
      return <span className="block min-w-[78px] rounded-xl border-2 border-blue-700 bg-blue-50 px-3 py-1.5 text-sm text-blue-950">{item.texte}</span>;
    }

    if (item.type === 'piece') {
      const coin = getCoinStyle(item.texte);
      return (
        <span
          className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] font-extrabold shadow-inner ${coin.outer}`}
          style={{ width: coin.sizePx, height: coin.sizePx, minWidth: coin.sizePx, minHeight: coin.sizePx, borderRadius: '9999px' }}
        >
          <span className="absolute rounded-full border border-current/25" style={{ inset: 4 }} />
          <span className={`absolute rounded-full border ${coin.inner}`} style={{ inset: item.texte === '2 $' ? 14 : 11 }} />
          <span className="absolute left-1/2 top-0.5 -translate-x-1/2 text-[5px] font-bold tracking-[0.14em] opacity-60">CANADA</span>
          <span className="relative z-10 flex flex-col items-center gap-0.5">
            <span className="opacity-75">{renderCoinIcon(coin.icon)}</span>
            <span className="text-[10px] leading-none">{coin.label}</span>
          </span>
        </span>
      );
    }

    const theme = getBillTheme(item.texte);
    const value = item.texte.replace(' $', '');
    return (
      <span className={`relative block h-[56px] w-[132px] overflow-hidden rounded-lg border-2 ${theme.border} bg-gradient-to-r ${theme.bg} ${theme.text} shadow-sm`}>
        <span className="absolute left-1.5 top-0.5 text-[8px] font-bold tracking-wide opacity-75">Canada</span>
        <span className="absolute right-2 top-1.5 text-lg font-black opacity-85">{value}</span>
        <span className="absolute bottom-1.5 left-2 text-2xl font-black opacity-85">{value}</span>
        <span className="absolute left-10 top-2 h-9 w-7 rounded-full border-2 border-current/30 bg-white/25" />
        <span className="absolute left-[65px] top-0 h-full w-4 bg-white/40 shadow-[0_0_8px_rgba(255,255,255,.7)]" />
        <span className="absolute left-[69px] top-2 h-9 w-1.5 rounded-full bg-cyan-200/70" />
        <span className={`absolute right-9 top-4 h-7 w-7 rotate-45 rounded-md ${theme.accent}`} />
        <span className="absolute right-6 bottom-1.5 h-4 w-9 rounded-sm border border-current/25 bg-white/20" />
        <span className="absolute inset-x-0 bottom-0 h-1.5 bg-white/20" />
        <span className="absolute bottom-0.5 right-2 text-[8px] font-bold opacity-70">{item.texte}</span>
      </span>
    );
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
        className="relative min-h-[260px] overflow-hidden rounded-xl border-2 border-emerald-200 bg-white"
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
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            className={`absolute touch-none select-none ${item.type === 'piece' ? 'rounded-full' : 'rounded-lg'} ${selectedId === item.id ? 'ring-4 ring-primary/40' : ''}`}
            style={{ left: item.x, top: item.y }}
            onPointerDown={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setSelectedId(item.id);
              setDrag({ id: item.id, dx: event.clientX - rect.left, dy: event.clientY - rect.top });
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
          >
            {renderMoneyObject(item)}
          </button>
        ))}
      </div>
    </div>
  );
}
