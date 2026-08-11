require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function main() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('No GEMINI_API_KEY found in env');
      return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    // In newer SDKs, genAI.getGenerativeModel can be used, but let's try listing models
    // via standard listModels call or catch the error if unsupported.
    console.log('Querying available models from Gemini API...');
    
    // Using fetch to query the models endpoint directly is extremely reliable
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.error) {
      console.error('API Error:', data.error);
      return;
    }
    
    console.log('Available Models:');
    if (data.models) {
      data.models.forEach(model => {
        console.log(`- ${model.name} (supports: ${model.supportedGenerationMethods.join(', ')})`);
      });
    } else {
      console.log('No models returned. Response data:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Error listing models:', err.message);
  }
}

main();
