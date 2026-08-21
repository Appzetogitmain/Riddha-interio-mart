import React from 'react';
import { FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { RFQ_UNITS, RFQ_UNIT_LABELS } from '../../services/rfqService';

const CONFIDENCE_STYLES = {
  high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-red-50 text-red-700 border-red-200'
};

/**
 * One product line inside the RFQ form. Lines that came from the AI parser carry
 * a confidence badge so the customer knows which rows to double-check; a low or
 * missing quantity is called out inline rather than silently accepted.
 */
const RFQLineItemRow = ({ line, index, onChange, onRemove, canRemove = true, errors = {} }) => {
  const update = (field, value) => onChange(index, { ...line, [field]: value });

  const needsReview = line.matchConfidence === 'low' || line.quantity === null || line.quantity === '';
  const inputBase = 'w-full rounded-lg border px-3 py-2 text-sm text-deep-espresso focus:outline-none focus:ring-2 focus:ring-warm-sand/40';
  const borderFor = (field) => (errors[field] ? 'border-red-400 bg-red-50/40' : 'border-soft-oatmeal bg-white');

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        needsReview ? 'border-amber-300 bg-amber-50/40' : 'border-soft-oatmeal bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-soft-oatmeal text-xs font-bold text-deep-espresso">
            {index + 1}
          </span>
          {line.matchConfidence && (
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                CONFIDENCE_STYLES[line.matchConfidence] || CONFIDENCE_STYLES.low
              }`}
              title="How confident the AI parser was about this line"
            >
              {line.matchConfidence} confidence
            </span>
          )}
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label={`Remove line ${index + 1}`}
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="md:col-span-5">
          <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">
            Product <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={line.productDescription || ''}
            onChange={(e) => update('productDescription', e.target.value)}
            placeholder="e.g. Vitrified floor tile, matt finish"
            className={`${inputBase} ${borderFor('productDescription')}`}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={line.quantity === null || line.quantity === undefined ? '' : line.quantity}
            onChange={(e) => update('quantity', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0"
            className={`${inputBase} ${borderFor('quantity')}`}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">
            Unit <span className="text-red-500">*</span>
          </label>
          <select
            value={line.unit || ''}
            onChange={(e) => update('unit', e.target.value)}
            className={`${inputBase} ${borderFor('unit')}`}
          >
            <option value="">Select</option>
            {RFQ_UNITS.map((unit) => (
              <option key={unit} value={unit}>{RFQ_UNIT_LABELS[unit]}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">Size / dimensions</label>
          <input
            type="text"
            value={line.size || ''}
            onChange={(e) => update('size', e.target.value)}
            placeholder="600x600"
            className={`${inputBase} border-soft-oatmeal bg-white`}
          />
        </div>

        <div className="md:col-span-4">
          <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">Finish / grade</label>
          <input
            type="text"
            value={line.finish || ''}
            onChange={(e) => update('finish', e.target.value)}
            placeholder="Matt, anti-skid"
            className={`${inputBase} border-soft-oatmeal bg-white`}
          />
        </div>

        <div className="md:col-span-4">
          <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">Brand preference</label>
          <input
            type="text"
            value={line.brandPreference || ''}
            onChange={(e) => update('brandPreference', e.target.value)}
            placeholder="Any"
            className={`${inputBase} border-soft-oatmeal bg-white`}
          />
        </div>

        <div className="md:col-span-4">
          <label className="mb-1 block text-xs font-semibold text-dusty-cocoa">Application / area</label>
          <input
            type="text"
            value={line.application || ''}
            onChange={(e) => update('application', e.target.value)}
            placeholder="Office washroom"
            className={`${inputBase} border-soft-oatmeal bg-white`}
          />
        </div>
      </div>

      {Object.values(errors).filter(Boolean).length > 0 && (
        <p className="mt-3 flex items-start gap-1.5 text-xs font-medium text-red-600">
          <FiAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{Object.values(errors).filter(Boolean).join(' ')}</span>
        </p>
      )}
    </div>
  );
};

export default RFQLineItemRow;
