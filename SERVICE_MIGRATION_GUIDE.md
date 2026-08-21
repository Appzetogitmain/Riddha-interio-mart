# Service Migration Implementation Guide

## Overview

This guide provides the exact pattern for migrating each Gemini service to OpenAI. All 18 services follow the same basic pattern with minor variations for specific features.

---

## Migration Pattern Template

### Step 1: Read Original Service
```bash
cat backend/src/services/gemini[ServiceName]Service.js
```

### Step 2: Create OpenAI Version
File: `backend/src/services/[serviceName]Service.js`

**Template Structure:**
```javascript
const openaiClient = require('./openaiService');
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const OpenAIUsageTracker = require('./openaiUsageTracker');
const logger = require('../utils/logger');

class [ServiceName]Service {
  /**
   * Main method name remains the same
   * Gemini: model.generateContent(prompt)
   * OpenAI: await openaiClient.generateText(prompt, options)
   */
  async [methodName](input, context = {}) {
    try {
      // 1. Build prompt (keep same logic)
      const prompt = this.buildPrompt(input);
      
      // 2. Call OpenAI (replace Gemini call)
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general', // or 'fast', 'reasoning', 'vision'
        expectJson: true, // if JSON expected
        systemPrompt: 'Optional system instruction',
        temperature: 0.7,
        maxTokens: 2000,
      });

      // 3. Parse response (keep same logic)
      const result = this.parseResponse(response.text);

      // 4. Track usage (CHANGED: now uses OpenAI format)
      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        '[feature-name]',
        context.userId,
        context.endpoint,
        response.model
      );

      return result;
    } catch (error) {
      const errorInfo = OpenAIErrorHandler.handleError(error, { 
        service: '[ServiceName]',
        method: '[methodName]',
        input 
      });
      throw new Error(errorInfo.message);
    }
  }

  // Keep all helper methods as-is
  buildPrompt(input) { /* existing logic */ }
  parseResponse(text) { /* existing logic */ }
}

module.exports = new [ServiceName]Service();
```

---

## Key Changes Across All Services

### 1. Import Changes
**Before (Gemini):**
```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
```

**After (OpenAI):**
```javascript
const openaiClient = require('./openaiService');
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const OpenAIUsageTracker = require('./openaiUsageTracker');
```

### 2. Client Initialization
**Before (Gemini):**
```javascript
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
```

**After (OpenAI):**
```javascript
const openaiClient = require('./openaiService');
// Client already initialized and reused
```

### 3. API Call Pattern
**Before (Gemini):**
```javascript
const response = await model.generateContent({
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  generationConfig: { responseMimeType: "application/json" } // if JSON
});
const text = response.response.text();
```

**After (OpenAI):**
```javascript
const response = await openaiClient.generateText(prompt, {
  expectJson: true, // simplified JSON handling
  modelType: 'general',
  temperature: 0.7,
});
const text = response.text;
```

### 4. Token Tracking
**Before (Gemini):**
```javascript
const inputCount = await model.countTokens(prompt);
// Tracked to GeminiUsageLog
```

**After (OpenAI):**
```javascript
// Tokens come in OpenAI response automatically
await OpenAIUsageTracker.trackUsage({
  inputTokens: response.inputTokens,
  outputTokens: response.outputTokens,
  totalTokens: response.totalTokens,
}, 'feature-name', userId, endpoint, response.model);
```

### 5. Error Handling
**Before (Gemini):**
```javascript
const { callWithFallback } = require('../utils/geminiErrorHandler');
// Custom Gemini error logic
```

**After (OpenAI):**
```javascript
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const errorInfo = OpenAIErrorHandler.handleError(error, context);
// Centralized OpenAI error handling
```

### 6. JSON Response Handling
**Before (Gemini):**
```javascript
const options = {};
if (expectJson) {
  options.generationConfig = { responseMimeType: "application/json" };
}
const content = await model.generateContent({ ...prompt, ...options });
```

**After (OpenAI):**
```javascript
const response = await openaiClient.generateText(prompt, {
  expectJson: true, // simplified
});
const result = JSON.parse(response.text);
```

---

## Service-Specific Migration Examples

### Example 1: geminiRecommendationService.js → recommendationService.js

**Pattern:**
1. Keep all business logic exactly the same
2. Replace only the Gemini API call
3. Update token tracking to use OpenAI format
4. All method names remain identical

