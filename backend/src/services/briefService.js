const openaiClient = require('./openaiService');
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const OpenAIUsageTracker = require('./openaiUsageTracker');

class BriefService {
  /**
   * Helper to parse JSON from AI response
   */
  parseJson(text) {
    if (!text || typeof text !== 'string') return null;
    let cleanText = text.trim();
    cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      return JSON.parse(cleanText);
    } catch (_) {}

    try {
      const sanitized = cleanText.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
        return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
      });
      return JSON.parse(sanitized);
    } catch (_) {}

    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      let sub = cleanText.substring(firstBrace, lastBrace + 1).replace(/,\s*([}\]])/g, '$1');
      try {
        return JSON.parse(sub);
      } catch (_) {}
    }

    const firstBracket = cleanText.indexOf('[');
    const lastBracket = cleanText.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      let subArr = cleanText.substring(firstBracket, lastBracket + 1).replace(/,\s*([}\]])/g, '$1');
      try {
        return JSON.parse(subArr);
      } catch (_) {}
    }

    return null;
  }

  /**
   * Helper to convert raw form answers array into a map
   */
  extractFormContext(formAnswers) {
    const answers = {};
    if (Array.isArray(formAnswers)) {
      formAnswers.forEach(item => {
        answers[item.questionId] = item.answer;
      });
    }

    return {
      projectType: answers[1] || 'Room Refresh',
      roomType: answers[2] || 'Living Room',
      roomDimensions: answers[3] || 'Not specified',
      scopeOfWork: Array.isArray(answers[4]) ? answers[4].join(', ') : (answers[4] || 'Furniture & Decor'),
      totalBudget: answers[5] ? `₹${Number(answers[5]).toLocaleString('en-IN')}` : '₹250,000',
      numericBudget: Number(answers[5]) || 250000,
      timeline: answers[6] || 'Soon (2-4 months)',
      designStyle: answers[7] || 'Modern Minimalist',
      mustHaves: answers[8] || 'Pet-friendly, durable, functional storage solutions',
      constraints: Array.isArray(answers[9]) ? answers[9].join(', ') : (answers[9] || 'None specified'),
      additionalInfo: answers[10] || 'Clean aesthetic with high quality finishes'
    };
  }

  /**
   * Generate complete Project Brief (8 sections)
   */
  async generateFullBrief(formAnswers, userId = null) {
    const ctx = this.extractFormContext(formAnswers);

    const sections = {
      executiveSummary: '',
      projectOverview: '',
      designScope: {},
      requirements: {},
      timeline: {},
      budgetBreakdown: {},
      constraints: [],
      deliverables: []
    };

    try {
      // Execute 8 prompts in parallel for rapid generation
      const [
        execSummaryRes,
        overviewRes,
        scopeRes,
        reqsRes,
        timelineRes,
        budgetRes,
        constraintsRes,
        deliverablesRes
      ] = await Promise.allSettled([
        this.generateExecutiveSummary(ctx, userId),
        this.generateProjectOverview(ctx, userId),
        this.generateDesignScope(ctx, userId),
        this.generateRequirements(ctx, userId),
        this.generateTimeline(ctx, userId),
        this.generateBudgetBreakdown(ctx, userId),
        this.generateConstraints(ctx, userId),
        this.generateDeliverables(ctx, userId)
      ]);

      sections.executiveSummary = execSummaryRes.status === 'fulfilled' && execSummaryRes.value ? execSummaryRes.value : this.getFallbackExecutiveSummary(ctx);
      sections.projectOverview = overviewRes.status === 'fulfilled' && overviewRes.value ? overviewRes.value : this.getFallbackProjectOverview(ctx);
      sections.designScope = scopeRes.status === 'fulfilled' && scopeRes.value ? scopeRes.value : this.getFallbackDesignScope(ctx);
      sections.requirements = reqsRes.status === 'fulfilled' && reqsRes.value ? reqsRes.value : this.getFallbackRequirements(ctx);
      sections.timeline = timelineRes.status === 'fulfilled' && timelineRes.value ? timelineRes.value : this.getFallbackTimeline(ctx);
      sections.budgetBreakdown = budgetRes.status === 'fulfilled' && budgetRes.value ? budgetRes.value : this.getFallbackBudgetBreakdown(ctx);
      sections.constraints = constraintsRes.status === 'fulfilled' && constraintsRes.value ? constraintsRes.value : this.getFallbackConstraints(ctx);
      sections.deliverables = deliverablesRes.status === 'fulfilled' && deliverablesRes.value ? deliverablesRes.value : this.getFallbackDeliverables(ctx);

      return {
        success: true,
        briefContent: sections,
        tokensUsed: { input: 0, output: 0 }
      };

    } catch (err) {
      const errorInfo = OpenAIErrorHandler.handleError(err, {
        service: 'BriefService',
        method: 'generateFullBrief'
      });
      console.error('[BRIEF SERVICE ERROR]', errorInfo.message);
      return {
        success: true,
        briefContent: this.generateFallbackBrief(ctx),
        tokensUsed: { input: 0, output: 0 }
      };
    }
  }

  // Section 1: Executive Summary
  async generateExecutiveSummary(ctx, userId = null) {
    const prompt = `Act as an expert interior design consultant for Riddha Mart.
Create a compelling, professional Executive Summary (2-3 sentences) for a client project brief with these details:
- Project Type: ${ctx.projectType}
- Room Type: ${ctx.roomType}
- Design Style: ${ctx.designStyle}
- Budget: ${ctx.totalBudget}
- Timeline: ${ctx.timeline}

Write directly in clear, inspiring, professional prose as an introduction to the design project. Do not include markdown codeblocks or headings.`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: false,
        temperature: 0.8,
        maxTokens: 300
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'briefExecutiveSummary',
        userId,
        '/api/briefs/generate',
        response.model
      );

      return response.text.trim() || this.getFallbackExecutiveSummary(ctx);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'BriefService',
        method: 'generateExecutiveSummary'
      });
      console.error('[EXECUTIVE SUMMARY ERROR]', errorInfo.message);
      return this.getFallbackExecutiveSummary(ctx);
    }
  }

  // Section 2: Project Overview
  async generateProjectOverview(ctx, userId = null) {
    const prompt = `Create a detailed 3-4 sentence Project Overview paragraph for an interior design brief:
- Project Type: ${ctx.projectType}
- Space: ${ctx.roomType} (Dimensions: ${ctx.roomDimensions})
- Scope of Work: ${ctx.scopeOfWork}
- Total Budget: ${ctx.totalBudget}
- Timeline: ${ctx.timeline}

Cover:
1. Core transformation goals
2. Primary functional & design focus areas
3. Project scale and complexity
4. Expected quality and lifestyle outcome.

Write professionally in plain paragraph form.`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: false,
        temperature: 0.8,
        maxTokens: 400
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'briefProjectOverview',
        userId,
        '/api/briefs/generate',
        response.model
      );

      return response.text.trim() || this.getFallbackProjectOverview(ctx);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'BriefService',
        method: 'generateProjectOverview'
      });
      console.error('[PROJECT OVERVIEW ERROR]', errorInfo.message);
      return this.getFallbackProjectOverview(ctx);
    }
  }

  // Section 3: Design Scope (3 Tier Options)
  async generateDesignScope(ctx, userId = null) {
    const prompt = `Define 3 structured Design Scope tiers for an interior design brief based on:
- Scope: ${ctx.scopeOfWork}
- Style: ${ctx.designStyle}
- Budget: ${ctx.totalBudget}
- Space: ${ctx.roomType}

Return ONLY a valid JSON object matching this schema:
{
  "basic": {
    "title": "Essential Package",
    "description": "Short summary of basic essential coverage",
    "estimatedEffort": "2-3 weeks",
    "includedItems": ["Item 1", "Item 2", "Item 3", "Item 4"]
  },
  "standard": {
    "title": "Comprehensive Design Package",
    "description": "Short summary of standard complete coverage",
    "estimatedEffort": "4-6 weeks",
    "includedItems": ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"]
  },
  "premium": {
    "title": "Luxury Custom Implementation",
    "description": "Short summary of premium high-end coverage",
    "estimatedEffort": "6-10 weeks",
    "includedItems": ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5", "Item 6"]
  }
}`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.7,
        maxTokens: 600
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'briefDesignScope',
        userId,
        '/api/briefs/generate',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = this.parseJson(cleanedText);
      return parsed || this.getFallbackDesignScope(ctx);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'BriefService',
        method: 'generateDesignScope'
      });
      console.error('[DESIGN SCOPE ERROR]', errorInfo.message);
      return this.getFallbackDesignScope(ctx);
    }
  }

  // Section 4: Requirements (5 Categories)
  async generateRequirements(ctx, userId = null) {
    const prompt = `Extract and organize project requirements for a ${ctx.roomType} redesign in ${ctx.designStyle} style.
Must-haves: ${ctx.mustHaves}
Constraints: ${ctx.constraints}
Additional Notes: ${ctx.additionalInfo}

Return ONLY a valid JSON object:
{
  "aesthetic": ["Requirement 1", "Requirement 2", "Requirement 3"],
  "functional": ["Requirement 1", "Requirement 2", "Requirement 3"],
  "technical": ["Requirement 1", "Requirement 2", "Requirement 3"],
  "budget": ["Requirement 1", "Requirement 2"],
  "timeline": ["Requirement 1", "Requirement 2"]
}`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.7,
        maxTokens: 600
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'briefRequirements',
        userId,
        '/api/briefs/generate',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = this.parseJson(cleanedText);
      return parsed || this.getFallbackRequirements(ctx);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'BriefService',
        method: 'generateRequirements'
      });
      console.error('[REQUIREMENTS ERROR]', errorInfo.message);
      return this.getFallbackRequirements(ctx);
    }
  }

  // Section 5: Timeline (Phases & Milestones)
  async generateTimeline(ctx, userId = null) {
    const prompt = `Create a realistic project timeline for ${ctx.projectType} (${ctx.roomType}, Budget: ${ctx.totalBudget}, Preference: ${ctx.timeline}).

Return ONLY a valid JSON object:
{
  "totalDuration": "Estimated weeks",
  "phases": [
    {
      "phaseName": "Phase 1: Consultation & Moodboards",
      "duration": "1 week",
      "deliverables": ["Deliverable 1", "Deliverable 2"],
      "milestone": "Concept Approval"
    },
    {
      "phaseName": "Phase 2: Space Layout & Procurement",
      "duration": "2 weeks",
      "deliverables": ["Deliverable 1", "Deliverable 2"],
      "milestone": "Order Confirmation"
    },
    {
      "phaseName": "Phase 3: Execution & Installation",
      "duration": "3 weeks",
      "deliverables": ["Deliverable 1", "Deliverable 2"],
      "milestone": "On-site Setup"
    },
    {
      "phaseName": "Phase 4: Styling & Handover",
      "duration": "1 week",
      "deliverables": ["Deliverable 1"],
      "milestone": "Final Sign-off"
    }
  ]
}`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.7,
        maxTokens: 800
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'briefTimeline',
        userId,
        '/api/briefs/generate',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = this.parseJson(cleanedText);
      return parsed || this.getFallbackTimeline(ctx);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'BriefService',
        method: 'generateTimeline'
      });
      console.error('[TIMELINE ERROR]', errorInfo.message);
      return this.getFallbackTimeline(ctx);
    }
  }

  // Section 6: Budget Breakdown
  async generateBudgetBreakdown(ctx, userId = null) {
    const prompt = `Create a budget breakdown for total budget ${ctx.totalBudget} INR for ${ctx.roomType} (${ctx.scopeOfWork}).

Return ONLY a valid JSON object:
{
  "totalBudget": ${ctx.numericBudget},
  "categories": [
    { "name": "Furniture & Key Storage", "percentage": 40, "amount": ${Math.round(ctx.numericBudget * 0.40)}, "included": "Sofa, tables, accent seating" },
    { "name": "Lighting & Electricals", "percentage": 15, "amount": ${Math.round(ctx.numericBudget * 0.15)}, "included": "Ambient fixtures, task lights" },
    { "name": "Wall Treatment & Paints", "percentage": 15, "amount": ${Math.round(ctx.numericBudget * 0.15)}, "included": "Accent wall, premium finish" },
    { "name": "Decor & Furnishings", "percentage": 20, "amount": ${Math.round(ctx.numericBudget * 0.20)}, "included": "Rugs, curtains, artwork" },
    { "name": "Contingency & Reserve", "percentage": 10, "amount": ${Math.round(ctx.numericBudget * 0.10)}, "included": "Unforeseen site adjustments" }
  ]
}`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.7,
        maxTokens: 700
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'briefBudgetBreakdown',
        userId,
        '/api/briefs/generate',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = this.parseJson(cleanedText);
      return parsed || this.getFallbackBudgetBreakdown(ctx);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'BriefService',
        method: 'generateBudgetBreakdown'
      });
      console.error('[BUDGET BREAKDOWN ERROR]', errorInfo.message);
      return this.getFallbackBudgetBreakdown(ctx);
    }
  }

  // Section 7: Constraints Analysis
  async generateConstraints(ctx, userId = null) {
    const prompt = `Analyze constraints for interior design project:
Constraints: ${ctx.constraints}
Must-haves: ${ctx.mustHaves}
Budget: ${ctx.totalBudget}

Return ONLY a valid JSON array of objects:
[
  {
    "constraint": "Constraint name",
    "impact": "Potential design impact",
    "solution": "Recommended design solution",
    "costImpact": "Low / Moderate / High",
    "timelineImpact": "Minimal / 1-2 Weeks"
  }
]`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.7,
        maxTokens: 600
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'briefConstraints',
        userId,
        '/api/briefs/generate',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = this.parseJson(cleanedText);
      return (Array.isArray(parsed) && parsed.length > 0) ? parsed : this.getFallbackConstraints(ctx);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'BriefService',
        method: 'generateConstraints'
      });
      console.error('[CONSTRAINTS ERROR]', errorInfo.message);
      return this.getFallbackConstraints(ctx);
    }
  }

  // Section 8: Deliverables List
  async generateDeliverables(ctx, userId = null) {
    const prompt = `List final client deliverables for a ${ctx.projectType} (${ctx.roomType}):

Return ONLY a valid JSON array of objects:
[
  {
    "name": "Design Concept & Moodboard",
    "description": "Visual theme, color palette & material swatches",
    "timing": "Week 1",
    "format": "Digital PDF & Material Board"
  },
  {
    "name": "2D Space Layout & Floorplan",
    "description": "Scaled furniture arrangement and clearance paths",
    "timing": "Week 2",
    "format": "2D Architectural Drawing"
  },
  {
    "name": "Product Shopping List & Specs",
    "description": "Itemized list with Riddha Mart product links and pricing",
    "timing": "Week 2",
    "format": "Interactive Quotation"
  },
  {
    "name": "Final On-site Styling & Handover",
    "description": "White-glove placement, accessory styling & sign-off",
    "timing": "Completion",
    "format": "On-site Inspection Document"
  }
]`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.7,
        maxTokens: 700
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'briefDeliverables',
        userId,
        '/api/briefs/generate',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = this.parseJson(cleanedText);
      return (Array.isArray(parsed) && parsed.length > 0) ? parsed : this.getFallbackDeliverables(ctx);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'BriefService',
        method: 'generateDeliverables'
      });
      console.error('[DELIVERABLES ERROR]', errorInfo.message);
      return this.getFallbackDeliverables(ctx);
    }
  }

  // --- Fallback Generators ---
  getFallbackExecutiveSummary(ctx) {
    return `This project brief outlines a tailored ${ctx.projectType.toLowerCase()} for a ${ctx.roomType.toLowerCase()} in a modern ${ctx.designStyle.toLowerCase()} aesthetic. Designed around a target investment of ${ctx.totalBudget}, the project focuses on elevating daily comfort, spatial balance, and refined visual appeal while addressing key functional priorities.`;
  }

  getFallbackProjectOverview(ctx) {
    return `The scope encompasses a total overhaul and styling of the ${ctx.roomType.toLowerCase()} incorporating ${ctx.scopeOfWork}. The design strategy emphasizes optimal spatial layout, durable finishes, and harmonious lighting to create an inviting atmosphere. All procurements and execution will align with the target timeline of ${ctx.timeline} while ensuring high-quality workmanship throughout.`;
  }

  getFallbackDesignScope(ctx) {
    return {
      basic: {
        title: "Essential Refresh Package",
        description: "Focuses on core layout, essential furniture pieces, and primary lighting adjustments.",
        estimatedEffort: "2-3 weeks",
        includedItems: ["Key Furniture Selection", "Color Scheme Guidance", "Primary Lighting Fixes", "Basic Layout Plan"]
      },
      standard: {
        title: "Comprehensive Interior Design",
        description: "Full spatial transformation covering furniture, decor, lighting, and custom wall accents.",
        estimatedEffort: "4-6 weeks",
        includedItems: ["Full Furniture & Layout", "Color & Wall Treatment", "Lighting Plan", "Decor Accessories", "Shopping List"]
      },
      premium: {
        title: "Bespoke Luxury Turnkey Package",
        description: "End-to-end custom interior design with premium materials, custom built-ins, and white-glove styling.",
        estimatedEffort: "6-8 weeks",
        includedItems: ["Complete Built-ins & Furniture", "3D Visualizations", "Premium Lighting & Automation", "Luxury Fabrics & Decor", "On-site Supervision"]
      }
    };
  }

  getFallbackRequirements(ctx) {
    return {
      aesthetic: [
        `Cohesive ${ctx.designStyle} color palette and textures`,
        `Warm ambient lighting with focal accent fixtures`,
        `Balanced furniture proportions tailored to ${ctx.roomType}`
      ],
      functional: [
        `Optimized movement pathways and ergonomic arrangement`,
        `Integrated storage solutions for clutter-free living`,
        `Durable, easy-to-clean materials and pet/kid friendly fabrics`
      ],
      technical: [
        `Verified wall dimensions (${ctx.roomDimensions})`,
        `Proper electrical outlet placement for lighting fixtures`,
        `Compliance with building noise and modification guidelines`
      ],
      budget: [
        `Strict adherence to overall allocation cap of ${ctx.totalBudget}`,
        `Tiered product recommendations offering high-value alternatives`
      ],
      timeline: [
        `Phased procurement to meet the desired ${ctx.timeline} timeframe`,
        `Clear milestone approvals prior to order placement`
      ]
    };
  }

  getFallbackTimeline(ctx) {
    return {
      totalDuration: "4-6 Weeks",
      phases: [
        {
          phaseName: "Phase 1: Briefing & Design Concept",
          duration: "1 Week",
          deliverables: ["Initial Moodboard", "Space Layout Options"],
          milestone: "Design Sign-off"
        },
        {
          phaseName: "Phase 2: Product Selection & Procurement",
          duration: "2 Weeks",
          deliverables: ["Riddha Mart Itemized Quotation", "Material Samples"],
          milestone: "Order Placement"
        },
        {
          phaseName: "Phase 3: Delivery & On-site Installation",
          duration: "2 Weeks",
          deliverables: ["Furniture Assembly", "Lighting Installation"],
          milestone: "Site Completion"
        },
        {
          phaseName: "Phase 4: Final Styling & Client Handover",
          duration: "1 Week",
          deliverables: ["Decor Setup", "Final Quality Punchlist"],
          milestone: "Project Completion"
        }
      ]
    };
  }

  getFallbackBudgetBreakdown(ctx) {
    const b = ctx.numericBudget;
    return {
      totalBudget: b,
      categories: [
        { name: "Furniture & Seating", percentage: 40, amount: Math.round(b * 0.40), included: "Core seating, tables, storage units" },
        { name: "Lighting & Electricals", percentage: 15, amount: Math.round(b * 0.15), included: "Ceiling lights, floor lamps, accent lights" },
        { name: "Wall Treatment & Paint", percentage: 15, amount: Math.round(b * 0.15), included: "Paint, wallpaper, paneling" },
        { name: "Decor, Soft Furnishings & Rugs", percentage: 20, amount: Math.round(b * 0.20), included: "Curtains, cushions, wall art, decor" },
        { name: "Contingency & Reserve", percentage: 10, amount: Math.round(b * 0.10), included: "Installation & buffer reserve" }
      ]
    };
  }

  getFallbackConstraints(ctx) {
    return [
      {
        constraint: ctx.constraints || "Fixed structural layout",
        impact: "Requires modular furniture placement without structural alterations.",
        solution: "Utilize standalone built-ins and adaptable multi-functional furniture.",
        costImpact: "Low",
        timelineImpact: "Minimal"
      },
      {
        constraint: "Budget Efficiency",
        impact: "Demands careful prioritization of core focal pieces versus secondary accessories.",
        solution: "Focus budget on high-impact furniture items while using budget-friendly decor accents.",
        costImpact: "Moderate",
        timelineImpact: "Minimal"
      }
    ];
  }

  getFallbackDeliverables(ctx) {
    return [
      {
        name: "Design Concept & Moodboard",
        description: "Visual palette, material references, and furniture moodboard",
        timing: "End of Week 1",
        format: "Digital PDF Brief"
      },
      {
        name: "2D Layout Plan",
        description: "Scaled floorplan with furniture arrangement and spatial clearances",
        timing: "End of Week 2",
        format: "Digital Layout File"
      },
      {
        name: "Riddha Mart Product Quotation",
        description: "Complete itemized shopping list with direct purchase links and price breakdown",
        timing: "End of Week 2",
        format: "Interactive Online Order"
      },
      {
        name: "On-site Installation & Final Handover",
        description: "White-glove assembly, placement, and final walkthrough sign-off",
        timing: "Completion",
        format: "Client Approval Sign-off"
      }
    ];
  }

  generateFallbackBrief(ctx) {
    return {
      executiveSummary: this.getFallbackExecutiveSummary(ctx),
      projectOverview: this.getFallbackProjectOverview(ctx),
      designScope: this.getFallbackDesignScope(ctx),
      requirements: this.getFallbackRequirements(ctx),
      timeline: this.getFallbackTimeline(ctx),
      budgetBreakdown: this.getFallbackBudgetBreakdown(ctx),
      constraints: this.getFallbackConstraints(ctx),
      deliverables: this.getFallbackDeliverables(ctx)
    };
  }
}

module.exports = new BriefService();
