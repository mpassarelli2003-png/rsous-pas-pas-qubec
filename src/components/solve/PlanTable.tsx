/**
 * PlanTable — Tableau de planification des étapes de calcul.
 * Affiché à l'étape 4B pour planifier, et en lecture seule à l'étape 5 comme rappel.
 */
import { useState } from 'react';
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/lib/ui';
import { Plus, X, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PlanRow {
  action: string;
  operation: string;
  why?: string;
}

interface PlanTableProps {
  rows: PlanRow[];
  onChange?: (rows: PlanRow[]) => void;
  readOnly?: boolean;
  onAddRow?: () => void;
  onDeleteRow?: (index: number) => void;
}

const OP_OPTIONS = [
  { value: '+',      label: '+ Addition' },
  { value: '−',      label: '− Soustraction' },
  { value: '×',      label: '× Multiplication' },
  { value: '÷',      label: '÷ Division' },
  { value: 'autre',  label: 'Autre' },
];

const ACTION_STARTERS = [
  'Je calcule',
  'Je trouve',
  'Je cherche',
  'J’ajoute',
  'J’enlève',
  'Je compare',
  'Je regroupe',
  'Je partage',
  'Je multiplie',
  'Je divise',
  'Je vérifie',
];

const actionPlaceholders = [
  'Ex. : Je calcule le total des adultes et des enfants.',
  'Ex. : J’ajoute les autres personnes au total.',
  'Ex. : Je trouve la réponse demandée.',
];

export function PlanTable({ rows, onChange, readOnly = false, onAddRow, onDeleteRow }: PlanTableProps) {
  const [showWritingHelp, setShowWritingHelp] = useState(false);

  const update = (index: number, field: keyof PlanRow, value: string) => {
    if (!onChange) return;
    const next = rows.map((r, i) => i === index ? { ...r, [field]: value } : r);
    onChange(next);
  };

  const addStarter = (index: number, starter: string) => {
    const current = rows[index]?.action || '';
    const nextValue = current.trim() ? `${current.trim()} ${starter.toLowerCase()} ` : `${starter} `;
    update(index, 'action', nextValue);
  };

  const canDelete = rows.length > 1;

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-2 text-sm text-blue-950 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold">Écris une phrase complète.</p>
            <p className="text-blue-900">Exemple : Je calcule le total des adultes et des enfants.</p>
          </div>
          <div className="relative shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowWritingHelp(prev => !prev)} className="gap-2 border-blue-200 bg-white text-blue-800 hover:bg-blue-100">
              <HelpCircle className="h-4 w-4" /> Pourquoi ?
            </Button>
            {showWritingHelp && (
              <div className="absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-blue-200 bg-white p-3 text-sm text-slate-700 shadow-lg">
                <p className="font-bold text-slate-900 mb-1">Pourquoi écrire avec des mots ?</p>
                <p className="leading-snug">Ici, on ne fait pas encore le calcul. On explique le plan. Les mots aident à dire ce qu’on va faire : calculer un total, enlever une quantité, comparer, regrouper ou partager.</p>
                <p className="mt-2 font-bold text-slate-900">Bon exemple</p>
                <p className="text-blue-800">Je calcule le total des adultes et des enfants.</p>
                <p className="mt-2 font-bold text-slate-900">À éviter</p>
                <p className="text-slate-600">245 + 138</p>
                <p className="mt-2 text-slate-600">Les chiffres seront utilisés à l’étape du calcul. Ici, on prépare la démarche.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border-2 border-primary/20 shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="px-4 py-3 text-left font-bold whitespace-nowrap w-20">Étape</th>
              <th className="px-4 py-3 text-left font-bold">Ce que je vais calculer</th>
              <th className="px-4 py-3 text-left font-bold whitespace-nowrap w-44">Opération prévue</th>
              {!readOnly && onDeleteRow && (
                <th className="px-2 py-3 w-10" />
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  'border-t border-primary/10 transition-colors',
                  i % 2 === 0 ? 'bg-white' : 'bg-primary/3'
                )}
              >
                <td className="px-4 py-3">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center">
                    {i + 1}
                  </div>
                </td>

                <td className="px-4 py-3">
                  {readOnly ? (
                    <p className={cn('text-sm', !row.action && 'text-muted-foreground italic')}>
                      {row.action || '—'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        value={row.action}
                        onChange={e => update(i, 'action', e.target.value)}
                        placeholder={actionPlaceholders[i] || 'Ex. : Je calcule ce dont j’ai besoin pour avancer.'}
                        className="border-primary/20 focus:border-primary text-sm h-9"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {ACTION_STARTERS.map(starter => (
                          <button
                            key={starter}
                            type="button"
                            onClick={() => addStarter(i, starter)}
                            className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800 hover:bg-blue-100"
                          >
                            {starter}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </td>

                <td className="px-4 py-3">
                  {readOnly ? (
                    <span className={cn(
                      'inline-flex items-center justify-center h-8 w-8 rounded-full text-lg font-bold border-2',
                      row.operation ? 'border-primary/30 bg-primary/10 text-primary' : 'border-muted text-muted-foreground'
                    )}>
                      {row.operation || '?'}
                    </span>
                  ) : (
                    <Select value={row.operation} onValueChange={val => update(i, 'operation', val)}>
                      <SelectTrigger className="h-9 border-primary/20 focus:border-primary">
                        <SelectValue placeholder="Choisir…" />
                      </SelectTrigger>
                      <SelectContent>
                        {OP_OPTIONS.map(op => (
                          <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </td>

                {!readOnly && onDeleteRow && (
                  <td className="px-2 py-3">
                    <button
                      onClick={() => onDeleteRow(i)}
                      disabled={!canDelete}
                      aria-label={`Supprimer l'étape ${i + 1}`}
                      className={cn(
                        'h-7 w-7 rounded-full flex items-center justify-center transition-colors text-sm font-bold',
                        canDelete
                          ? 'text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                          : 'text-muted-foreground/30 cursor-not-allowed'
                      )}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && onAddRow && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAddRow}
          className="gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary w-full mt-1"
        >
          <Plus className="h-4 w-4" /> Ajouter une étape
        </Button>
      )}
    </div>
  );
}

/** Crée un tableau vide avec n lignes */
export function emptyPlanRows(n: number): PlanRow[] {
  return Array.from({ length: n }, () => ({ action: '', operation: '' }));
}