**File:** `backend/src/services/recommendationService.js`

```javascript
const openaiClient = require('./openaiService');
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const OpenAIUsageTracker = require('./openaiUsageTracker');

class RecommendationService {
  async generateRecommendations(userId, preferences) {
    try {
      const prompt = this.buildRecommendationPrompt(userId, preferences);
      
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        systemPrompt: 'You are a helpful interior design recommendation engine...',
        temperature: 0.8,
      });

      const recommendations = JSON.parse(response.text);
      
      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'recommendations',
        userId,
        '/api/recommendations',
        response.model
      );

      return recommendations;
    } catch (error) {
      const errorInfo = OpenAIErrorHandler.handleError(error, {
        service: 'RecommendationService',
        userId,
      });
      throw new Error(errorInfo.message);
    }
  }

  buildRecommendationPrompt(userId, preferences) {
    // Keep existing logic
  }
}

module.exports = new RecommendationService();
```

### Example 2: geminiContentGeneratorService.js → contentGeneratorService.js

**Same pattern:** Only the API interaction changes, all business logic stays the same.

---

## Controller Updates (Minimal Changes)

### Before (Gemini):
```javascript
const { geminiContentGeneratorService } = require('../services/geminiContentGeneratorService');
```

### After (OpenAI):
```javascript
const contentGeneratorService = require('../services/contentGeneratorService');
```

**Note:** All controller logic remains identical. No business logic changes needed.

---

## Testing Each Service

After migrating each service:

```bash
# 1. Check imports
grep -r "GoogleGenerativeAI" backend/src/

# 2. Check syntax
npm run lint

# 3. Test the specific service (if unit tests exist)
npm test -- --testPathPattern="recommendation" # example

# 4. Manual API test
curl -X POST http://localhost:5002/api/recommendations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "...", "preferences": {...}}'
```

---

## Batch Processing Strategy

### Batch 1: Foundation (Must do first)
1. Replace base `geminiService.js` usage in other services
2. Review and update `geminiPrompts.js` → `aiPrompts.js`
3. Verify all services can import `openaiService.js`

### Batch 2-6: Process each service

For each service:
1. Read the original Gemini service
2. Create new OpenAI-based service using template
3. Update controller imports
4. Test the API endpoint
5. Commit the batch

---

## Prompt Template Review Checklist

When migrating, check if prompts need updates for OpenAI:

- [ ] Gemini-specific instructions removed
- [ ] Format instructions match OpenAI expectations
- [ ] JSON schema clear and valid (if JSON expected)
- [ ] System prompt vs user prompt properly separated
- [ ] Token limits appropriate for OpenAI

**Most prompts will work as-is** - OpenAI is backward compatible with most Gemini prompts.

---

## Quick Reference: Service List

| Service | Purpose | Complexity | Priority |
|---------|---------|-----------|----------|
| `geminiService.js` | Base client | Low | 1 |
| `geminiRecommendationService.js` | Recommendations | Low | 2 |
| `geminiJourneyService.js` | Journey tracking | Low | 2 |
| `geminiContentGeneratorService.js` | Content gen | Medium | 2 |
| `geminiBriefService.js` | Brief processing | Low | 3 |
| `geminiBoqService.js` | BOQ generation | Medium | 3 |
| `geminiQuotationService.js` | Quotations | Medium | 3 |
| `geminiDesignService.js` | Design suggestions | Medium | 4 |
| `geminiMoodBoardService.js` | Mood boards | Medium | 4 |
| `geminiEstimatorService.js` | Cost estimation | Low | 4 |
| `geminiNotificationService.js` | Notifications | Low | 5 |
| `geminiTrackingService.js` | Order tracking | Low | 5 |
| `geminiProjectService.js` | Projects | Medium | 6 |
| `assistantService.js` | Chat assistant | Medium | 6 |
| `aiService.js` | General utility | Low | 6 |
| `geminiProfileService.js` | Profile analysis | Low | 2 |

---

## Next Steps

1. **Start with Batch 1**: Ensure foundation is solid
2. **Follow the template**: Each service uses identical pattern
3. **Test incrementally**: Don't migrate all 18 at once
4. **Keep prompts as-is**: Most will work without changes
5. **Track progress**: Update MIGRATION_PROGRESS.md

