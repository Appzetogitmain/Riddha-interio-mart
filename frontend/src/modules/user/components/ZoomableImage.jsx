import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * ZoomableImage Component
 * - Displays a magnifying glass lens / zoom-in cursor when hovered on desktop.
 * - Follows the cursor position and smoothly magnifies that part of the product photo (2x zoom).
 * - Leaves standard touch / mobile viewing unaffected and lightweight.
 */
const ZoomableImage = ({
  src,
  alt = 'Product image',
  className = '',
  zoomScale = 2.2,
  loading = 'lazy'
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open]);

  const openViewer = () => { setLevel(1); setOpen(true); };
  const clamp = (n) => Math.min(4, Math.max(1, n));

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp between 0% and 100%
    setOrigin({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsZoomed(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsZoomed(false);
    setOrigin({ x: 50, y: 50 });
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={openViewer}
      className={`relative overflow-hidden cursor-zoom-in select-none ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading={loading}
        style={{
          transformOrigin: `${origin.x}% ${origin.y}%`,
          transform: isZoomed ? `scale(${zoomScale})` : 'scale(1)',
          transition: isZoomed ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out'
        }}
        className="h-full w-full object-cover pointer-events-none will-change-transform"
      />
      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex flex-col"
          onClick={(e) => { e.stopPropagation(); }}
        >
          <div className="flex items-center justify-end gap-2 p-3 text-white">
            <button type="button" aria-label="Zoom out" onClick={() => setLevel(l => clamp(l - 0.5))} className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-xl font-bold">−</button>
            <span className="text-xs w-12 text-center">{Math.round(level * 100)}%</span>
            <button type="button" aria-label="Zoom in" onClick={() => setLevel(l => clamp(l + 0.5))} className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-xl font-bold">+</button>
            <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-xl">✕</button>
          </div>
          <div className="flex-1 overflow-auto" style={{ touchAction: 'pan-x pan-y pinch-zoom' }} onClick={() => setOpen(false)}>
            <div className="min-h-full min-w-full flex items-center justify-center">
              <img
                src={src}
                alt={alt}
                onClick={(e) => { e.stopPropagation(); setLevel(l => (l >= 2 ? 1 : 2)); }}
                style={{ width: `${level * 100}%`, maxWidth: level === 1 ? '100%' : 'none', maxHeight: level === 1 ? 'calc(100vh - 80px)' : 'none' }}
                className={`object-contain select-none ${level >= 2 ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                draggable={false}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ZoomableImage;

