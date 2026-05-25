import { useState } from 'react';
import { Card, Button, Textarea } from '@/lib/ui';
import { ListTodo, Layout, Table as TableIcon, Coins, Clock, Square, CheckCircle2, Plus, Trash2, Highlighter, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DrawingPad } from './DrawingPad';
import { ConceptReminder } from './ConceptReminder';
import { CroquisArgent } from './CroquisArgent';

interface Step3KnowledgeProps { problem: any; onUpdate: (data: any) => void; savedData?: any; highlightedTokenIds?: string[]; }
type OrganizerId = 'list' | 'table' | 'schema' | 'money' | 'clock' | 'shape';
type Row = Record<string, string>;

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';
const labelClass = 'text-xs font-bold uppercase tracking-wide text-slate-500';

const ORGANIZERS = [
  { id: 'list' as OrganizerId, label: 'Liste', icon: <ListTodo className="h-4 w-4" />, helper: 'Données une par ligne' },
  { id: 'table' as OrganizerId, label: 'Tableau', icon: <TableIcon className="h-4 w-4" />, helper: 'Info / sens / besoin' },
  { id: 'schema' as OrganizerId, label: 'Croquis', icon: <Layout className="h-4 w-4" />, helper: 'Dessiner ou flèches' },
  { id: 'money' as OrganizerId, label: 'Argent', icon: <Coins className="h-4 w-4" />, helper: 'Prix et budget' },
  { id: 'clock' as OrganizerId, label: 'Temps', icon: <Clock className="h-4 w-4" />, helper: 'Heure et durée' },
  { id: 'shape' as OrganizerId, label: 'Géométrie', icon: <Square className="h-4 w-4" />, helper: 'Mesures et formule' },
];

const defaultListRows: Row[] = [{ value: '' }, { value: '' }, { value: '' }];
const defaultRows: Record<Exclude<OrganizerId, 'list' | 'schema'>, Row[]> = {
  table: [{ data: '', meaning: '', useful: '' }, { data: '', meaning: '', useful: '' }, { data: '', meaning: '', useful: '' }],
  money: [{ item: '', quantity: '', value: '', useful: '' }, { item: '', quantity: '', value: '', useful: '' }, { item: '', quantity: '', value: '', useful: '' }],
  clock: [{ start: '', change: '', result: '' }, { start: '', change: '', result: '' }, { start: '', change: '', result: '' }],
  shape: [{ shape: '', measures: '', formula: '', target: '' }, { shape: '', measures: '', formula: '', target: '' }, { shape: '', measures: '', formula: '', target: '' }],
};

const tokenizeText = (text: string) => text.split(/(\s+)/).filter(part => part.length > 0);
const cleanToken = (token: string) => token.trim().replace(/[−–—]/g, '-').replace(/^[^\p{L}\p{N}+\-°]+/gu, '').replace(/[^\p{L}\p{N}°]+$/gu, '').replace(/^[+\-](?!\d)/, '');
const getHighlightedContentTokens = (content: string, highlightedTokenIds: string[] = []) => {
  const highlightedSet = new Set(highlightedTokenIds.filter(id => id.startsWith('content-')));
  const seen = new Set<string>();
  return tokenizeText(content).map((token, index) => ({ token: cleanToken(token), id: `content-${index}` })).filter(({ token, id }) => token && highlightedSet.has(id)).filter(({ token }) => { const key = token.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; }).map(({ token }) => token);
};

