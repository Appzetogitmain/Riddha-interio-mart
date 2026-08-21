import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LuLayers } from 'react-icons/lu';

import { isSampleable } from '../../services/sampleService';

/**
 * Requirement A §2.2 — "Request Sample" CTA.
 *
 * Renders nothing unless the product opted into the sample programme AND sits in
 * a touch-and-feel category, so it never appears on a sofa or a light fitting.
 */
const RequestSampleButton = ({
  product,
  variant = 'outline',
  size = 'md',
  className = '',
  fullWidth = false,
  label
}) => {
  const navigate = useNavigate();

  if (!isSampleable(product)) return null;

  const charge = Number(product.sampleCharge) || 0;
  const text = label || (charge > 0 ? `Request Sample · ₹${charge}` : 'Request Free Sample');

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2'
  };

  const variants = {
    primary: 'bg-warm-sand text-white hover:bg-dusty-cocoa shadow-sm',
    outline: 'border border-warm-sand text-warm-sand bg-white hover:bg-soft-oatmeal',
    ghost: 'text-warm-sand hover:bg-soft-oatmeal',
    card: 'bg-white/95 backdrop-blur border border-warm-sand/40 text-deep-espresso hover:bg-warm-sand hover:text-white shadow-sm'
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate('/samples/new', { state: { prefillProducts: [product] } });
      }}
      aria-label={text}
      className={[
        'inline-flex items-center justify-center rounded-xl font-semibold transition-colors',
        sizes[size] || sizes.md,
        variants[variant] || variants.outline,
        fullWidth ? 'w-full' : '',
        className
      ].join(' ')}
    >
      <LuLayers className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" />
      <span>{text}</span>
    </button>
  );
};

export default RequestSampleButton;
