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
type Row = Record<string, string>;

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';
const labelClass = 'text-xs font-bold uppercase tracking-wide text-slate-500';

const ORGANIZERS: { id: OrganizerId; label: string; icon: JSX.Element; helper: string }[] = [
  { id: 'list', label: 'Liste', icon: <ListTodo className="h-4 w-4" />, helper: 'Données une sous l’autre' },
  { id: 'table', label: 'Tableau', icon: <TableIcon className="h-4 w-4" />, helper: 'Donnée / sens / utile' },
  { id: 'schema', label: 'Schéma', icon: <Layout className="h-4 w-4" />, helper: 'Groupes ou flèches' },
  { id: 'money', label: 'Argent', icon: <Coins className="h-4 w-4" />, helper: 'Prix et budget' },
  { id: 'clock', label: 'Temps', icon: <Clock className="h-4 w-4" />, helper: 'Heure et durée' },
  { id: 'shape', label: 'Géométrie', icon: <Square className="h-4 w-4" />, helper: 'Mesures et formule' },
];

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

const serializeRows = (type: OrganizerId, rows: Row[]) => {
  const filled = rows.filter(row => Object.values(row).some(value => value.trim() !== ''));
  if (filled.length === 0) return '';

  if (type === 'table') {
    return filled.map(row => `${row.data || '?'} | ${row.meaning || '?'} | ${row.useful || '?'}`).join('\n');
  }
  if (type === 'money') {
    return filled.map(row => `${row.item || '?'} | quantité: ${row.quantity || '?'} | prix: ${row.unitPrice || '?'} | total: ${row.total || '?'}`).join('\n');
  }
  if (type === 'clock') {
    return filled.map(row => `${row.start || '?'} | ${row.change || '?'} | ${row.result || '?'}`).join('\n');
  }
  if (type === 'shape') {
    return filled.map(row => `${row.shape || '?'} | ${row.measures || '?'} | ${row.formula || '?'} | ${row.target || '?'}`).join('\n');
  }
  return '';
};

export function Step3Knowledge({ problem, onUpdate, savedData }: Step3KnowledgeProps) {
  const [organizer, setOrganizer] = useState<OrganizerId>(savedData?.organizer || 'list');
  const [important, setImportant] = useState(savedData?.important || '');
  const [workspace, setWorkspace] = useState<Record<string, any>>(savedData?.workspace || {});
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);

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

  const getRows = (type: Exclude<OrganizerId, 'list' | 'schema'>): Row[] => {
    return workspace[type] || defaultRows[type];
  };

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
      return (
        <Textarea
          placeholder={'Ex. :\n8 boîtes\n24 crayons par boîte\n36 crayons gardés\n6 équipes'}
          className="min-h-[190px] resize-none border-2 border-primary/20 focus:border-primary bg-white text-sm"
          value={important}
          onChange={(e) => handleTextChange(e.target.value)}
        />
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
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h3 className="text-2xl font-bold text-primary">Ce que je sais</h3>
        <p className="text-muted-foreground">Trie les informations utiles et inutiles du problème.</p>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold flex items-center gap-2">
          <Layout className="h-5 w-5 text-primary" />
          Choisis comment organiser tes informations
        </h4>
        <p className="text-sm text-muted-foreground">
          Clique sur un outil. L’espace de travail change selon ton choix.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {ORGANIZERS.map((org) => (
            <Button
              key={org.id}
              variant={organizer === org.id ? 'primary' : 'outline'}
              className={cn(
                'h-20 flex flex-col gap-1 transition-all text-center px-2 overflow-hidden',
                organizer === org.id ? 'scale-[1.03] shadow-md' : 'hover:border-primary/50'
              )}
              onClick={() => handleOrganizerChange(org.id)}
            >
              {org.icon}
              <span className="text-xs font-bold leading-tight">{org.label}</span>
              <span className="text-[10px] leading-tight opacity-80 whitespace-normal">{org.helper}</span>
            </Button>
          ))}
        </div>
      </div>

      <Card className="p-6 border-2 border-primary/20 bg-primary/5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h4 className="font-bold text-primary flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Outil : {organizerInfo?.label}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              Remplis les cases utiles. Tu n’es pas obligé de tout remplir.
            </p>
          </div>
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-white border border-primary/20 text-primary whitespace-nowrap">
            {organizerInfo?.label}
          </span>
        </div>

        {renderWorkspace()}
      </Card>

      <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-sm italic">
        "Une donnée importante est une information qui t'aide à répondre à la question."
      </div>

      <div className="space-y-3">
        <Button
          variant="ghost"
          onClick={() => setShowHint(true)}
          className="gap-2 text-yellow-700 hover:text-yellow-800 hover:bg-yellow-50"
        >
          <HelpCircle className="h-4 w-4" />
          Besoin d'un indice ?
        </Button>

        {showHint && (
          <HintPanel
            currentStep={3}
            hintLevel={hintLevel}
            onNextLevel={() => setHintLevel(prev => Math.min(prev + 1, 3))}
            onClose={() => setShowHint(false)}
          />
        )}
      </div>
    </div>
  );
}
