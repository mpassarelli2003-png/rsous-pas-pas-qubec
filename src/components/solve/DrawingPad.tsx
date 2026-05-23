import { useEffect, useRef, useState } from 'react';
import { Button } from '@/lib/ui';

type Tool = 'move' | 'pen' | 'eraser' | 'arrow' | 'box' | 'groups' | 'numberLine' | 'share';
type Point = { x: number; y: number };
type Bounds = { left: number; top: number; right: number; bottom: number };
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
const EXPAND_MARGIN = 80;
const GROUP_OPTIONS = [2, 3, 4, 5, 10];
const SHARE_OPTIONS = [2, 3, 4, 5, 10];
const NUMBER_LINE_OPTIONS = [5, 10];
const TOOLS: Tool[] = ['move', 'pen', 'eraser', 'arrow', 'box', 'groups', 'numberLine', 'share'];

const TOOL_LABELS: Record<Tool, string> = {
  move: 'Manipuler',
  pen: 'Stylet',
  eraser: 'Gomme',
  arrow: 'Flèche',
  box: 'Boîte',
  groups: 'Groupes',
  numberLine: 'Droite numérique',
  share: 'Partage',
};

const makeId = () => `shape-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const storageKey = () => `drawing-pad:${window.location.pathname}`;

const getBounds = (shape: ShapeObject, selected = false): Bounds => {
  const pad = selected ? 18 : 8;

  if (shape.type === 'arrow' || shape.type === 'box' || shape.type === 'numberLine') {
    return {
      left: Math.min(shape.x1, shape.x2) - pad,
      right: Math.max(shape.x1, shape.x2) + pad,
      top: Math.min(shape.y1, shape.y2) - pad,
      bottom: Math.max(shape.y1, shape.y2) + pad,
    };
  }

  if (shape.type === 'groups') {
    const columns = Math.min(shape.count, 5);
    const rows = Math.ceil(shape.count / columns);
    const totalW = (columns - 1) * 48 + 32;
    const totalH = (rows - 1) * 42 + 32;
    return {
      left: shape.x - totalW / 2 - pad,
      right: shape.x + totalW / 2 + pad,
      top: shape.y - totalH / 2 - pad,
      bottom: shape.y + totalH / 2 + pad,
    };
  }

  const columns = Math.min(shape.count, 5);
  const rows = Math.ceil(shape.count / columns);
  const totalW = columns * 54 + (columns - 1) * 14;
  const totalH = rows * 42 + (rows - 1) * 14;
  return {
    left: shape.x - totalW / 2 - pad,
    right: shape.x + totalW / 2 + pad,
    top: shape.y - totalH / 2 - pad,
    bottom: shape.y + totalH / 2 + pad,
  };
};

export function DrawingPad({ initialDataUrl = '', initialHeight = INITIAL_CANVAS_HEIGHT, initialObjects = [], onSave }: DrawingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const isDrawing = useRef(false);
  const startPoint = useRef<Point | null>(null);
  const lastPoint = useRef<Point | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const dragLastPoint = useRef<Point | null>(null);
  const objectsRef = useRef<ShapeObject[]>(initialObjects || []);
  const canvasHeightRef = useRef(Math.max(initialHeight || 0, INITIAL_CANVAS_HEIGHT));

  const [canvasHeight, setCanvasHeight] = useState(Math.max(initialHeight || 0, INITIAL_CANVAS_HEIGHT));
  const [tool, setTool] = useState<Tool>('move');
  const [groupCount, setGroupCount] = useState(5);
  const [shareCount, setShareCount] = useState(4);
  const [numberLineTicks, setNumberLineTicks] = useState(5);
  const [objects, setObjects] = useState<ShapeObject[]>(initialObjects || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectShape = (id: string | null) => {
    selectedIdRef.current = id;
    setSelectedId(id);
  };

  const setObjectsBoth = (next: ShapeObject[]) => {
    objectsRef.current = next;
    setObjects(next);
  };

  const setupCanvas = (height = canvasHeightRef.current, preserve = true) => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const width = Math.max(Math.floor(rect.width), 320);
    const nextHeight = Math.max(height, INITIAL_CANVAS_HEIGHT);
    const dpr = window.devicePixelRatio || 1;
    let snapshot: HTMLCanvasElement | null = null;

    if (preserve && canvas.width > 0 && canvas.height > 0) {
      snapshot = document.createElement('canvas');
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      snapshot.getContext('2d')?.drawImage(canvas, 0, 0);
    }

    canvasHeightRef.current = nextHeight;
    setCanvasHeight(nextHeight);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${nextHeight}px`;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(nextHeight * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (snapshot) ctx.drawImage(snapshot, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const loadCanvasImage = (src: string) => {
    if (!src) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const img = new Image();
    img.onload = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(img, 0, 0, Math.min(img.width, canvas.width), Math.min(img.height, canvas.height));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    img.src = src;
  };

  const persist = (nextObjects = objectsRef.current, height = canvasHeightRef.current) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    try {
      sessionStorage.setItem(storageKey(), JSON.stringify({ canvasDataUrl: dataUrl, height, objects: nextObjects }));
    } catch {
      // La sauvegarde principale reste active même si sessionStorage est indisponible.
    }
    onSave?.(dataUrl, height, nextObjects);
  };

  useEffect(() => {
    let savedCanvas = initialDataUrl;
    let savedHeight = Math.max(initialHeight || 0, INITIAL_CANVAS_HEIGHT);
    let savedObjects = initialObjects || [];

    try {
      const raw = sessionStorage.getItem(storageKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        savedCanvas = parsed.canvasDataUrl || savedCanvas;
        savedHeight = Math.max(parsed.height || savedHeight, INITIAL_CANVAS_HEIGHT);
        savedObjects = Array.isArray(parsed.objects) ? parsed.objects : savedObjects;
      }
    } catch {
      // On ignore une sauvegarde locale illisible.
    }

    canvasHeightRef.current = savedHeight;
    setObjectsBoth(savedObjects);
    setupCanvas(savedHeight, false);
    setTimeout(() => loadCanvasImage(savedCanvas), 0);

    const wrapper = wrapperRef.current;
    if (!wrapper || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (!isDrawing.current) setupCanvas(canvasHeightRef.current, true);
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  const getPointFromCanvas = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const getPointFromSvgEvent = (event: React.PointerEvent): Point => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const eraseCanvasAt = (point: Point) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 13, 0, Math.PI * 2);
    ctx.fill();
  };

  const eraseCanvasSegment = (from: Point, to: Point) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 26;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const eraseShapeAt = (point: Point) => {
    const target = [...objectsRef.current].reverse().find(shape => {
      const bounds = getBounds(shape, true);
      return point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom;
    });
    if (!target) return false;
    const next = objectsRef.current.filter(shape => shape.id !== target.id);
    if (selectedIdRef.current === target.id) selectShape(null);
    setObjectsBoth(next);
    persist(next);
    return true;
  };

  const expandIfNeeded = (point: Point, extra = 0) => {
    const needed = point.y + EXPAND_MARGIN + extra;
    if (needed <= canvasHeightRef.current) return;
    const nextHeight = canvasHeightRef.current + Math.ceil((needed - canvasHeightRef.current) / EXPAND_STEP) * EXPAND_STEP;
    setupCanvas(nextHeight, true);
  };

  const shapeExtra = () => {
    if (tool === 'groups') return groupCount > 5 ? 100 : 60;
    if (tool === 'share') return shareCount > 5 ? 120 : 70;
    return 50;
  };

  const startPen = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool !== 'pen' && tool !== 'eraser') return;
    event.preventDefault();
    const point = getPointFromCanvas(event);
    expandIfNeeded(point);
    const ctx = event.currentTarget.getContext('2d');
    if (!ctx) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawing.current = true;
    lastPoint.current = point;

    if (tool === 'eraser') {
      eraseCanvasAt(point);
      return;
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const movePen = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || (tool !== 'pen' && tool !== 'eraser')) return;
    event.preventDefault();
    const point = getPointFromCanvas(event);
    expandIfNeeded(point);
    const ctx = event.currentTarget.getContext('2d');
    if (!ctx) return;
    const previous = lastPoint.current || point;

    if (tool === 'eraser') {
      eraseCanvasSegment(previous, point);
      lastPoint.current = point;
      return;
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(previous.x, previous.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPoint.current = point;
  };

  const stopPen = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || (tool !== 'pen' && tool !== 'eraser')) return;
    event.preventDefault();
    isDrawing.current = false;
    lastPoint.current = null;
    persist();
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* déjà relâché */ }
  };

  const makeShape = (from: Point, to: Point): ShapeObject | null => {
    if (tool === 'arrow') return { id: makeId(), type: 'arrow', x1: from.x, y1: from.y, x2: to.x, y2: to.y };
    if (tool === 'box') return { id: makeId(), type: 'box', x1: from.x, y1: from.y, x2: to.x, y2: to.y };
    if (tool === 'groups') return { id: makeId(), type: 'groups', x: to.x, y: to.y, count: groupCount };
    if (tool === 'numberLine') return { id: makeId(), type: 'numberLine', x1: from.x, y1: from.y, x2: to.x, y2: to.y, ticks: numberLineTicks };
    if (tool === 'share') return { id: makeId(), type: 'share', x: to.x, y: to.y, count: shareCount };
    return null;
  };

  const startShape = (event: React.PointerEvent<SVGSVGElement>) => {
    if (tool === 'pen' || tool === 'move') return;
    event.preventDefault();
    const point = getPointFromSvgEvent(event);
    expandIfNeeded(point, shapeExtra());

    if (tool === 'eraser') {
      const removedShape = eraseShapeAt(point);
      if (!removedShape) {
        isDrawing.current = true;
        lastPoint.current = point;
        eraseCanvasAt(point);
      }
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawing.current = true;
    startPoint.current = point;
  };

  const stopShape = (event: React.PointerEvent<SVGSVGElement>) => {
    if (tool === 'eraser') {
      event.preventDefault();
      isDrawing.current = false;
      lastPoint.current = null;
      persist();
      return;
    }

    if (!isDrawing.current || tool === 'pen' || tool === 'move') return;
    event.preventDefault();
    const from = startPoint.current;
    const to = getPointFromSvgEvent(event);
    expandIfNeeded(to, shapeExtra());
    if (from) {
      const shape = makeShape(from, to);
      if (shape) {
        const next = [...objectsRef.current, shape];
        selectShape(shape.id);
        setObjectsBoth(next);
        setTool('move');
        persist(next);
      }
    }
    isDrawing.current = false;
    startPoint.current = null;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* déjà relâché */ }
  };

  const startMove = (event: React.PointerEvent<SVGGElement>, id: string) => {
    if (tool === 'eraser') {
      event.preventDefault();
      event.stopPropagation();
      const next = objectsRef.current.filter(shape => shape.id !== id);
      if (selectedIdRef.current === id) selectShape(null);
      setObjectsBoth(next);
      persist(next);
      return;
    }

    if (tool !== 'move') return;
    event.preventDefault();
    event.stopPropagation();
    selectShape(id);
    dragLastPoint.current = getPointFromSvgEvent(event);
    isDrawing.current = true;
    svgRef.current?.setPointerCapture(event.pointerId);
  };

  const moveShape = (event: React.PointerEvent<SVGSVGElement>) => {
    if (tool === 'eraser') {
      event.preventDefault();
      const point = getPointFromSvgEvent(event);
      if (isDrawing.current && lastPoint.current) eraseCanvasSegment(lastPoint.current, point);
      lastPoint.current = point;
      return;
    }

    if (tool !== 'move' || !isDrawing.current || !selectedIdRef.current || !dragLastPoint.current) return;
    event.preventDefault();
    const point = getPointFromSvgEvent(event);
    const dx = point.x - dragLastPoint.current.x;
    const dy = point.y - dragLastPoint.current.y;
    dragLastPoint.current = point;
    expandIfNeeded(point, 80);

    const next = objectsRef.current.map(shape => {
      if (shape.id !== selectedIdRef.current) return shape;
      if (shape.type === 'groups' || shape.type === 'share') return { ...shape, x: shape.x + dx, y: shape.y + dy };
      return { ...shape, x1: shape.x1 + dx, y1: shape.y1 + dy, x2: shape.x2 + dx, y2: shape.y2 + dy };
    });
    setObjectsBoth(next);
  };

  const stopMove = (event?: React.PointerEvent<SVGSVGElement>) => {
    if (tool !== 'move') return;
    isDrawing.current = false;
    dragLastPoint.current = null;
    persist(objectsRef.current);
    if (event) {
      try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* déjà relâché */ }
    }
  };

  const deselect = () => {
    selectShape(null);
    isDrawing.current = false;
    dragLastPoint.current = null;
    persist(objectsRef.current);
  };

  const deleteSelected = () => {
    if (!selectedIdRef.current) return;
    const next = objectsRef.current.filter(shape => shape.id !== selectedIdRef.current);
    selectShape(null);
    setObjectsBoth(next);
    persist(next);
  };

  const clear = () => {
    selectShape(null);
    setObjectsBoth([]);
    canvasHeightRef.current = INITIAL_CANVAS_HEIGHT;
    setupCanvas(INITIAL_CANVAS_HEIGHT, false);
    try { sessionStorage.removeItem(storageKey()); } catch { /* rien */ }
    onSave?.('', INITIAL_CANVAS_HEIGHT, []);
  };

  const renderOptions = () => {
    if (tool === 'groups') return <OptionRow label="Groupes" values={GROUP_OPTIONS} value={groupCount} onChange={setGroupCount} />;
    if (tool === 'share') return <OptionRow label="Partager en" values={SHARE_OPTIONS} value={shareCount} onChange={setShareCount} />;
    if (tool === 'numberLine') return <OptionRow label="Repères" values={NUMBER_LINE_OPTIONS} value={numberLineTicks} onChange={setNumberLineTicks} />;
    if (tool === 'move') return <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-2 text-sm font-medium text-blue-900">Clique une forme pour la sélectionner, puis glisse-la. Clique dans le vide pour enlever le contour bleu.</div>;
    if (tool === 'eraser') return <div className="rounded-lg border border-red-200 bg-red-50/70 p-2 text-sm font-medium text-red-900">Glisse sur les traits du stylet pour les effacer. Clique sur une forme guidée pour la supprimer.</div>;
    return null;
  };

  const svgPointerEvents = tool === 'pen' ? 'none' : 'auto';

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {TOOLS.map(item => (
            <Button key={item} type="button" variant={tool === item ? 'primary' : 'outline'} size="sm" onClick={() => setTool(item)}>
              {TOOL_LABELS[item]}
            </Button>
          ))}
        </div>
        {renderOptions()}
        {selectedId && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-white p-2 text-sm">
            <span className="font-semibold text-blue-900">Objet sélectionné</span>
            <Button type="button" variant="outline" size="sm" onClick={deselect}>Désélectionner</Button>
            <Button type="button" variant="outline" size="sm" onClick={deleteSelected}>Supprimer</Button>
          </div>
        )}
        <Button type="button" variant="outline" size="sm" onClick={clear}>Effacer le croquis</Button>
      </div>

      <div ref={wrapperRef} className="relative w-full rounded-xl border-2 border-primary/30 bg-white p-2 shadow-inner overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block w-full rounded-lg bg-white touch-none select-none"
          style={{ touchAction: 'none', height: `${canvasHeight}px`, cursor: tool === 'pen' || tool === 'eraser' ? 'crosshair' : 'default' }}
          onPointerDown={startPen}
          onPointerMove={movePen}
          onPointerUp={stopPen}
          onPointerCancel={stopPen}
        />
        <svg
          ref={svgRef}
          className="absolute left-2 top-2 w-[calc(100%-1rem)] touch-none select-none"
          style={{ height: `${canvasHeight}px`, pointerEvents: svgPointerEvents }}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget && tool === 'move') deselect();
            startShape(event);
          }}
          onPointerMove={moveShape}
          onPointerUp={(event) => { stopShape(event); stopMove(event); }}
          onPointerCancel={(event) => { isDrawing.current = false; dragLastPoint.current = null; stopMove(event); }}
        >
          {objects.map(shape => <ShapeView key={shape.id} shape={shape} selected={selectedId === shape.id} onPointerDown={(event) => startMove(event, shape.id)} />)}
        </svg>
      </div>
      <p className="text-xs text-slate-600">Manipuler : sélectionner, déplacer, désélectionner. Après l’ajout d’une forme, l’outil revient automatiquement à Manipuler.</p>
    </div>
  );
}

