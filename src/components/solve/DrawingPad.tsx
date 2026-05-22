import { useEffect, useRef, useState } from 'react';
import { Button } from '@/lib/ui';

type Tool = 'pen' | 'eraser' | 'arrow' | 'box' | 'groups' | 'numberLine' | 'share';
type Point = { x: number; y: number };

const CANVAS_HEIGHT = 260;

const TOOL_LABELS: Record<Tool, string> = {
  pen: 'Stylet',
  eraser: 'Gomme',
  arrow: 'Flèche',
  box: 'Boîte',
  groups: 'Groupes',
  numberLine: 'Droite numérique',
  share: 'Partage',
};

export function DrawingPad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<Point | null>(null);
  const startPoint = useRef<Point | null>(null);
  const [tool, setTool] = useState<Tool>('pen');

  const setupCanvas = (preserve = true) => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const width = Math.max(Math.floor(rect.width), 320);
    const height = CANVAS_HEIGHT;
    const dpr = window.devicePixelRatio || 1;
    const previousImage = preserve && canvas.width > 0 ? canvas.toDataURL('image/png') : '';

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (previousImage) {
      const img = new Image();
      img.onload = () => {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = previousImage;
    }
  };

  useEffect(() => {
    setupCanvas(false);

    const wrapper = wrapperRef.current;
    if (!wrapper || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      if (!isDrawing.current) setupCanvas(true);
    });

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const setStroke = (ctx: CanvasRenderingContext2D, lineWidth = 3) => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#0f172a';
    ctx.fillStyle = '#0f172a';
    ctx.lineWidth = lineWidth;
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, from: Point, to: Point) => {
    setStroke(ctx, 3);
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const headLength = 16;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLength * Math.cos(angle - Math.PI / 6), to.y - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLength * Math.cos(angle + Math.PI / 6), to.y - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const drawBox = (ctx: CanvasRenderingContext2D, from: Point, to: Point) => {
    setStroke(ctx, 3);
    const x = Math.min(from.x, to.x);
    const y = Math.min(from.y, to.y);
    const width = Math.max(Math.abs(to.x - from.x), 44);
    const height = Math.max(Math.abs(to.y - from.y), 32);
    ctx.strokeRect(x, y, width, height);
  };

  const drawGroups = (ctx: CanvasRenderingContext2D, center: Point) => {
    setStroke(ctx, 3);
    const radius = 16;
    const gap = 48;
    const startX = center.x - gap;
    const startY = center.y - 20;

    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        ctx.beginPath();
        ctx.arc(startX + col * gap, startY + row * 42, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  const drawNumberLine = (ctx: CanvasRenderingContext2D, from: Point, to: Point) => {
    setStroke(ctx, 3);
    const startX = Math.min(from.x, to.x);
    const endX = Math.max(from.x, to.x);
    const y = from.y;
    const width = Math.max(endX - startX, 160);
    const left = startX;
    const right = left + width;

    drawArrow(ctx, { x: left, y }, { x: right, y });

    for (let i = 0; i <= 5; i += 1) {
      const x = left + (width / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, y - 8);
      ctx.lineTo(x, y + 8);
      ctx.stroke();
    }
  };

  const drawShare = (ctx: CanvasRenderingContext2D, center: Point) => {
    setStroke(ctx, 3);
    const boxW = 58;
    const boxH = 42;
    const gap = 18;
    const totalW = boxW * 4 + gap * 3;
    const startX = center.x - totalW / 2;
    const y = center.y - boxH / 2;

    for (let i = 0; i < 4; i += 1) {
      ctx.strokeRect(startX + i * (boxW + gap), y, boxW, boxH);
    }
  };

  const drawShape = (ctx: CanvasRenderingContext2D, from: Point, to: Point) => {
    if (tool === 'arrow') drawArrow(ctx, from, to);
    if (tool === 'box') drawBox(ctx, from, to);
    if (tool === 'groups') drawGroups(ctx, to);
    if (tool === 'numberLine') drawNumberLine(ctx, from, to);
    if (tool === 'share') drawShare(ctx, to);
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    setupCanvas(true);

    const canvas = event.currentTarget;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(event.pointerId);
    const point = getPoint(event);
    isDrawing.current = true;
    lastPoint.current = point;
    startPoint.current = point;

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (!isDrawing.current || (tool !== 'pen' && tool !== 'eraser')) return;

    const ctx = event.currentTarget.getContext('2d');
    if (!ctx) return;

    const point = getPoint(event);
    const previous = lastPoint.current || point;

    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = tool === 'eraser' ? 20 : 3;

    ctx.beginPath();
    ctx.moveTo(previous.x, previous.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    lastPoint.current = point;
  };

  const stop = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    const ctx = event.currentTarget.getContext('2d');
    const from = startPoint.current;
    const to = getPoint(event);

    if (ctx && from && tool !== 'pen' && tool !== 'eraser') {
      drawShape(ctx, from, to);
    }

    isDrawing.current = false;
    lastPoint.current = null;
    startPoint.current = null;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Certains appareils relâchent déjà le pointeur.
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, CANVAS_HEIGHT);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {(['pen', 'eraser', 'arrow', 'box', 'groups', 'numberLine', 'share'] as Tool[]).map(item => (
            <Button
              key={item}
              type="button"
              variant={tool === item ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTool(item)}
            >
              {TOOL_LABELS[item]}
            </Button>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={clear}>Effacer le croquis</Button>
      </div>
      <div ref={wrapperRef} className="w-full rounded-xl border-2 border-primary/30 bg-white p-2 shadow-inner overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block cursor-crosshair rounded-lg bg-white touch-none select-none"
          style={{ touchAction: 'none' }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerCancel={stop}
          onPointerLeave={(event) => {
            if (isDrawing.current) stop(event);
          }}
        />
      </div>
      <p className="text-xs text-slate-600">
        Utilise Stylet pour dessiner librement. Les autres boutons ajoutent rapidement une flèche, une boîte, des groupes, une droite numérique ou un partage.
      </p>
    </div>
  );
}
