import { useState } from 'react';
import { Brain, Eye, HelpCircle, RotateCcw, Target, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type SupportTone = 'blue' | 'violet' | 'yellow' | 'green' | 'slate';

interface SupportItem {
  id: string;
  label: string;
  icon: 'attention' | 'challenge' | 'recall' | 'target' | 'help';
  tone: SupportTone;
  title: string;
  text: string;
}

interface CognitiveSupportBarProps {
  items: SupportItem[];
  className?: string;
}

const toneClasses: Record<SupportTone, { button: string; panel: string; title: string }> = {
  blue: {
    button: 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100',
    panel: 'border-blue-200 bg-blue-50 text-blue-950',
    title: 'text-blue-900',
  },
  violet: {
    button: 'border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100',
    panel: 'border-violet-200 bg-violet-50 text-violet-950',
    title: 'text-violet-900',
  },
  yellow: {
    button: 'border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100',
    panel: 'border-yellow-200 bg-yellow-50 text-yellow-950',
    title: 'text-yellow-900',
  },
  green: {
    button: 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100',
    panel: 'border-green-200 bg-green-50 text-green-950',
    title: 'text-green-900',
  },
  slate: {
    button: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
    panel: 'border-slate-200 bg-slate-50 text-slate-900',
    title: 'text-slate-900',
  },
};

function SupportIcon({ icon }: { icon: SupportItem['icon'] }) {
  if (icon === 'attention') return <Eye className="h-5 w-5" />;
  if (icon === 'challenge') return <Brain className="h-5 w-5" />;
  if (icon === 'recall') return <RotateCcw className="h-5 w-5" />;
  if (icon === 'target') return <Target className="h-5 w-5" />;
  return <HelpCircle className="h-5 w-5" />;
}

export function CognitiveSupportBar({ items, className }: CognitiveSupportBarProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const activeItem = items.find(item => item.id === openId);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap justify-center gap-2" aria-label="Aides rapides">
        {items.map(item => {
          const isOpen = openId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              title={item.label}
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className={cn(
                'h-11 w-11 rounded-full border-2 flex items-center justify-center shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30',
                toneClasses[item.tone].button,
                isOpen && 'scale-105 ring-2 ring-primary/20'
              )}
            >
              <SupportIcon icon={item.icon} />
            </button>
          );
        })}
      </div>

      {activeItem && (
        <div className={cn('mx-auto max-w-2xl rounded-xl border p-3 text-sm shadow-sm animate-fade-in', toneClasses[activeItem.tone].panel)}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0"><SupportIcon icon={activeItem.icon} /></span>
              <div>
                <p className={cn('font-bold leading-tight', toneClasses[activeItem.tone].title)}>{activeItem.title}</p>
                <p className="mt-1 leading-snug">{activeItem.text}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Fermer l’aide"
              onClick={() => setOpenId(null)}
              className="rounded-full p-1 text-current opacity-70 hover:bg-white/70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
