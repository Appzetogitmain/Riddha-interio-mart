const generateHSNCode = async (category, subcategory, productType, productName, description) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is missing in environment variables');
    }

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
3. Identify the most accurate Subheading (last 2 digits or more) based on Product Type and Product Name.
4. If an exact match exists, return the full 6-digit HSN code.
5. If an exact match is not found:
   - Try to find the closest matching HSN based on similar products.
   - Use industry-standard classification logic.
6. Do NOT guess randomly. Always follow structured classification.
7. Prefer commonly used GST HSN codes in India.

OUTPUT FORMAT (STRICT JSON):
{
  "hsn_code": "XXXXXX"
}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    };

    const fetchResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      throw new Error(`Gemini API error: ${fetchResponse.status} - ${errorText}`);
    }

    const data = await fetchResponse.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      const parsed = JSON.parse(text);
      return parsed.hsn_code;
    }
    return null;
  } catch (error) {
    console.error('Error generating HSN code via Gemini:', error);
    throw new Error(`Failed to generate HSN code: ${error.message}`);
  }
};

const generateProductContent = async (name, category, subcategory, brand, material, color, dimensions, thickness, generateImage = false) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is missing in environment variables');
    }

    const prompt = `You are a premium product copywriter and SEO specialist for Riddha Interior Mart (RIMX), an e-commerce platform specializing in home interiors, building materials, furniture, tiles, and fittings.

INPUTS:
- Product Name: ${name || 'N/A'}
- Category: ${category || 'N/A'}
- Subcategory: ${subcategory || 'N/A'}
- Brand: ${brand || 'N/A'}
- Material: ${material || 'N/A'}
- Color: ${color || 'N/A'}
- Dimensions: ${dimensions || 'N/A'}
- Thickness: ${thickness || 'N/A'}

YOUR TASK:
Generate outputs based on the input details:
1. **Description**: A premium, search-optimized, professional e-commerce product description (approx. 50-80 words). Emphasize quality, material durability, aesthetic value, and usage scenarios.
2. **HSN Code**: The most appropriate 6-digit HSN (Harmonized System of Nomenclature) code for this category under Indian GST rules.
3. **SKU**: Generate a unique, professional SKU in uppercase. Format: [First 3 letters of Brand]-[First 3 letters of Category]-[First 3 letters of Subcategory or Material]-[3 random digits] (e.g. LUX-SOF-FAB-182).
4. **SEO Keywords**: An array of 5 to 8 relevant, high-traffic search terms/keywords (e.g., "beige fabric sofa", "modern living room furniture").
5. **Specifications**: A flat JSON object of 4 to 6 relevant technical attributes/specifications for this product type (e.g., {"Warranty": "2 Years", "Seating Capacity": "3 Seater", "Style": "Modern", "Finish": "Glossy"}). Make them specific to the product type.
6. **Image Prompt**: A descriptive photo generation prompt (approx. 20-30 words) for a realistic studio product showcase of this item.

OUTPUT FORMAT (STRICT JSON):
{
  "description": "...",
  "hsn_code": "XXXXXX",
  "sku": "...",
  "seo_keywords": ["keyword1", "keyword2", "keyword3"],
  "specifications": {
    "Attribute1": "Value1",
    "Attribute2": "Value2"
  },
  "image_prompt": "..."
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    };

    const fetchResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      throw new Error(`Gemini API error: ${fetchResponse.status} - ${errorText}`);
    }

    const data = await fetchResponse.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      const parsed = JSON.parse(text);
      let imageBase64 = null;

      console.log(`Backend aiService: generateImage flag is:`, generateImage);
      if (generateImage) {
        const imagePrompt = parsed.image_prompt || parsed.imagePrompt || `Premium professional studio product photography of ${name || 'home interior product'}, category: ${category || 'decor'}, subcategory: ${subcategory || 'interior'}, clean studio background, high resolution, 8k`;
        try {
          console.log(`Generating AI product image via Pollinations AI for prompt: ${imagePrompt}`);
          const imageRes = await fetch(
            `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=800&height=800&nologo=true`,
            { signal: AbortSignal.timeout(25000) }
          );
          if (imageRes.ok) {
            const arrayBuffer = await imageRes.arrayBuffer();
            imageBase64 = `data:image/jpeg;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
            console.log("AI Image downloaded and converted to base64 successfully.");
          } else {
            console.error(`AI Image Generation failed with status: ${imageRes.status}`);
          }
        } catch (imgErr) {
          console.error("AI Image Generation failed:", imgErr.message || imgErr);
        }
      }

      return {
        ...parsed,
        image: imageBase64
      };
    }
    return null;
  } catch (error) {
    console.error('Error generating product content via Gemini:', error);
    throw new Error(`Failed to generate product content: ${error.message}`);
  }
};

module.exports = {
  generateHSNCode,
  generateProductContent
};
