// Small pure helpers for the Tejas assistant (easy to unit-test).

// keyword -> store category name fragment (matched case-insensitively against Category.name)
const CATEGORY_HINTS = [
  { category: 'Lighting', re: /\b(light|lights|lighting|lamp|lamps|chandelier|chandeliers|pendant|pendants|led|leds|bulb|bulbs|downlight|downlights|spotlight|spotlights|jhoomar|diya|tubelight|cove)\b/i },
  { category: 'False Ceiling', re: /\b(false\s*ceiling|gypsum|pop\s*ceiling)\b/i },
  { category: 'Modular Kitchen', re: /\b(kitchen|chimney|hob|cooktop|modular)\b/i },
  { category: 'Bath', re: /\b(bathroom|faucet|faucets|shower|basin|washbasin|toilet|bathtub|geyser|sanitary)\b/i },
  { category: 'Furniture', re: /\b(sofa|sofas|bed|beds|table|tables|chair|chairs|wardrobe|wardrobes|desk|furniture|couch|recliner|bookshelf|dining)\b/i },
  { category: 'Flooring', re: /\b(floor|floors|flooring|tile|tiles|vitrified|laminate flooring|wooden flooring)\b/i },
  { category: 'Marble', re: /\b(marble|granite|quartz|onyx)\b/i },
  { category: 'Paint', re: /\b(paint|paints|colour|color|wallpaper|wallpapers|texture|putty|primer)\b/i },
  { category: 'Wall', re: /\b(wall\s*panel|wall\s*panels|cladding|wall\s*solution)\b/i },
  { category: 'Electrical', re: /\b(switch|switches|socket|sockets|wire|wires|mcb|fan|fans|wiring)\b/i },
  { category: 'Hardware', re: /\b(handle|handles|lock|locks|hinge|hinges|knob|drawer\s*channel)\b/i },
  { category: 'Outdoor', re: /\b(outdoor|garden|patio|balcony furniture|swing)\b/i }
];

/** Best-guess store category for a customer sentence, or null. Lighting wins when it is mentioned. */
function inferCategoryHint(text) {
  const t = String(text || '');
  for (const h of CATEGORY_HINTS) {
    if (h.re.test(t)) return h.category;
  }
  return null;
}

const STOPWORDS = new Set(['the', 'and', 'for', 'with', 'show', 'give', 'want', 'need', 'looking', 'please', 'some', 'any', 'best', 'good', 'nice', 'new', 'buy', 'get', 'can', 'you', 'me', 'my', 'our', 'your', 'have', 'has', 'are', 'what', 'which', 'dikhao', 'chahiye', 'mujhe', 'ke', 'liye', 'ka', 'ki', 'ko', 'hai', 'hain', 'aur', 'ya', 'koi', 'kuch', 'wala', 'wali', 'room', 'home', 'house', 'product', 'products', 'item', 'items']);

/** Meaningful search words (>=3 letters, no filler). */
function tokenize(query) {
  return [...new Set(String(query || '').toLowerCase().split(/[^a-z0-9ऀ-ॿ]+/).filter(w => w.length >= 3 && !STOPWORDS.has(w)))].slice(0, 6);
}

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** True when the customer is explicitly asking to see / buy products. */
function isExplicitProductRequest(text) {
  return /\b(show|dikhao|dikha|recommend|suggest|options|buy|purchase|price of|how much|cost of|kitna|best .* for|looking for|need|want|chahiye)\b/i.test(String(text || ''));
}

/** Clean the model's quick replies: strings only, short, unique, max 5. */
function sanitizeQuickReplies(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const item of list) {
    const label = typeof item === 'string' ? item : item?.label;
    const clean = String(label || '').replace(/\s+/g, ' ').trim();
    if (clean && clean.length <= 32 && !out.some(o => o.toLowerCase() === clean.toLowerCase())) out.push(clean);
    if (out.length === 5) break;
  }
  return out;
}

const REQ_FIELDS = ['room', 'category', 'lightingType', 'fixture', 'warmth', 'budget', 'style', 'stage'];

/** Merge the model's latest requirements into what we already know; known values are never blanked out. */
function mergeRequirements(previous = {}, incoming = {}) {
  const merged = { ...(previous || {}) };
  REQ_FIELDS.forEach((k) => {
    const v = incoming && typeof incoming[k] === 'string' ? incoming[k].trim().slice(0, 80) : '';
    if (v) merged[k] = v;
    else if (merged[k] === undefined) merged[k] = '';
  });
  return merged;
}

/** Short human-readable summary for the admin follow-up list. */
function summarizeRequirements(req = {}) {
  const parts = [];
  if (req.category) parts.push(req.category);
  if (req.room) parts.push(req.room);
  if (req.lightingType) parts.push(req.lightingType);
  if (req.fixture) parts.push(req.fixture);
  if (req.warmth) parts.push(req.warmth);
  if (req.style) parts.push(req.style);
  if (req.budget) parts.push(`Budget ${req.budget}`);
  return parts.join(' · ');
}

module.exports = { inferCategoryHint, tokenize, escapeRegex, isExplicitProductRequest, sanitizeQuickReplies, mergeRequirements, summarizeRequirements, REQ_FIELDS };
