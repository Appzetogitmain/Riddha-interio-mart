const logger = require('./logger');

/**
 * Handle OpenAI API errors gracefully
 */
class OpenAIErrorHandler {
  /**
   * Categorize and handle OpenAI errors
   */
  static handleError(error, context = {}) {
    const errorLog = {
      timestamp: new Date(),
      type: error.constructor.name,
      message: error.message,
      context,
    };

    // Authentication errors
    if (error.status === 401 || error.code === 'invalid_api_key') {
      errorLog.category = 'AUTHENTICATION';
      errorLog.userMessage = 'AI service authentication failed. Please contact support.';
      logger.error('OpenAI Auth Error:', errorLog);
      return {
        success: false,
        category: 'AUTHENTICATION',
        message: errorLog.userMessage,
      };
    }

    // Rate limit errors
    if (error.status === 429 || error.code === 'rate_limit_exceeded') {
      errorLog.category = 'RATE_LIMIT';
      errorLog.userMessage = 'AI service is busy. Please try again in a few moments.';
      logger.warn('OpenAI Rate Limit:', errorLog);
      return {
        success: false,
        category: 'RATE_LIMIT',
        message: errorLog.userMessage,
        retryable: true,
      };
    }

    // Invalid request errors
    if (error.status === 400 || error.code === 'invalid_request_error') {
      errorLog.category = 'INVALID_REQUEST';
      errorLog.userMessage = 'Invalid request to AI service. Please try again.';
      logger.error('OpenAI Invalid Request:', errorLog);
      return {
        success: false,
        category: 'INVALID_REQUEST',
        message: errorLog.userMessage,
      };
    }

    // Server errors (5xx)
    if (error.status >= 500) {
      errorLog.category = 'SERVER_ERROR';
      errorLog.userMessage = 'AI service temporarily unavailable. Please try again later.';
      logger.error('OpenAI Server Error:', errorLog);
      return {
        success: false,
        category: 'SERVER_ERROR',
        message: errorLog.userMessage,
        retryable: true,
      };
    }

    // Network/timeout errors
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.message.includes('timeout') ||
      error.message.includes('network')
    ) {
      errorLog.category = 'NETWORK';
      errorLog.userMessage = 'Network error connecting to AI service. Please try again.';
      logger.error('OpenAI Network Error:', errorLog);
      return {
        success: false,
        category: 'NETWORK',
        message: errorLog.userMessage,
        retryable: true,
      };
    }

    // Generic error
    errorLog.category = 'UNKNOWN';
    errorLog.userMessage = 'An error occurred with the AI service. Please try again.';
    logger.error('OpenAI Unknown Error:', errorLog);
    return {
      success: false,
      category: 'UNKNOWN',
      message: errorLog.userMessage,
      retryable: false,
    };
  }

  /**
   * Retry logic with exponential backoff
   */
  static async callWithRetry(apiCall, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        const errorInfo = this.handleError(error);

        // Don't retry if not retryable
        if (!errorInfo.retryable) {
          throw error;
        }

        // Don't retry if last attempt
        if (attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        logger.info(`Retrying after ${delayMs}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  /**
   * Parse error response
   */
  static getErrorDetails(error) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
      type: error.type,
      param: error.param,
    };
  }
}

module.exports = OpenAIErrorHandler;
