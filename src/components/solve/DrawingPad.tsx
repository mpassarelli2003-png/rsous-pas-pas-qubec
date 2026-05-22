import { useEffect, useRef, useState } from 'react';
import { Button } from '@/lib/ui';

type Tool = 'pen' | 'eraser' | 'arrow' | 'box' | 'groups' | 'numberLine' | 'share';
type Point = { x: number; y: number };

type CanvasSnapshot = {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
};

interface DrawingPadProps {
  initialDataUrl?: string;
  initialHeight?: number;
  onSave?: (dataUrl: string, height: number) => void;
}

const INITIAL_CANVAS_HEIGHT = 260;
const EXPAND_STEP = 180;
const EXPAND_MARGIN = 52;
const GROUP_OPTIONS = [2, 3, 4, 5, 10];
const SHARE_OPTIONS = [2, 3, 4, 5, 10];
const NUMBER_LINE_OPTIONS = [5, 10];

const TOOL_LABELS: Record<Tool, string> = {
  pen: 'Stylet',
  eraser: 'Gomme',
  arrow: 'Flèche',
  box: 'Boîte',
  groups: 'Groupes',
  numberLine: 'Droite numérique',
  share: 'Partage',
};

export function DrawingPad({ initialDataUrl = '', initialHeight = INITIAL_CANVAS_HEIGHT, onSave }: DrawingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<Point | null>(null);
  const startPoint = useRef<Point | null>(null);
  const canvasHeightRef = useRef(Math.max(initialHeight, INITIAL_CANVAS_HEIGHT));
  const initialDataLoadedRef = useRef(false);
  const [canvasHeight, setCanvasHeight] = useState(Math.max(initialHeight, INITIAL_CANVAS_HEIGHT));
  const [tool, setTool] = useState<Tool>('pen');
  const [groupCount, setGroupCount] = useState(5);
  const [shareCount, setShareCount] = useState(4);
  const [numberLineTicks, setNumberLineTicks] = useState(5);

  const saveCanvas = (height = canvasHeightRef.current) => {
    const canvas = canvasRef.current;
    if (!canvas || !onSave) return;
    onSave(canvas.toDataURL('image/png'), height);
  };

  const captureCanvas = (): CanvasSnapshot | null => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return null;

    const snapshot = document.createElement('canvas');
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    const snapshotCtx = snapshot.getContext('2d');
    if (!snapshotCtx) return null;

    snapshotCtx.drawImage(canvas, 0, 0);
    return { canvas: snapshot, width: canvas.width, height: canvas.height };
  };

  const drawInitialData = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dpr: number) => {
    if (!initialDataUrl || initialDataLoadedRef.current) return;

    const img = new Image();
    img.onload = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(img, 0, 0, Math.min(img.width, canvas.width), Math.min(img.height, canvas.height));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initialDataLoadedRef.current = true;
    };
    img.src = initialDataUrl;
  };

  const setupCanvas = (preserve = true, nextHeight = canvasHeightRef.current) => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const width = Math.max(Math.floor(rect.width), 320);
    const height = Math.max(nextHeight, INITIAL_CANVAS_HEIGHT);
    const dpr = window.devicePixelRatio || 1;
    const snapshot = preserve ? captureCanvas() : null;

    canvasHeightRef.current = height;
    setCanvasHeight(height);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (snapshot) {
      ctx.drawImage(snapshot.canvas, 0, 0, snapshot.width, snapshot.height);
    } else {
      drawInitialData(ctx, canvas, dpr);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const expandIfNeeded = (point: Point, extraSpace = 0) => {
    const neededHeight = point.y + EXPAND_MARGIN + extraSpace;
    if (neededHeight <= canvasHeightRef.current) return;

    const nextHeight = canvasHeightRef.current + Math.ceil((neededHeight - canvasHeightRef.current) / EXPAND_STEP) * EXPAND_STEP;
    setupCanvas(true, nextHeight);
  };

  useEffect(() => {
    setupCanvas(false, Math.max(initialHeight, INITIAL_CANVAS_HEIGHT));

    const wrapper = wrapperRef.current;
    if (!wrapper || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      if (!isDrawing.current) setupCanvas(true, canvasHeightRef.current);
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
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
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
    const gapX = 48;
    const gapY = 42;
    const columns = Math.min(groupCount, 5);
    const rows = Math.ceil(groupCount / columns);
    const totalW = (columns - 1) * gapX;
    const totalH = (rows - 1) * gapY;
    const startX = center.x - totalW / 2;
    const startY = center.y - totalH / 2;

    for (let i = 0; i < groupCount; i += 1) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      ctx.beginPath();
      ctx.arc(startX + col * gapX, startY + row * gapY, radius, 0, Math.PI * 2);
      ctx.stroke();
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

    for (let i = 0; i <= numberLineTicks; i += 1) {
      const x = left + (width / numberLineTicks) * i;
      ctx.beginPath();
      ctx.moveTo(x, y - 8);
      ctx.lineTo(x, y + 8);
      ctx.stroke();
    }
  };

  const drawShare = (ctx: CanvasRenderingContext2D, center: Point) => {
    setStroke(ctx, 3);
    const boxW = 54;
    const boxH = 42;
    const gap = 14;
    const columns = Math.min(shareCount, 5);
    const rows = Math.ceil(shareCount / columns);
    const totalW = columns * boxW + (columns - 1) * gap;
    const totalH = rows * boxH + (rows - 1) * gap;
    const startX = center.x - totalW / 2;
    const startY = center.y - totalH / 2;

    for (let i = 0; i < shareCount; i += 1) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      ctx.strokeRect(startX + col * (boxW + gap), startY + row * (boxH + gap), boxW, boxH);
    }
  };

  const shapeExtraSpace = () => {
    if (tool === 'groups') return groupCount > 5 ? 95 : 55;
    if (tool === 'share') return shareCount > 5 ? 110 : 60;
    return 40;
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

    const canvas = event.currentTarget;
    const point = getPoint(event);
    expandIfNeeded(point, shapeExtraSpace());

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(event.pointerId);
    isDrawing.current = true;
    lastPoint.current = point;
    startPoint.current = point;

    if (tool === 'pen' || tool === 'eraser') {
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = tool === 'eraser' ? 20 : 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (!isDrawing.current || (tool !== 'pen' && tool !== 'eraser')) return;

    const point = getPoint(event);
    expandIfNeeded(point);

    const ctx = event.currentTarget.getContext('2d');
    if (!ctx) return;

    const previous = lastPoint.current || point;

    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = tool === 'eraser' ? 20 : 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(previous.x, previous.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    lastPoint.current = point;
  };

  const stop = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    const from = startPoint.current;
    const to = getPoint(event);
    expandIfNeeded(to, shapeExtraSpace());

    const ctx = event.currentTarget.getContext('2d');
    if (ctx && from && tool !== 'pen' && tool !== 'eraser') {
      drawShape(ctx, from, to);
    }

    isDrawing.current = false;
    lastPoint.current = null;
    startPoint.current = null;
    saveCanvas();

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Certains appareils relâchent déjà le pointeur.
    }
  };

  const clear = () => {
    initialDataLoadedRef.current = true;
    canvasHeightRef.current = INITIAL_CANVAS_HEIGHT;
    setCanvasHeight(INITIAL_CANVAS_HEIGHT);
    setupCanvas(false, INITIAL_CANVAS_HEIGHT);
    onSave?.('', INITIAL_CANVAS_HEIGHT);
  };

  const renderOptions = () => {
    if (tool === 'groups') {
      return (
        <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-2 text-sm">
          <span className="mr-2 font-semibold text-blue-900">Groupes :</span>
          <div className="mt-2 flex flex-wrap gap-2 sm:inline-flex sm:mt-0">
            {GROUP_OPTIONS.map(value => (
              <button key={value} type="button" onClick={() => setGroupCount(value)} className={`rounded-md border px-3 py-1 font-bold ${groupCount === value ? 'border-primary bg-primary text-white' : 'border-blue-200 bg-white text-blue-900'}`}>
                {value}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (tool === 'share') {
      return (
        <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-2 text-sm">
          <span className="mr-2 font-semibold text-blue-900">Partager en :</span>
          <div className="mt-2 flex flex-wrap gap-2 sm:inline-flex sm:mt-0">
            {SHARE_OPTIONS.map(value => (
              <button key={value} type="button" onClick={() => setShareCount(value)} className={`rounded-md border px-3 py-1 font-bold ${shareCount === value ? 'border-primary bg-primary text-white' : 'border-blue-200 bg-white text-blue-900'}`}>
                {value}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (tool === 'numberLine') {
      return (
        <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-2 text-sm">
          <span className="mr-2 font-semibold text-blue-900">Repères :</span>
          <div className="mt-2 flex flex-wrap gap-2 sm:inline-flex sm:mt-0">
            {NUMBER_LINE_OPTIONS.map(value => (
              <button key={value} type="button" onClick={() => setNumberLineTicks(value)} className={`rounded-md border px-3 py-1 font-bold ${numberLineTicks === value ? 'border-primary bg-primary text-white' : 'border-blue-200 bg-white text-blue-900'}`}>
                {value}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return null;
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
        {renderOptions()}
        <Button type="button" variant="outline" size="sm" onClick={clear}>Effacer le croquis</Button>
      </div>
      <div ref={wrapperRef} className="w-full rounded-xl border-2 border-primary/30 bg-white p-2 shadow-inner overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block cursor-crosshair rounded-lg bg-white touch-none select-none"
          style={{ touchAction: 'none', height: `${canvasHeight}px` }}
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
        Ton croquis est conservé quand tu changes d’onglet. L’espace s’agrandit vers le bas au besoin.
      </p>
    </div>
  );
}
