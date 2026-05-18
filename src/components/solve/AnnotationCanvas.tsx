/**
 * AnnotationCanvas — Zone de dessin tactile/souris avec stylet, surligneur et gomme.
 * Conçu pour tablette, Chromebook et écran tactile. Gros boutons, interface simple.
 */
import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/lib/ui';
import { Pen, Highlighter, Eraser, Undo2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tool = 'pen' | 'highlighter' | 'eraser';

interface AnnotationCanvasProps {
  height?: number;
  placeholder?: string;
}

interface Point { x: number; y: number; }
interface Stroke {
  tool: Tool;
  color: string;
  width: number;
  points: Point[];
}

const TOOL_CONFIG: Record<Tool, { color: string; width: number; opacity: number; label: string }> = {
  pen:         { color: '#1e3a8a', width: 3,  opacity: 1,    label: 'Stylet' },
  highlighter: { color: '#fde047', width: 20, opacity: 0.4,  label: 'Surligneur' },
  eraser:      { color: '#ffffff', width: 24, opacity: 1,    label: 'Gomme' },
};

export function AnnotationCanvas({ height = 260, placeholder = 'Zone de brouillon...' }: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>('pen');
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Redraw all strokes
  const redraw = useCallback((allStrokes: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of allStrokes) {
      if (stroke.points.length < 2) continue;
      ctx.save();
      ctx.globalAlpha = TOOL_CONFIG[stroke.tool].opacity;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, []);

  // Get canvas-relative position from mouse or touch event
  const getPos = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX: number, clientY: number;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPos(e);
    const cfg = TOOL_CONFIG[activeTool];
    const stroke: Stroke = {
      tool: activeTool,
      color: cfg.color,
      width: cfg.width,
      points: [pos],
    };
    setCurrentStroke(stroke);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !currentStroke) return;
    const pos = getPos(e);
    const updated = { ...currentStroke, points: [...currentStroke.points, pos] };
    setCurrentStroke(updated);

    // Draw just the latest segment live
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pts = updated.points;
    if (pts.length < 2) return;
    const cfg = TOOL_CONFIG[activeTool];
    ctx.save();
    ctx.globalAlpha = cfg.opacity;
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = cfg.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
    }
    ctx.beginPath();
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
    ctx.restore();
  };

  const endDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);
    const finalStrokes = [...strokes, currentStroke];
    setStrokes(finalStrokes);
    setCurrentStroke(null);
  };

  const undo = () => {
    const next = strokes.slice(0, -1);
    setStrokes(next);
    setIsEmpty(next.length === 0);
    redraw(next);
  };

  const clear = () => {
    setStrokes([]);
    setCurrentStroke(null);
    setIsEmpty(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Resize canvas with container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      // Save pixel-ratio for sharpness
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      redraw(strokes);
    });
    observer.observe(canvas.parentElement!);
    return () => observer.disconnect();
  }, [strokes, redraw]);

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'pen',         icon: <Pen className="h-5 w-5" />,         label: 'Stylet' },
    { id: 'highlighter', icon: <Highlighter className="h-5 w-5" />, label: 'Surligneur' },
    { id: 'eraser',      icon: <Eraser className="h-5 w-5" />,      label: 'Gomme' },
  ];

  return (
    <div className="rounded-2xl border-2 border-primary/20 overflow-hidden bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-primary/5 border-b border-primary/10 flex-wrap">
        {tools.map(t => (
          <Button
            key={t.id}
            variant={activeTool === t.id ? 'primary' : 'outline'}
            size="sm"
            className={cn(
              'h-10 gap-2 px-3 transition-all',
              activeTool === t.id && 'scale-105 shadow-md',
              t.id === 'highlighter' && activeTool !== 'highlighter' && 'text-yellow-600 border-yellow-300 hover:border-yellow-400',
            )}
            onClick={() => setActiveTool(t.id)}
          >
            {t.icon}
            <span className="text-xs font-semibold hidden sm:inline">{t.label}</span>
          </Button>
        ))}
        <div className="h-6 w-px bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-10 gap-2 px-3 text-muted-foreground hover:text-foreground"
          onClick={undo}
          disabled={strokes.length === 0}
          title="Annuler"
        >
          <Undo2 className="h-4 w-4" />
          <span className="text-xs hidden sm:inline">Annuler</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 gap-2 px-3 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={clear}
          disabled={isEmpty}
          title="Effacer tout"
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-xs hidden sm:inline">Effacer</span>
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {/* Color swatch for active tool */}
          <div
            className="h-6 w-6 rounded-full border-2 border-white shadow"
            style={{
              backgroundColor: TOOL_CONFIG[activeTool].color,
              opacity: activeTool === 'highlighter' ? 0.7 : 1,
            }}
          />
          <span className="text-xs text-muted-foreground font-medium hidden md:inline">
            {TOOL_CONFIG[activeTool].label} actif
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative" style={{ height }}>
        {isEmpty && (
          <p className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 text-sm pointer-events-none select-none italic">
            {placeholder}
          </p>
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          style={{ display: 'block' }}
        />
      </div>
    </div>
  );
}
