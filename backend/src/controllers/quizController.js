const mongoose = require('mongoose');
const Product = require('../models/Product');
const UserQuizResult = require('../models/UserQuizResult');
const profileService = require('../services/profileService');
const designService = require('../services/designService');
const recommendationService = require('../services/recommendationService');
const moodBoardService = require('../services/moodBoardService');

// Helpers for quiz parsing
const mapRoomType = (rt) => {
  if (!rt) return 'living';
  const lower = rt.toLowerCase();
  if (lower.includes('living')) return 'living';
  if (lower.includes('bed')) return 'bedroom';
  if (lower.includes('bath')) return 'bathroom';
  if (lower.includes('kitchen')) return 'kitchen';
  if (lower.includes('office') || lower.includes('work')) return 'office';
  if (lower.includes('dining')) return 'dining';
  if (lower.includes('outdoor')) return 'outdoor';
  return 'living';
};

const mapBudget = (b) => {
  if (!b) return { min: 50000, max: 100000 };
  if (typeof b === 'object' && b.min !== undefined) return b;
  
  // Extract digits
  const numbers = b.replace(/,/g, '').match(/\d+/g);
  if (numbers && numbers.length >= 2) {
    return { min: parseInt(numbers[0], 10), max: parseInt(numbers[1], 10) };
  } else if (numbers && numbers.length === 1) {
    const val = parseInt(numbers[0], 10);
    return b.includes('+') || b.toLowerCase().includes('above')
      ? { min: val, max: val * 5 } 
      : { min: Math.round(val / 2), max: val };
  }
  return { min: 50000, max: 100000 };
};

/**
 * @desc    Submit designer quiz answers and generate AI personalization profile
 * @route   POST /api/quiz/:sessionId/complete
 * @access  Public (Optionally Authenticated)
 */
exports.submitQuiz = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answers } = req.body;
    const userId = req.user ? req.user._id : null;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }
    if (!answers) {
      return res.status(400).json({ success: false, error: 'Quiz answers are required' });
    }

    // 1. Construct the raw design profile based on 10 questionnaire answers
    // Answers expected mapping:
    // q1: Room type, q2: Style, q3: Colors, q4: Budget, q5: Lighting, q6: Boldness (1-10), q7: Materials
    const roomType = mapRoomType(answers.q1 || answers.roomType);
    const primaryStyle = answers.q2 || answers.primaryStyle || 'Modern';
    const colors = Array.isArray(answers.q3) ? answers.q3 : (answers.q3 ? [answers.q3] : ['Neutral', 'Grey']);
    const budget = mapBudget(answers.q4 || answers.budget);
    const lighting = answers.q5 || answers.lighting || 'Bright & Airy';
    const boldness = parseInt(answers.q6 || answers.boldness, 10) || 5;
    const materials = Array.isArray(answers.q7) ? answers.q7 : (answers.q7 ? [answers.q7] : ['Wood']);

    const designProfile = {
      roomType,
      primaryStyle,
      colors,
      budget,
      lighting,
      boldness,
      materials
    };

    // 2. Fetch products to perform personalization matching
    const products = await Product.find({ isActive: true, isApproved: true })
      .populate('category', 'name')
      .lean();

    // 3. Trigger all Gemini APIs in parallel to reduce network latency
    // A: Personality label
    // B: Profile Narrative
    // C: Design Suggestions (Style, Budget, Personality)
    // D: Mood Board Narrative (with inferred themes)
    const moodBoardThemes = [
      `${primaryStyle} Textures`,
      `${colors[0] || 'Neutral'} Palette Focus`,
      `${materials[0] || 'Organic'} Highlights`
    ];

    const [personality, narrative, suggestions, moodBoardContent] = await Promise.all([
      profileService.generateDesignerPersonality(designProfile, userId),
      profileService.generateProfileNarrative(designProfile, userId),
      designService.generateSuggestions(designProfile, userId),
      moodBoardService.generateMoodBoardContent(designProfile, moodBoardThemes, userId)
    ]);

    designProfile.personality = personality; // Save personality back to profile

    // 4. Score products & get top matches (also generates custom product explanations)
    const enhancedRecs = await recommendationService.enhanceRecommendations(products, designProfile, userId);

    // 5. Structure productExplanations map for storing
    const productExplanations = {};
    enhancedRecs.forEach(item => {
      if (item.aiExplanation) {
        productExplanations[item.product._id.toString()] = item.aiExplanation;
      }
    });

    // 6. Save UserQuizResult to Database
    const quizResult = await UserQuizResult.create({
      userId,
      sessionId,
      answers,
      designProfile,
      aiGeneratedContent: {
        profileNarrative: narrative,
        designerPersonality: personality,
        designSuggestions: suggestions,
        productExplanations,
        moodBoardNarrative: moodBoardContent.narrative,
        moodBoardThemes: moodBoardContent.themes,
        moodBoardInspiration: moodBoardContent.inspiration,
        generatedAt: new Date()
      },
      recommendations: enhancedRecs.map(item => ({
        product: item.product._id,
        matchScore: item.matchScore,
        matchPercentage: item.matchPercentage,
        aiExplanation: item.aiExplanation || `Matches your preferred ${primaryStyle} style.`,
        recommendationStrength: item.recommendationStrength
      }))
    });

    // Populate references to send back to user
    const populatedResult = await UserQuizResult.findById(quizResult._id)
      .populate('recommendations.product');

    return res.status(200).json({
      success: true,
      data: populatedResult
    });

  } catch (error) {
    console.error('[QUIZ CONTROLLER ERROR] Failed to submit and process quiz:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get saved quiz result for a user or guest session
 * @route   GET /api/quiz/results/:sessionId
 * @access  Public
 */
exports.getQuizResult = async (req, res) => {
  try {
    const { sessionId } = req.params;
    let result = null;

    if (req.user) {
      // Authenticated user: find their latest result
      result = await UserQuizResult.findOne({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .populate('recommendations.product');
    }

    // Fallback or guest lookup: find by session ID
    if (!result && sessionId) {
      result = await UserQuizResult.findOne({ sessionId })
        .sort({ createdAt: -1 })
        .populate('recommendations.product');
    }

    if (!result) {
      return res.status(404).json({ success: false, error: 'No design profile found for this session' });
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get current user's quiz result profile
 * @route   GET /api/quiz/my-results
 * @access  Private
 */
exports.getMyQuizResult = async (req, res) => {
  try {
    const result = await UserQuizResult.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('recommendations.product');

    if (!result) {
      return res.status(404).json({ success: false, error: 'No design profile found. Please complete the quiz first.' });
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Retrieve Gemini usage logs and statistics
 * @route   GET /api/quiz/admin/usage-stats
 * @access  Private (Admin Only)
 */
exports.getUsageStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await geminiUsageTracker.generateUsageReport(startDate, endDate);
    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
