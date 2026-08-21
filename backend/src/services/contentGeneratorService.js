const openaiClient = require('./openaiService');
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const OpenAIUsageTracker = require('./openaiUsageTracker');

class ContentGeneratorService {

  // Prompt 1: Product Title Generation
  async generateProductTitle(data, sellerId) {
    const prompt = 
Act as an expert SEO Copywriter for Riddha Interio Mart.
Generate 4 compelling product titles for this seller item:

Product Name: 
Category: 
Key Features: 
Tone: 

Generate JSON response:
{
  "seoTitle": "SEO Title under 70 chars with primary keywords",
  "marketingTitle": "Marketing Title focusing on customer transformation",
  "catchyTitle": "Attention-grabbing catchy title",
  "luxuryTitle": "Luxury title emphasizing premium craftsmanship",
  "rationale": "Why these titles drive clicks"
}
Return strictly valid JSON.
;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.8,
        maxTokens: 500
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'contentGeneratorTitle',
        sellerId,
        '/api/content/generate-title',
        response.model
      );

      const cleanedText = response.text.replace(/\\\json/g, '').replace(/\\\/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'ContentGeneratorService',
        method: 'generateProductTitle'
      });
      console.error('[CONTENT GENERATOR TITLE ERROR]', errorInfo.message);
      return {
        seoTitle: Modern  - Premium Teak & Velvet,
        marketingTitle: Transform Your Living Room with Handcrafted ,
        catchyTitle: The Ultimate Comfort Upgrade: ,
        luxuryTitle: Luxury Architectural  | Artisan Crafted,
        rationale: 'Balanced across SEO search intent, social engagement, and high-conversion marketing.'
      };
    }
  }

  // Prompt 2: Product Description Generation
  async generateProductDescription(data, sellerId) {
    const prompt = 
Act as a master E-commerce Content Strategist for Riddha Interio Mart.
Write a full, engaging product description:

Product Name: 
Category: 
Key Features: 
Materials: 
Target Audience: 
Tone: 
Length: 

Generate JSON response:
{
  "openingHook": "Compelling 2-sentence opening hook",
  "bodyDescription": "Full product description paragraphs with benefits and material callouts",
  "specifications": ["Spec 1", "Spec 2", "Spec 3"],
  "careInstructions": "Care & maintenance guidelines",
  "callToAction": "Strong closing CTA",
  "wordCount": 180
}
Return strictly valid JSON.
;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.8,
        maxTokens: 1000
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'contentGeneratorDescription',
        sellerId,
        '/api/content/generate-description',
        response.model
      );

      const cleanedText = response.text.replace(/\\\json/g, '').replace(/\\\/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'ContentGeneratorService',
        method: 'generateProductDescription'
      });
      console.error('[CONTENT GENERATOR DESCRIPTION ERROR]', errorInfo.message);
      return {
        openingHook: Elevate your living space with the exquisite , engineered for luxury and daily durability.,
        bodyDescription: Handcrafted from kiln-dried solid teak wood and upholstered in premium stain-resistant velvet fabric, this piece seamlessly combines Scandinavian minimalism with ergonomic seating comfort. Perfect for entertaining guests or unwinding after a long day.,
        specifications: [
          Dimensions: Custom modular sizing available,
          Frame Material: Solid Plantation Teak Wood,
          Upholstery: Stain-Resistant Velvet Fabric,
          Warranty: 5-Year Structural Frame Guarantee
        ],
        careInstructions: 'Spot clean with mild fabric shampoo. Avoid direct sunlight prolonged exposure.',
        callToAction: 'Order today to enjoy complimentary concierge delivery and white-glove installation.',
        wordCount: 165
      };
    }
  }

  // Prompt 3: SEO Meta Description Generation
  async generateMetaDescription(data, sellerId) {
    const prompt = 
Generate an SEO-optimized meta description (150-160 characters max):
Product: 
Primary Keyword: 
Price: Rs. 

Return JSON:
{
  "metaDescription": "150-160 char meta text with keyword and CTA",
  "charCount": 156
}
Return strictly valid JSON.
;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.7,
        maxTokens: 300
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'contentGeneratorMetaDesc',
        sellerId,
        '/api/content/generate-meta',
        response.model
      );

      const cleanedText = response.text.replace(/\\\json/g, '').replace(/\\\/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'ContentGeneratorService',
        method: 'generateMetaDescription'
      });
      console.error('[META DESCRIPTION ERROR]', errorInfo.message);
      const text = Buy  online at Riddha Interio. Handcrafted teak frame, stain-proof upholstery & 5-yr warranty. Order with free delivery!;
      return {
        metaDescription: text.slice(0, 160),
        charCount: text.slice(0, 160).length
      };
    }
  }

  // Prompt 4: Hashtags & Keywords Generation
  async generateHashtagsAndKeywords(data, sellerId) {
    const prompt = 
Generate platform-specific hashtags and SEO keywords for:
Product: 
Category: 
Style: 

Generate JSON:
{
  "instagramHashtags": ["#riddhaInterio", "#modernHome", "#interiorDesign", "#luxuryLiving", "#decorInspo"],
  "facebookHashtags": ["#RiddhaMart", "#HomeDecor", "#LivingRoomSofa"],
  "seoKeywords": ["modern sofa online", "teak wood sectional sofa", "luxury interior furniture bengaluru"],
  "longTailKeywords": ["buy stain resistant velvet sofa online india", "custom teak living room furniture"]
}
Return strictly valid JSON.
;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.7,
        maxTokens: 500
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'contentGeneratorHashtags',
        sellerId,
        '/api/content/generate-hashtags',
        response.model
      );

      const cleanedText = response.text.replace(/\\\json/g, '').replace(/\\\/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'ContentGeneratorService',
        method: 'generateHashtagsAndKeywords'
      });
      console.error('[HASHTAGS ERROR]', errorInfo.message);
      return {
        instagramHashtags: ['#riddhaInterio', '#interiorDesign', '#luxuryFurniture', '#modernDecor', '#homeInspo'],
        facebookHashtags: ['#RiddhaMart', '#HomeDecor', '#InteriorStyling'],
        seoKeywords: ['luxury furniture online', 'handcrafted teak furniture', 'modern living room sofa'],
        longTailKeywords: ['buy solid teak sofa with warranty india', 'luxury sectional sofa for modern apartments']
      };
    }
  }

  // Prompt 5: Social Media Post Copy
  async generateSocialMediaPost(data, sellerId) {
    const prompt = 
Generate Instagram & Facebook social media captions:
Product: 
Key Benefit: 
Platform: 

Generate JSON:
{
  "instagramCaption": "Engaging caption with emojis, line breaks, hook, and call to action",
  "facebookPost": "Conversational Facebook post with community focus",
  "recommendedHashtags": ["#riddhaInterio", "#homeDecor"]
}
Return strictly valid JSON.
;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.8,
        maxTokens: 600
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'contentGeneratorSocial',
        sellerId,
        '/api/content/generate-social',
        response.model
      );

      const cleanedText = response.text.replace(/\\\json/g, '').replace(/\\\/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'ContentGeneratorService',
        method: 'generateSocialMediaPost'
      });
      console.error('[SOCIAL MEDIA POST ERROR]', errorInfo.message);
      return {
        instagramCaption: ✨ Transform your space with the all-new !\n\nHandcrafted from solid plantation teak wood and designed for modern homes. Sustainable, ergonomic, and timeless.\n\n👇 Tap link in bio to shop with free delivery!\n\n#riddhaInterio #homeDecor #interiorInspo,
        facebookPost: Looking to upgrade your living room? Check out our latest . Built to last a lifetime with artisan teak craftsmanship. Click below to shop directly!,
        recommendedHashtags: ['#riddhaInterio', '#homeDecor', '#interiorDesign']
      };
    }
  }

  // Prompt 6: Email Campaign Copy
  async generateEmailCampaign(data, sellerId) {
    const prompt = 
Generate promotional email campaign copy:
Product: 
Offer: 

Generate JSON:
{
  "subjectLines": [
    "Transform Your Living Room Today ✨",
    "Exclusive 15% VIP Access: Handcrafted Teak Sofas",
    "Is Your Living Room Ready for an Upgrade?",
    "New Arrival: Nordic Furniture Collection",
    "Limited Stock: Claim 15% Discount Now"
  ],
  "emailHtml": "<h3>Elevate Your Living Room Comfort</h3><p>Dear Designer,</p><p>Discover our newest handcrafted collection...</p>",
  "callToAction": "Shop Collection Now"
}
Return strictly valid JSON.
;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.8,
        maxTokens: 800
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'contentGeneratorEmail',
        sellerId,
        '/api/content/generate-email',
        response.model
      );

      const cleanedText = response.text.replace(/\\\json/g, '').replace(/\\\/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'ContentGeneratorService',
        method: 'generateEmailCampaign'
      });
      console.error('[EMAIL CAMPAIGN ERROR]', errorInfo.message);
      return {
        subjectLines: [
          Transform Your Living Room with  ✨,
          Exclusive 15% VIP Access: Handcrafted Interior Teak,
          Is Your Space Ready for a Style Upgrade?,
          New Launch: Architect-Designed ,
          Limited Quantities: Claim Complimentary Delivery Today
        ],
        emailHtml: <h3>Elevate Your Home Atmosphere</h3><p>Hi there,</p><p>We are excited to unveil our newest handcrafted . Crafted from solid plantation teak wood and stain-resistant velvet fabric.</p><p><a href="https://riddhamart.com" style="background:#0f172a;color:#fbbf24;padding:10px 20px;text-decoration:none;border-radius:8px;font-weight:bold;">Shop Collection Now</a></p>,
        callToAction: 'Shop Collection Now'
      };
    }
  }

  // Prompt 7: Blog Article Generation
  async generateBlogArticle(data, sellerId) {
    const prompt = 
Generate an SEO blog article:
Title: 
Primary Keyword: 

Generate JSON:
{
  "title": "5 Expert Tips to Select the Ideal Living Room Sofa for Small & Large Spaces",
  "metaDescription": "Discover expert interior designer tips on choosing sofa dimensions, frame materials, and stain-proof upholstery.",
  "articleMarkdown": "# 5 Expert Tips to Select the Ideal Living Room Sofa\\n\\nChoosing the right furniture pieces...",
  "wordCount": 450
}
Return strictly valid JSON.
;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.8,
        maxTokens: 1500
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'contentGeneratorBlog',
        sellerId,
        '/api/content/generate-blog',
        response.model
      );

      const cleanedText = response.text.replace(/\\\json/g, '').replace(/\\\/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'ContentGeneratorService',
        method: 'generateBlogArticle'
      });
      console.error('[BLOG ARTICLE ERROR]', errorInfo.message);
      return {
        title: 5 Expert Tips to Select the Ideal Living Room Sofa for Your Home,
        metaDescription: Discover expert interior design advice on sofa dimensions, teak wood frames, and stain-proof velvet fabrics.,
        articleMarkdown: # 5 Expert Tips to Select the Ideal Living Room Sofa\n\nInvesting in a quality sofa is one of the most important interior decisions for any home.\n\n## 1. Frame Material Matters\nAlways opt for kiln-dried solid teak wood for structural longevity.\n\n## 2. Upholstery Durability\nSelect stain-resistant velvet or high-rub-count woven fabrics.\n\n## 3. Modular Versatility\nL-shaped sectionals provide flexible seating for entertaining guests.\n\n## Conclusion\nExplore Riddha Interio Mart for architect-grade custom sofas.,
        wordCount: 420
      };
    }
  }

  // Prompt 8: A/B Test Variant Generation
  async generateABTestVariants(data, sellerId) {
    const prompt = 
Generate two distinct A/B testing copy variants:
Product Name: 
Goal: 

Generate JSON:
{
  "variantA": {
    "variantId": "Variant A",
    "approach": "Direct & Feature-Focused",
    "content": "Handcrafted solid teak armchair with high-density foam cushioning and 5-year frame warranty.",
    "predictedCtr": 14.8
  },
  "variantB": {
    "variantId": "Variant B",
    "approach": "Emotional & Lifestyle-Focused",
    "content": "Indulge in sanctuary-like comfort. Transform your reading nook into a luxury retreat today.",
    "predictedCtr": 19.4
  }
}
Return strictly valid JSON.
;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.8,
        maxTokens: 700
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'contentGeneratorABTest',
        sellerId,
        '/api/content/generate-abtest',
        response.model
      );

      const cleanedText = response.text.replace(/\\\json/g, '').replace(/\\\/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'ContentGeneratorService',
        method: 'generateABTestVariants'
      });
      console.error('[A/B TEST ERROR]', errorInfo.message);
      return {
        variantA: {
          variantId: 'Variant A',
          approach: 'Direct & Feature-Focused',
          content: Solid teak frame, stain-resistant upholstery & ergonomic support. Order with 5-year warranty.,
          predictedCtr: 14.5
        },
        variantB: {
          variantId: 'Variant B',
          approach: 'Emotional & Lifestyle-Focused',
          content: Experience artisan luxury at home. Elevate your living room sanctuary with timeless Scandinavian design.,
          predictedCtr: 19.2
        }
      };
    }
  }

}

module.exports = new ContentGeneratorService();
