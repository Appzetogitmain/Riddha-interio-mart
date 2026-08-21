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
const fetchImage = async (url, timeoutMs) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const originalTlsReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  try {
    // Disable TLS unauthorized checks temporarily to avoid cert issues (e.g. self-signed or missing root certs)
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const res = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
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
  sku, generateImage = false, customPrompt = ""
) => {
  try {
    let prompt = `You are a premium product copywriter, database specialist, and SEO specialist for Riddha Interior Mart (RIMX), an e-commerce platform specializing in home interiors, building materials, furniture, tiles, and fittings.

Your primary objective is to research the product using the provided Model Number / SKU and other inputs, and generate complete, highly accurate catalog details.

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

YOUR TASK:
1. **Description**: Premium, SEO-optimized product description (50-80 words). Highlight quality, durability, aesthetics, and usage scenarios.
2. **HSN Code**: The most appropriate 6-digit HSN code under Indian GST rules for this product.
3. **Brand Name**: Inferred brand/manufacturer name based on the SKU/Model Number, Product Name, and Category (e.g., Sleepwell, CenturyPly, Kajaria, Jaquar, Asian Paints, etc.). If you cannot infer it, return the Brand (Current Selection) or "other".
4. **SEO Keywords**: Array of 5-8 high-traffic search terms.
5. **Specifications**: Flat JSON of 4-6 technical attributes specific to this product type (e.g., {"Finish": "Glossy", "Material": "Ceramic", "Warranty": "5 Years"}). Ensure the "Material" attribute contains the specific raw material composition (e.g., "Copper" for copper wires, "Teak Wood" for wood furniture, "Ceramic" or "Clay" for tiles) rather than generic adjectives like "Premium", "First Quality", or "Locat".
6. **Dimensions & Thickness**: Parse or infer dimensions and thickness values. Do not remove thickness, as some items (like tiles, glass, plywood) have thickness, while other items have only length, width, and height. Create a flat JSON object containing "height", "width", "thickness", and "unit" if they can be determined/inferred from the inputs or SKU. Return empty strings for any fields you cannot determine.
7. **Image Prompt**: A highly descriptive, detailed, professional studio product photography prompt (25-35 words). Describe the product setup, specific material textures, color details, angles, professional studio lighting, and a clean minimalist backdrop to guide the image generator accurately.
`;

    if (customPrompt && customPrompt.trim()) {
      prompt += `\n\nCRITICAL VENDOR/ADMIN REQUESTED IMAGE AND DETAILS INSTRUCTIONS TO FOLLOW STRICTLY:\n${customPrompt}\n`;
    }

    prompt += `\nOUTPUT FORMAT (STRICT JSON). Ensure all double quotes inside string values are properly escaped (e.g. \\"...) and no raw newlines are used inside the values:
{
  "description": "...",
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
  "image_prompt": "..."
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
    let imageBase64 = null;

    // ── Image Generation (only when vendor explicitly requests it) ─────────────
    if (generateImage) {
      const cacheKey = (sku || name || '').trim().toLowerCase();
      if (cacheKey && imageCache.has(cacheKey)) {
        console.log(`[ImageGen] Serving image from cache for key: ${cacheKey}`);
        imageBase64 = imageCache.get(cacheKey);
      } else {
        console.log(`[ImageGen] Starting image generation for: "${name}"`);

        // AI-generated prompt from the content model (already short due to the word limit)
        // Falls back to a clean, concise prompt if missing
        const aiPrompt = parsed.image_prompt ||
          `${name || 'interior product'} studio photo, white background, professional lighting`;
        const simplePrompt = `${name || 'interior product'} product photo, clean white background`;

        // 4-attempt cascade with robust timeouts and 4-second gaps between attempts
        const attempts = [
          {
            label: 'Attempt 1 (AI prompt, turbo model - FAST & STABLE)',
            url: `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=800&height=800&nologo=true&model=turbo`,
            timeout: 20000,
          },
          {
            label: 'Attempt 2 (AI prompt, default flux model)',
            url: `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=800&height=800&nologo=true`,
            timeout: 25000,
          },
          {
            label: 'Attempt 3 (simple prompt, turbo model)',
            url: `https://image.pollinations.ai/prompt/${encodeURIComponent(simplePrompt)}?width=800&height=800&nologo=true&model=turbo`,
            timeout: 20000,
          },
          {
            label: 'Attempt 4 (dreamshaper model)',
            url: `https://image.pollinations.ai/prompt/${encodeURIComponent(simplePrompt)}?model=dreamshaper`,
            timeout: 20000,
          },
        ];

        for (let i = 0; i < attempts.length; i++) {
          const { label, url: imgUrl, timeout } = attempts[i];

          // Wait 4 seconds before each retry to respect Pollinations rate limits
          if (i > 0) {
            console.log(`[ImageGen] Waiting 4s before ${label}...`);
            await sleep(4000);
          }

          console.log(`[ImageGen] ${label}`);
          const imageRes = await fetchImage(imgUrl, timeout);

          if (imageRes && imageRes.ok) {
            const arrayBuffer = await imageRes.arrayBuffer();
            imageBase64 = `data:image/jpeg;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
            console.log(`[ImageGen] SUCCESS on ${label}. Size: ${imageBase64.length} chars`);
            // Cache the successfully generated image
            imageCache.set(cacheKey, imageBase64);
            break;
          }

          let errorSnippet = '';
          if (imageRes) {
            try {
              const text = await imageRes.text();
              errorSnippet = ` - Body: ${text.slice(0, 150).replace(/\s+/g, ' ')}`;
            } catch (e) {}
          }
          const status = imageRes ? `HTTP ${imageRes.status}${errorSnippet}` : 'timeout/network error';
          const hasNext = i < attempts.length - 1;
          console.warn(`[ImageGen] ${label} failed (${status}). ${hasNext ? 'Trying next...' : 'All attempts exhausted.'}`);
        }

        if (!imageBase64) {
          console.error('[ImageGen] All 4 attempts failed. Returning content without image.');
        }
      }
    }

    return { ...parsed, image: imageBase64 };

  } catch (error) {
    console.error('Error generating product content via OpenAI:', error);
    throw new Error(`Failed to generate product content: ${error.message}`);
  }
};

module.exports = {
  generateHSNCode,
  generateProductContent,
};
