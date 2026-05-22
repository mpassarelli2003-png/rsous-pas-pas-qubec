import { useEffect, useRef, useState } from 'react';
import { Button } from '@/lib/ui';

type Tool = 'move' | 'pen' | 'eraser' | 'arrow' | 'box' | 'groups' | 'numberLine' | 'share';
type Point = { x: number; y: number };
type ShapeObject =
  | { id: string; type: 'arrow'; x1: number; y1: number; x2: number; y2: number }
  | { id: string; type: 'box'; x1: number; y1: number; x2: number; y2: number }
  | { id: string; type: 'groups'; x: number; y: number; count: number }
  | { id: string; type: 'numberLine'; x1: number; y1: number; x2: number; y2: number; ticks: number }
  | { id: string; type: 'share'; x: number; y: number; count: number };

interface DrawingPadProps {
  initialDataUrl?: string;
  initialHeight?: number;
  initialObjects?: ShapeObject[];
  onSave?: (dataUrl: string, height: number, objects?: ShapeObject[]) => void;
}

const INITIAL_CANVAS_HEIGHT = 260;
const EXPAND_STEP = 180;
const EXPAND_MARGIN = 70;
const GROUP_OPTIONS = [2, 3, 4, 5, 10];
const SHARE_OPTIONS = [2, 3, 4, 5, 10];
const NUMBER_LINE_OPTIONS = [5, 10];

const TOOL_LABELS: Record<Tool, string> = {
  move: 'Déplacer',
  pen: 'Stylet',
  eraser: 'Gomme',
  arrow: 'Flèche',
  box: 'Boîte',
  groups: 'Groupes',
  numberLine: 'Droite numérique',
  share: 'Partage',
};

