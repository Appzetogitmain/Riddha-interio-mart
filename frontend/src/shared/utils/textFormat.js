// Sentence-case helpers for specification names and values.

const isAcronym = (w) => w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w);

// "fireRating" / "fire_rating" / "FIRE RATING" -> "Fire rating"; keeps acronyms like SKU, HSN, IP
export const formatSpecLabel = (label) => {
  const text = String(label ?? '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  const words = text.split(' ');
  const allCaps = words.every(isAcronym);
  const out = words.map((w, i) => {
    if (!allCaps && isAcronym(w) && w.length <= 4) return w;
    if (/^[A-Z][a-z]+\/[A-Z]/.test(w)) return w.split('/').map((p, j) => (j ? p.toLowerCase() : p)).join('/');
    return w.toLowerCase();
  });
  out[0] = out[0].charAt(0).toUpperCase() + out[0].slice(1);
  return out.join(' ');
};

// Capitalises the first letter of a value and leaves the rest (brand/proper names, units, "120 × 75 cm") untouched.
export const formatSpecValue = (value) => {
  const text = String(value ?? '').replace(/_/g, ' ').trim();
  if (!text) return '';
  if (text === text.toLowerCase() && /[a-z]/.test(text)) return text.charAt(0).toUpperCase() + text.slice(1);
  return text.charAt(0).toUpperCase() + text.slice(1);
};
