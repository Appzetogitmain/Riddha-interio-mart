const OpenAI = require('openai');

class OpenAIServiceClient {
  constructor() {
    this.client = null;
    this.currentApiKey = null;
  }

  /**
   * Get or create OpenAI client instance
   */
  getClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    if (!this.client || this.currentApiKey !== apiKey) {
      this.currentApiKey = apiKey;
      this.client = new OpenAI({
        apiKey: apiKey,
      });
    }

    return this.client;
  }

  /**
   * Get model configuration
   * @param {string} modelType - Type of model (general, fast, reasoning, vision)
   */
  getModel(modelType = 'general') {
    const models = {
      general: process.env.OPENAI_GENERAL_MODEL || 'gpt-4o-mini',
      fast: process.env.OPENAI_FAST_MODEL || 'gpt-4o-mini',
      reasoning: process.env.OPENAI_REASONING_MODEL || 'gpt-4o',
      vision: process.env.OPENAI_VISION_MODEL || 'gpt-4o',
    };

    return models[modelType] || models.general;
  }

  /**
   * Generate text using OpenAI API
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Configuration options
   */
  async generateText(prompt, options = {}) {
    const client = this.getClient();
    const model = this.getModel(options.modelType || 'general');

    const messages = options.systemPrompt
      ? [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: prompt },
        ]
      : [{ role: 'user', content: prompt }];

    const requestOptions = {
      model,
      messages,
      temperature: options.temperature || 0.7,
    };

    // Add response format if expecting JSON
    if (options.expectJson) {
      requestOptions.response_format = { type: 'json_object' };
    }

    // Add max tokens if specified
    if (options.maxTokens) {
      requestOptions.max_tokens = options.maxTokens;
    }

    // Add top_p if specified
    if (options.topP !== undefined) {
      requestOptions.top_p = options.topP;
    }

    const response = await client.messages.create(requestOptions);

    return {
      text: response.content[0].text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      model: response.model,
    };
  }

  /**
   * Generate text with message history (for conversations)
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Configuration options
   */
  async generateWithHistory(messages, options = {}) {
    const client = this.getClient();
    const model = this.getModel(options.modelType || 'general');

    const requestOptions = {
      model,
      messages,
      temperature: options.temperature || 0.7,
    };

    if (options.expectJson) {
      requestOptions.response_format = { type: 'json_object' };
    }

    if (options.maxTokens) {
      requestOptions.max_tokens = options.maxTokens;
    }

    if (options.topP !== undefined) {
      requestOptions.top_p = options.topP;
    }

    const response = await client.messages.create(requestOptions);

    return {
      text: response.content[0].text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      model: response.model,
    };
  }

  /**
   * Estimate token count for a prompt
   * Fallback: ~4 characters per token on average
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }
}

// Export singleton instance
module.exports = new OpenAIServiceClient();
