/**
 * PlanTable — Tableau de planification des étapes de calcul.
 * Affiché à l'étape 4B pour planifier, et en lecture seule à l'étape 5 comme rappel.
 */
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/lib/ui';
import { Plus, X } from 'lucide-react';
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

export function PlanTable({ rows, onChange, readOnly = false, onAddRow, onDeleteRow }: PlanTableProps) {
  const update = (index: number, field: keyof PlanRow, value: string) => {
    if (!onChange) return;
    const next = rows.map((r, i) => i === index ? { ...r, [field]: value } : r);
    onChange(next);
  };

  const canDelete = rows.length > 1;

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border-2 border-primary/20 shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="px-4 py-3 text-left font-bold whitespace-nowrap w-20">Étape</th>
              <th className="px-4 py-3 text-left font-bold">Ce que je dois faire</th>
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
                    <Input
                      value={row.action}
                      onChange={e => update(i, 'action', e.target.value)}
                      placeholder={`Ex: Calculer les billets de ${i === 0 ? '2,50 $' : i === 1 ? '5,00 $' : 'chaque sorte'}`}
                      className="border-primary/20 focus:border-primary text-sm h-9"
                    />
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