const serializeListRows = (rows: Row[]) => rows.map(row => row.value?.trim()).filter(Boolean).map(value => `• ${value}`).join('\n');
const filledRows = (rows: Row[]) => rows.filter(row => Object.values(row).some(value => String(value).trim() !== ''));
const serializeRows = (type: OrganizerId, rows: Row[], workspace: Record<string, any> = {}) => {
  const filled = filledRows(rows);
  if (type === 'money') {
    const top = [workspace.moneyPurpose ? `L’argent sert à : ${workspace.moneyPurpose}` : '', workspace.moneyTarget ? `Je cherche : ${workspace.moneyTarget}` : ''].filter(Boolean).join('\n');
    const body = filled.map(row => `${row.item || '?'} | combien: ${row.quantity || '?'} | prix ou valeur: ${row.value || row.unitPrice || '?'} | utile: ${row.useful || row.total || '?'}`).join('\n');
    return [top, body].filter(Boolean).join('\n');
  }
  if (filled.length === 0) return '';
  if (type === 'table') return filled.map(row => `${row.data || '?'} | ${row.meaning || '?'} | ${row.useful || '?'}`).join('\n');
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

  const emitUpdate = (nextOrganizer: OrganizerId, nextImportant: string, nextWorkspace: Record<string, any>) => onUpdate({ important: nextImportant, organizer: nextOrganizer, workspace: nextWorkspace });
  const handleOrganizerChange = (id: OrganizerId) => { setOrganizer(id); emitUpdate(id, important, workspace); };
  const handleTextChange = (val: string) => { setImportant(val); emitUpdate(organizer, val, workspace); };
  const handleDrawingSave = (dataUrl: string, height: number, objects?: any[]) => { const nextWorkspace = { ...workspace, schemaDrawing: dataUrl, schemaDrawingHeight: height, schemaObjects: objects || workspace.schemaObjects || [] }; setWorkspace(nextWorkspace); emitUpdate(organizer, important, nextWorkspace); };

  const getListRows = (): Row[] => {
    if (workspace.list) return workspace.list;
    if (important && organizer === 'list') {
      const parsedRows = important.split('\n').map((line: string) => ({ value: line.replace(/^\s*•\s*/, '').trim() })).filter((row: Row) => row.value);
      return parsedRows.length > 0 ? parsedRows : defaultListRows;
    }
    return defaultListRows;
  };
  const getRows = (type: Exclude<OrganizerId, 'list' | 'schema'>): Row[] => workspace[type] || defaultRows[type];

  const handleMoneySketchChange = (objects: any[]) => {
    const nextWorkspace = { ...workspace, moneySketchObjects: objects };
    const serialized = serializeRows('money', getRows('money'), nextWorkspace);
    setWorkspace(nextWorkspace);
    setImportant(serialized);
    emitUpdate(organizer, serialized, nextWorkspace);
  };

  const updateListRow = (rowIndex: number, value: string) => {
    const rows = getListRows().map((row, index) => index === rowIndex ? { ...row, value } : row);
    const nextWorkspace = { ...workspace, list: rows };
    const serialized = serializeListRows(rows);
    setWorkspace(nextWorkspace); setImportant(serialized); setActiveListRowIndex(rowIndex); emitUpdate(organizer, serialized, nextWorkspace);
  };
  const addListRow = () => { const rows = [...getListRows(), { value: '' }]; const nextWorkspace = { ...workspace, list: rows }; setWorkspace(nextWorkspace); setActiveListRowIndex(rows.length - 1); emitUpdate(organizer, serializeListRows(rows), nextWorkspace); };
  const removeListRow = (rowIndex: number) => { const rows = getListRows().filter((_, index) => index !== rowIndex); const safeRows = rows.length > 0 ? rows : [{ value: '' }]; const nextWorkspace = { ...workspace, list: safeRows }; const serialized = serializeListRows(safeRows); setWorkspace(nextWorkspace); setImportant(serialized); setActiveListRowIndex(Math.min(rowIndex, safeRows.length - 1)); emitUpdate(organizer, serialized, nextWorkspace); };

  const updateRows = (type: Exclude<OrganizerId, 'list' | 'schema'>, rowIndex: number, key: string, value: string) => {
    const rows = getRows(type).map((row, index) => index === rowIndex ? { ...row, [key]: value } : row);
    const nextWorkspace = { ...workspace, [type]: rows };
    const serialized = serializeRows(type, rows, nextWorkspace);
    setWorkspace(nextWorkspace); setImportant(serialized); emitUpdate(organizer, serialized, nextWorkspace);
  };
  const updateMoneyContext = (key: 'moneyPurpose' | 'moneyTarget', value: string) => { const nextWorkspace = { ...workspace, [key]: value }; const serialized = serializeRows('money', getRows('money'), nextWorkspace); setWorkspace(nextWorkspace); setImportant(serialized); emitUpdate(organizer, serialized, nextWorkspace); };
  const addRow = (type: Exclude<OrganizerId, 'list' | 'schema'>) => { const emptyRow = Object.keys(defaultRows[type][0]).reduce((acc, key) => ({ ...acc, [key]: '' }), {} as Row); const rows = [...getRows(type), emptyRow]; const nextWorkspace = { ...workspace, [type]: rows }; setWorkspace(nextWorkspace); emitUpdate(organizer, serializeRows(type, rows, nextWorkspace), nextWorkspace); };
  const addHighlightedTokenToList = (token: string) => { const rows = getListRows(); const safeIndex = Math.min(activeListRowIndex, rows.length - 1); const nextRows = rows.map((row, index) => index !== safeIndex ? row : { value: row.value?.trim() ? `${row.value.trim()} ${token}` : token }); const nextWorkspace = { ...workspace, list: nextRows }; const serialized = serializeListRows(nextRows); setOrganizer('list'); setWorkspace(nextWorkspace); setImportant(serialized); setActiveListRowIndex(safeIndex); emitUpdate('list', serialized, nextWorkspace); };

  const renderTableRows = () => {
    const rows = getRows('table');
    return <div className="space-y-3"><div className="grid grid-cols-12 gap-2 px-1"><span className={`${labelClass} col-span-4`}>Info du problème</span><span className={`${labelClass} col-span-5`}>Ça veut dire…</span><span className={`${labelClass} col-span-3`}>J’en ai besoin ?</span></div>{rows.map((row, index) => <div key={index} className="grid grid-cols-12 gap-2"><input className={`${inputClass} col-span-4`} placeholder="Ex. 245 bouteilles" value={row.data || ''} onChange={e => updateRows('table', index, 'data', e.target.value)} /><input className={`${inputClass} col-span-5`} placeholder="Ex. bouteilles ramassées lundi" value={row.meaning || ''} onChange={e => updateRows('table', index, 'meaning', e.target.value)} /><input className={`${inputClass} col-span-3`} placeholder="oui / non" value={row.useful || ''} onChange={e => updateRows('table', index, 'useful', e.target.value)} /></div>)}<Button variant="outline" size="sm" onClick={() => addRow('table')}>+ Ajouter une ligne</Button></div>;
  };

  const renderMoneyRows = () => {
    const rows = getRows('money');
    return <div className="space-y-4"><div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3"><div className="grid gap-3 sm:grid-cols-2"><div><label className={labelClass}>L’argent sert à :</label><input className={`${inputClass} mt-1`} placeholder="Ex. acheter, vendre, économiser" value={workspace.moneyPurpose || ''} onChange={e => updateMoneyContext('moneyPurpose', e.target.value)} /></div><div><label className={labelClass}>Je cherche :</label><input className={`${inputClass} mt-1`} placeholder="Ex. coût total, monnaie, différence" value={workspace.moneyTarget || ''} onChange={e => updateMoneyContext('moneyTarget', e.target.value)} /></div></div></div><div className="grid grid-cols-12 gap-2 px-1"><span className={`${labelClass} col-span-3`}>Objet / situation</span><span className={`${labelClass} col-span-3`}>Combien ?</span><span className={`${labelClass} col-span-3`}>Prix ou valeur</span><span className={`${labelClass} col-span-3`}>Utile ?</span></div>{rows.map((row, index) => <div key={index} className="grid grid-cols-12 gap-2"><input className={`${inputClass} col-span-3`} placeholder="Billets, jus, montant donné" value={row.item || ''} onChange={e => updateRows('money', index, 'item', e.target.value)} /><input className={`${inputClass} col-span-3`} placeholder="4, 3, 60 $" value={row.quantity || ''} onChange={e => updateRows('money', index, 'quantity', e.target.value)} /><input className={`${inputClass} col-span-3`} placeholder="12 $, 2 $, 0,10 $" value={row.value || row.unitPrice || ''} onChange={e => updateRows('money', index, 'value', e.target.value)} /><input className={`${inputClass} col-span-3`} placeholder="oui / non" value={row.useful || row.total || ''} onChange={e => updateRows('money', index, 'useful', e.target.value)} /></div>)}<Button variant="outline" size="sm" onClick={() => addRow('money')}>+ Ajouter une ligne</Button><CroquisArgent objets={workspace.moneySketchObjects || []} onChange={handleMoneySketchChange} /></div>;
  };

  const renderClockRows = () => { const rows = getRows('clock'); return <div className="space-y-3"><div className="grid grid-cols-12 gap-2 px-1"><span className={`${labelClass} col-span-4`}>Départ / début</span><span className={`${labelClass} col-span-4`}>Durée / changement</span><span className={`${labelClass} col-span-4`}>Arrivée / résultat</span></div>{rows.map((row, index) => <div key={index} className="grid grid-cols-12 gap-2"><input className={`${inputClass} col-span-4`} placeholder="8 h 15 ou -6 °C" value={row.start || ''} onChange={e => updateRows('clock', index, 'start', e.target.value)} /><input className={`${inputClass} col-span-4`} placeholder="+45 min ou +9 °C" value={row.change || ''} onChange={e => updateRows('clock', index, 'change', e.target.value)} /><input className={`${inputClass} col-span-4`} placeholder="?" value={row.result || ''} onChange={e => updateRows('clock', index, 'result', e.target.value)} /></div>)}<Button variant="outline" size="sm" onClick={() => addRow('clock')}>+ Ajouter une ligne</Button></div>; };
  const renderShapeRows = () => { const rows = getRows('shape'); return <div className="space-y-3"><div className="grid grid-cols-12 gap-2 px-1"><span className={`${labelClass} col-span-3`}>Forme</span><span className={`${labelClass} col-span-3`}>Mesures</span><span className={`${labelClass} col-span-3`}>Formule</span><span className={`${labelClass} col-span-3`}>Je cherche</span></div>{rows.map((row, index) => <div key={index} className="grid grid-cols-12 gap-2"><input className={`${inputClass} col-span-3`} placeholder="Rectangle" value={row.shape || ''} onChange={e => updateRows('shape', index, 'shape', e.target.value)} /><input className={`${inputClass} col-span-3`} placeholder="12 m, 5 m" value={row.measures || ''} onChange={e => updateRows('shape', index, 'measures', e.target.value)} /><input className={`${inputClass} col-span-3`} placeholder="A = L × l" value={row.formula || ''} onChange={e => updateRows('shape', index, 'formula', e.target.value)} /><input className={`${inputClass} col-span-3`} placeholder="aire" value={row.target || ''} onChange={e => updateRows('shape', index, 'target', e.target.value)} /></div>)}<Button variant="outline" size="sm" onClick={() => addRow('shape')}>+ Ajouter une ligne</Button></div>; };

  const renderStructuredRows = () => {
    if (organizer === 'table') return renderTableRows();
    if (organizer === 'money') return renderMoneyRows();
    if (organizer === 'clock') return renderClockRows();
    if (organizer === 'shape') return renderShapeRows();
    return null;
  };

  const renderWorkspace = () => {
    if (organizer === 'list') {
      const rows = getListRows();
      return <div className="space-y-3"><div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-sm text-blue-900">Clique d’abord dans la ligne où tu veux écrire. Ensuite, clique sur les pastilles pour les ajouter sur cette même ligne.</div><div className="space-y-2">{rows.map((row, index) => <div key={index} className="flex items-center gap-2"><span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold', activeListRowIndex === index ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary')}>•</span><input className={cn(inputClass, activeListRowIndex === index && 'border-primary ring-2 ring-primary/20')} placeholder={`Donnée importante ${index + 1}`} value={row.value || ''} onFocus={() => setActiveListRowIndex(index)} onChange={e => updateListRow(index, e.target.value)} /><Button variant="ghost" size="icon" onClick={() => removeListRow(index)} className="shrink-0 text-slate-400 hover:text-red-600 hover:bg-red-50" aria-label="Supprimer cette donnée"><Trash2 className="h-4 w-4" /></Button></div>)}</div><Button variant="outline" size="sm" onClick={addListRow} className="gap-2"><Plus className="h-4 w-4" /> Ajouter une donnée</Button></div>;
    }
    if (organizer === 'schema') return <div className="space-y-4"><div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-sm text-blue-900">Fais un croquis rapide pour montrer les groupes, les parties ou ce qui change. Tu peux aussi écrire une courte explication sous le dessin.</div><DrawingPad initialDataUrl={workspace.schemaDrawing} initialHeight={workspace.schemaDrawingHeight} initialObjects={workspace.schemaObjects || []} onSave={handleDrawingSave} /><Textarea placeholder={'Mon croquis veut dire...\nEx. : 245 bouteilles → +138 bouteilles → +27 bouteilles → total ?\nEx. : 120 pommes partagées en 4 paniers'} className="min-h-[120px] resize-none border-2 border-primary/20 focus:border-primary bg-white text-sm" value={important} onChange={e => handleTextChange(e.target.value)} /></div>;
    return renderStructuredRows();
  };

  const organizerInfo = ORGANIZERS.find(org => org.id === organizer);

  return <div className="space-y-6"><div className="space-y-2 text-center"><h3 className="text-2xl font-bold text-primary">Ce que je sais</h3><p className="text-muted-foreground">Trie les informations utiles et inutiles du problème.</p></div><div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-5 items-start"><aside className="w-full lg:sticky lg:top-28 lg:self-start space-y-3 z-[1]"><div className="rounded-xl border border-blue-300 bg-blue-50 p-3 shadow-sm"><h4 className="text-[11px] font-bold uppercase tracking-widest text-blue-800 flex items-center gap-2 mb-2"><EyeOff className="h-4 w-4 shrink-0" />Aide-mémoire</h4><div className="space-y-3 text-sm text-blue-950 leading-snug"><div><p className="font-bold text-blue-950">Info utile</p><p>Aide à répondre à la question : nombre, mesure, prix, durée, quantité ou condition.</p></div><div><p className="font-bold text-blue-950">Info inutile</p><p>Donne du contexte, mais n’est pas nécessaire pour faire le calcul.</p></div><div className="rounded-lg border border-blue-200 bg-white/70 px-3 py-2 text-blue-900 font-medium">Est-ce que j’en ai besoin pour trouver la réponse ?</div></div></div><div className="rounded-xl border border-yellow-300 bg-yellow-50 p-3 shadow-sm"><h4 className="text-[11px] font-bold uppercase tracking-widest text-yellow-800 flex items-center gap-2 mb-2"><Highlighter className="h-4 w-4 shrink-0" />Infos surlignées</h4>{highlightedContentTokens.length > 0 ? <div className="flex flex-wrap gap-1.5">{highlightedContentTokens.map((token, index) => <button key={`${token}-${index}`} type="button" onClick={() => addHighlightedTokenToList(token)} className="rounded-md bg-yellow-200 px-2 py-1 text-sm font-semibold text-yellow-950 hover:bg-yellow-300 transition-colors" title="Ajouter à la ligne active">{token}</button>)}</div> : <p className="text-sm text-yellow-900 leading-snug">Les mots et nombres surlignés dans l’énoncé apparaîtront ici.</p>}<p className="mt-2 text-xs text-yellow-800 italic">Clique sur une pastille pour l’ajouter à la ligne active.</p></div></aside><div className="min-w-0 space-y-4"><div className="space-y-4"><h4 className="font-bold flex items-center gap-2"><Layout className="h-5 w-5 text-primary" />Choisis comment organiser tes informations</h4><p className="text-sm text-muted-foreground">Clique sur un outil. L’espace de travail change selon ton choix.</p><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">{ORGANIZERS.map(org => <Button key={org.id} variant={organizer === org.id ? 'primary' : 'outline'} className={cn('h-20 flex flex-col gap-1 transition-all text-center px-2 overflow-hidden', organizer === org.id ? 'scale-[1.03] shadow-md' : 'hover:border-primary/50')} onClick={() => handleOrganizerChange(org.id)}>{org.icon}<span className="text-xs font-bold leading-tight">{org.label}</span><span className="text-[10px] leading-tight opacity-80 whitespace-normal">{org.helper}</span></Button>)}</div></div><Card className="p-6 border-2 border-primary/20 bg-primary/5 min-w-0"><div className="flex items-start justify-between gap-4 mb-4"><div><h4 className="font-bold text-primary flex items-center gap-2"><CheckCircle2 className="h-5 w-5" />Outil : {organizerInfo?.label}</h4><p className="text-sm text-muted-foreground mt-1">Remplis les cases utiles. Tu n’es pas obligé de tout remplir.</p></div><span className="text-xs font-bold px-2 py-1 rounded-full bg-white border border-primary/20 text-primary whitespace-nowrap">{organizerInfo?.label}</span></div><div className="mb-4"><ConceptReminder context={organizer} /></div>{renderWorkspace()}</Card></div></div></div>;
}
