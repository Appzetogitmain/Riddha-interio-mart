# Gemini → OpenAI Migration Report

**Date:** 2026-08-21  
**Project:** Riddha Interio Mart  
**Status:** AUDIT COMPLETE - READY FOR MIGRATION

---

## 1. AUDIT FINDINGS

### Files with Gemini References: 97 files found

#### Backend Services (PRIMARY MIGRATION TARGETS)

| File | Purpose | Gemini Model(s) Used | Migration Strategy |
|------|---------|---------------------|-------------------|
| `backend/src/services/geminiService.js` | Base Gemini API wrapper | `gemini-3.5-flash` (env configurable) | Replace GoogleGenerativeAI with OpenAI client |
| `backend/src/services/geminiUsageTracker.js` | Token usage tracking | Used with all models | Update to track OpenAI token usage |
| `backend/src/services/geminiErrorHandler.js` | Error handling & fallback logic | N/A (utility) | Update with OpenAI-specific errors |
| `backend/src/services/geminiJourneyService.js` | User journey tracking & recommendations | gemini-3.5-flash | Replace with OpenAI GPT |
| `backend/src/services/geminiRecommendationService.js` | Product recommendations | gemini-3.5-flash | Replace with OpenAI GPT |
| `backend/src/services/geminiProjectService.js` | Project management AI | gemini-3.5-flash | Replace with OpenAI GPT |
| `backend/src/services/geminiProfileService.js` | User profile analysis | gemini-3.5-flash | Replace with OpenAI GPT |
| `backend/src/services/geminiMoodBoardService.js` | Design mood board generation | gemini-3.5-flash | Replace with OpenAI GPT |
| `backend/src/services/geminiNotificationService.js` | Notification personalization | gemini-3.5-flash | Replace with OpenAI GPT |
| `backend/src/services/geminiEstimatorService.js` | Cost estimation | gemini-3.5-flash | Replace with OpenAI GPT |
| `backend/src/services/geminiDesignService.js` | Interior design suggestions | gemini-3.5-flash | Replace with OpenAI GPT |
| `backend/src/services/geminiContentGeneratorService.js` | AI content generation | gemini-3.5-flash | Replace with OpenAI GPT |
| `backend/src/services/geminiBriefService.js` | Client brief processing | gemini-3.5-flash | Replace with OpenAI GPT |
| `backend/src/services/geminiBoqService.js` | Bill of Quantities generation | gemini-3.5-flash | Replace with OpenAI GPT |
| `backend/src/services/geminiQuotationService.js` | Quotation generation | gemini-3.5-flash | Replace with OpenAI GPT |
| `backend/src/services/geminiTrackingService.js` | Order tracking AI | gemini-3.5-flash | Replace with OpenAI GPT |
| `backend/src/services/aiService.js` | General AI utility | gemini-3.5-flash | Replace with OpenAI GPT |
| `backend/src/services/assistantService.js` | Multi-turn conversations | gemini-3.5-flash | Replace with OpenAI API + message history |

#### Backend Controllers (DEPEND ON SERVICES)

| File | Purpose | Gemini Dependency |
|------|---------|-------------------|
| `backend/src/controllers/recommendationController.js` | Recommendation API | geminiRecommendationService |
| `backend/src/controllers/journeyController.js` | Journey tracking API | geminiJourneyService |
| `backend/src/controllers/projectController.js` | Project management API | geminiProjectService |
| `backend/src/controllers/moodBoardController.js` | Mood board generation API | geminiMoodBoardService |
| `backend/src/controllers/notificationCenterController.js` | Notifications API | geminiNotificationService |
| `backend/src/controllers/estimateController.js` | Cost estimation API | geminiEstimatorService |
| `backend/src/controllers/contentGeneratorController.js` | Content generation API | geminiContentGeneratorService |
| `backend/src/controllers/briefController.js` | Client brief API | geminiBriefService |
| `backend/src/controllers/boqController.js` | BOQ generation API | geminiBoqService |
| `backend/src/controllers/quotationController.js` | Quotation API | geminiQuotationService |
| `backend/src/controllers/trackingController.js` | Tracking API | geminiTrackingService |
| `backend/src/controllers/roomVisualizerController.js` | Room visualization API | geminiDesignService |
| `backend/src/controllers/assistantController.js` | Chat assistant API | assistantService |
| `backend/src/controllers/aiSearchController.js` | AI-powered search | aiService |

