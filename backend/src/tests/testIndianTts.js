const indianTtsService = require('../services/indianTtsService');

async function testIndianTts() {
  console.log('Testing Indian TTS Service with en-IN native voice...');
  const samplePhrase = "Namaste! I am Tejas from Riddha Interio Mart. Aapka swagat hai!";

  try {
    const result = await indianTtsService.generateIndianSpeech(samplePhrase, { lang: 'en-IN' });
    console.log('Success! Buffer received, length:', result.buffer.length, 'bytes');
    console.log('Content-Type:', result.contentType);
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

testIndianTts();
