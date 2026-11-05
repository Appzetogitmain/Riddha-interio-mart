const openaiClient = require('./openaiService');
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const OpenAIUsageTracker = require('./openaiUsageTracker');
const { cloudinary } = require('../config/cloudinary');

// Stream image Buffer directly to Cloudinary so frontend receives small, fast CDN URLs
const uploadBufferToCloudinary = (buffer) => {
  return new Promise((resolve) => {
    if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY) {
      return resolve(null);
    }
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'riddha_mart/images',
        transformation: [
          { width: 1000, height: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          console.warn('[Cloudinary AI Upload Error]:', error.message);
          resolve(null);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

// Utility: sleep for ms milliseconds
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Simple in-memory image cache
const imageCache = new Map();

// Utility: run an OpenAI call with retry/backoff on transient (5xx / 429) errors
const callOpenAIWithRetry = (apiCall, maxRetries = 3) =>
  OpenAIErrorHandler.callWithRetry(apiCall, maxRetries);

// Utility: Fetch an image URL with a timeout, returns Response or null
const fetchImage = async (url, timeoutMs, extraHeaders = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const originalTlsReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  try {
    // Disable TLS unauthorized checks temporarily to avoid cert issues (e.g. self-signed or missing root certs)
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        ...extraHeaders
      }
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[ImageFetch] Error: ${err.message}`);
    return null;
  } finally {
    if (originalTlsReject !== undefined) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalTlsReject;
    } else {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    }
  }
};

// =============================================================================
// Search for real product photos by name/SKU (keyless — no search API key is
// configured for this project). Best-effort only: on any failure this returns
// [] so the caller falls back to AI image generation, which is the only path
// that existed before. Real search results are strongly preferred when found,
// since they are the actual manufacturer/retailer product photos rather than
// an AI approximation.
// =============================================================================
const searchProductImages = async (query, maxResults = 8) => {
  if (!query || !query.trim()) return [];
  try {
    const searchPageUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
    const pageRes = await fetchImage(searchPageUrl, 8000);
    if (!pageRes || !pageRes.ok) return [];
    const html = await pageRes.text();
    const vqdMatch = html.match(/vqd=['"]?([\d-]+)['"&]/) || html.match(/vqd=([\d-]+)/);
    if (!vqdMatch) return [];
    const vqd = vqdMatch[1];

    const apiUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`;
    const apiRes = await fetchImage(apiUrl, 8000, { Referer: 'https://duckduckgo.com/' });
    if (!apiRes || !apiRes.ok) return [];
    const data = await apiRes.json().catch(() => null);
    if (!data || !Array.isArray(data.results)) return [];

    return data.results
      .map((r) => r.image)
      .filter((url) => typeof url === 'string' && /^https?:\/\//.test(url))
      .slice(0, maxResults);
  } catch (err) {
    console.warn(`[ImageSearch] Search failed for "${query}": ${err.message}`);
    return [];
  }
};

// =============================================================================
// Generate HSN Code via OpenAI
// =============================================================================
const generateHSNCode = async (category, subcategory, productType, productName, description) => {
  try {
    const prompt = `You are an expert in GST classification and HSN code mapping.

Your task is to generate the most accurate HSN (Harmonized System of Nomenclature) code for a product based on the given inputs.
Follow strict classification rules based on Indian GST HSN standards.

INPUT:
- Category: ${category || 'N/A'}
- Subcategory: ${subcategory || 'N/A'}
- Product Type (Sub-subcategory): ${productType || 'N/A'}
- Product Name: ${productName || 'N/A'}
- Product Description: ${description || 'N/A'}

INSTRUCTIONS:
1. Identify the correct HSN Chapter (first 2 digits) based on the Category.
2. Identify the correct Heading (next 2 digits) based on the Subcategory.
3. Identify the most accurate Subheading (last 2 digits) based on Product Type and Product Name.
4. If an exact match exists, return the full 6-digit HSN code.
5. If not found, use industry-standard classification logic for the closest match.
6. Do NOT guess randomly. Prefer commonly used GST HSN codes in India.

OUTPUT FORMAT (STRICT JSON):
{
  "hsn_code": "XXXXXX"
}`;

    const response = await callOpenAIWithRetry(
      () =>
        openaiClient.generateText(prompt, {
          modelType: 'general',
          expectJson: true,
          temperature: 0.2,
          maxTokens: 100,
        }),
      3
    );

    await OpenAIUsageTracker.trackUsage(
      {
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        totalTokens: response.totalTokens,
      },
      'hsn-code',
      null,
      '/api/products/generate-hsn',
      response.model
    );

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
      return parsed.hsn_code;
    }
    return null;
  } catch (error) {
    console.error('Error generating HSN code via OpenAI:', error);
    throw new Error(`Failed to generate HSN code: ${error.message}`);
  }
};


/**
 * Uses GPT-4o Vision to analyze an uploaded original product image and generate
 * up to 10 category-intelligent, identity-preserving image generation prompts.
 * For furniture: front view, side view, back view, close-up details, lifestyle views, etc.
 * For other categories: intelligently identifies product type and generates relevant angles and usages.
 */
const generateTenPerspectivePromptsFromImage = async (
  originalImage,
  { name, category, subcategory, material, color, customPrompt, targetCount = 10 }
) => {
  const catText = `${category || ''} ${subcategory || ''} ${name || ''}`.toLowerCase();
  const isFurniture = catText.includes('furniture') || catText.includes('chair') || catText.includes('sofa') || catText.includes('table') || catText.includes('bed') || catText.includes('desk') || catText.includes('cabinet') || catText.includes('wardrobe') || catText.includes('stool');

  const systemPrompt = `You are a world-class e-commerce visual director and 3D product rendering artist specializing in interior architecture, luxury furniture, building materials, and home decor.
Your task is to analyze the uploaded original product photo and formulate exactly ${targetCount} detailed photographic prompts.

CRITICAL IDENTITY PRESERVATION RULES:
All ${targetCount} prompts MUST preserve the original product's exact identity:
- Exactly the same shape, silhouette, proportions, and structure
- Exactly the same color palette, hues, and pattern
- Exactly the same material (e.g. specific wood grain, fabric weave/texture, marble veining, metal polish)
- Exactly the same hardware, handles, legs, joints, seams, or buttons
- Exactly the same NUMBER OF SEATS / units / drawers / doors / shelves / legs (a 3-seater sofa must never become a 2-seater or 1-seater; a 4-seater table must stay 4-seater)
- Exactly the same overall dimensions and width-to-height-to-depth proportions, armrests, backrest, cushions and base
- Only the camera angle, viewpoint, lighting, background or staging may change. The product itself must NEVER change.
- Every prompt must explicitly state: "Showing the exact same product as reference with identical design, color, materials and form"`;

  const userPrompt = `Carefully examine this uploaded original product image.
Product context:
- Name: ${name || 'N/A'}
- Category: ${category || 'N/A'}
- Subcategory: ${subcategory || 'N/A'}
- Material: ${material || 'N/A'}
- Color: ${color || 'N/A'}
${customPrompt ? `- Custom vendor instructions: ${customPrompt}` : ''}

Analyze the product:
0. Write "structuralSpec": one precise sentence that locks the product's physical identity, e.g. "3-seater sofa, three seat cushions and three back cushions, two low rolled armrests, four tapered wooden legs, width about 2.3x depth". Count seats/cushions/legs carefully from the image. This sentence will be repeated verbatim in every prompt.
1. Identify product type: is it Furniture (e.g. chair, table, sofa, bed, storage) or another interior category (Tiles/Flooring, Sanitaryware, Lighting, Kitchen, Hardware, Decor)?
2. Note the exact geometry, materials, color finish, and distinctive craft details.

Generate an array of exactly ${targetCount} distinct, high-quality, professional photography prompts:
${isFurniture ? `FOR THIS FURNITURE PRODUCT, GENERATE THESE PERSPECTIVES:
1. Front Elevation View: Eye-level direct front view on pure white studio background with soft realistic contact drop shadow.
2. Three-Quarter Angle View: Elegant 45-degree angled perspective capturing front and side with dimensional depth.
3. Side Profile View: 90-degree lateral profile showing silhouette, depth, backrest angle, and armrest/leg curvature.
4. Rear / Back View: Direct back view highlighting structure, joinery, and clean upholstery/wood finish.
5. High Three-Quarter Isometric View: Elevated camera angle looking down to show seat depth, cushioning, and top surfaces.
6. Macro Craft & Texture Close-Up: Extreme macro close-up focusing directly on fabric weave, wood grain, stitching, or metal joinery.
7. Luxury Living Room Lifestyle Setting: The piece styled naturally inside a sunlit, contemporary luxury residential interior.
8. Evening Ambient Salon Setting: Warm, atmospheric residential scene with designer floor lamps and soft evening illumination.
9. Scale & Spatial Staging: Staged naturally alongside complementary decor (side table, rug, or arch window) showing real-world proportions.
10. Dramatic Showroom Pedestal Hero Shot: Spotlight illuminated commercial catalog presentation on a neutral studio platform.` : `FOR THIS CATEGORY, INTELLIGENTLY GENERATE ${targetCount} RELEVANT PRODUCT & USAGE VIEWS:
Generate 10 distinct, category-appropriate commercial views (such as full flat-lay surface, 45-degree angle studio perspective, close-up texture/reflection macro, installed in-room living/bathroom/kitchen scene, commercial/hotel lobby installation, edge/joint craftsmanship detail, warm ambient lighting view, scale/packaging context, showroom pedestal display, and architectural perspective).`}

Return STRICT JSON:
{
  "structuralSpec": "exact seat count / structure sentence",
  "categoryIdentified": "${isFurniture ? 'Furniture' : 'General'}",
  "visualSummary": "brief visual description",
  "prompts": [
    "prompt 1...",
    "prompt 2...",
    ... exactly ${targetCount} prompts
  ]
}`;

  try {
    const response = await callOpenAIWithRetry(() =>
      openaiClient.generateWithVision(userPrompt, originalImage, {
        modelType: 'vision',
        systemPrompt,
        expectJson: true,
        temperature: 0.4,
      })
    );

    const rawText = response.text;
    if (!rawText) return [];
    const parsed = JSON.parse(rawText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim());
    const structuralSpec = typeof parsed.structuralSpec === 'string' ? parsed.structuralSpec.trim() : '';
    const prompts = Array.isArray(parsed.prompts) ? parsed.prompts : [];
    return { prompts, structuralSpec };
  } catch (err) {
    console.error('[ImageGen] Failed to generate perspective prompts from original image:', err);
    return { prompts: [], structuralSpec: '' };
  }
};

// Wraps a scene prompt so the image model edits the reference photo instead of re-imagining the product.
const buildIdentityLockedPrompt = (scenePrompt, structuralSpec) =>
  `Use the provided reference photo as the exact product. Keep the product 100% identical: ${structuralSpec || 'same product type, same number of seats/units, same proportions'}. ` +
  `Do NOT change the number of seats, size, proportions, armrests, backrest, cushions, legs, material, stitching or colour. ` +
  `Do NOT turn it into a different model or a smaller/larger variant (e.g. never a 2-seater instead of a 3-seater). ` +
  `Change ONLY the camera angle, viewpoint, lighting, background and staging as follows: ${scenePrompt}`;

// Accepts a data URL, an http(s) URL, or { base64, mimeType }; returns { buffer, mimeType } or null.
const resolveImageBuffer = async (image) => {
  try {
    if (!image) return null;
    if (typeof image === 'object') {
      if (Buffer.isBuffer(image.buffer)) return { buffer: image.buffer, mimeType: image.mimeType || 'image/png' };
      if (image.base64) return { buffer: Buffer.from(image.base64, 'base64'), mimeType: image.mimeType || 'image/png' };
      return null;
    }
    const dataMatch = /^data:(image\/[\w.+-]+);base64,(.+)$/s.exec(image);
    if (dataMatch) return { buffer: Buffer.from(dataMatch[2], 'base64'), mimeType: dataMatch[1] };
    if (/^https?:\/\//.test(image)) {
      const res = await fetchImage(image, 15000);
      if (!res || !res.ok) return null;
      const mimeType = (res.headers.get('content-type') || 'image/png').split(';')[0].trim();
      return { buffer: Buffer.from(await res.arrayBuffer()), mimeType };
    }
  } catch (err) {
    console.warn('[ImageGen] Could not read original image:', err.message);
  }
  return null;
};

// Image-to-image generation anchored to the reference photo. Returns a CDN URL / data URL, or null.
const generateFromReference = async (prompt, reference) => {
  const result = await callOpenAIWithRetry(() =>
    openaiClient.editImage(prompt, reference, { size: '1024x1024', quality: 'medium' })
  );
  if (!result || !result.base64) return null;
  await OpenAIUsageTracker.trackUsage(
    { inputTokens: result.inputTokens, outputTokens: result.outputTokens, totalTokens: result.totalTokens },
    'product-image', null, '/api/products/generate-content', result.model
  ).catch(() => {});
  const uploaded = await uploadBufferToCloudinary(Buffer.from(result.base64, 'base64'));
  return uploaded || result.dataUrl;
};

/**
 * Generates the same product in several colours from one original photo.
 * Only the colour changes; every structural detail is locked to the original.
 * Returns [{ colour, image }] (image is null when generation failed for that colour).
 */
const generateColourVariantImages = async (originalImage, colours, { name } = {}) => {
  const reference = await resolveImageBuffer(originalImage);
  if (!reference) throw new Error('Could not read the original product image.');

  // Lock the structure once from the original, then reuse it for every colour.
  let structuralSpec = '';
  try {
    const response = await callOpenAIWithRetry(() =>
      openaiClient.generateWithVision(
        'Describe this product\'s exact physical structure in ONE sentence: product type, exact number of seats/units, cushions, armrests, legs, shape and proportions. Be precise about counts.',
        originalImage,
        { modelType: 'vision', temperature: 0.1, maxTokens: 120 }
      )
    );
    structuralSpec = (response.text || '').trim();
  } catch (err) {
    console.warn('[ColourVariants] Structure analysis failed, continuing with generic lock:', err.message);
  }

  const results = [];
  for (const colour of colours) {
    const prompt =
      `Use the provided reference photo as the exact product. Recolour ONLY the main upholstery/body of the product to ${colour}. ` +
      `Everything else stays pixel-faithful to the reference: ${structuralSpec || 'same product type, same number of seats/units, same proportions'}. ` +
      `Keep the same camera angle, framing, background, lighting, shadows, shape, size, proportions, seat count, armrests, backrest, cushions, legs, stitching and texture. ` +
      `Do not redesign, resize, add or remove any part. Realistic ${colour} colour with natural fabric/material shading.` +
      (name ? ` Product: ${name}.` : '');
    let image = null;
    try {
      image = await generateFromReference(prompt, reference);
    } catch (err) {
      console.error(`[ColourVariants] ${colour} failed:`, err.message);
    }
    results.push({ colour, image });
  }
  return results;
};

// =============================================================================
// Dimensions: always Length x Width/Depth x Height, never partial for 3-D furniture
// =============================================================================
const THREE_D_KEYWORDS = [
  'table', 'wardrobe', 'almirah', 'bed', 'cabinet', 'sofa', 'couch', 'chair', 'desk', 'shelf',
  'bookcase', 'dresser', 'sideboard', 'tv unit', 'stool', 'bench', 'furniture', 'cupboard',
  'drawer', 'ottoman', 'recliner', 'shoe rack',
];

const cleanNumber = (v) => {
  const m = String(v ?? '').replace(/,/g, '').match(/\d+(\.\d+)?/);
  return m ? m[0] : '';
};

/**
 * Normalises the AI "dimensions" object.
 *  - accepts depth as an alias of width, and the legacy { height, width } shape
 *  - for 3-D furniture, formatted is only produced when length, width and height are ALL known;
 *    otherwise it is '' and needsManualEntry is true (values are never invented)
 */
const normalizeDimensions = (raw, contextText = '') => {
  const d = raw && typeof raw === 'object' ? raw : {};
  const length = cleanNumber(d.length);
  const width = cleanNumber(d.width || d.depth);
  const height = cleanNumber(d.height);
  const thickness = typeof d.thickness === 'string' ? d.thickness.trim() : (d.thickness ? String(d.thickness) : '');
  const unit = (String(d.unit || '').trim().toLowerCase()) || ((length || width || height) ? 'cm' : '');
  const requiresThree = THREE_D_KEYWORDS.some(k => contextText.toLowerCase().includes(k));

  let formatted = '';
  let needsManualEntry = false;
  if (requiresThree) {
    if (length && width && height) formatted = `${length} × ${width} × ${height} ${unit}`.trim();
    else needsManualEntry = true;
  } else if (length && width) {
    formatted = [length, width, height].filter(Boolean).join(' × ') + ` ${unit}`;
    formatted = formatted.trim();
  }

  return { length, width, height, thickness, unit, formatted, requiresThreeDimensions: requiresThree, needsManualEntry };
};

// =============================================================================
// Generate Product Content (description, HSN, SKU, SEO, specs) + optional image
// =============================================================================
const generateProductContent = async (
  name, category, subcategory, subsubcategory,
  brand, material, color, dimensions, thickness,
  sku, generateImage = false, customPrompt = "", imageCount = null,
  originalImage = null
) => {
  try {
    const catText = `${category || ''} ${subcategory || ''} ${subsubcategory || ''}`.toLowerCase();
    const isHardware = catText.includes('hardware');
    const defaultTargetCount = isHardware ? 3 : 2;
    const targetCount = Number.isFinite(imageCount) && imageCount > 0
      ? Math.min(imageCount, 10)
      : defaultTargetCount;
    const imagePromptCount = targetCount;

    let prompt = `You are a premium product copywriter, technical database specialist, and SEO specialist for Riddha Interior Mart (RIMX), an e-commerce platform specializing in home interiors, building materials, furniture, tiles, hardware, and electrical fittings.

Your task is to research the product using the given Product Name and SKU/Model Number (recall the real manufacturer datasheet for this exact SKU if you recognize it) and generate complete, accurate, category-appropriate catalog details — written the same way a professional BOQ (Bill of Quantities) line item or manufacturer spec sheet is written.

INPUTS:
- Product Name: ${name || 'N/A'}
- SKU / Model Number: ${sku || 'N/A'}
- Category: ${category || 'N/A'}
- Subcategory: ${subcategory || 'N/A'}
- Sub-subcategory: ${subsubcategory || 'N/A'}
- Brand (Current Selection): ${brand && brand !== 'other' && brand !== 'N/A' ? brand : 'None selected yet'}
- Material (Current Selection): ${material || 'N/A'}
- Color (Current Selection): ${color || 'N/A'}
- Dimensions (Current Selection): ${dimensions || 'N/A'}
- Thickness (Current Selection): ${thickness || 'N/A'}

CRITICAL RULE — FIELDS MUST MATCH THE ACTUAL PRODUCT TYPE, NOT A FIXED TEMPLATE:
Different product types have completely different relevant specifications. Do NOT force generic "Dimensions" or "Thickness" onto every product. Decide which fields a real manufacturer datasheet for THIS exact product type would list. Examples:
- Lighting / electrical fixtures / switches / MCBs: NO thickness, NO dimensions — instead use fields like Wattage, Voltage, Lumens, Beam Angle, Colour Temperature, IP Rating, Standard.
- Wires / cables: NO dimensions/thickness — instead use Size (Sq.mm), Core, Conductor, Insulation, Voltage Grade, Standard, Packing/Coil Length.
- Drawer systems / channels / kitchen hardware / fittings: use a specific named measurement instead of generic "Dimensions" (e.g. "Drawer Side Height", "Channel Length", "Load Capacity") plus Make, Model/Series, Type, Application, Finish, Unit.
- Tiles / marble / plywood / glass / sheets: DO use Dimensions AND Thickness (e.g. 600x600mm, 12mm).
- Furniture (tables, dining tables, wardrobes, beds, cabinets, sofas, chairs, desks, shelves, etc.): ALWAYS three-dimensional. Use Length x Width/Depth x Height (in that exact order) plus Material/Finish; Thickness only if relevant (e.g. tabletop).
Only output a field if it is something a genuine manufacturer datasheet for this exact product type would actually list.

YOUR TASK — Return the following:
1. **Description**: Premium, SEO-optimized product description (50-80 words), professional catalog tone, highlighting quality, durability, application, and installation where relevant.
2. **Short Description**: ONE single sentence (max 25 words) written like a formal BOQ line item, e.g. "Providing and fixing Hettich AvantTech YOU 101mm height drawer system, comprising slim metal drawer sides, concealed Actro YOU full-extension soft-close runners, complete with installation."
3. **HSN Code**: The most appropriate 6-digit HSN code under Indian GST rules for this product.
4. **Brand Name**: If Brand (Current Selection) is provided and not 'None selected yet', return that exact brand name. If NO brand is currently selected (or is 'None selected yet'), infer or suggest a realistic, reputable brand name suitable for this exact product type and category (e.g., Andres, Hettich, Polycab, CenturyPly, Kajaria, Jaquar, Asian Paints, Godrej, Philips). Do not return generic words like 'Generic' or 'Unknown' or 'other' unless completely impossible to infer.
5. **SEO Keywords**: Array of 5-8 high-traffic search terms.
6. **Specifications**: Flat JSON of 6-10 technical attributes specific to THIS product type only (follow the CRITICAL RULE above). For example, a drawer system: {"Make": "Hettich", "Model/Series": "AvantTech YOU", "Drawer Side Height": "101 mm", "Type": "Full Extension / Soft Close", "Application": "Modular Kitchen / Wardrobe", "Finish": "Anthracite", "Unit": "Set Nos"}. A wire: {"Make": "Polycab", "Size": "1.5 Sq.mm", "Core": "Single Core", "Conductor": "99.97% Electrolytic Copper", "Insulation": "FR-PVC", "Voltage Grade": "1100V", "Standard": "IS 694"}. If a "Material" attribute is included, state the specific raw material (e.g. "Copper", "Teak Wood", "Ceramic") rather than vague adjectives like "Premium" or "First Quality".
7. **Dimensions & Thickness**: ONLY populate if this product type genuinely has a standard size and/or thickness (per the CRITICAL RULE). Return a flat JSON object with "length", "width", "height", "thickness", "unit".
   - First identify the exact product type (e.g. dining table, coffee table, wardrobe, bed, cabinet, tile).
   - THREE-DIMENSIONAL products (any furniture such as tables, dining tables, wardrobes, beds, cabinets, sofas, chairs, desks, shelves): provide ALL THREE of "length", "width" (this is the Width/Depth) and "height". Never return only two of them.
   - Flat products (tiles, sheets, glass, plywood): "length" and "width" (and "thickness"); leave "height" empty.
   - Numbers only (no units inside the values); put the unit in "unit" (use "cm" for furniture, "mm" for tiles/sheets).
   - Use real values from the SKU / datasheet / the current selection above when known. If you cannot determine a measurement with reasonable confidence, leave that field as an empty string "". NEVER invent or guess numbers; empty is correct when unsure.
   - Leave everything empty for products that do not use generic dimensions (lights, wires, switches).
8. **Image Prompts**: An array of ${imagePromptCount} highly descriptive, professional studio product photography prompts (each 20-30 words), one per distinct angle/shot so the listing has multiple real reference images — e.g. index 0: full product overall shot, index 1: close-up material/texture/detail shot, index 2: packaging/box or in-use/installed shot. Each prompt must describe exact material, color, finish, angle, professional studio lighting, and a clean minimalist backdrop.
`;

    if (customPrompt && customPrompt.trim()) {
      prompt += `\n\nCRITICAL VENDOR/ADMIN REQUESTED IMAGE AND DETAILS INSTRUCTIONS TO FOLLOW STRICTLY:\n${customPrompt}\n`;
    }

    prompt += `\nOUTPUT FORMAT (STRICT JSON). Ensure all double quotes inside string values are properly escaped (e.g. \\"...) and no raw newlines are used inside the values:
{
  "description": "...",
  "short_description": "...",
  "hsn_code": "XXXXXX",
  "brand_name": "...",
  "seo_keywords": ["keyword1", "keyword2"],
  "specifications": { "Attribute1": "Value1" },
  "dimensions": {
    "length": "...",
    "width": "...",
    "height": "...",
    "thickness": "...",
    "unit": "..."
  },
  "image_prompts": ["prompt for shot 1", "prompt for shot 2"]
}
`;

    const response = await callOpenAIWithRetry(
      () =>
        openaiClient.generateText(prompt, {
          modelType: 'general',
          expectJson: true,
          temperature: 0.4,
          maxTokens: 1200,
        }),
      5
    );

    await OpenAIUsageTracker.trackUsage(
      {
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        totalTokens: response.totalTokens,
      },
      'product-content',
      null,
      '/api/products/generate-content',
      response.model
    );

    const text = response.text;
    if (!text) return null;

    const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
    parsed.dimensions = normalizeDimensions(parsed.dimensions, `${name || ''} ${category || ''} ${subcategory || ''} ${subsubcategory || ''}`);
    const images = [];

    // ── Image Sourcing (only when vendor explicitly requests it) ────────────────
    if (generateImage) {
      const baseCacheKey = (sku || name || '').trim().toLowerCase();
      let prompts = [];
      let referenceImage = null;

      // If an original product image was uploaded, analyze it with GPT-4o Vision to produce
      // identity-preserving multi-angle perspective prompts (up to targetCount, e.g. 10).
      if (originalImage) {
        console.log(`[ImageGen] Original product image supplied! Generating ${targetCount} identity-preserving perspective prompts...`);
        const perspective = await generateTenPerspectivePromptsFromImage(originalImage, {
          name,
          category,
          subcategory,
          material,
          color,
          customPrompt,
          targetCount
        });
        prompts = perspective.prompts.map(pr => buildIdentityLockedPrompt(pr, perspective.structuralSpec));
        referenceImage = await resolveImageBuffer(originalImage);
        console.log(`[ImageGen] Generated ${prompts.length} identity-locked prompts from original image (reference ${referenceImage ? 'loaded' : 'MISSING'}).`);
      } else {
        // 1) Real image search by product name + SKU (only when no original image was provided)
        const searchQuery = `${name || ''} ${sku || ''}`.trim();
        console.log(`[ImageGen] Searching real product images for: "${searchQuery}"`);
        const searchCandidates = await searchProductImages(searchQuery, targetCount * 4);

        for (const candidateUrl of searchCandidates) {
          if (images.length >= targetCount) break;
          const cacheKey = baseCacheKey ? `${baseCacheKey}::search::${candidateUrl}` : '';
          if (cacheKey && imageCache.has(cacheKey)) {
            images.push(imageCache.get(cacheKey));
            continue;
          }
          const imgRes = await fetchImage(candidateUrl, 8000);
          if (!imgRes || !imgRes.ok) continue;
          const contentType = (imgRes.headers.get('content-type') || '').split(';')[0].trim();
          if (!contentType.startsWith('image/')) continue;
          const arrayBuffer = await imgRes.arrayBuffer();
          if (arrayBuffer.byteLength < 3000) continue; // skip broken/placeholder pixels
          const buffer = Buffer.from(arrayBuffer);
          let finalUrl = null;
          try {
            finalUrl = await uploadBufferToCloudinary(buffer);
          } catch (_) {}
          if (!finalUrl) {
            finalUrl = `data:${contentType};base64,${buffer.toString('base64')}`;
          }
          images.push(finalUrl);
          if (cacheKey) imageCache.set(cacheKey, finalUrl);
          console.log(`[ImageGen] Found real product image via search (${arrayBuffer.byteLength} bytes) -> ${finalUrl.startsWith('http') ? 'Cloudinary' : 'Base64'}`);
        }

        if (images.length > 0) {
          console.log(`[ImageGen] ${images.length}/${targetCount} image(s) filled from real search results.`);
        }
      }

      // 2) AI-generate any remaining unfilled slots
      const remaining = targetCount - images.length;
      if (prompts.length === 0 && remaining > 0) {
        prompts = (Array.isArray(parsed.image_prompts) && parsed.image_prompts.length > 0
          ? parsed.image_prompts.slice(0, remaining)
          : [parsed.image_prompt || `${name || 'interior product'} studio photo, white background, professional lighting`]);
      }

      if (prompts.length > 0) {
        console.log(`[ImageGen] Generating ${prompts.length} AI fallback image(s) for: "${name}"`);
      }

      for (let i = 0; i < prompts.length; i++) {
        // With an original photo we edit THAT photo (image-to-image), so the product cannot drift.
        // There is deliberately no text-to-image fallback here: a missing angle is better than a wrong product.
        if (referenceImage) {
          try {
            const refUrl = await generateFromReference(prompts[i], referenceImage);
            if (refUrl) images.push(refUrl);
            else console.error(`[ImageGen] Reference-based image ${i} returned no data.`);
          } catch (err) {
            console.error(`[ImageGen] Reference-based image ${i} failed:`, err.message);
          }
          continue;
        }

        const cacheKey = baseCacheKey ? `${baseCacheKey}::${i}` : '';
        if (cacheKey && imageCache.has(cacheKey)) {
          console.log(`[ImageGen] Serving image ${i} from cache for key: ${cacheKey}`);
          images.push(imageCache.get(cacheKey));
          continue;
        }

        if (i > 0) {
          // Stagger requests between images to respect Pollinations rate limits
          await sleep(4000);
        }

        const aiPrompt = prompts[i];
        const simplePrompt = `${name || 'interior product'} product photo${i > 0 ? `, alternate angle ${i + 1}` : ''}, clean white background`;
        const seed = Date.now() + i;

        // Vary model across attempts (not just prompt) — Pollinations rate-limits/errors
        // tend to be per-model, so a same-model retry immediately after a failure often
        // fails again; rotating models gives each retry a real chance.
        const attempts = [
          {
            label: `Image ${i} Attempt 1 (AI prompt, turbo model)`,
            url: `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=800&height=800&nologo=true&model=turbo&seed=${seed}`,
            timeout: 20000,
          },
          {
            label: `Image ${i} Attempt 2 (AI prompt, default flux model)`,
            url: `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=800&height=800&nologo=true&seed=${seed + 1}`,
            timeout: 22000,
          },
          {
            label: `Image ${i} Attempt 3 (simple prompt fallback, dreamshaper model)`,
            url: `https://image.pollinations.ai/prompt/${encodeURIComponent(simplePrompt)}?width=800&height=800&nologo=true&model=dreamshaper&seed=${seed + 2}`,
            timeout: 20000,
          },
        ];

        let imageBase64 = null;
        for (let a = 0; a < attempts.length; a++) {
          const { label, url: imgUrl, timeout } = attempts[a];
          if (a > 0) await sleep(4000);

          console.log(`[ImageGen] ${label}`);
          const imageRes = await fetchImage(imgUrl, timeout);

          if (imageRes && imageRes.ok) {
            const arrayBuffer = await imageRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            let uploadedUrl = null;
            try {
              uploadedUrl = await uploadBufferToCloudinary(buffer);
            } catch (_) {}
            imageBase64 = uploadedUrl || `data:image/jpeg;base64,${buffer.toString('base64')}`;
            console.log(`[ImageGen] SUCCESS on ${label}. Mode: ${uploadedUrl ? 'Cloudinary CDN' : 'Base64 fallback'}`);
            break;
          }

          const status = imageRes ? `HTTP ${imageRes.status}` : 'timeout/network error';
          console.warn(`[ImageGen] ${label} failed (${status}).`);
        }

        if (imageBase64) {
          images.push(imageBase64);
          if (cacheKey) imageCache.set(cacheKey, imageBase64);
        } else {
          console.error(`[ImageGen] All attempts exhausted for image ${i}.`);
        }
      }
    }

    return { ...parsed, image: images[0] || null, images };

  } catch (error) {
    console.error('Error generating product content via OpenAI:', error);
    throw new Error(`Failed to generate product content: ${error.message}`);
  }
};

/**
 * Analyze a single product photo using GPT-4o Vision, extract comprehensive product details,
 * and generate respective matching photos (room setting, macro texture, studio angle).
 */
const analyzeProductPhotoAndGenerate = async (
  imageData,
  availableCategories = [],
  generateMatchingImages = true,
  imageCount = 3,
  customInstructions = ''
) => {
  try {
    if (!imageData) {
      throw new Error('Image data (base64 or URL) is required for analysis');
    }

    const systemPrompt = `You are a world-class interior design, architectural materials, and e-commerce catalog specialist.
Your task is to analyze the uploaded product photo with precision and generate complete, production-ready product listing data.
Return ONLY valid JSON matching the exact schema requested.`;

    const userPrompt = `Analyze this product photograph in detail.

${availableCategories && availableCategories.length > 0 ? `Available Categories in our catalog:\n${JSON.stringify(availableCategories, null, 2)}` : ''}
${customInstructions ? `Special Instructions / Focus: ${customInstructions}` : ''}

Extract and generate the following JSON structure:
1. "name": An attractive, highly professional, SEO-optimized product title (e.g., "Calacatta Oro Polished Vitrified Floor Tile 600x1200mm", "Nordic Solid Oak Minimalist Dining Chair").
2. "category": Pick the best matching category from the available categories list above. If not in the list, provide the most appropriate industry category (e.g., "Flooring", "Furniture", "Lighting", "Bath Fitting", "Marble", "Modular Kitchen").
3. "subcategory": The specific subcategory (e.g. "Ceramic Floor Tiles", "Pendant Lights", "Office Chairs").
4. "subsubcategory": The specific sub-subcategory or product type if applicable (or "" if not applicable).
5. "material": The exact primary material (e.g. "Vitrified Porcelain", "Solid Teak Wood", "Brass", "Tempered Glass").
6. "color": Color description (e.g. "Warm White with Golden Grey Veins").
7. "finish": Surface finish or texture (e.g. "Glossy Mirror Finish", "Matte", "Brushed Satin", "Wood Grain").
8. "dimensions": Industry-standard dimensions (e.g. "600 x 1200 mm", "45 x 55 x 85 cm").
9. "thickness": Standard thickness with unit if relevant (e.g. "9 mm", "12 mm") or "".
10. "sku": Clean model / SKU code suggestion (e.g. "RIM-FLR-001").
11. "hsnCode": Accurate 4-8 digit Indian GST HSN code for this product type.
12. "shortDescription": 1-2 sentence compelling summary for product card view.
13. "description": Comprehensive, rich marketing description (100-250 words) detailing design style, architectural applications (e.g. living room, bathroom, facade), durability, maintenance, and elegance.
14. "specifications": Object of 5 to 8 key technical specifications (e.g., {"Water Absorption": "< 0.05%", "Finish Type": "High Gloss Polished", "Application Area": "Indoor Floors & Walls", "Stain Resistance": "Class 5", "Edge Type": "Rectified / Seamless"}).
15. "seoKeywords": Array of 6 to 10 relevant search keywords.
16. "photoPerspectives": Array of ${Math.min(Math.max(imageCount, 1), 4)} image generation prompts for generating DIFFERENT matching photos of this EXACT same product:
    - Perspective 1 (Lifestyle / In-Room Architecture): Describe a stunning, sunlit luxury interior scene (e.g. modern living room, luxury bathroom, designer kitchen, or boutique hotel) featuring this exact product installed or displayed in place. Photorealistic architectural photography, 8k resolution.
    - Perspective 2 (Macro Detail & Texture): Describe a studio macro close-up shot focusing directly on the product's surface texture, pattern, finish, and material reflections with clean studio lighting.
    - Perspective 3 (Showroom Perspective Angle): Describe a 45-degree angle studio product shot on an elevated neutral pedestal or contemporary studio platform, crisp shadows, commercial catalog photography.

Output strictly valid JSON with no markdown backticks or commentary:
{
  "name": "...",
  "category": "...",
  "subcategory": "...",
  "subsubcategory": "...",
  "material": "...",
  "color": "...",
  "finish": "...",
  "dimensions": "...",
  "thickness": "...",
  "sku": "...",
  "hsnCode": "...",
  "shortDescription": "...",
  "description": "...",
  "specifications": {},
  "seoKeywords": [],
  "photoPerspectives": []
}`;

    console.log('[AI Photo Studio] Analyzing uploaded image with GPT-4o Vision...');
    const visionResponse = await callOpenAIWithRetry(() =>
      openaiClient.generateWithVision(userPrompt, imageData, {
        modelType: 'vision',
        systemPrompt,
        expectJson: true,
        temperature: 0.5,
      })
    );

    await OpenAIUsageTracker.trackUsage(
      {
        inputTokens: visionResponse.inputTokens,
        outputTokens: visionResponse.outputTokens,
        totalTokens: visionResponse.totalTokens,
      },
      'photo-vision-analysis',
      null,
      '/api/products/ai-scan-photo',
      visionResponse.model
    );

    const rawText = visionResponse.text;
    if (!rawText) {
      throw new Error('No analysis returned from vision model');
    }

    const parsed = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
    console.log('[AI Photo Studio] Vision analysis complete for product:', parsed.name);

    const generatedImages = [];
    if (generateMatchingImages && Array.isArray(parsed.photoPerspectives) && parsed.photoPerspectives.length > 0) {
      const targetCount = Math.min(parsed.photoPerspectives.length, imageCount || 3);
      console.log(`[AI Photo Studio] Generating ${targetCount} matching perspective images...`);

      for (let i = 0; i < targetCount; i++) {
        const perspectivePrompt = parsed.photoPerspectives[i];
        const seed = Date.now() + i * 17;
        if (i > 0) {
          await sleep(2500); // polite stagger
        }

        const attempts = [
          {
            label: `Matching Photo ${i + 1} (Turbo model)`,
            url: `https://image.pollinations.ai/prompt/${encodeURIComponent(perspectivePrompt)}?width=1000&height=1000&nologo=true&model=turbo&seed=${seed}`,
            timeout: 20000,
          },
          {
            label: `Matching Photo ${i + 1} (Flux model fallback)`,
            url: `https://image.pollinations.ai/prompt/${encodeURIComponent(perspectivePrompt)}?width=1000&height=1000&nologo=true&seed=${seed + 1}`,
            timeout: 22000,
          },
          {
            label: `Matching Photo ${i + 1} (Dreamshaper model fallback)`,
            url: `https://image.pollinations.ai/prompt/${encodeURIComponent(`${parsed.name || 'product'} studio photography, luxury interior design`) }?width=1000&height=1000&nologo=true&model=dreamshaper&seed=${seed + 2}`,
            timeout: 20000,
          }
        ];

        let finalImageUrl = null;
        for (let a = 0; a < attempts.length; a++) {
          const { label, url: imgUrl, timeout } = attempts[a];
          if (a > 0) await sleep(2500);

          console.log(`[AI Photo Studio] Attempting ${label}...`);
          const imgRes = await fetchImage(imgUrl, timeout);
          if (imgRes && imgRes.ok) {
            const arrayBuffer = await imgRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            let uploadedUrl = null;
            try {
              uploadedUrl = await uploadBufferToCloudinary(buffer);
            } catch (_) {}
            finalImageUrl = uploadedUrl || `data:image/jpeg;base64,${buffer.toString('base64')}`;
            console.log(`[AI Photo Studio] SUCCESS on ${label} -> ${uploadedUrl ? 'Cloudinary CDN' : 'Base64 fallback'}`);
            break;
          }
        }

        if (finalImageUrl) {
          generatedImages.push({
            url: finalImageUrl,
            perspective: i === 0 ? 'Room Setting' : (i === 1 ? 'Texture Detail' : 'Showroom Angle'),
            prompt: perspectivePrompt
          });
        }
      }
    }

    return {
      details: parsed,
      generatedImages,
    };
  } catch (error) {
    console.error('[AI Photo Studio] Error in analyzeProductPhotoAndGenerate:', error);
    throw error;
  }
};

module.exports = {
  generateHSNCode,
  generateProductContent,
  analyzeProductPhotoAndGenerate,
  generateColourVariantImages,
};