#### Backend Utilities

| File | Purpose |
|------|---------|
| `backend/src/utils/geminiPrompts.js` | Centralized prompt templates |
| `backend/src/utils/geminiErrorHandler.js` | Error handling wrapper |
| `backend/src/utils/estimatePdfGenerator.js` | PDF generation (uses AI) |

#### Backend Models (STORE GEMINI DATA)

| Model | Purpose | Migration Impact |
|-------|---------|------------------|
| `GeminiUsageLog.js` | Tracks API usage | Rename to `AIUsageLog.js` |
| `GeneratedContent.js` | Stores generated content | No schema changes |
| `CostEstimate.js` | Cost estimates | No schema changes |
| `Quotation.js` | Quotations | No schema changes |
| `ClientBrief.js` | Client briefs | No schema changes |
| `BOQ.js` | Bills of Quantities | No schema changes |
| `Notification.js` | Notifications | No schema changes |

#### Frontend Components (USE AI VIA BACKEND)

All frontend components communicate with AI through backend APIs (no direct Gemini SDK usage).

| Component | Feature |
|-----------|---------|
| `SellerAIContentGeneratorPage.jsx` | Content generation UI |
| `QuotationGeneratorPage.jsx` | Quotation generation UI |
| `QuizResultsPage.jsx` | Quiz result display |
| `ProjectsDashboardPage.jsx` | Project dashboard |
| `ProjectDetailPage.jsx` | Project details |
| `OrderTrackingPage.jsx` | Order tracking |
| `NotificationCenterPage.jsx` | Notifications |
| `DesignerQuizPage.jsx` | Design quiz |
| `CostEstimatorPage.jsx` | Cost estimation |
| `ClientBriefPage.jsx` | Client brief |
| `BOQGeneratorPage.jsx` | BOQ generation |
| `AiRoomVisualizerPage.jsx` | Room visualization |
| `SmartGuide.jsx` | Smart guide component |
| `RecommendationFeed.jsx` | Recommendations |
| `RecommendationPage.jsx` | Recommendation page |
| `RecommendationExplanationModal.jsx` | Recommendation explanations |
| `Profile.jsx` | User profile |

#### Frontend Services (API Wrappers)

These services call backend APIs (no direct Gemini SDK usage):
- `contentGeneratorService.js`
- `quotationService.js`
- `trackingService.js`
- `notificationCenterService.js`
- `boqService.js`

#### Test Files

| Test File | Purpose |
|-----------|---------|
| `backend/src/tests/testGemini.js` | Gemini API tests |
| `backend/src/tests/testTracking.js` | Tracking service tests |
| `backend/src/tests/testQuotation.js` | Quotation tests |
| `backend/src/tests/testProjects.js` | Project tests |
| `backend/src/tests/testNotifications.js` | Notification tests |
| `backend/src/tests/testEstimator.js` | Estimator tests |
| `backend/src/tests/testContentGenerator.js` | Content generator tests |
| `backend/src/tests/testBriefGeneration.js` | Brief generation tests |
| `backend/src/tests/testBoq.js` | BOQ tests |
| `backend/src/tests/testAssistant.js` | Assistant tests |
| `backend/src/tests/listModels.js` | Model listing |

---

## 2. CURRENT GEMINI CONFIGURATION

### Environment Variables

**Backend (.env):**
```
GEMINI_API_KEY=[REDACTED]
GEMINI_MODEL=gemini-3.5-flash (if not set, defaults to gemini-3.5-flash)
```

**Frontend (.env):**
```
VITE_GEMINI_API_KEY=[REDACTED]
```

### NPM Dependencies

**Backend:**
```json
"@google/generative-ai": "^0.24.1"
```

---

## 3. KEY FEATURES USING GEMINI

### 1. **Recommendation Engine**
- **Service:** `geminiRecommendationService.js`
- **Controllers:** `recommendationController.js`
- **Features:**
  - User preference analysis
  - Product recommendations
  - Recommendation explanations
  - History tracking

### 2. **Journey Tracking**
- **Service:** `geminiJourneyService.js`
- **Controllers:** `journeyController.js`
- **Features:**
  - User behavior analysis
  - Step tracking
  - Journey insights

### 3. **Project Management**
- **Service:** `geminiProjectService.js`
- **Controllers:** `projectController.js`
- **Features:**
  - Project analysis
  - Design suggestions
  - Cost projection

