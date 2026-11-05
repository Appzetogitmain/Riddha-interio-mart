import React, { useEffect, useRef, useState } from 'react';
import { parseDimensions, formatDimensions, requiresThreeDimensions } from '../utils/dimensions';

const UNITS = ['cm', 'mm', 'inch', 'ft', 'm'];

// Length × Width/Depth × Height editor. Stores a single string like "120 × 75 × 76 cm"
// so it stays compatible with the existing `dimensions` field.
const DimensionsInput = ({ value, onChange, categoryText = '', className = '', inputClassName = '' }) => {
  const [parts, setParts] = useState(() => parseDimensions(value));
  const lastEmitted = useRef(value || '');
  const needsThree = requiresThreeDimensions(categoryText);

  // Re-sync only when the value changes from outside (AI apply, loading a product)
  useEffect(() => {
    if ((value || '') !== lastEmitted.current) {
      lastEmitted.current = value || '';
      setParts(parseDimensions(value));
    }
  }, [value]);

  const update = (field, v) => {
    const next = { ...parts, [field]: v };
    setParts(next);
    // Never save a partial L/W/H set for furniture (it would read as a wrong size);
    // the typed values stay on screen until all three are entered.
    const count = [next.length, next.width, next.height].filter(Boolean).length;
    const out = needsThree && count < 3 ? '' : formatDimensions(next);
    lastEmitted.current = out;
    onChange(out);
  };

  const filled = [parts.length, parts.width, parts.height].filter(Boolean).length;
  const incomplete = needsThree && filled < 3;

  const base = inputClassName ||
    'w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-3 py-3 text-sm focus:outline-none';

  return (
    <div className={className}>
      <div className="grid grid-cols-4 gap-2">
        {[['length', 'Length'], ['width', 'Width / Depth'], ['height', 'Height']].map(([field, label]) => (
          <div key={field} className="space-y-1">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="—"
              value={parts[field]}
              onChange={(e) => update(field, e.target.value)}
              className={base}
            />
          </div>
        ))}
        <div className="space-y-1">
          <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-400">Unit</span>
          <select
            value={UNITS.includes(parts.unit) ? parts.unit : 'cm'}
            onChange={(e) => update('unit', e.target.value)}
            className={base}
          >
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <p className={`text-[10px] mt-1.5 font-semibold ${incomplete ? 'text-amber-600' : 'text-gray-400'}`}>
        {incomplete
          ? 'This product needs all three measurements (L × W × H). Please enter the missing values manually; AI does not guess them.'
          : (formatDimensions(parts) ? `Saved as: ${formatDimensions(parts)} (L × W/D × H)` : 'Order: Length × Width/Depth × Height')}
      </p>
    </div>
  );
};

export default DimensionsInput;
