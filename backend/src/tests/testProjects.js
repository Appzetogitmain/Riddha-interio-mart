const dotenv = require('dotenv');
dotenv.config();

const geminiProjectService = require('../services/geminiProjectService');

async function testGeminiProjectService() {
  console.log('--- Testing Gemini Project Service Prompts ---');
  
  const mockProject = {
    projectName: 'Penthouse Luxury Suite',
    clientName: 'Rahul Sharma',
    roomType: 'Master Bedroom',
    designStyle: 'Modern Luxury',
    completionPercentage: 45,
    overallStatus: 'on-track',
    budget: {
      total: 250000,
      categories: [
        { name: 'Furniture', planned: 100000, spent: 85000 },
        { name: 'Lighting', planned: 50000, spent: 30000 },
        { name: 'Decor', planned: 50000, spent: 10000 }
      ]
    },
    phases: [
      { phaseName: 'Design & Concept', status: 'completed' },
      { phaseName: 'Procurement', status: 'in-progress' },
      { phaseName: 'Installation', status: 'not-started' }
    ],
    deliverables: [
      { name: 'Moodboard Approval', status: 'completed' },
      { name: 'Lighting Selection', status: 'in-progress', dueDate: new Date() },
      { name: 'Custom Furniture Delivery', status: 'pending' }
    ]
  };

  try {
    console.log('\n1. Health Narrative:');
    const narrative = await geminiProjectService.generateHealthNarrative(mockProject);
    console.log(narrative);

    console.log('\n2. Risk Assessment:');
    const risks = await geminiProjectService.assessProjectRisks(mockProject);
    console.log(risks);

    console.log('\n3. Next Steps:');
    const nextSteps = await geminiProjectService.recommendNextSteps(mockProject);
    console.log(nextSteps);

    console.log('\n4. Report Summary:');
    const summary = await geminiProjectService.generateReportSummary(mockProject);
    console.log(summary);

    console.log('\n5. Client Update Email:');
    const emailText = await geminiProjectService.generateClientEmailContent(mockProject);
    console.log(emailText);

    console.log('\n✅ All Gemini Project Service tests passed successfully!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testGeminiProjectService();
