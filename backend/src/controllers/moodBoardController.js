const crypto = require('crypto');
const openaiClient = require('../services/openaiService');
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const OpenAIUsageTracker = require('../services/openaiUsageTracker');
const Product = require('../models/Product');
const Category = require('../models/Category');

// In-memory cache for mood board requests
const moodBoardCache = new Map();
const MAX_CACHE_SIZE = 200;

const getCacheKey = (roomType, style) => {
  return `${roomType}_${style}`;
};

// Curated room-specific background images for mood board canvas
const roomImages = {
  'Living Room': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&q=80',
  'Bedroom': 'https://images.unsplash.com/photo-1616594831707-3c7d94320665?w=1000&q=80',
  'Kitchen': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1000&q=80',
  'Bathroom': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1000&q=80',
  'Dining Room': 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1000&q=80',
  'Home Office': 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1000&q=80'
};

const roomKeywords = {
  'Living Room': ['sofa', 'table', 'marble', 'lighting', 'tile'],
  'Bedroom': ['bed', 'mattress', 'wardrobe', 'lamp', 'sheet'],
  'Kitchen': ['faucet', 'sink', 'granite', 'cabinet', 'tile'],
  'Bathroom': ['faucet', 'shower', 'basin', 'bath', 'towel'],
  'Dining Room': ['dining table', 'chair', 'pendant light', 'cutlery'],
  'Home Office': ['desk', 'office chair', 'lamp', 'bookshelf']
};

// @desc    Generate AI Mood Board
// @route   POST /api/products/ai-mood-board
// @access  Public
exports.generateAiMoodBoard = async (req, res, next) => {
  try {
    const { roomType = 'Living Room', style = 'Modern Luxury', budget = '₹ 2 - 5 Lakhs', roomSize = '1000 - 1500 sq.ft', preferredColors = [] } = req.body;
    const cacheKey = getCacheKey(`${roomType}_${style}_${budget}_${roomSize}`, preferredColors.join('-'));

    if (moodBoardCache.has(cacheKey)) {
      console.log(`[AI Mood Board] Cache HIT for key: ${cacheKey}`);
      return res.status(200).json({
        success: true,
        cached: true,
        ...moodBoardCache.get(cacheKey)
      });
    }

    let boardData = {
      title: `${style} ${roomType} Mood Board`,
      roomType,
      style,
      budget,
      roomSize,
      palette: [
        { name: 'Calacatta Gold', hex: '#E5D3B3' },
        { name: 'Warm Charcoal', hex: '#2C3539' },
        { name: 'Brushed Brass', hex: '#D4AF37' },
        { name: 'Champagne Cream', hex: '#F7F5F0' },
        { name: 'Olive Accent', hex: '#556B2F' }
      ],
      bgImage: roomImages[roomType] || roomImages['Living Room'],
      secondaryImages: [
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=80',
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80'
      ],
      description: `Curated ${style} aesthetic board for your ${roomType} (${roomSize}, Budget: ${budget}).`,
      keywords: roomKeywords[roomType] || ['sofa', 'table', 'marble', 'lighting']
    };

    if (process.env.OPENAI_API_KEY) {
      try {
        const promptText = `You are a professional interior design stylist for "Riddha Interior Mart".
Create a personalized Mood Board concept for a ${roomType} styled in ${style} theme with estimated budget ${budget} and room size ${roomSize}.

Provide structured JSON output with:
1. "title": String (Catchy title like "Opulent Emerald & Brass Retreat")
2. "description": String (20-word summary of the mood board vibe)
3. "palette": Array of 5 objects with "name" (color/material name) and "hex" (HEX color code like "#E5D3B3").
4. "keywords": Array of 4-6 product search terms from a home store matching this look (e.g. ["marble slab", "gold faucet", "sofa", "lighting"]).

Output ONLY valid JSON.`;

        const aiResponse = await OpenAIErrorHandler.callWithRetry(() =>
          openaiClient.generateText(promptText, {
            modelType: 'general',
            expectJson: true,
            temperature: 0.8,
            maxTokens: 600,
          })
        );

        await OpenAIUsageTracker.trackUsage(
          {
            inputTokens: aiResponse.inputTokens,
            outputTokens: aiResponse.outputTokens,
            totalTokens: aiResponse.totalTokens,
          },
          'mood-board',
          req.user?._id || null,
          '/api/products/ai-mood-board',
          aiResponse.model
        );

        const rawText = (aiResponse.text || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(rawText);
        if (parsed.palette && parsed.palette.length > 0) {
          boardData = { ...boardData, ...parsed };
        }
      } catch (aiErr) {
        const errorInfo = OpenAIErrorHandler.handleError(aiErr, {
          service: 'AIMoodBoard',
          method: 'generateMoodBoardConcept',
        });
        console.warn('[AI Mood Board] OpenAI API warning:', errorInfo.message);
      }
    }

    // Synthesize a fresh AI interior room concept image via the OpenAI images API
    if (process.env.OPENAI_API_KEY) {
      try {
        const imageGenPrompt = `A fully furnished, high-resolution interior photography of a ${style} ${roomType} featuring elegant decor, warm lighting, and luxury material finishes.`;

        const imgResult = await openaiClient.generateImage(imageGenPrompt, {
          size: '1024x1024',
          quality: 'medium',
        });

        if (imgResult.dataUrl) {
          boardData.bgImage = imgResult.dataUrl;
          console.log('[AI Mood Board] OpenAI images API generated the main AI room concept!');

          await OpenAIUsageTracker.trackUsage(
            {
              inputTokens: imgResult.inputTokens,
              outputTokens: imgResult.outputTokens,
              totalTokens: imgResult.totalTokens,
            },
            'mood-board-image',
            req.user?._id || null,
            '/api/products/ai-mood-board',
            imgResult.model
          );
        }
      } catch (imgErr) {
        const errorInfo = OpenAIErrorHandler.handleError(imgErr, {
          service: 'AIMoodBoard',
          method: 'imageGeneration',
        });
        console.warn('[AI Mood Board] OpenAI image generation warning:', errorInfo.message);
      }
    }

    // Query active products from store catalog matching the mood board theme
    const searchTerms = boardData.keywords || ['sofa', 'table', 'marble', 'lighting'];
    const regexTerms = searchTerms.map(term => new RegExp(term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i'));

    let products = await Product.find({
      isActive: true,
      $or: [
        { name: { $in: regexTerms } },
        { description: { $in: regexTerms } },
        { seoKeywords: { $in: regexTerms } }
      ]
    })
    .populate('category', 'name slug')
    .populate('brand', 'name logo slug')
    .limit(6)
    .lean();

    if (products.length === 0) {
      products = await Product.find({ isActive: true })
        .populate('category', 'name slug')
        .populate('brand', 'name logo slug')
        .limit(6)
        .lean();
    }

    const responsePayload = {
      success: true,
      moodBoard: {
        id: `mb_${Date.now()}`,
        ...boardData,
        products,
        createdAt: new Date().toISOString()
      }
    };

    if (moodBoardCache.size >= MAX_CACHE_SIZE) {
      const firstKey = moodBoardCache.keys().next().value;
      moodBoardCache.delete(firstKey);
    }
    moodBoardCache.set(cacheKey, responsePayload);

    return res.status(200).json(responsePayload);

  } catch (error) {
    console.error('[AI Mood Board] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate AI Mood Board.'
    });
  }
};
