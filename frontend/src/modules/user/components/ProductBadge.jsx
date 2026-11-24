import React from 'react';

const POSITION_CLASS = {
  'top-left': 'top-2 left-2',
  'top-right': 'top-2 right-2',
  'bottom-left': 'bottom-2 left-2',
  'bottom-right': 'bottom-2 right-2',
};

// Bestseller badge. Place inside a `relative` image wrapper. Text, colours and position come from the
// admin settings (or the product's own override).
const ProductBadge = ({ badge, className = '' }) => {
  if (!badge || !badge.text) return null;
  return (
    <span
      style={{ backgroundColor: badge.bgColor, color: badge.textColor }}
      className={`pointer-events-none absolute z-10 ${POSITION_CLASS[badge.position] || POSITION_CLASS['bottom-left']} px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-[8px] md:text-[10px] font-black uppercase tracking-wider shadow-md max-w-[70%] truncate ${className}`}
    >
      {badge.text}
    </span>
  );
};

export default ProductBadge;
