const indianTtsService = require('../services/indianTtsService');

/**
 * @desc    Generate Speech Audio (TTS) with authentic Indian English / Hindi accent for Tejas Assistant
 * @route   POST /api/tts or POST /api/assistant/tts
 * @access  Public (Used by assistant widget for text-to-speech)
 */
exports.generateSpeech = async (req, res) => {
  try {
    const { text, lang } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for speech synthesis.'
      });
    }

    // Clean text and generate natural Indian speech
    const speechResult = await indianTtsService.generateIndianSpeech(text, {
      lang: lang || 'en-IN'
    });

    if (!speechResult || !speechResult.buffer) {
      return res.status(500).json({
        success: false,
        fallbackToBrowser: true,
        error: 'Unable to synthesize speech audio.'
      });
    }

    res.set({
      'Content-Type': speechResult.contentType || 'audio/mpeg',
      'Content-Length': speechResult.buffer.length,
      'Cache-Control': 'public, max-age=86400', // Allow caching of synthesized audio
      'Accept-Ranges': 'bytes'
    });

    return res.send(speechResult.buffer);
  } catch (error) {
    console.warn('[TTS Controller] Indian TTS error, notifying frontend to use browser Indian voice:', error.message || error);
    return res.status(502).json({
      success: false,
      fallbackToBrowser: true,
      error: 'Backend Indian TTS unavailable, falling back to browser synthesis.'
    });
  }
};
