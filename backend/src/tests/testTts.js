require('dotenv').config();
const openaiService = require('../services/openaiService');

async function testTTS() {
  console.log('Testing OpenAI TTS...');
  console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
  
  // Test with models: tts-1, gpt-4o-mini-tts
  const testModels = ['tts-1', 'gpt-4o-mini-tts'];
  const testVoices = ['onyx', 'echo', 'cedar', 'alloy'];

  for (const model of testModels) {
    for (const voice of testVoices) {
      try {
        console.log(`\nTrying model="${model}", voice="${voice}"...`);
        const result = await openaiService.generateSpeech('Hello, I am Tejas.', {
          model,
          voice
        });
        console.log(`SUCCESS with model="${model}", voice="${voice}"! Buffer size: ${result.buffer.length} bytes`);
        return; // found working combination
      } catch (err) {
        console.error(`FAILED with model="${model}", voice="${voice}":`, err.message);
      }
    }
  }
}

testTTS();