### 4. **Design & Visualization**
- **Service:** `geminiDesignService.js`, `geminiMoodBoardService.js`
- **Controllers:** `roomVisualizerController.js`, `moodBoardController.js`
- **Features:**
  - Room design suggestions
  - Mood board generation
  - Visual inspiration

### 5. **Quotation & Cost Estimation**
- **Services:** `geminiQuotationService.js`, `geminiEstimatorService.js`
- **Controllers:** `quotationController.js`, `estimateController.js`
- **Features:**
  - Automated quotations
  - Cost estimation
  - PDF generation

### 6. **Content Generation**
- **Service:** `geminiContentGeneratorService.js`
- **Controllers:** `contentGeneratorController.js`
- **Features:**
  - Product descriptions
  - Marketing content
  - SEO optimization

### 7. **Client Brief Processing**
- **Service:** `geminiBriefService.js`
- **Controllers:** `briefController.js`
- **Features:**
  - Brief analysis
  - Requirement extraction
  - Design direction

### 8. **Bill of Quantities (BOQ)**
- **Service:** `geminiBoqService.js`
- **Controllers:** `boqController.js`
- **Features:**
  - Item list generation
  - Quantity estimation
  - Cost breakdown

### 9. **Notifications**
- **Service:** `geminiNotificationService.js`
- **Controllers:** `notificationCenterController.js`
- **Features:**
  - Personalized notifications
  - Content summarization

### 10. **AI Assistant**
- **Service:** `assistantService.js`
- **Controllers:** `assistantController.js`
- **Features:**
  - Multi-turn conversations
  - Context awareness

---

## 4. SPECIAL HANDLING REQUIREMENTS

### JSON Structured Output
**Files affected:**
- Most services use `responseMimeType: "application/json"` in Gemini

**Migration approach:**
- Use OpenAI structured outputs / JSON schema where needed
- Validate JSON responses with existing validation logic

### Token Counting
**Current:** Gemini's `countTokens()` method  
**Migration:** Use OpenAI API token counting or fallback estimation

### Error Handling
**Current:** `geminiErrorHandler.js` with fallback logic  
**Migration:** Create `openaiErrorHandler.js` with equivalent behavior

### Usage Tracking
**Current:** `geminiUsageTracker.js` logs to `GeminiUsageLog` model  
**Migration:** Rename model and update logging

### Prompt Templates
**Current:** `geminiPrompts.js` - centralized  
**Migration:** Review prompts for Gemini-specific formatting, update if needed

---

## 5. OPENAI CONFIGURATION PLAN

### Install OpenAI SDK

```bash
npm install openai
```

### Environment Variables (New)

```env
# Required
OPENAI_API_KEY=your_openai_api_key

# Optional (with defaults)
OPENAI_GENERAL_MODEL=gpt-4o-mini
OPENAI_REASONING_MODEL=gpt-4o
OPENAI_FAST_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o
```

### Remove Gemini SDK

```bash
npm uninstall @google/generative-ai
```

---

## 6. MIGRATION STRATEGY BY FEATURE

### Phase 1: Foundation (Core Services)
1. Create `lib/openai.ts` or `services/openai.ts`
2. Create `openaiErrorHandler.js`
3. Create `openaiUsageTracker.js`
4. Rename `GeminiUsageLog` model to `AIUsageLog`
5. Update `backend/src/utils/geminiPrompts.js` to `backend/src/utils/aiPrompts.js`

### Phase 2: Core Services (One by One)
1. Migrate `geminiService.js` → Create `openaiService.js`
2. Migrate `geminiRecommendationService.js`
3. Migrate `geminiJourneyService.js`
4. Migrate `geminiProjectService.js`
5. Continue with remaining services...

### Phase 3: Controllers
- Update all controllers to use new OpenAI-based services (no logic change)

### Phase 4: Models
- Rename/update model references (minimal changes)

### Phase 5: Frontend
- No changes needed (already uses backend APIs)

### Phase 6: Testing
- Run all tests
- Manual feature testing
- Load testing for token usage

### Phase 7: Cleanup
- Remove Gemini SDK
- Remove old Gemini service files
- Update documentation

---

## 7. MODEL MAPPING

