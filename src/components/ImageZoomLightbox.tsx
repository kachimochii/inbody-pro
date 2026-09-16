import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react';

interface ImageZoomLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.35;

/**
 * Visor a pantalla completa: zoom, arrastre y rueda del ratón
 * para navegar imágenes de planes de entrenamiento.
 */
export const ImageZoomLightbox: React.FC<ImageZoomLightboxProps> = ({
  src,
  alt = 'Imagen del plan',
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

  const resetView = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setZoom((z) => clampZoom(z + ZOOM_STEP));
      if (e.key === '-') setZoom((z) => clampZoom(z - ZOOM_STEP));
      if (e.key === '0') resetView();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, resetView]);

  useEffect(() => {
    if (zoom <= 1) setOffset({ x: 0, y: 0 });
  }, [zoom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((z) => clampZoom(z + delta));
    };
    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return;
    dragging.current = true;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPoint.current.x;
    const dy = e.clientY - lastPoint.current.y;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-sm flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Visor de imagen"
    >
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-white/10 bg-slate-950/90 shrink-0">
        <div className="min-w-0">
          <p className="text-xs font-black text-white truncate">{alt}</p>
          <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
            <Move className="w-3 h-3" />
            Zoom {Math.round(zoom * 100)}% · Arrastra para mover · Rueda para acercar
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700 cursor-pointer"
            title="Alejar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700 cursor-pointer"
            title="Acercar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700 cursor-pointer"
            title="Ajustar a pantalla"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white flex items-center justify-center cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden relative touch-none select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ cursor: zoom > 1 ? (dragging.current ? 'grabbing' : 'grab') : 'zoom-in' }}
          onDoubleClick={() => {
            if (zoom > 1) resetView();
            else setZoom(2);
          }}
        >
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            draggable={false}
            className="max-w-[96vw] max-h-[calc(100vh-5.5rem)] object-contain pointer-events-none transition-transform duration-75"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          />
        </div>
      </div>
    </div>
  );
};

interface ZoomablePlanImageProps {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  /** Controles de audio u otros overlays encima de la imagen */
  overlay?: React.ReactNode;
}

/**
 * Imagen de plan con botón lupa y clic para abrir el visor a tamaño real.
 */
export const ZoomablePlanImage: React.FC<ZoomablePlanImageProps> = ({
  src,
  alt = 'Imagen guía del plan',
  className = '',
  imgClassName = 'w-full max-h-[55vh] object-contain mx-auto',
  overlay,
}) => {
  const [open, setOpen] = useState(false);

  if (!src) return null;

  return (
    <>
      <div className={`relative rounded-2xl overflow-hidden border border-slate-800 bg-black group ${className}`}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full cursor-zoom-in text-left"
          title="Ver imagen a tamaño completo"
        >
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            className={imgClassName}
          />
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute bottom-3 left-3 z-10 w-10 h-10 rounded-full bg-slate-950/85 border border-white/25 text-white flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer backdrop-blur-md shadow-lg"
          title="Ampliar imagen (lupa)"
          aria-label="Ampliar imagen"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        {overlay}
      </div>
      {open && (
        <ImageZoomLightbox src={src} alt={alt} onClose={() => setOpen(false)} />
      )}
    </>
  );
};
