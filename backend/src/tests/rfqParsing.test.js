const test = require('node:test');
const assert = require('node:assert/strict');

const rfqAiService = require('../services/rfqAiService');
const { extractText, extractXlsxText } = require('../utils/rfqFileText');
const { isSampleEligibleCategory } = require('../services/sampleRulesService');

/**
 * Requirement A — the deterministic halves of the AI pipeline: the fallback
 * RFQ parser, the parsed-response sanitiser and the uploaded-file text reader.
 * None of these touch the network or the database.
 */

// -----------------------------------------------------------------------------
// Unit normalisation
// -----------------------------------------------------------------------------

test('units: common contractor spellings normalise to the canonical unit', () => {
  const cases = [
    ['sqft', 'sq.ft'], ['SQ FT', 'sq.ft'], ['square feet', 'sq.ft'], ['Sft', 'sq.ft'],
    ['sqm', 'sq.m'], ['square metres', 'sq.m'],
    ['Pieces', 'pcs'], ['pc', 'pcs'],
    ['Nos', 'nos'], ['units', 'nos'],
    ['KGS', 'kg'],
    ['cartons', 'box'],
    ['running feet', 'rft'], ['rmt', 'rft'],
    ['Sets', 'set']
  ];
  for (const [input, expected] of cases) {
    assert.equal(rfqAiService.normalizeUnit(input), expected, `"${input}" should normalise to ${expected}`);
  }
});

test('units: an unrecognised unit returns null rather than a guess', () => {
  assert.equal(rfqAiService.normalizeUnit('furlongs'), null);
  assert.equal(rfqAiService.normalizeUnit(''), null);
  assert.equal(rfqAiService.normalizeUnit(null), null);
});

// -----------------------------------------------------------------------------
// Fallback parser
// -----------------------------------------------------------------------------

test('fallback parser: reads quantity, unit, size and finish off a typical line', () => {
  const { lineItems } = rfqAiService.fallbackParse({
    rawInput: '2000 sq.ft Kajaria vitrified tile 600x600 matt finish - office washroom'
  });

  assert.equal(lineItems.length, 1);
  assert.equal(lineItems[0].quantity, 2000);
  assert.equal(lineItems[0].unit, 'sq.ft');
  assert.equal(lineItems[0].size, '600x600');
  assert.equal(lineItems[0].finish, 'matt');
  assert.match(lineItems[0].productDescription, /Kajaria vitrified tile/);
});

test('fallback parser: never invents a quantity it could not read', () => {
  const { lineItems, ambiguities } = rfqAiService.fallbackParse({
    rawInput: 'some marble for the reception counter'
  });

  assert.equal(lineItems[0].quantity, null);
  assert.equal(lineItems[0].unit, null);
  assert.equal(lineItems[0].matchConfidence, 'low');
  assert.ok(ambiguities.some((a) => /confirm the quantity/i.test(a)));
});

test('fallback parser: never reports high confidence, since it has no semantics', () => {
  const { lineItems } = rfqAiService.fallbackParse({
    rawInput: '25 nos Hettich soft close hinges\n120 sq.ft Italian marble'
  });
  assert.equal(lineItems.length, 2);
  for (const line of lineItems) {
    assert.notEqual(line.matchConfidence, 'high');
  }
});

test('fallback parser: splits on newlines and semicolons and strips bullets', () => {
  const { lineItems } = rfqAiService.fallbackParse({
    rawInput: '- 100 pcs door handles\n* 50 box floor tiles; 30 kg tile adhesive'
  });
  assert.equal(lineItems.length, 3);
  assert.deepEqual(lineItems.map((l) => l.unit), ['pcs', 'box', 'kg']);
  assert.deepEqual(lineItems.map((l) => l.quantity), [100, 50, 30]);
});

test('fallback parser: caps at the 50-line RFQ limit', () => {
  const rawInput = Array.from({ length: 80 }, (_, i) => `${i + 1} pcs item ${i + 1}`).join('\n');
  const { lineItems } = rfqAiService.fallbackParse({ rawInput });
  assert.equal(lineItems.length, 50);
});

test('fallback parser: always flags that AI parsing was unavailable', () => {
  const { ambiguities, aiUsed } = rfqAiService.fallbackParse({ rawInput: '10 pcs handles' });
  assert.equal(aiUsed, false);
  assert.ok(ambiguities.some((a) => /AI parsing was unavailable/i.test(a)));
});

// -----------------------------------------------------------------------------
// Sanitising an AI response
// -----------------------------------------------------------------------------

test('sanitiser: a good AI response passes through with confidence intact', () => {
  const result = rfqAiService.sanitizeParsedRFQ({
    lineItems: [{
      productDescription: 'Vitrified floor tile',
      quantity: 1200,
      unit: 'sqft',
      size: '600x600',
      finish: 'matt',
      brandPreference: 'Kajaria',
      application: 'reception',
      confidence: 'high'
    }],
    deliveryLocation: 'Indore',
    requiredDate: '2026-09-15',
    ambiguities: []
  }, { aiUsed: true });

  assert.equal(result.lineItems[0].unit, 'sq.ft');
  assert.equal(result.lineItems[0].matchConfidence, 'high');
  assert.equal(result.deliveryLocation, 'Indore');
  assert.equal(result.aiUsed, true);
  assert.deepEqual(result.ambiguities, []);
});