function HitBox({ bounds }: { bounds: Bounds }) {
  return <rect x={bounds.left} y={bounds.top} width={bounds.right - bounds.left} height={bounds.bottom - bounds.top} fill="transparent" pointerEvents="all" />;
}

function ShapeView({ shape, selected, onPointerDown }: { shape: ShapeObject; selected: boolean; onPointerDown: (event: React.PointerEvent<SVGGElement>) => void }) {
  const strokeWidth = selected ? 4 : 3;
  const common = { stroke: '#0f172a', strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, pointerEvents: 'none' as const };
  const bounds = getBounds(shape, selected);
  const selectedBox = selected ? <rect x={bounds.left} y={bounds.top} width={bounds.right - bounds.left} height={bounds.bottom - bounds.top} fill="none" stroke="#2563eb" strokeWidth={2} strokeDasharray="6 4" pointerEvents="none" /> : null;

  if (shape.type === 'arrow') {
    const markerId = `arrow-${shape.id}`;
    return <g onPointerDown={onPointerDown} style={{ cursor: 'move' }}><HitBox bounds={bounds} />{selectedBox}<defs><marker id={markerId} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#0f172a" /></marker></defs><line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} {...common} markerEnd={`url(#${markerId})`} /></g>;
  }

  if (shape.type === 'box') {
    const x = Math.min(shape.x1, shape.x2);
    const y = Math.min(shape.y1, shape.y2);
    const width = Math.max(Math.abs(shape.x2 - shape.x1), 44);
    const height = Math.max(Math.abs(shape.y2 - shape.y1), 32);
    return <g onPointerDown={onPointerDown} style={{ cursor: 'move' }}><HitBox bounds={bounds} />{selectedBox}<rect x={x} y={y} width={width} height={height} {...common} /></g>;
  }

  if (shape.type === 'groups') {
    const columns = Math.min(shape.count, 5);
    const rows = Math.ceil(shape.count / columns);
    const startX = shape.x - ((columns - 1) * 48) / 2;
    const startY = shape.y - ((rows - 1) * 42) / 2;
    return <g onPointerDown={onPointerDown} style={{ cursor: 'move' }}><HitBox bounds={bounds} />{selectedBox}{Array.from({ length: shape.count }).map((_, i) => <circle key={i} cx={startX + (i % columns) * 48} cy={startY + Math.floor(i / columns) * 42} r={16} {...common} />)}</g>;
  }

  if (shape.type === 'numberLine') {
    const markerId = `line-${shape.id}`;
    const left = Math.min(shape.x1, shape.x2);
    const width = Math.max(Math.abs(shape.x2 - shape.x1), 160);
    const right = left + width;
    return <g onPointerDown={onPointerDown} style={{ cursor: 'move' }}><HitBox bounds={bounds} />{selectedBox}<defs><marker id={markerId} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#0f172a" /></marker></defs><line x1={left} y1={shape.y1} x2={right} y2={shape.y1} {...common} markerEnd={`url(#${markerId})`} />{Array.from({ length: shape.ticks + 1 }).map((_, i) => { const x = left + (width / shape.ticks) * i; return <line key={i} x1={x} y1={shape.y1 - 8} x2={x} y2={shape.y1 + 8} {...common} />; })}</g>;
  }

  const columns = Math.min(shape.count, 5);
  const rows = Math.ceil(shape.count / columns);
  const totalW = columns * 54 + (columns - 1) * 14;
  const totalH = rows * 42 + (rows - 1) * 14;
  const startX = shape.x - totalW / 2;
  const startY = shape.y - totalH / 2;
  return <g onPointerDown={onPointerDown} style={{ cursor: 'move' }}><HitBox bounds={bounds} />{selectedBox}{Array.from({ length: shape.count }).map((_, i) => <rect key={i} x={startX + (i % columns) * 68} y={startY + Math.floor(i / columns) * 56} width={54} height={42} {...common} />)}</g>;
}

function OptionRow({ label, values, value, onChange }: { label: string; values: number[]; value: number; onChange: (value: number) => void }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-2 text-sm">
      <span className="mr-2 font-semibold text-blue-900">{label} :</span>
      <div className="mt-2 flex flex-wrap gap-2 sm:inline-flex sm:mt-0">
        {values.map(item => (
          <button key={item} type="button" onClick={() => onChange(item)} className={`rounded-md border px-3 py-1 font-bold ${value === item ? 'border-primary bg-primary text-white' : 'border-blue-200 bg-white text-blue-900'}`}>{item}</button>
        ))}
      </div>
    </div>
  );
}
