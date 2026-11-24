/**
 * Tejas voice: a MALE Indian-English speaker.
 *
 * Providers (official APIs only), tried in this order:
 *   1. Azure AI Speech neural voice  en-IN-PrabhatNeural (male, native Indian) / hi-IN-MadhurNeural for Devanagari
 *      -> needs AZURE_SPEECH_KEY + AZURE_SPEECH_REGION   (best, truly native Indian voice)
 *   2. OpenAI gpt-4o-mini-tts, steered with instructions to speak as an Indian man  -> uses OPENAI_API_KEY
 * If neither is configured / reachable the controller tells the browser to use its own en-IN male voice.
 */
const openaiService = require('./openaiService');

/**
 * In-memory LRU-style cache for audio buffers of frequently used phrases
 * (e.g. greetings, standard acknowledgments, short prompts)
 */
const ttsCache = new Map();
const MAX_CACHE_ENTRIES = 120;

/**
 * Cleans and prepares text for natural Indian English / Hinglish speech synthesis
 */
function prepareIndianSpeechText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // 1. Remove URLs and file links
  text = text.replace(/https?:\/\/\S+/gi, '');

  // 2. Remove markdown symbols (bold, italic, headers, code fences, blockquotes, bullets)
  text = text.replace(/[*#_`~\[\]()|{}>]/g, ' ');
  text = text.replace(/^[-*•]\s+/gm, '');

  // 3. Remove emojis and special pictograms
  text = text.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu,
    ''
  );

  // 4. Currency and numbers expansion for Indian English cadence
  text = text.replace(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi, '$1 rupees');
  text = text.replace(/Rs\.?\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi, '$1 rupees');
  text = text.replace(/₹/g, ' rupees ');

  // 5. Expand domain-specific abbreviations for natural pronunciation
  text = text.replace(/\bB2B\b/gi, 'B to B');
  text = text.replace(/\bB2C\b/gi, 'B to C');
  text = text.replace(/\bRFQ\b/gi, 'R F Q');
  text = text.replace(/\bCOD\b/gi, 'Cash on Delivery');
  text = text.replace(/\bsq\.?\s*ft\.?\b/gi, 'square feet');
  text = text.replace(/\bsqft\b/gi, 'square feet');
  text = text.replace(/\bBHK\b/gi, 'B H K');
  text = text.replace(/\bBOQ\b/gi, 'B O Q');
  text = text.replace(/\bAI\b/g, 'A I');

  // 6. Indian terminology phonetic adjustments
  text = text.replace(/\bVastu\b/gi, 'Vaastu');
  text = text.replace(/\bRiddha\b/gi, 'Riddha');

  // 7. Normalize whitespace & punctuation
  text = text.replace(/!+/g, '!');
  text = text.replace(/\?+/g, '?');
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Splits text into conversational segments of <= maxLen characters
 * respects sentence and punctuation boundaries
 */
function splitIntoChunks(text, maxLen = 175) {
  if (!text) return [];
  if (text.length <= maxLen) return [text];

  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (trimmed.length > maxLen) {
      // Split very long sentence by commas or words
      const words = trimmed.split(/\s+/);
      for (const word of words) {
        if ((current + ' ' + word).trim().length > maxLen) {
          if (current.trim()) chunks.push(current.trim());
          current = word;
        } else {
          current = current ? `${current} ${word}` : word;
        }
      }
    } else {
      if ((current + ' ' + trimmed).trim().length > maxLen) {
        if (current.trim()) chunks.push(current.trim());
        current = trimmed;
      } else {
        current = current ? `${current} ${trimmed}` : trimmed;
      }
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

/** Azure AI Speech REST (official). Returns an MP3 buffer. */
async function synthesizeWithAzure(text, isHindiScript) {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) return null;

  const voice = isHindiScript
    ? (process.env.AZURE_TTS_VOICE_HI || 'hi-IN-MadhurNeural')
    : (process.env.AZURE_TTS_VOICE_EN || 'en-IN-PrabhatNeural');
  const lang = isHindiScript ? 'hi-IN' : 'en-IN';
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}"><voice name="${voice}"><prosody rate="-4%">${escaped}</prosody></voice></speak>`;

  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'riddha-tejas'
    },
    body: ssml,
    signal: AbortSignal.timeout(9000)
  });
  if (!res.ok) throw new Error(`Azure TTS responded ${res.status}`);
  return { buffer: Buffer.from(await res.arrayBuffer()), provider: 'azure', voice };
}

const OPENAI_INSTRUCTIONS =
  'Voice: a warm, friendly, courteous young Indian man from India, like a polite interior-design consultant. ' +
  'Accent: natural Indian English (not American, not British); use Indian intonation and rhythm. ' +
  'Pronounce Hindi and Hinglish words the Indian way: ji, aap, namaste, bilkul, zaroor, Vaastu, Riddha, sagwan. ' +
  'Pace: calm and clear, slightly unhurried. Tone: helpful, respectful and positive.';

/** OpenAI text-to-speech steered toward a male Indian accent. */
async function synthesizeWithOpenAI(text) {
  if (!process.env.OPENAI_API_KEY) return null;
  const client = openaiService.getClient();
  const voice = process.env.TTS_OPENAI_VOICE || 'ash'; // male voice
  const response = await client.audio.speech.create({
    model: process.env.TTS_OPENAI_MODEL || 'gpt-4o-mini-tts',
    voice,
    input: text,
    instructions: OPENAI_INSTRUCTIONS,
    response_format: 'mp3'
  });
  return { buffer: Buffer.from(await response.arrayBuffer()), provider: 'openai', voice };
}

/**
 * Generates the male Indian voice audio for the given text.
 * Returns { buffer, contentType, provider, voice } or throws when no provider is available.
 */
async function generateIndianSpeech(rawText, options = {}) {
  const cleanText = prepareIndianSpeechText(rawText);
  if (!cleanText) {
    throw new Error('No readable text content provided for speech synthesis');
  }

  const isHindiScript = /[\u0900-\u097F]/.test(cleanText);
  const capped = cleanText.slice(0, 600);

  const cacheKey = `${isHindiScript ? 'hi' : 'en'}:${capped}`;
  if (ttsCache.has(cacheKey)) {
    return { ...ttsCache.get(cacheKey), contentType: 'audio/mpeg' };
  }

  const providers = [
    () => synthesizeWithAzure(capped, isHindiScript),
    () => synthesizeWithOpenAI(capped)
  ];

  let lastError = null;
  for (const run of providers) {
    try {
      const result = await run();
      if (result && result.buffer && result.buffer.length > 250) {
        if (ttsCache.size >= MAX_CACHE_ENTRIES) ttsCache.delete(ttsCache.keys().next().value);
        ttsCache.set(cacheKey, result);
        return { ...result, contentType: 'audio/mpeg' };
      }
    } catch (err) {
      lastError = err;
      console.warn('[Tejas TTS] provider failed:', err.message);
    }
  }
  throw lastError || new Error('No text-to-speech provider is configured');
}

module.exports = {
  generateIndianSpeech,
  prepareIndianSpeechText,
  splitIntoChunks
};
