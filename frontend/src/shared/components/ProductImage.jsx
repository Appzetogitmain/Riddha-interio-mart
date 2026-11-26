import React, { useEffect, useState } from 'react';

const isUsable = (src) =>
  typeof src === 'string' &&
  src.trim() !== '' &&
  !/^[a-zA-Z]:[\/]/.test(src.trim()) && // local Windows paths (C:\...) can never load in a browser
  src.trim() !== 'undefined' &&
  src.trim() !== 'null';

/**
 * Product image that shows a neutral "No image" tile when the product has no image,
 * the path is unusable, or the image fails to load (instead of a stock photo or a broken icon).
 */
const ProductImage = ({ src, alt = '', className = '', placeholderClassName = '', onError, ...rest }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);

  if (!isUsable(src) || failed) {
    return (
      <div
        role="img"
        aria-label={alt ? `${alt} - no image available` : 'No image available'}
        className={`w-full h-full min-h-[64px] flex flex-col items-center justify-center gap-1 bg-gray-100 text-gray-400 select-none ${placeholderClassName}`}
      >
        <svg viewBox="0 0 24 24" className="w-1/4 max-w-[40px] min-w-[18px] aspect-square" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        <span className="text-[10px] font-semibold uppercase tracking-wider">No image</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => { setFailed(true); if (onError) onError(e); }}
      {...rest}
    />
  );
};

export default ProductImage;
