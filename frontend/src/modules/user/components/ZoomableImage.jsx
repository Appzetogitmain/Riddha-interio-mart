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
  loading = 'lazy',
  fit = 'cover',
  gallery = null,      // optional list of image URLs the fullscreen viewer can step through
  onNavigate = null    // optional (url) => void, called when the viewer moves to another image
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState(1);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);

  const images = gallery && gallery.length ? gallery : [src];
  const hasMany = images.length > 1;
  const currentSrc = images[index] || src;

  const go = useCallback((dir) => {
    setIndex((i) => (i + dir + images.length) % images.length);
    setLevel(1);
  }, [images]);

  // The parent re-keys this component when its active image changes, which would unmount the
  // open viewer. So only tell the parent which image we ended on once the viewer is closed.
  const closeViewer = useCallback(() => {
    setOpen(false);
    const last = images[index];
    if (onNavigate && last && last !== src) onNavigate(last);
  }, [images, index, onNavigate, src]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeViewer();
      else if (hasMany && e.key === 'ArrowLeft') go(-1);
      else if (hasMany && e.key === 'ArrowRight') go(1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, hasMany, go, closeViewer]);

  const openViewer = () => {
    const start = images.indexOf(src);
    setIndex(start >= 0 ? start : 0);
    setLevel(1);
    setOpen(true);
  };
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
        className={`h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} pointer-events-none will-change-transform`}
      />
      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex flex-col"
          onClick={(e) => { e.stopPropagation(); }}
        >
          <div className="flex items-center justify-end gap-2 p-3 text-white">
            {hasMany && <span className="mr-auto text-xs font-semibold bg-white/15 rounded-full px-3 py-1">{index + 1} / {images.length}</span>}
            <button type="button" aria-label="Zoom out" onClick={() => setLevel(l => clamp(l - 0.5))} className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-xl font-bold">−</button>
            <span className="text-xs w-12 text-center">{Math.round(level * 100)}%</span>
            <button type="button" aria-label="Zoom in" onClick={() => setLevel(l => clamp(l + 0.5))} className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-xl font-bold">+</button>
            <button type="button" aria-label="Close" onClick={closeViewer} className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-xl">✕</button>
          </div>
          <div
            className="relative flex-1 overflow-auto"
            style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
            onClick={closeViewer}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (!hasMany || level > 1 || touchStartX.current == null) return;
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              touchStartX.current = null;
              if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            }}
          >
            <div className="min-h-full min-w-full flex items-center justify-center">
              <img
                key={currentSrc}
                src={currentSrc}
                alt={alt}
                onClick={(e) => { e.stopPropagation(); setLevel(l => (l >= 2 ? 1 : 2)); }}
                style={{ width: `${level * 100}%`, maxWidth: level === 1 ? '100%' : 'none', maxHeight: level === 1 ? 'calc(100vh - 80px)' : 'none' }}
                className={`object-contain select-none ${level >= 2 ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                draggable={false}
              />
            </div>
          </div>
          {hasMany && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                className="fixed left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/15 hover:bg-white/35 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => { e.stopPropagation(); go(1); }}
                className="fixed right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/15 hover:bg-white/35 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default ZoomableImage;

