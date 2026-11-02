import React, { useState, useRef, useCallback } from 'react';

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
    </div>
  );
};

export default ZoomableImage;

