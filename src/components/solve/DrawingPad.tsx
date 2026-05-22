import { useEffect, useRef, useState } from 'react';
import { Button } from '@/lib/ui';

type Tool = 'pen' | 'eraser';

const CANVAS_HEIGHT = 260;

export function DrawingPad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
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

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
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

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (!isDrawing.current) return;

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
    isDrawing.current = false;
    lastPoint.current = null;

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
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={tool === 'pen' ? 'primary' : 'outline'} size="sm" onClick={() => setTool('pen')}>Stylet</Button>
        <Button type="button" variant={tool === 'eraser' ? 'primary' : 'outline'} size="sm" onClick={() => setTool('eraser')}>Gomme</Button>
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
      <p className="text-xs text-slate-600">Dessine des groupes, des flèches, des boîtes, une droite numérique ou un partage rapide.</p>
    </div>
  );
}
