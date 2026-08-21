require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const openaiClient = require('../services/openaiService');

async function main() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('No OPENAI_API_KEY found in env');
      return;
    }

    console.log('Querying available models from the OpenAI API...');
    const client = openaiClient.getClient();
    const list = await client.models.list();

    const models = (list.data || []).map((m) => m.id).sort();
    if (models.length === 0) {
      console.log('No models returned.');
      return;
    }

    console.log(`Available Models (${models.length}):`);
    models.forEach((id) => console.log(`- ${id}`));

    console.log('\nConfigured for this project:');
    ['general', 'fast', 'reasoning', 'vision'].forEach((type) => {
      console.log(`- ${type}: ${openaiClient.getModel(type)}`);
    });
    console.log(`- image: ${openaiClient.getImageModel()}`);
  } catch (err) {
    console.error('Error listing models:', err.message);
  }
}

main();
