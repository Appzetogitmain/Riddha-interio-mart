require('dotenv').config();
const mongoose = require('mongoose');
const ClientBrief = require('../models/ClientBrief');
const geminiBriefService = require('../services/geminiBriefService');
const connectDB = require('../config/db');

async function testBriefFlow() {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Connected to MongoDB.');

  try {
    // 1. Create dummy brief
    console.log('\n--- 1. Testing Brief Initialization ---');
    const guestSessionId = 'test_brief_guest_' + Date.now();
    let brief = await ClientBrief.create({
      guestSessionId,
      projectName: 'Modern Villa Living Room Renovation',
      formAnswers: [
        { questionId: 1, answer: 'Full Renovation' },
        { questionId: 2, answer: 'Living Room' },
        { questionId: 3, answer: '20ft x 25ft' },
        { questionId: 4, answer: ['Furniture Selection', 'Lighting Design', 'Color Scheme', 'Custom Built-ins'] },
        { questionId: 5, answer: 750000 },
        { questionId: 6, answer: 'Soon (2-4 months)' },
        { questionId: 7, answer: 'Modern Minimalist' },
        { questionId: 8, answer: 'Pet friendly upholstery, warm ambient dimmable lighting, concealed TV cabling' },
        { questionId: 9, answer: ['Pets (Durable Materials Required)', 'Fixed Strict Budget Limit'] },
        { questionId: 10, answer: 'Earthy tone accents with natural wood finishes' }
      ]
    });
    console.log('Created ClientBrief ID:', brief._id);

    // 2. Test Gemini brief generation
    console.log('\n--- 2. Testing Gemini AI Brief Generation (8 Sections) ---');
    const start = Date.now();
    const result = await geminiBriefService.generateFullBrief(brief.formAnswers, null);
    const duration = Date.now() - start;
    console.log(`Generation completed in ${duration}ms!`);
    console.log('Generation success:', result.success);
    
    const c = result.briefContent;
    console.log('\n--- Section Verification ---');
    console.log('1. Executive Summary:', c.executiveSummary ? 'PASSED (' + c.executiveSummary.substring(0, 60) + '...)' : 'FAILED');
    console.log('2. Project Overview:', c.projectOverview ? 'PASSED (' + c.projectOverview.substring(0, 60) + '...)' : 'FAILED');
    console.log('3. Design Scope Tiers:', (c.designScope && c.designScope.basic) ? 'PASSED' : 'FAILED');
    console.log('4. Requirements Categories:', (c.requirements && c.requirements.aesthetic) ? 'PASSED' : 'FAILED');
    console.log('5. Timeline Phases:', (c.timeline && c.timeline.phases) ? 'PASSED (' + c.timeline.phases.length + ' phases)' : 'FAILED');
    console.log('6. Budget Categories:', (c.budgetBreakdown && c.budgetBreakdown.categories) ? 'PASSED (' + c.budgetBreakdown.categories.length + ' categories)' : 'FAILED');
    console.log('7. Constraints Analysis:', (Array.isArray(c.constraints) && c.constraints.length > 0) ? 'PASSED (' + c.constraints.length + ' items)' : 'FAILED');
    console.log('8. Deliverables List:', (Array.isArray(c.deliverables) && c.deliverables.length > 0) ? 'PASSED (' + c.deliverables.length + ' items)' : 'FAILED');

    // Clean up
    console.log('\nCleaning up test brief record...');
    await ClientBrief.findByIdAndDelete(brief._id);
    console.log('Test completed successfully!');

  } catch (err) {
    console.error('Test failed with exception:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testBriefFlow();
