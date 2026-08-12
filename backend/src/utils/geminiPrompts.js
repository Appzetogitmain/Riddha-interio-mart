/**
 * System prompts and prompt templates for Gemini API integrations.
 */
const GEMINI_PROMPTS = {
  profileNarrative: (profile) => `
    Based on this interior design profile, write a personalized narrative description (2-3 sentences) that captures the user's design personality:
    
    - Room Type: ${profile.roomType}
    - Primary Style: ${profile.primaryStyle}
    - Secondary Style: ${profile.secondaryStyle || 'None'}
    - Colors: ${profile.colors.join(', ')}
    - Budget: ₹${profile.budget.min} - ₹${profile.budget.max}
    - Lighting Preference: ${profile.lighting}
    - Design Boldness (1-10): ${profile.boldness}/10
    - Chosen Materials: ${profile.materials.join(', ')}
    
    Write in a warm, encouraging, professional tone that celebrates their unique style.
    Make it personal and engaging, like a designer who deeply understands their taste.
    Return ONLY the narrative string, nothing else.
  `,

  designerPersonality: (profile) => `
    Create a 2-3 word "designer personality" label for this design profile:
    
    - Primary Style: ${profile.primaryStyle}
    - Colors: ${profile.colors.join(', ')}
    - Boldness Score: ${profile.boldness}/10
    - Budget Range: ₹${profile.budget.min} - ₹${profile.budget.max}
    
    Examples: "Sophisticated Minimalist", "Bold Contemporary", "Cozy Traditionalist", "Elegant Eclectic", "Warm Industrialist".
    
    Return ONLY the 2-3 word personality label, nothing else. Do not use quotes.
  `,

  styleSuggestion: (profile) => `
    Create an inspiring design suggestion for someone with this profile:
    - Primary Style: ${profile.primaryStyle}
    - Room Type: ${profile.roomType}
    - Total Budget: ₹${profile.budget.max}
    - Colors: ${profile.colors.join(', ')}
    - Materials: ${profile.materials.join(', ')}
    
    Provide:
    1. A creative design concept title (3-5 words)
    2. A compelling 2-3 sentence description of how to approach styling the room
    3. Key design elements to focus on (exactly 3 items)
    
    You MUST respond with a valid JSON object matching this structure (do not include markdown formatting or backticks around JSON):
    {
      "title": "Title of suggestion",
      "description": "2-3 sentences explaining design approach",
      "keyElements": ["element1", "element2", "element3"]
    }
  `,

  budgetSuggestion: (profile) => `
    Create a budget-smart design suggestion:
    - Total Budget: ₹${profile.budget.max}
    - Primary Style: ${profile.primaryStyle}
    - Room Type: ${profile.roomType}
    
    Suggest how to allocate their budget strategically to achieve their design goals. Focus on:
    1. Which items are worth investing in
    2. Where to save money
    3. Smart shopping strategies
    
    You MUST respond with a valid JSON object matching this structure (do not include markdown formatting or backticks around JSON):
    {
      "title": "Smart Investment Approach",
      "description": "Detailed strategic budget advice in 2-3 sentences",
      "budgetAllocation": {
        "invest": ["major items to spend on (1-2 items)"],
        "moderate": ["medium-priced pieces (1-2 items)"],
        "budget": ["affordable items or accessories (1-2 items)"]
      }
    }
  `,

  boldSuggestion: (profile) => `
    This user has a design boldness score of ${profile.boldness}/10 (meaning they are daring and love unique statements).
    Create an exciting, daring design suggestion:
    
    - Style: ${profile.primaryStyle}
    - Colors: ${profile.colors.join(', ')}
    - Room Type: ${profile.roomType}
    
    Encourage them to:
    1. Make a statement with color or pattern
    2. Mix unexpected elements
    3. Express their personality through design
    
    You MUST respond with a valid JSON object matching this structure (do not include markdown formatting or backticks around JSON):
    {
      "title": "Daring & Bold Expression",
      "description": "Detailed advice on how to implement bold, unique statements in 2-3 sentences",
      "daringSuggestions": ["idea1", "idea2", "idea3"]
    }
  `,

  classicSuggestion: (profile) => `
    This user prefers a more conservative, classic approach (design boldness score ${profile.boldness}/10).
    Create a timeless, elegant design suggestion:
    
    - Style: ${profile.primaryStyle}
    - Colors: ${profile.colors.join(', ')}
    - Room Type: ${profile.roomType}
    
    Focus on:
    1. Timeless pieces that won't go out of style
    2. Quality over quantity
    3. Subtle sophistication
    
    You MUST respond with a valid JSON object matching this structure (do not include markdown formatting or backticks around JSON):
    {
      "title": "Timeless Elegance",
      "description": "Detailed advice on achieving a timeless look in 2-3 sentences",
      "principles": ["principle1", "principle2", "principle3"]
    }
  `,

  productExplanation: (product, profile, score) => `
    Write a 2-3 sentence personalized explanation for why this product is a great choice for this design profile:
    
    Product Details:
    - Name: ${product.name}
    - Style: ${product.style || 'Matching ' + profile.primaryStyle}
    - Colors: ${product.color || 'Neutral'}
    - Material: ${product.material || 'Premium'}
    - Price: ₹${product.price}
    - Match Score: ${(score * 100).toFixed(0)}%
    
    User Profile:
    - Primary Style: ${profile.primaryStyle}
    - Preferred Colors: ${profile.colors.join(', ')}
    - Budget Range: ₹${profile.budget.min}-₹${profile.budget.max}
    - Boldness: ${profile.boldness}/10
    
    Explain why this product matches their taste and how it fits into their room's aesthetic. Be encouraging and specific.
    Return ONLY the explanation text, nothing else.
  `,

  moodBoardNarrative: (profile, themes) => `
    This is a mood board for someone with this design profile:
    - Primary Style: ${profile.primaryStyle}
    - Preferred Colors: ${profile.colors.join(', ')}
    - Room Type: ${profile.roomType}
    - Designer Personality: ${profile.personality || 'Chic Minimalist'}
    
    The mood board includes these themes: ${themes.join(', ')}
    
    Write an inspiring 3-4 sentence narrative that:
    1. Describes the overall mood, vibe, and feeling of this board
    2. Explains the design philosophy behind this selection
    3. Inspires the user to create this space
    4. Mentions specific elements they should focus on
    
    Make it personal, engaging, and aspirational.
    Return ONLY the narrative text, nothing else.
  `,

  inspirationPoints: (profile) => `
    Generate exactly 3 specific, short, actionable design inspiration points for someone who loves:
    - Primary Style: ${profile.primaryStyle}
    - Colors: ${profile.colors.join(', ')}
    - Room Type: ${profile.roomType}
    - Budget Limit: ₹${profile.budget.max}
    
    Focus on where to find inspiration, what textures/details to look for, and how to start.
    Provide the response as a JSON array of strings:
    ["inspiration point 1", "inspiration point 2", "inspiration point 3"]
    
    Return ONLY the JSON array, nothing else. Do not wrap in markdown or code blocks.
  `
};

module.exports = GEMINI_PROMPTS;
