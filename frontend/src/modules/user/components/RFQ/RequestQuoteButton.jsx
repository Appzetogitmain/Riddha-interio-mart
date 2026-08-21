import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFileText } from 'react-icons/fi';

/**
 * Requirement A §1.1 — the one "Request a Quote" CTA used at every entry point:
 * product detail, category card, cart, BOQ results, project page and the header.
 *
 * It carries whatever context the caller has into the RFQ form via router state,
 * so the form opens pre-filled instead of blank.
 *
 * @param {Array}  products   [{ productId, productDescription, quantity, unit }]
 * @param {string} projectId  links the RFQ to a project (Requirement C)
 * @param {string} variant    'primary' | 'outline' | 'ghost' | 'card' | 'link'
 */
const RequestQuoteButton = ({
  products = [],
  projectId = null,
  projectName = '',
  source = 'unknown',
  variant = 'primary',
  size = 'md',
  label = 'Request a Quote',
  className = '',
  fullWidth = false,
  onClick
}) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) onClick(e);

    navigate('/rfq/new', {
      state: {
        prefillLineItems: products,
        projectId,
        projectName,
        source
      }
    });
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2'
  };

  const variants = {
    primary: 'bg-warm-sand text-white hover:bg-dusty-cocoa shadow-sm',
    outline: 'border border-warm-sand text-warm-sand bg-white hover:bg-soft-oatmeal',
    ghost: 'text-warm-sand hover:bg-soft-oatmeal',
    card: 'bg-white/95 backdrop-blur border border-warm-sand/40 text-deep-espresso hover:bg-warm-sand hover:text-white shadow-sm',
    link: 'text-warm-sand underline underline-offset-2 hover:text-dusty-cocoa p-0'
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={[
        'inline-flex items-center justify-center rounded-xl font-semibold transition-colors',
        variant === 'link' ? '' : sizes[size] || sizes.md,
        variants[variant] || variants.primary,
        fullWidth ? 'w-full' : '',
        className
      ].join(' ')}
    >
      <FiFileText className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
};

export default RequestQuoteButton;
