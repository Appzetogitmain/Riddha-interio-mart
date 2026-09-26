const openaiService = require('../services/openaiService');

/**
 * @desc    Generate Speech Audio (TTS) for Tejas Voice Assistant
 * @route   POST /api/tts
 * @access  Public (Used by assistant widget for text-to-speech)
 */
exports.generateSpeech = async (req, res) => {
  try {
    const { text, voice, model } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for speech synthesis.'
      });
    }

    // Clean and cap length for responsive playback
    const cleanedText = text.replace(/[*#_`~\[\]()]/g, ' ').trim();
    if (cleanedText.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid text content is required.'
      });
    }

    // Max cap: 4000 characters
    const textToSpeak = cleanedText.slice(0, 4000);

    const speechResult = await openaiService.generateSpeech(textToSpeak, {
      voice: voice || process.env.OPENAI_TTS_VOICE || 'echo',
      model: model || process.env.OPENAI_TTS_MODEL || 'tts-1'
    });

    res.set({
      'Content-Type': speechResult.contentType || 'audio/mpeg',
      'Content-Length': speechResult.buffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    return res.send(speechResult.buffer);
  } catch (error) {
    console.error('[TTS Controller] Error generating speech:', error.message || error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate voice response.'
    });
  }
};
