const openaiClient = require('./openaiService');
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const OpenAIUsageTracker = require('./openaiUsageTracker');

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

// =============================================================================
// Generate Product Content (description, HSN, SKU, SEO, specs) + optional image
// =============================================================================
const generateProductContent = async (
  name, category, subcategory, subsubcategory,
  brand, material, color, dimensions, thickness,
  sku, generateImage = false, customPrompt = "", imageCount = null
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
- Brand (Current Selection): ${brand || 'N/A'}
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
- Furniture: use Dimensions (LxWxH) and Material/Finish; Thickness only if relevant (e.g. tabletop).
Only output a field if it is something a genuine manufacturer datasheet for this exact product type would actually list.

YOUR TASK — Return the following:
1. **Description**: Premium, SEO-optimized product description (50-80 words), professional catalog tone, highlighting quality, durability, application, and installation where relevant.
2. **Short Description**: ONE single sentence (max 25 words) written like a formal BOQ line item, e.g. "Providing and fixing Hettich AvantTech YOU 101mm height drawer system, comprising slim metal drawer sides, concealed Actro YOU full-extension soft-close runners, complete with installation."
3. **HSN Code**: The most appropriate 6-digit HSN code under Indian GST rules for this product.
4. **Brand Name**: Inferred brand/manufacturer name from the SKU/Model Number, Product Name, and Category (e.g., Hettich, Polycab, CenturyPly, Kajaria, Jaquar, Asian Paints). If not inferable, return the Brand (Current Selection) or "other".
5. **SEO Keywords**: Array of 5-8 high-traffic search terms.
6. **Specifications**: Flat JSON of 6-10 technical attributes specific to THIS product type only (follow the CRITICAL RULE above). For example, a drawer system: {"Make": "Hettich", "Model/Series": "AvantTech YOU", "Drawer Side Height": "101 mm", "Type": "Full Extension / Soft Close", "Application": "Modular Kitchen / Wardrobe", "Finish": "Anthracite", "Unit": "Set Nos"}. A wire: {"Make": "Polycab", "Size": "1.5 Sq.mm", "Core": "Single Core", "Conductor": "99.97% Electrolytic Copper", "Insulation": "FR-PVC", "Voltage Grade": "1100V", "Standard": "IS 694"}. If a "Material" attribute is included, state the specific raw material (e.g. "Copper", "Teak Wood", "Ceramic") rather than vague adjectives like "Premium" or "First Quality".
7. **Dimensions & Thickness**: ONLY populate if this product type genuinely has a standard length/width/height and/or thickness (per the CRITICAL RULE). Return a flat JSON object with "height", "width", "thickness", "unit" — leave ALL of them as empty strings "" if this product type does not use generic dimensions/thickness (e.g. lights, wires, switches). Never invent numbers you are not reasonably confident about.
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
    "height": "...",
    "width": "...",
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
    const images = [];

    // ── Image Sourcing (only when vendor explicitly requests it) ────────────────
    // Prefer real product photos found by searching the product name + SKU; only
    // fall back to AI-generated images for any slots a search couldn't fill.
    if (generateImage) {
      const baseCacheKey = (sku || name || '').trim().toLowerCase();

      // 1) Real image search by product name + SKU
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
        const b64 = `data:${contentType};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
        images.push(b64);
        if (cacheKey) imageCache.set(cacheKey, b64);
        console.log(`[ImageGen] Found real product image via search (${arrayBuffer.byteLength} bytes)`);
      }

      if (images.length > 0) {
        console.log(`[ImageGen] ${images.length}/${targetCount} image(s) filled from real search results.`);
      }

      // 2) AI-generate any remaining unfilled slots
      const remaining = targetCount - images.length;
      const prompts = remaining > 0
        ? (Array.isArray(parsed.image_prompts) && parsed.image_prompts.length > 0
          ? parsed.image_prompts.slice(0, remaining)
          : [parsed.image_prompt || `${name || 'interior product'} studio photo, white background, professional lighting`])
        : [];

      if (prompts.length > 0) {
        console.log(`[ImageGen] Generating ${prompts.length} AI fallback image(s) for: "${name}"`);
      }

      for (let i = 0; i < prompts.length; i++) {
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
            imageBase64 = `data:image/jpeg;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
            console.log(`[ImageGen] SUCCESS on ${label}. Size: ${imageBase64.length} chars`);
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

module.exports = {
  generateHSNCode,
  generateProductContent,
};
