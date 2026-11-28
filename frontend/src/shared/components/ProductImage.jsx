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
        className={`w-full h-full min-h-[64px] flex items-center justify-center p-2 bg-gray-50 select-none ${placeholderClassName}`}
      >
        <img
          src="/logo.png"
          alt=""
          draggable={false}
          className="max-w-[70%] max-h-[70%] w-auto h-auto object-contain opacity-80"
        />
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
