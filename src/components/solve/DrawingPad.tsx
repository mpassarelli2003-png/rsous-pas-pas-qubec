import { useRef, useState } from 'react';
import { Button } from '@/lib/ui';

type Tool = 'pen' | 'eraser';

export function DrawingPad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const [tool, setTool] = useState<Tool>('pen');

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const setupIfNeeded = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width > 0) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(260 * dpr);
    canvas.style.height = '260px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, 260);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    setupIfNeeded();
    const ctx = event.currentTarget.getContext('2d');
    if (!ctx) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getPoint(event);
    isDrawing.current = true;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const ctx = event.currentTarget.getContext('2d');
    if (!ctx) return;
    const point = getPoint(event);
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = tool === 'eraser' ? 18 : 3;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stop = (event: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawing.current = false;
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
    ctx.fillRect(0, 0, rect.width, 260);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={tool === 'pen' ? 'primary' : 'outline'} size="sm" onClick={() => setTool('pen')}>Stylet</Button>
        <Button type="button" variant={tool === 'eraser' ? 'primary' : 'outline'} size="sm" onClick={() => setTool('eraser')}>Gomme</Button>
        <Button type="button" variant="outline" size="sm" onClick={clear}>Effacer le croquis</Button>
      </div>
      <div className="rounded-xl border-2 border-primary/30 bg-white p-2 shadow-inner">
        <canvas
          ref={canvasRef}
          className="block w-full cursor-crosshair rounded-lg bg-white touch-none"
          style={{ touchAction: 'none' }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerCancel={stop}
          onPointerEnter={setupIfNeeded}
        />
      </div>
      <p className="text-xs text-slate-600">Dessine des groupes, des flèches, des boîtes, une droite numérique ou un partage rapide.</p>
    </div>
  );
}
