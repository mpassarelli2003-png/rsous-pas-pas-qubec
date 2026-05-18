import { useState } from 'react';
import { Card, Button, Textarea } from '@/lib/ui';
import { ListTodo, Layout, Table as TableIcon, Coins, Clock, Square, CheckCircle2, Plus, Trash2, Highlighter, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step3KnowledgeProps {
  problem: any;
  onUpdate: (data: any) => void;
  savedData?: any;
  highlightedTokenIds?: string[];
}

type OrganizerId = 'list' | 'table' | 'schema' | 'money' | 'clock' | 'shape';
type Row = Record<string, string>;

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';
const labelClass = 'text-xs font-bold uppercase tracking-wide text-slate-500';

const ORGANIZERS: { id: OrganizerId; label: string; icon: JSX.Element; helper: string }[] = [
  { id: 'list', label: 'Liste', icon: <ListTodo className="h-4 w-4" />, helper: 'Données une par ligne' },
  { id: 'table', label: 'Tableau', icon: <TableIcon className="h-4 w-4" />, helper: 'Donnée / sens / utile' },
  { id: 'schema', label: 'Schéma', icon: <Layout className="h-4 w-4" />, helper: 'Groupes ou flèches' },
  { id: 'money', label: 'Argent', icon: <Coins className="h-4 w-4" />, helper: 'Prix et budget' },
  { id: 'clock', label: 'Temps', icon: <Clock className="h-4 w-4" />, helper: 'Heure et durée' },
  { id: 'shape', label: 'Géométrie', icon: <Square className="h-4 w-4" />, helper: 'Mesures et formule' },
];

const defaultListRows: Row[] = [{ value: '' }, { value: '' }, { value: '' }];

const defaultRows: Record<Exclude<OrganizerId, 'list' | 'schema'>, Row[]> = {
  table: [
    { data: '', meaning: '', useful: '' },
    { data: '', meaning: '', useful: '' },
    { data: '', meaning: '', useful: '' },
  ],
  money: [
    { item: '', quantity: '', unitPrice: '', total: '' },
    { item: '', quantity: '', unitPrice: '', total: '' },
    { item: '', quantity: '', unitPrice: '', total: '' },
  ],
  clock: [
    { start: '', change: '', result: '' },
    { start: '', change: '', result: '' },
    { start: '', change: '', result: '' },
  ],
  shape: [
    { shape: '', measures: '', formula: '', target: '' },
    { shape: '', measures: '', formula: '', target: '' },
    { shape: '', measures: '', formula: '', target: '' },
  ],
};

const tokenizeText = (text: string) => text.split(/(\s+)/).filter(part => part.length > 0);
const cleanToken = (token: string) => token.trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

const getHighlightedContentTokens = (content: string, highlightedTokenIds: string[] = []) => {
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
};

const serializeListRows = (rows: Row[]) => {
  return rows
    .map(row => row.value?.trim())
    .filter(Boolean)
    .map(value => `• ${value}`)
    .join('\n');
};

const serializeRows = (type: OrganizerId, rows: Row[]) => {
  const filled = rows.filter(row => Object.values(row).some(value => value.trim() !== ''));
  if (filled.length === 0) return '';

  if (type === 'table') return filled.map(row => `${row.data || '?'} | ${row.meaning || '?'} | ${row.useful || '?'}`).join('\n');
  if (type === 'money') return filled.map(row => `${row.item || '?'} | quantité: ${row.quantity || '?'} | prix: ${row.unitPrice || '?'} | total: ${row.total || '?'}`).join('\n');
  if (type === 'clock') return filled.map(row => `${row.start || '?'} | ${row.change || '?'} | ${row.result || '?'}`).join('\n');
  if (type === 'shape') return filled.map(row => `${row.shape || '?'} | ${row.measures || '?'} | ${row.formula || '?'} | ${row.target || '?'}`).join('\n');
  return '';
};

export function Step3Knowledge({ problem, onUpdate, savedData, highlightedTokenIds = [] }: Step3KnowledgeProps) {
  const [organizer, setOrganizer] = useState<OrganizerId>(savedData?.organizer || 'list');
  const [important, setImportant] = useState(savedData?.important || '');
  const [workspace, setWorkspace] = useState<Record<string, any>>(savedData?.workspace || {});
  const [activeListRowIndex, setActiveListRowIndex] = useState(0);
  const highlightedContentTokens = getHighlightedContentTokens(problem?.content || '', highlightedTokenIds);

  const emitUpdate = (nextOrganizer: OrganizerId, nextImportant: string, nextWorkspace: Record<string, any>) => {
    onUpdate({ important: nextImportant, organizer: nextOrganizer, workspace: nextWorkspace });
  };

  const handleTextChange = (val: string) => {
    setImportant(val);
    emitUpdate(organizer, val, workspace);
  };

  const handleOrganizerChange = (id: OrganizerId) => {
    setOrganizer(id);
    emitUpdate(id, important, workspace);
  };

  const getListRows = (): Row[] => {
    if (workspace.list) return workspace.list;
    if (important && organizer === 'list') {
      const parsedRows = important
        .split('\n')
        .map((line: string) => ({ value: line.replace(/^\s*•\s*/, '').trim() }))
        .filter((row: Row) => row.value);
      return parsedRows.length > 0 ? parsedRows : defaultListRows;
    }
    return defaultListRows;
  };

  const updateListRow = (rowIndex: number, value: string) => {
    const rows = getListRows().map((row, index) => index === rowIndex ? { ...row, value } : row);
    const nextWorkspace = { ...workspace, list: rows };
    const serialized = serializeListRows(rows);
    setWorkspace(nextWorkspace);
    setImportant(serialized);
    setActiveListRowIndex(rowIndex);
    emitUpdate(organizer, serialized, nextWorkspace);
  };

  const addListRow = () => {
    const rows = [...getListRows(), { value: '' }];
    const nextWorkspace = { ...workspace, list: rows };
    setWorkspace(nextWorkspace);
    setActiveListRowIndex(rows.length - 1);
    emitUpdate(organizer, serializeListRows(rows), nextWorkspace);
  };

  const removeListRow = (rowIndex: number) => {
    const rows = getListRows().filter((_, index) => index !== rowIndex);
    const safeRows = rows.length > 0 ? rows : [{ value: '' }];
    const nextWorkspace = { ...workspace, list: safeRows };
    const serialized = serializeListRows(safeRows);
    setWorkspace(nextWorkspace);
    setImportant(serialized);
    setActiveListRowIndex(Math.min(rowIndex, safeRows.length - 1));
    emitUpdate(organizer, serialized, nextWorkspace);
  };

  const getRows = (type: Exclude<OrganizerId, 'list' | 'schema'>): Row[] => workspace[type] || defaultRows[type];

  const updateRows = (type: Exclude<OrganizerId, 'list' | 'schema'>, rowIndex: number, key: string, value: string) => {
    const rows = getRows(type).map((row, index) => index === rowIndex ? { ...row, [key]: value } : row);
    const nextWorkspace = { ...workspace, [type]: rows };
    const serialized = serializeRows(type, rows);
    setWorkspace(nextWorkspace);
    setImportant(serialized);
    emitUpdate(organizer, serialized, nextWorkspace);
  };

  const addRow = (type: Exclude<OrganizerId, 'list' | 'schema'>) => {
    const emptyRow = Object.keys(defaultRows[type][0]).reduce((acc, key) => ({ ...acc, [key]: '' }), {} as Row);
    const rows = [...getRows(type), emptyRow];
    const nextWorkspace = { ...workspace, [type]: rows };
    setWorkspace(nextWorkspace);
    emitUpdate(organizer, serializeRows(type, rows), nextWorkspace);
  };

  const addHighlightedTokenToList = (token: string) => {
    const rows = getListRows();
    const safeIndex = Math.min(activeListRowIndex, rows.length - 1);
    const nextRows = rows.map((row, index) => {
      if (index !== safeIndex) return row;
      const current = row.value?.trim() || '';
      return { value: current ? `${current} ${token}` : token };
    });
    const nextWorkspace = { ...workspace, list: nextRows };
    const serialized = serializeListRows(nextRows);
    setOrganizer('list');
    setWorkspace(nextWorkspace);
    setImportant(serialized);
    setActiveListRowIndex(safeIndex);
    emitUpdate('list', serialized, nextWorkspace);
  };

  const renderStructuredRows = () => {
    if (organizer === 'table') {
      const rows = getRows('table');
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 px-1">
            <span className={`${labelClass} col-span-4`}>Donnée</span>
            <span className={`${labelClass} col-span-5`}>Ce que ça veut dire</span>
            <span className={`${labelClass} col-span-3`}>Utile ?</span>
          </div>
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-12 gap-2">
              <input className={`${inputClass} col-span-4`} placeholder="Ex. 8 boîtes" value={row.data} onChange={e => updateRows('table', index, 'data', e.target.value)} />
              <input className={`${inputClass} col-span-5`} placeholder="Ex. nombre de boîtes" value={row.meaning} onChange={e => updateRows('table', index, 'meaning', e.target.value)} />
              <input className={`${inputClass} col-span-3`} placeholder="oui / non" value={row.useful} onChange={e => updateRows('table', index, 'useful', e.target.value)} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addRow('table')}>+ Ajouter une ligne</Button>
        </div>
      );
    }

    if (organizer === 'money') {
      const rows = getRows('money');
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 px-1">
            <span className={`${labelClass} col-span-3`}>Article</span>
            <span className={`${labelClass} col-span-3`}>Quantité</span>
            <span className={`${labelClass} col-span-3`}>Prix unitaire</span>
            <span className={`${labelClass} col-span-3`}>Total</span>
          </div>
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-12 gap-2">
              <input className={`${inputClass} col-span-3`} placeholder="Billets" value={row.item} onChange={e => updateRows('money', index, 'item', e.target.value)} />
              <input className={`${inputClass} col-span-3`} placeholder="15" value={row.quantity} onChange={e => updateRows('money', index, 'quantity', e.target.value)} />
              <input className={`${inputClass} col-span-3`} placeholder="2,50 $" value={row.unitPrice} onChange={e => updateRows('money', index, 'unitPrice', e.target.value)} />
              <input className={`${inputClass} col-span-3`} placeholder="?" value={row.total} onChange={e => updateRows('money', index, 'total', e.target.value)} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addRow('money')}>+ Ajouter une ligne</Button>
        </div>
      );
    }

    if (organizer === 'clock') {
      const rows = getRows('clock');
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 px-1">
            <span className={`${labelClass} col-span-4`}>Départ / début</span>
            <span className={`${labelClass} col-span-4`}>Durée / changement</span>
            <span className={`${labelClass} col-span-4`}>Arrivée / résultat</span>
          </div>
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-12 gap-2">
              <input className={`${inputClass} col-span-4`} placeholder="8 h 15 ou -6 °C" value={row.start} onChange={e => updateRows('clock', index, 'start', e.target.value)} />
              <input className={`${inputClass} col-span-4`} placeholder="+45 min ou +9 °C" value={row.change} onChange={e => updateRows('clock', index, 'change', e.target.value)} />
              <input className={`${inputClass} col-span-4`} placeholder="?" value={row.result} onChange={e => updateRows('clock', index, 'result', e.target.value)} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addRow('clock')}>+ Ajouter une ligne</Button>
        </div>
      );
    }

    if (organizer === 'shape') {
      const rows = getRows('shape');
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 px-1">
            <span className={`${labelClass} col-span-3`}>Forme</span>
            <span className={`${labelClass} col-span-3`}>Mesures</span>
            <span className={`${labelClass} col-span-3`}>Formule</span>
            <span className={`${labelClass} col-span-3`}>Je cherche</span>
          </div>
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-12 gap-2">
              <input className={`${inputClass} col-span-3`} placeholder="Rectangle" value={row.shape} onChange={e => updateRows('shape', index, 'shape', e.target.value)} />
              <input className={`${inputClass} col-span-3`} placeholder="12 m, 5 m" value={row.measures} onChange={e => updateRows('shape', index, 'measures', e.target.value)} />
              <input className={`${inputClass} col-span-3`} placeholder="A = L × l" value={row.formula} onChange={e => updateRows('shape', index, 'formula', e.target.value)} />
              <input className={`${inputClass} col-span-3`} placeholder="aire" value={row.target} onChange={e => updateRows('shape', index, 'target', e.target.value)} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addRow('shape')}>+ Ajouter une ligne</Button>
        </div>
      );
    }

    return null;
  };

  const renderWorkspace = () => {
    if (organizer === 'list') {
      const rows = getListRows();
      return (
        <div className="space-y-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-sm text-blue-900">
            Clique d’abord dans la ligne où tu veux écrire. Ensuite, clique sur les pastilles pour les ajouter sur cette même ligne.
          </div>
          <div className="space-y-2">
            {rows.map((row, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold', activeListRowIndex === index ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary')}>•</span>
                <input className={cn(inputClass, activeListRowIndex === index && 'border-primary ring-2 ring-primary/20')} placeholder={`Donnée importante ${index + 1}`} value={row.value} onFocus={() => setActiveListRowIndex(index)} onChange={e => updateListRow(index, e.target.value)} />
                <Button variant="ghost" size="icon" onClick={() => removeListRow(index)} className="shrink-0 text-slate-400 hover:text-red-600 hover:bg-red-50" aria-label="Supprimer cette donnée">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addListRow} className="gap-2">
            <Plus className="h-4 w-4" /> Ajouter une donnée
          </Button>
        </div>
      );
    }

    if (organizer === 'schema') {
      return (
        <Textarea
          placeholder={'Ex. :\n8 boîtes → 24 crayons dans chaque boîte\nTotal de crayons → enlever 36 crayons\nReste → partager en 6 équipes'}
          className="min-h-[190px] resize-none border-2 border-primary/20 focus:border-primary bg-white font-mono text-sm"
          value={important}
          onChange={(e) => handleTextChange(e.target.value)}
        />
      );
    }

    return renderStructuredRows();
  };

  const organizerInfo = ORGANIZERS.find(org => org.id === organizer);

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h3 className="text-2xl font-bold text-primary">Ce que je sais</h3>
        <p className="text-muted-foreground">Trie les informations utiles et inutiles du problème.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-5 items-start">
        <aside className="w-full lg:sticky lg:top-28 lg:self-start space-y-3 z-[1]">
          <div className="rounded-xl border border-blue-300 bg-blue-50 p-3 shadow-sm">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-blue-800 flex items-center gap-2 mb-2">
              <EyeOff className="h-4 w-4 shrink-0" />
              Aide-mémoire
            </h4>
            <div className="space-y-3 text-sm text-blue-950 leading-snug">
              <div>
                <p className="font-bold text-blue-950">Info utile</p>
                <p>Aide à répondre à la question : nombre, mesure, prix, durée, quantité ou condition.</p>
              </div>
              <div>
                <p className="font-bold text-blue-950">Info inutile</p>
                <p>Donne du contexte, mais n’est pas nécessaire pour faire le calcul.</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-white/70 px-3 py-2 text-blue-900 font-medium">
                Est-ce que j’en ai besoin pour trouver la réponse ?
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-3 shadow-sm">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-yellow-800 flex items-center gap-2 mb-2">
              <Highlighter className="h-4 w-4 shrink-0" />
              Infos surlignées
            </h4>
            {highlightedContentTokens.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {highlightedContentTokens.map((token, index) => (
                  <button key={`${token}-${index}`} type="button" onClick={() => addHighlightedTokenToList(token)} className="rounded-md bg-yellow-200 px-2 py-1 text-sm font-semibold text-yellow-950 hover:bg-yellow-300 transition-colors" title="Ajouter à la ligne active">
                    {token}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-yellow-900 leading-snug">Les mots et nombres surlignés dans l’énoncé apparaîtront ici.</p>
            )}
            <p className="mt-2 text-xs text-yellow-800 italic">Clique sur une pastille pour l’ajouter à la ligne active.</p>
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="space-y-4">
            <h4 className="font-bold flex items-center gap-2">
              <Layout className="h-5 w-5 text-primary" />
              Choisis comment organiser tes informations
            </h4>
            <p className="text-sm text-muted-foreground">Clique sur un outil. L’espace de travail change selon ton choix.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {ORGANIZERS.map((org) => (
                <Button key={org.id} variant={organizer === org.id ? 'primary' : 'outline'} className={cn('h-20 flex flex-col gap-1 transition-all text-center px-2 overflow-hidden', organizer === org.id ? 'scale-[1.03] shadow-md' : 'hover:border-primary/50')} onClick={() => handleOrganizerChange(org.id)}>
                  {org.icon}
                  <span className="text-xs font-bold leading-tight">{org.label}</span>
                  <span className="text-[10px] leading-tight opacity-80 whitespace-normal">{org.helper}</span>
                </Button>
              ))}
            </div>
          </div>

          <Card className="p-6 border-2 border-primary/20 bg-primary/5 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h4 className="font-bold text-primary flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Outil : {organizerInfo?.label}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">Remplis les cases utiles. Tu n’es pas obligé de tout remplir.</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-white border border-primary/20 text-primary whitespace-nowrap">{organizerInfo?.label}</span>
            </div>

            {renderWorkspace()}
          </Card>
        </div>
      </div>
    </div>
  );
}
