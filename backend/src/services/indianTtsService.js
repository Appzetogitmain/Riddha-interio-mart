const https = require('https');
const http = require('http');
const { URL } = require('url');

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

/**
 * Performs HTTP/HTTPS request with automatic redirect following
 */
function fetchBufferWithRedirect(urlStr, options = {}, maxRedirects = 3) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error('Too many redirects while fetching TTS audio'));
    }

    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'http:' ? http : https;

    const req = client.get(
      urlStr,
      {
        ...options,
        timeout: options.timeout || 7000
      },
      (res) => {
        // Handle HTTP 3xx Redirects
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          const nextUrl = new URL(res.headers.location, urlStr).toString();
          return resolve(fetchBufferWithRedirect(nextUrl, options, maxRedirects - 1));
        }

        if (res.statusCode !== 200) {
          return reject(
            new Error(`TTS server responded with status code ${res.statusCode}`)
          );
        }

        const dataChunks = [];
        res.on('data', (c) => dataChunks.push(c));
        res.on('end', () => resolve(Buffer.concat(dataChunks)));
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('TTS audio request timed out'));
    });

    req.on('error', (err) => reject(err));
  });
}

/**
 * Downloads a single text chunk using Google's native Indian English (en-IN) / Hindi (hi) neural TTS
 */
async function fetchIndianTtsChunk(textChunk, lang = 'en-IN') {
  const encodedText = encodeURIComponent(textChunk);
  const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodedText}`;

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Referer: 'https://translate.google.com/',
    Accept: 'audio/mpeg, audio/*;q=0.9, */*;q=0.8'
  };

  return await fetchBufferWithRedirect(targetUrl, { headers, timeout: 6000 });
}

/**
 * Generates natural Indian voice audio buffer for the given text.
 * Returns { buffer, contentType: 'audio/mpeg' }
 */
async function generateIndianSpeech(rawText, options = {}) {
  const cleanText = prepareIndianSpeechText(rawText);
  if (!cleanText) {
    throw new Error('No readable text content provided for speech synthesis');
  }

  // Detect script: if Devanagari Hindi script is present, use 'hi', otherwise 'en-IN' (Indian English)
  const isHindiScript = /[\u0900-\u097F]/.test(cleanText);
  const lang = options.lang || (isHindiScript ? 'hi' : 'en-IN');

  // Keep max ~350-400 characters for responsive conversational spoken reply
  const cappedText = cleanText.slice(0, 420);

  // Check in-memory cache
  const cacheKey = `${lang}:${cappedText}`;
  if (ttsCache.has(cacheKey)) {
    return {
      buffer: ttsCache.get(cacheKey),
      contentType: 'audio/mpeg'
    };
  }

  // Split into chunks of max 175 characters
  const chunks = splitIntoChunks(cappedText, 175);
  if (chunks.length === 0) {
    throw new Error('Failed to generate speech chunks');
  }

  // Fetch up to first 3 chunks (covers ~400 chars)
  const audioBuffers = [];
  for (const chunk of chunks.slice(0, 3)) {
    if (!chunk.trim()) continue;
    try {
      const buf = await fetchIndianTtsChunk(chunk, lang);
      if (buf && buf.length > 0) {
        audioBuffers.push(buf);
      }
    } catch (err) {
      console.warn(`[IndianTTS] Error fetching chunk "${chunk.slice(0, 30)}...":`, err.message);
      // If we already have at least one valid chunk, we can proceed with partial audio
      if (audioBuffers.length === 0) {
        throw err;
      }
      break;
    }
  }

  if (audioBuffers.length === 0) {
    throw new Error('No audio buffers returned from Indian TTS service');
  }

  const finalBuffer = Buffer.concat(audioBuffers);

  // Maintain cache size
  if (ttsCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = ttsCache.keys().next().value;
    ttsCache.delete(oldestKey);
  }
  ttsCache.set(cacheKey, finalBuffer);

  return {
    buffer: finalBuffer,
    contentType: 'audio/mpeg'
  };
}

module.exports = {
  generateIndianSpeech,
  prepareIndianSpeechText
};
