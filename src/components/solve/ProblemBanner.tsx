import { useState, useRef } from 'react';
import { Button } from '@blinkdotnew/ui';
import { Volume2, VolumeX, ZoomIn, ZoomOut, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProblemBannerProps {
  problem: {
    title: string;
    content: string;
    question: string;
  };
}

export function ProblemBanner({ problem }: ProblemBannerProps) {
  const [isReading, setIsReading] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [collapsed, setCollapsed] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const handleReadAloud = () => {
    if (!('speechSynthesis' in window)) return;

    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }

    const text = `${problem.content} ${problem.question}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-CA';
    utterance.rate = 0.9;
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);
    utteranceRef.current = utterance;
    setIsReading(true);
    window.speechSynthesis.speak(utterance);
  };

  const changeFontSize = (delta: number) => {
    setFontSize(prev => Math.min(Math.max(prev + delta, 13), 24));
  };

  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-white shadow-md overflow-hidden mb-6">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-2 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest opacity-80">Problème à résoudre</span>
          <span className="font-semibold text-sm truncate max-w-[200px] md:max-w-sm">{problem.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20"
            onClick={() => changeFontSize(-1)}
            title="Réduire le texte"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20"
            onClick={() => changeFontSize(2)}
            title="Agrandir le texte"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7 hover:bg-white/20 transition-colors',
              isReading ? 'text-yellow-300' : 'text-primary-foreground/80 hover:text-primary-foreground'
            )}
            onClick={handleReadAloud}
            title={isReading ? 'Arrêter la lecture' : 'Lire à voix haute'}
          >
            {isReading ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20"
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? 'Afficher l\'énoncé' : 'Réduire l\'énoncé'}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div
          className="px-5 py-4 space-y-3 bg-white"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.65 }}
        >
          <p className="text-foreground leading-relaxed">{problem.content}</p>
          <div className="flex items-start gap-2 pt-2 border-t border-primary/10">
            <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">?</span>
            <p className="font-bold text-primary leading-snug">{problem.question}</p>
          </div>
        </div>
      )}

      {/* Collapsed hint */}
      {collapsed && (
        <div className="px-5 py-2 bg-primary/5 border-t border-primary/10">
          <p className="text-xs text-primary/60 italic truncate">{problem.question}</p>
        </div>
      )}
    </div>
  );
}