test('sanitiser: a missing quantity is downgraded to low and raised as an ambiguity', () => {
  const result = rfqAiService.sanitizeParsedRFQ({
    lineItems: [{ productDescription: 'Marble slab', quantity: 0, unit: 'sq.ft', confidence: 'high' }]
  });

  assert.equal(result.lineItems[0].quantity, null);
  assert.equal(result.lineItems[0].matchConfidence, 'low');
  assert.ok(result.ambiguities.some((a) => /Marble slab/.test(a) && /quantity/i.test(a)));
});

test('sanitiser: an unusable unit is dropped and high confidence is downgraded', () => {
  const result = rfqAiService.sanitizeParsedRFQ({
    lineItems: [{ productDescription: 'Teak veneer', quantity: 40, unit: 'sheets', confidence: 'high' }]
  });

  assert.equal(result.lineItems[0].unit, null);
  assert.equal(result.lineItems[0].matchConfidence, 'medium');
  assert.ok(result.ambiguities.some((a) => /Unit of measure unclear/.test(a)));
});

test('sanitiser: a junk confidence value falls back to low', () => {
  const result = rfqAiService.sanitizeParsedRFQ({
    lineItems: [{ productDescription: 'Laminate', quantity: 10, unit: 'pcs', confidence: 'definitely' }]
  });
  assert.equal(result.lineItems[0].matchConfidence, 'low');
});

test('sanitiser: a malformed response yields no lines instead of throwing', () => {
  const result = rfqAiService.sanitizeParsedRFQ({ lineItems: 'not-an-array' });
  assert.deepEqual(result.lineItems, []);
  assert.deepEqual(result.ambiguities, []);
});

test('sanitiser: enforces the 50-line RFQ limit', () => {
  const lineItems = Array.from({ length: 90 }, (_, i) => ({
    productDescription: `item ${i}`, quantity: 1, unit: 'pcs', confidence: 'high'
  }));
  assert.equal(rfqAiService.sanitizeParsedRFQ({ lineItems }).lineItems.length, 50);
});

test('sanitiser: duplicate ambiguities are collapsed', () => {
  const result = rfqAiService.sanitizeParsedRFQ({
    lineItems: [
      { productDescription: 'Tile', quantity: null, unit: 'pcs' },
      { productDescription: 'Tile', quantity: null, unit: 'pcs' }
    ]
  });
  assert.equal(new Set(result.ambiguities).size, result.ambiguities.length);
});

// -----------------------------------------------------------------------------
// Uploaded file text
// -----------------------------------------------------------------------------

test('file text: csv and txt are decoded directly', () => {
  const csv = extractText(Buffer.from('desc,qty,unit\ntile,2000,sqft'), 'boq.csv', 'text/csv');
  assert.equal(csv.supported, true);
  assert.match(csv.text, /tile,2000,sqft/);
});

test('file text: xlsx rows become tab-separated lines the parser can read', () => {
  // Minimal xlsx: a zip holding sharedStrings.xml and worksheets/sheet1.xml.
  const AdmZip = require('adm-zip');
  const zip = new AdmZip();
  zip.addFile('xl/sharedStrings.xml', Buffer.from(
    '<sst><si><t>Vitrified tile</t></si><si><t>sq.ft</t></si></sst>'
  ));
  zip.addFile('xl/worksheets/sheet1.xml', Buffer.from(
    '<worksheet><sheetData>'
    + '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><v>2000</v></c><c r="C1" t="s"><v>1</v></c></row>'
    + '</sheetData></worksheet>'
  ));

  const text = extractXlsxText(zip.toBuffer());
  assert.equal(text, 'Vitrified tile\t2000\tsq.ft');
});

test('file text: unreadable formats are reported, not silently empty', () => {
  for (const [name, pattern] of [['plan.pdf', /PDF text cannot be extracted/], ['plan.dwg', /cannot be read automatically/]]) {
    const result = extractText(Buffer.from('binary'), name, '');
    assert.equal(result.supported, false);
    assert.equal(result.text, '');
    assert.match(result.note, pattern);
  }
});

test('file text: a corrupt xlsx is caught rather than crashing the request', () => {
  const result = extractText(Buffer.from('definitely not a zip'), 'broken.xlsx', '');
  assert.equal(result.supported, false);
  assert.ok(result.note.length > 0);
});

// -----------------------------------------------------------------------------
// Sample category eligibility
// -----------------------------------------------------------------------------

test('samples: only touch-and-feel material categories are eligible', () => {
  const eligible = ['Marble', 'Granite Slabs', 'Vitrified Tiles', 'Laminates', 'Teak Veneer',
    'Upholstery Fabric', 'Wallpaper', 'Wooden Flooring', 'Interior Paint', 'Acrylic Sheets',
    'Hardware Finishes'];
  for (const name of eligible) {
    assert.equal(isSampleEligibleCategory(name), true, `${name} should be sample-eligible`);
  }

  const ineligible = ['Sofas & Seating', 'Ceiling Lights', 'Wardrobes', 'Mattresses'];
  for (const name of ineligible) {
    assert.equal(isSampleEligibleCategory(name), false, `${name} should not be sample-eligible`);
  }
});

test('samples: an empty category name is not eligible', () => {
  assert.equal(isSampleEligibleCategory(''), false);
  assert.equal(isSampleEligibleCategory(null, undefined), false);
});
