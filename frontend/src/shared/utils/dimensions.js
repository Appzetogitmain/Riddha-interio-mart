// Shared helpers for product dimensions. Order is always Length × Width/Depth × Height.

const THREE_D_KEYWORDS = [
  'table', 'wardrobe', 'almirah', 'bed', 'cabinet', 'sofa', 'couch', 'chair', 'desk',
  'shelf', 'bookcase', 'dresser', 'sideboard', 'tv unit', 'stool', 'bench', 'furniture',
  'cupboard', 'drawer', 'ottoman', 'recliner', 'shoe rack',
];

// Furniture-type products need all three measurements.
export const requiresThreeDimensions = (...texts) => {
  const haystack = texts.filter(Boolean).join(' ').toLowerCase();
  return THREE_D_KEYWORDS.some(k => haystack.includes(k));
};

const UNIT_PATTERN = /(mm|cm|inches|inch|feet|ft|mtrs|m|in)\s*$/i;

// "120 x 75 x 76 cm" -> { length: '120', width: '75', height: '76', unit: 'cm' }
export const parseDimensions = (value) => {
  const text = String(value || '').trim();
  if (!text) return { length: '', width: '', height: '', unit: 'cm' };
  const unitMatch = text.match(UNIT_PATTERN);
  const unit = unitMatch ? unitMatch[1].toLowerCase() : 'cm';
  const numeric = unitMatch ? text.slice(0, unitMatch.index) : text;
  const parts = numeric.split(/[x×*]/i).map(p => p.replace(/[^\d.]/g, ''));
  if (parts.length === 3) return { length: parts[0], width: parts[1], height: parts[2], unit };
  if (parts.length === 2) return { length: parts[0], width: parts[1], height: '', unit };
  return { length: parts[0] || '', width: '', height: '', unit };
};

// { length, width, height, unit } -> "120 × 75 × 76 cm" ('' when nothing is filled in)
export const formatDimensions = ({ length, width, height, unit = 'cm' }) => {
  const parts = [length, width, height].map(v => String(v ?? '').trim());
  if (parts.every(p => !p)) return '';
  return `${parts.filter(Boolean).join(' × ')} ${unit}`.trim();
};

// Turns the AI dimensions object into the string stored on the product.
// The backend already marks incomplete 3-D furniture with formatted === '' so nothing is invented.
export const dimensionsFromAi = (aiDimensions, fallback = '') => {
  if (!aiDimensions) return fallback;
  if (typeof aiDimensions.formatted === 'string') {
    return aiDimensions.formatted || fallback;
  }
  const { length, width, height } = aiDimensions;
  return length && width && height ? formatDimensions(aiDimensions) : fallback;
};
