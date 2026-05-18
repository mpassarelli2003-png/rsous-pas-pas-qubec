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
  highlightedTokenIds?: string[];
  strikethroughTokenIds?: string[];
  markMode?: 'highlight' | 'strike';
  showMarkTools?: boolean;
  onMarkModeChange?: (mode: 'highlight' | 'strike') => void;
  onToggleHighlight?: (tokenId: string) => void;
  onToggleStrikethrough?: (tokenId: string) => void;
}

function tokenizeText(text: string) {
  return text.split(/(\s+)/).filter(part => part.length > 0);
}

function isHighlightableToken(token: string) {
  return /[\p{L}\p{N}]/u.test(token);
}

export function ProblemBanner({
  problem,
  highlightedTokenIds = [],
  strikethroughTokenIds = [],
  markMode = 'highlight',
  showMarkTools = false,
  onMarkModeChange,
  onToggleHighlight,
  onToggleStrikethrough,
}: ProblemBannerProps) {
  const [isReading, setIsReading] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [collapsed, setCollapsed] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const highlightedSet = new Set(highlightedTokenIds);
  const strikethroughSet = new Set(strikethroughTokenIds);

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

  const renderHighlightableText = (text: string, section: 'content' | 'question') => {
    const tokens = tokenizeText(text);

    return tokens.map((token, index) => {
      if (/^\s+$/.test(token)) return token;

      const tokenId = `${section}-${index}`;
      const isHighlighted = highlightedSet.has(tokenId);
      const isStruck = strikethroughSet.has(tokenId);
      const canMark = isHighlightableToken(token) && (!!onToggleHighlight || !!onToggleStrikethrough);

      if (!canMark) return token;

      const handleMarkClick = () => {
        if (markMode === 'strike' && onToggleStrikethrough) {
          onToggleStrikethrough(tokenId);
          return;
        }
        onToggleHighlight?.(tokenId);
      };

      return (
        <button
          key={tokenId}
          type="button"
          onClick={handleMarkClick}
          className={cn(
            'inline rounded px-0.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1',
            markMode === 'strike' ? 'hover:bg-slate-100 focus:ring-slate-400' : 'hover:bg-yellow-100 focus:ring-yellow-400',
            isHighlighted && 'bg-yellow-200 hover:bg-yellow-300 shadow-[inset_0_-0.35em_0_rgba(250,204,21,0.45)]',
            isStruck && 'bg-slate-100 text-slate-500 line-through decoration-2 decoration-slate-500 hover:bg-slate-200 shadow-none'
          )}
          aria-pressed={isHighlighted || isStruck}
          title={isStruck ? 'Retirer la rature' : isHighlighted ? 'Retirer le surlignage' : markMode === 'strike' ? 'Rayer ce mot' : 'Surligner ce mot'}
        >
          {token}
        </button>
      );
    });
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
          {(onToggleHighlight || onToggleStrikethrough) && (
            <div className="flex flex-wrap items-center gap-2">
              {showMarkTools ? (
                <div className="inline-flex items-center gap-1 rounded-lg border border-yellow-200 bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-900">
                  <span className="mr-1">Outil :</span>
                  <button
                    type="button"
                    onClick={() => onMarkModeChange?.('highlight')}
                    className={cn(
                      'rounded-md px-2 py-1 transition-colors',
                      markMode === 'highlight' ? 'bg-yellow-200 text-yellow-950 shadow-sm' : 'hover:bg-yellow-100'
                    )}
                    aria-pressed={markMode === 'highlight'}
                  >
                    Surligner utile
                  </button>
                  <button
                    type="button"
                    onClick={() => onMarkModeChange?.('strike')}
                    className={cn(
                      'rounded-md px-2 py-1 transition-colors',
                      markMode === 'strike' ? 'bg-slate-200 text-slate-800 shadow-sm' : 'hover:bg-yellow-100'
                    )}
                    aria-pressed={markMode === 'strike'}
                  >
                    Rayer inutile
                  </button>
                </div>
              ) : (
                <p className="inline-flex rounded-lg bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-900 border border-yellow-200">
                  Clique sur les nombres, les mots importants ou la question pour les surligner.
                </p>
              )}
              {showMarkTools && (
                <p className={cn(
                  'inline-flex rounded-lg px-3 py-1 text-xs font-medium border',
                  markMode === 'strike'
                    ? 'bg-slate-50 text-slate-700 border-slate-200'
                    : 'bg-yellow-50 text-yellow-900 border-yellow-200'
                )}>
                  {markMode === 'strike'
                    ? 'Clique pour rayer les informations inutiles.'
                    : 'Clique pour surligner ou désurligner les informations utiles.'}
                </p>
              )}
            </div>
          )}
          <p className="text-foreground leading-relaxed">{renderHighlightableText(problem.content, 'content')}</p>
          <div className="flex items-start gap-2 pt-2 border-t border-primary/10">
            <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">?</span>
            <p className="font-bold text-primary leading-snug">{renderHighlightableText(problem.question, 'question')}</p>
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