const makeId = () => `shape-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function DrawingPad({ initialDataUrl = '', initialHeight = INITIAL_CANVAS_HEIGHT, initialObjects = [], onSave }: DrawingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<Point | null>(null);
  const startPoint = useRef<Point | null>(null);
  const selectedId = useRef<string | null>(null);
  const dragLastPoint = useRef<Point | null>(null);
  const canvasHeightRef = useRef(Math.max(initialHeight, INITIAL_CANVAS_HEIGHT));
  const initialDataLoadedRef = useRef(false);
  const objectsRef = useRef<ShapeObject[]>(initialObjects || []);
  const [canvasHeight, setCanvasHeight] = useState(Math.max(initialHeight, INITIAL_CANVAS_HEIGHT));
  const [tool, setTool] = useState<Tool>('move');
  const [groupCount, setGroupCount] = useState(5);
  const [shareCount, setShareCount] = useState(4);
  const [numberLineTicks, setNumberLineTicks] = useState(5);

  const saveCanvas = (height = canvasHeightRef.current) => {
    const canvas = canvasRef.current;
    if (!canvas || !onSave) return;
    onSave(canvas.toDataURL('image/png'), height, objectsRef.current);
  };

  const setupCanvas = (preserve = true, nextHeight = canvasHeightRef.current) => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const width = Math.max(Math.floor(rect.width), 320);
    const height = Math.max(nextHeight, INITIAL_CANVAS_HEIGHT);
    const dpr = window.devicePixelRatio || 1;
    let snapshot: HTMLCanvasElement | null = null;

    if (preserve && canvas.width > 0 && canvas.height > 0) {
      snapshot = document.createElement('canvas');
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      snapshot.getContext('2d')?.drawImage(canvas, 0, 0);
    }

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
      ctx.drawImage(snapshot, 0, 0);
    } else if (initialDataUrl && !initialDataLoadedRef.current) {
      const img = new Image();
      img.onload = () => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(img, 0, 0, Math.min(img.width, canvas.width), Math.min(img.height, canvas.height));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        initialDataLoadedRef.current = true;
      };
      img.src = initialDataUrl;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  useEffect(() => {
    setupCanvas(false, Math.max(initialHeight, INITIAL_CANVAS_HEIGHT));
    objectsRef.current = initialObjects || [];

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
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const setStroke = (ctx: CanvasRenderingContext2D, lineWidth = 3, selected = false) => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#0f172a';
    ctx.fillStyle = '#0f172a';
    ctx.lineWidth = selected ? lineWidth + 1.5 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, from: Point, to: Point, selected = false) => {
    setStroke(ctx, 3, selected);
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

  const drawBox = (ctx: CanvasRenderingContext2D, from: Point, to: Point, selected = false) => {
    setStroke(ctx, 3, selected);
    const x = Math.min(from.x, to.x);
    const y = Math.min(from.y, to.y);
    const width = Math.max(Math.abs(to.x - from.x), 44);
    const height = Math.max(Math.abs(to.y - from.y), 32);
    ctx.strokeRect(x, y, width, height);
  };

  const drawGroups = (ctx: CanvasRenderingContext2D, center: Point, count: number, selected = false) => {
    setStroke(ctx, 3, selected);
    const radius = 16;
    const gapX = 48;
    const gapY = 42;
    const columns = Math.min(count, 5);
    const rows = Math.ceil(count / columns);
    const totalW = (columns - 1) * gapX;
    const totalH = (rows - 1) * gapY;
    const startX = center.x - totalW / 2;
    const startY = center.y - totalH / 2;
    for (let i = 0; i < count; i += 1) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      ctx.beginPath();
      ctx.arc(startX + col * gapX, startY + row * gapY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const drawNumberLine = (ctx: CanvasRenderingContext2D, from: Point, to: Point, ticks: number, selected = false) => {
    setStroke(ctx, 3, selected);
    const startX = Math.min(from.x, to.x);
    const endX = Math.max(from.x, to.x);
    const y = from.y;
    const width = Math.max(endX - startX, 160);
    const left = startX;
    const right = left + width;
    drawArrow(ctx, { x: left, y }, { x: right, y }, selected);
    for (let i = 0; i <= ticks; i += 1) {
      const x = left + (width / ticks) * i;
      ctx.beginPath();
      ctx.moveTo(x, y - 8);
      ctx.lineTo(x, y + 8);
      ctx.stroke();
    }
  };

  const drawShare = (ctx: CanvasRenderingContext2D, center: Point, count: number, selected = false) => {
    setStroke(ctx, 3, selected);
    const boxW = 54;
    const boxH = 42;
    const gap = 14;
    const columns = Math.min(count, 5);
    const rows = Math.ceil(count / columns);
    const totalW = columns * boxW + (columns - 1) * gap;
    const totalH = rows * boxH + (rows - 1) * gap;
    const startX = center.x - totalW / 2;
    const startY = center.y - totalH / 2;
    for (let i = 0; i < count; i += 1) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      ctx.strokeRect(startX + col * (boxW + gap), startY + row * (boxH + gap), boxW, boxH);
    }
  };

  const drawShape = (ctx: CanvasRenderingContext2D, shape: ShapeObject, selected = false) => {
    if (shape.type === 'arrow') drawArrow(ctx, { x: shape.x1, y: shape.y1 }, { x: shape.x2, y: shape.y2 }, selected);
    if (shape.type === 'box') drawBox(ctx, { x: shape.x1, y: shape.y1 }, { x: shape.x2, y: shape.y2 }, selected);
    if (shape.type === 'groups') drawGroups(ctx, { x: shape.x, y: shape.y }, shape.count, selected);
    if (shape.type === 'numberLine') drawNumberLine(ctx, { x: shape.x1, y: shape.y1 }, { x: shape.x2, y: shape.y2 }, shape.ticks, selected);
    if (shape.type === 'share') drawShare(ctx, { x: shape.x, y: shape.y }, shape.count, selected);
  };

  const redrawObjects = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    setupCanvas(true, canvasHeightRef.current);
    objectsRef.current.forEach(shape => drawShape(ctx, shape, selectedId.current === shape.id));
  };

  const expandIfNeeded = (point: Point, extraSpace = 0) => {
    const neededHeight = point.y + EXPAND_MARGIN + extraSpace;
    if (neededHeight <= canvasHeightRef.current) return;
    const nextHeight = canvasHeightRef.current + Math.ceil((neededHeight - canvasHeightRef.current) / EXPAND_STEP) * EXPAND_STEP;
    setupCanvas(true, nextHeight);
    redrawObjects();
  };

  const shapeExtraSpace = () => {
    if (tool === 'groups') return groupCount > 5 ? 95 : 55;
    if (tool === 'share') return shareCount > 5 ? 110 : 60;
    return 40;
  };

  const makeShape = (from: Point, to: Point): ShapeObject | null => {
    if (tool === 'arrow') return { id: makeId(), type: 'arrow', x1: from.x, y1: from.y, x2: to.x, y2: to.y };
    if (tool === 'box') return { id: makeId(), type: 'box', x1: from.x, y1: from.y, x2: to.x, y2: to.y };
    if (tool === 'groups') return { id: makeId(), type: 'groups', x: to.x, y: to.y, count: groupCount };
    if (tool === 'numberLine') return { id: makeId(), type: 'numberLine', x1: from.x, y1: from.y, x2: to.x, y2: to.y, ticks: numberLineTicks };
    if (tool === 'share') return { id: makeId(), type: 'share', x: to.x, y: to.y, count: shareCount };
    return null;
  };

  const getBounds = (shape: ShapeObject) => {
    if (shape.type === 'arrow' || shape.type === 'box' || shape.type === 'numberLine') {
      const pad = 24;
      return { left: Math.min(shape.x1, shape.x2) - pad, right: Math.max(shape.x1, shape.x2) + pad, top: Math.min(shape.y1, shape.y2) - pad, bottom: Math.max(shape.y1, shape.y2) + pad };
    }
    if (shape.type === 'groups') {
      const columns = Math.min(shape.count, 5);
      const rows = Math.ceil(shape.count / columns);
      return { left: shape.x - ((columns - 1) * 48) / 2 - 24, right: shape.x + ((columns - 1) * 48) / 2 + 24, top: shape.y - ((rows - 1) * 42) / 2 - 24, bottom: shape.y + ((rows - 1) * 42) / 2 + 24 };
    }
    const columns = Math.min(shape.count, 5);
    const rows = Math.ceil(shape.count / columns);
    const totalW = columns * 54 + (columns - 1) * 14;
    const totalH = rows * 42 + (rows - 1) * 14;
    return { left: shape.x - totalW / 2 - 8, right: shape.x + totalW / 2 + 8, top: shape.y - totalH / 2 - 8, bottom: shape.y + totalH / 2 + 8 };
  };

  const hitTest = (point: Point) => {
    for (let i = objectsRef.current.length - 1; i >= 0; i -= 1) {
      const shape = objectsRef.current[i];
      const b = getBounds(shape);
      if (point.x >= b.left && point.x <= b.right && point.y >= b.top && point.y <= b.bottom) return shape.id;
    }
    return null;
  };

  const moveShape = (id: string, dx: number, dy: number) => {
    objectsRef.current = objectsRef.current.map(shape => {
      if (shape.id !== id) return shape;
      if (shape.type === 'groups' || shape.type === 'share') return { ...shape, x: shape.x + dx, y: shape.y + dy };
      return { ...shape, x1: shape.x1 + dx, y1: shape.y1 + dy, x2: shape.x2 + dx, y2: shape.y2 + dy };
    });
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

    if (tool === 'move') {
      selectedId.current = hitTest(point);
      dragLastPoint.current = point;
      redrawObjects();
      return;
    }

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
    if (!isDrawing.current) return;
    const point = getPoint(event);
    expandIfNeeded(point);

    if (tool === 'move' && selectedId.current && dragLastPoint.current) {
      moveShape(selectedId.current, point.x - dragLastPoint.current.x, point.y - dragLastPoint.current.y);
      dragLastPoint.current = point;
      redrawObjects();
      return;
    }

    if (tool !== 'pen' && tool !== 'eraser') return;
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
    if (ctx && from && tool !== 'pen' && tool !== 'eraser' && tool !== 'move') {
      const shape = makeShape(from, to);
      if (shape) {
        objectsRef.current = [...objectsRef.current, shape];
        selectedId.current = shape.id;
        drawShape(ctx, shape, true);
      }
    }

    isDrawing.current = false;
    lastPoint.current = null;
    startPoint.current = null;
    dragLastPoint.current = null;
    saveCanvas();
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* déjà relâché */ }
  };

  const clear = () => {
    initialDataLoadedRef.current = true;
    selectedId.current = null;
    objectsRef.current = [];
    canvasHeightRef.current = INITIAL_CANVAS_HEIGHT;
    setCanvasHeight(INITIAL_CANVAS_HEIGHT);
    setupCanvas(false, INITIAL_CANVAS_HEIGHT);
    onSave?.('', INITIAL_CANVAS_HEIGHT, []);
  };

  const renderOptions = () => {
    if (tool === 'groups') return <OptionRow label="Groupes" values={GROUP_OPTIONS} value={groupCount} onChange={setGroupCount} />;
    if (tool === 'share') return <OptionRow label="Partager en" values={SHARE_OPTIONS} value={shareCount} onChange={setShareCount} />;
    if (tool === 'numberLine') return <OptionRow label="Repères" values={NUMBER_LINE_OPTIONS} value={numberLineTicks} onChange={setNumberLineTicks} />;
    if (tool === 'move') return <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-2 text-sm font-medium text-blue-900">Clique sur une forme guidée, puis glisse-la pour la déplacer. Les traits faits au stylet ne se déplacent pas.</div>;
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {(['move', 'pen', 'eraser', 'arrow', 'box', 'groups', 'numberLine', 'share'] as Tool[]).map(item => (
            <Button key={item} type="button" variant={tool === item ? 'primary' : 'outline'} size="sm" onClick={() => setTool(item)}>
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
          onPointerLeave={(event) => { if (isDrawing.current) stop(event); }}
        />
      </div>
      <p className="text-xs text-slate-600">
        Utilise Déplacer pour bouger les formes guidées. Les traits faits au stylet restent comme un dessin libre.
      </p>
    </div>
  );
}

function OptionRow({ label, values, value, onChange }: { label: string; values: number[]; value: number; onChange: (value: number) => void }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-2 text-sm">
      <span className="mr-2 font-semibold text-blue-900">{label} :</span>
      <div className="mt-2 flex flex-wrap gap-2 sm:inline-flex sm:mt-0">
        {values.map(item => (
          <button key={item} type="button" onClick={() => onChange(item)} className={`rounded-md border px-3 py-1 font-bold ${value === item ? 'border-primary bg-primary text-white' : 'border-blue-200 bg-white text-blue-900'}`}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
