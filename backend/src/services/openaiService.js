const OpenAI = require('openai');
const { toFile } = require('openai');

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
   * Map an OpenAI chat completion onto the { text, inputTokens, outputTokens,
   * totalTokens, model } shape every caller in this codebase expects.
   */
  normalizeResponse(response) {
    const usage = response.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;

    return {
      text: response.choices?.[0]?.message?.content || '',
      finishReason: response.choices?.[0]?.finish_reason || null,
      inputTokens,
      outputTokens,
      totalTokens: usage.total_tokens || inputTokens + outputTokens,
      model: response.model,
    };
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

    const response = await client.chat.completions.create(requestOptions);

    return this.normalizeResponse(response);
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

    const response = await client.chat.completions.create(requestOptions);

    return this.normalizeResponse(response);
  }

  /**
   * Get the image model used for generation and editing
   */
  getImageModel() {
    return process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
  }

  /**
   * Build an OpenAI vision content part from a data URL string or a
   * { base64 | buffer, mimeType } object.
   */
  toImagePart(image) {
    if (typeof image === 'string') {
      return { type: 'image_url', image_url: { url: image } };
    }

    const mimeType = image.mimeType || 'image/jpeg';
    const base64 = Buffer.isBuffer(image.buffer)
      ? image.buffer.toString('base64')
      : image.base64;

    return {
      type: 'image_url',
      image_url: {
        url: `data:${mimeType};base64,${base64}`,
        detail: image.detail || 'auto',
      },
    };
  }

  /**
   * Analyze one or more images alongside a text prompt.
   * Returns the same normalized shape as generateText.
   * @param {string} prompt - The instruction to apply to the image(s)
   * @param {Array|Object|string} images - data URLs, or { base64|buffer, mimeType }
   * @param {Object} options - Same options as generateText
   */
  async generateWithVision(prompt, images = [], options = {}) {
    const client = this.getClient();
    const model = this.getModel(options.modelType || 'vision');

    const imageList = Array.isArray(images) ? images : [images];
    const content = [
      { type: 'text', text: prompt },
      ...imageList.map((img) => this.toImagePart(img)),
    ];

    const messages = options.systemPrompt
      ? [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content },
        ]
      : [{ role: 'user', content }];

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

    const response = await client.chat.completions.create(requestOptions);

    return this.normalizeResponse(response);
  }

  /**
   * Map an images API response onto a { base64, dataUrl, mimeType, ...tokens }
   * shape. gpt-image-1 always returns base64 - there is no URL variant.
   */
  normalizeImageResponse(response) {
    const usage = response.usage || {};
    const base64 = response.data?.[0]?.b64_json || null;
    const mimeType = `image/${response.output_format || 'png'}`;
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;

    return {
      base64,
      dataUrl: base64 ? `data:${mimeType};base64,${base64}` : null,
      mimeType,
      inputTokens,
      outputTokens,
      totalTokens: usage.total_tokens || inputTokens + outputTokens,
      model: this.getImageModel(),
    };
  }

  /**
   * Generate an image from a text prompt.
   * @param {string} prompt - Description of the image to synthesize
   * @param {Object} options - { size, quality }
   */
  async generateImage(prompt, options = {}) {
    const client = this.getClient();

    const response = await client.images.generate({
      model: this.getImageModel(),
      prompt,
      n: 1,
      size: options.size || '1024x1024',
      quality: options.quality || 'medium',
    });

    return this.normalizeImageResponse(response);
  }

  /**
   * Edit / restyle an existing image using a text prompt.
   * @param {string} prompt - How the source image should be transformed
   * @param {Buffer|Object} image - Buffer, or { base64|buffer, mimeType }
   * @param {Object} options - { size, quality }
   */
  async editImage(prompt, image, options = {}) {
    const client = this.getClient();

    const buffer = Buffer.isBuffer(image)
      ? image
      : Buffer.isBuffer(image.buffer)
        ? image.buffer
        : Buffer.from(image.base64, 'base64');
    const mimeType = (!Buffer.isBuffer(image) && image.mimeType) || 'image/png';
    const extension = mimeType.split('/')[1] || 'png';

    const file = await toFile(buffer, `source.${extension}`, { type: mimeType });

    const response = await client.images.edit({
      model: this.getImageModel(),
      image: file,
      prompt,
      n: 1,
      size: options.size || '1024x1024',
      quality: options.quality || 'medium',
    });

    return this.normalizeImageResponse(response);
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