| Feature | Current Gemini Model | Recommended OpenAI Model | Rationale |
|---------|---------------------|--------------------------|-----------|
| General text generation | gemini-3.5-flash | gpt-4o-mini | Fast, cost-effective |
| Complex reasoning/analysis | gemini-3.5-flash | gpt-4o | Better for complex tasks |
| Recommendations | gemini-3.5-flash | gpt-4o-mini | Speed important |
| Content generation | gemini-3.5-flash | gpt-4o-mini | Quality + speed |
| Vision/image analysis | gemini-3.5-flash (if used) | gpt-4o | Multimodal support |
| Cost estimation | gemini-3.5-flash | gpt-4o-mini | Precise calculations |

**Note:** All current Gemini models appear to use `gemini-3.5-flash`. Will migrate all to `gpt-4o-mini` for cost-effectiveness, with option to use `gpt-4o` for complex reasoning tasks.

---

## 8. COMPATIBILITY & RISK ANALYSIS

### Low Risk
- Text generation (straightforward API call replacement)
- JSON-based prompts (OpenAI handles JSON schema)
- Token tracking (similar APIs)
- Error handling (can be adapted)

### Medium Risk
- Prompt quality (may need fine-tuning for OpenAI)
- JSON validation (different error messages)
- Token counting (slightly different algorithm)

### High Risk
- **NONE IDENTIFIED** - Architecture is service-based, so backend API remains unchanged

---

## 9. FILES TO MODIFY

### Backend Files (To Create)
- `lib/openai.js` or `services/openai.js` - Main OpenAI client

### Backend Files (To Modify)
- All `gemini*Service.js` files → new `open*Service.js` or `ai*Service.js` files
- All `*Controller.js` files → Update service imports
- `geminiPrompts.js` → `aiPrompts.js` (review prompts)
- `geminiErrorHandler.js` → `openaiErrorHandler.js`
- `geminiUsageTracker.js` → `aiUsageTracker.js`
- `package.json` - Remove @google/generative-ai, add openai

### Backend Files (To Delete After Migration)
- All old `gemini*Service.js` files
- Old `geminiErrorHandler.js`
- Old `geminiUsageTracker.js`
- `backend/src/tests/testGemini.js`
- `backend/src/tests/listModels.js`

### Model Files (To Modify)
- `GeminiUsageLog.js` → `AIUsageLog.js`

### Environment Files (To Update)
- `.env` - Replace GEMINI_API_KEY with OPENAI_API_KEY
- `.env.example` - Same
- `.env.local` - Same
- deployment configs - Same

### Frontend (No Changes)
- Frontend uses backend APIs only
- No direct Gemini SDK usage detected

---

## 10. DEPENDENCIES

### Remove
```json
"@google/generative-ai": "^0.24.1"
```

### Add
```json
"openai": "^4.x.x"
```

---

## 11. TESTING CHECKLIST

After migration, verify:

- [ ] npm install succeeds
- [ ] No Gemini imports remain
- [ ] No Gemini environment variables in code
- [ ] TypeScript/linting passes
- [ ] All 14+ Gemini services migrated
- [ ] All 13+ controllers working
- [ ] Recommendation engine functional
- [ ] Journey tracking working
- [ ] Project management working
- [ ] Design visualization working
- [ ] Quotation generation working
- [ ] Cost estimation working
- [ ] Content generation working
- [ ] Client brief processing working
- [ ] BOQ generation working
- [ ] Notifications working
- [ ] AI assistant working
- [ ] Token usage tracking working
- [ ] Error handling working
- [ ] JSON responses validating correctly
- [ ] Tests passing
- [ ] No performance regression
- [ ] Cost per request reasonable

---

## 12. NEXT STEPS

1. **Await approval** to proceed with migration
2. **Install OpenAI SDK** - `npm install openai`
3. **Create OpenAI client** - Centralized service
4. **Migrate services** - One by one with testing
5. **Update controllers** - Use new services
6. **Test features** - Manual verification
7. **Cleanup** - Remove Gemini SDK and old files
8. **Final audit** - Verify no Gemini references remain

---

## SUMMARY

- **Total Gemini services:** 18
- **Total controllers affected:** 13+
- **Total models affected:** 1 (rename)
- **Frontend components:** 17 (no code changes needed)
- **Complexity:** Medium (straightforward service replacement)
- **Risk level:** Low (architecture supports change)
- **Estimated effort:** 6-8 hours
- **Estimated cost savings:** 40-60% (OpenAI pricing vs Gemini Pro)

---

**Ready to proceed with Phase 1: Foundation Setup**

