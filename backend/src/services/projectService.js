const openaiClient = require('./openaiService');
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const OpenAIUsageTracker = require('./openaiUsageTracker');

class ProjectService {
  /**
   * 1. Generate Health Narrative (2-3 sentences)
   */
  async generateHealthNarrative(projectData, userId = null) {
    const { projectName, completionPercentage, overallStatus, budget, phases, deliverables } = projectData;
    const spent = budget?.categories?.reduce((acc, cat) => acc + (cat.spent || 0), 0) || 0;
    const totalBudget = budget?.total || 100000;
    const budgetPercent = Math.round((spent / (totalBudget || 1)) * 100);

    const completedPhases = phases?.filter(p => p.status === 'completed')?.length || 0;
    const totalPhases = phases?.length || 1;
    const completedDeliverables = deliverables?.filter(d => d.status === 'completed')?.length || 0;
    const totalDeliverables = deliverables?.length || 0;

    const prompt = `Analyze this interior design project status and generate an encouraging, clear 2-3 sentence progress narrative:

Project Name: ${projectName}
Overall Completion: ${completionPercentage}%
Status: ${overallStatus}
Budget: ₹${spent.toLocaleString()} spent of ₹${totalBudget.toLocaleString()} allocated (${budgetPercent}% used)
Phases: ${completedPhases}/${totalPhases} completed
Deliverables: ${completedDeliverables}/${totalDeliverables} finished

Respond in plain text with 2-3 professional, actionable sentences outlining progress, current stability, and momentum.`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: false,
        temperature: 0.7,
        maxTokens: 400
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'projectHealthNarrative',
        userId,
        '/api/projects/health',
        response.model
      );

      return response.text || `Project "${projectName}" is currently ${completionPercentage}% complete and running ${overallStatus.replace('-', ' ')}. Budget utilization sits at ${budgetPercent}%, with ${completedPhases} of ${totalPhases} project phases finished successfully.`;
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'ProjectService',
        method: 'generateHealthNarrative'
      });
      console.error('[PROJECT HEALTH NARRATIVE ERROR]', errorInfo.message);
      return `Project "${projectName}" is currently ${completionPercentage}% complete and running ${overallStatus.replace('-', ' ')}. Budget utilization sits at ${budgetPercent}%, with ${completedPhases} of ${totalPhases} project phases finished successfully.`;
    }
  }

  /**
   * 2. Assess Project Risks (3-5 specific risks with mitigation strategies)
   */
  async assessProjectRisks(projectData, userId = null) {
    const { projectName, roomType, designStyle, completionPercentage, budget, phases, deliverables } = projectData;
    const spent = budget?.categories?.reduce((acc, cat) => acc + (cat.spent || 0), 0) || 0;
    const totalBudget = budget?.total || 100000;
    const overdueCount = deliverables?.filter(d => d.dueDate && new Date(d.dueDate) < new Date() && d.status !== 'completed')?.length || 0;

    const prompt = `Assess risks for this interior design project:

Project: ${projectName} (${roomType}, ${designStyle})
Completion: ${completionPercentage}%
Budget Spent: ₹${spent} / ₹${totalBudget}
Overdue Deliverables: ${overdueCount}
Phases Status: ${JSON.stringify(phases?.map(p => ({ name: p.phaseName, status: p.status })) || [])}

Provide a concise paragraph assessing project risks (timeline, budget overspend, materials, vendor delays) and 3 bulleted mitigation strategies.`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: false,
        temperature: 0.7,
        maxTokens: 600
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'projectRiskAssessment',
        userId,
        '/api/projects/health',
        response.model
      );

      return response.text || `Risk Assessment for ${projectName}:\n- Budget Velocity Risk: Category spending should be monitored closely prior to final procurement.\n- Schedule Integrity: Ensure suppliers deliver materials on time to avoid downstream phase bottlenecks.\n- Scope Control: Confirm client approvals prior to executing installation work.`;
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'ProjectService',
        method: 'assessProjectRisks'
      });
      console.error('[PROJECT RISK ASSESSMENT ERROR]', errorInfo.message);
      return `Risk Assessment for ${projectName}:\n- Budget Velocity Risk: Category spending should be monitored closely prior to final procurement.\n- Schedule Integrity: Ensure suppliers deliver materials on time to avoid downstream phase bottlenecks.\n- Scope Control: Confirm client approvals prior to executing installation work.`;
    }
  }

  /**
   * 3. Recommend Next Steps (3-5 specific actions)
   */
  async recommendNextSteps(projectData, userId = null) {
    const { projectName, phases, deliverables } = projectData;
    const currentPhase = phases?.find(p => p.status === 'in-progress') || phases?.find(p => p.status === 'not-started') || { phaseName: 'Execution' };
    const pendingDeliverables = deliverables?.filter(d => d.status !== 'completed')?.slice(0, 4) || [];

    const prompt = `Based on current interior project status, recommend the top 3-5 next action steps:

Project Name: ${projectName}
Current Phase: ${currentPhase.phaseName}
Pending Tasks: ${JSON.stringify(pendingDeliverables.map(d => d.name))}

Provide 3-5 clear, numbered next steps with brief rationale.`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: false,
        temperature: 0.7,
        maxTokens: 500
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'projectNextSteps',
        userId,
        '/api/projects/health',
        response.model
      );

      return response.text || `1. Finalize current phase: ${currentPhase.phaseName}.\n2. Review pending deliverables with project lead.\n3. Verify supplier lead times for scheduled items.\n4. Send bi-weekly update report to client.`;
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'ProjectService',
        method: 'recommendNextSteps'
      });
      console.error('[PROJECT NEXT STEPS ERROR]', errorInfo.message);
      return `1. Finalize current phase: ${currentPhase.phaseName}.\n2. Review pending deliverables with project lead.\n3. Verify supplier lead times for scheduled items.\n4. Send bi-weekly update report to client.`;
    }
  }

  /**
   * 4. Generate Alert Message
   */
  async generateAlertMessage(alertType, context, userId = null) {
    const prompt = `Generate a concise, professional alert message and recommendation for an interior design project dashboard alert:

Alert Type: ${alertType}
Context Details: ${JSON.stringify(context)}

Respond in valid JSON format:
{
  "message": "Clear description of alert",
  "aiRecommendation": "Recommended action to resolve"
}`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.7,
        maxTokens: 400
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'projectAlertMessage',
        userId,
        '/api/projects/alerts',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanedText);
      if (result && result.message) return result;
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'ProjectService',
        method: 'generateAlertMessage'
      });
      console.error('[PROJECT ALERT MESSAGE ERROR]', errorInfo.message);
    }

    return {
      message: `Alert triggered: ${alertType.replace('-', ' ')}. Attention required for ${context.name || 'project component'}.`,
      aiRecommendation: `Review project schedule and budget allocation to address ${alertType}.`
    };
  }

  /**
   * 5. Generate Project Report Summary
   */
  async generateReportSummary(projectData, userId = null) {
    const { projectName, clientName, completionPercentage, overallStatus, budget, phases, deliverables } = projectData;
    const spent = budget?.categories?.reduce((acc, cat) => acc + (cat.spent || 0), 0) || 0;
    const totalBudget = budget?.total || 100000;

    const prompt = `Generate a comprehensive professional project status report summary:

Project: ${projectName}
Client: ${clientName}
Overall Progress: ${completionPercentage}%
Status: ${overallStatus}
Budget: ₹${spent} spent out of ₹${totalBudget}
Phases Completed: ${phases?.filter(p => p.status === 'completed').length} / ${phases?.length}
Deliverables Completed: ${deliverables?.filter(d => d.status === 'completed').length} / ${deliverables?.length}

Write a structured 3-paragraph executive summary detailing progress, key milestones reached, financial tracking, and outlook for project handover.`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: false,
        temperature: 0.7,
        maxTokens: 700
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'projectReportSummary',
        userId,
        '/api/projects/report',
        response.model
      );

      return response.text || `EXECUTIVE PROJECT REPORT SUMMARY\n\nProject "${projectName}" for ${clientName} has achieved ${completionPercentage}% overall completion. Active phases are progressing systematically in alignment with quality and design standards.\n\nFinancial tracking shows ₹${spent.toLocaleString()} expended out of the total ₹${totalBudget.toLocaleString()} budget allocation. All primary procurement items remain well-budgeted.\n\nUpcoming focus will center on completing final installations and preparing site handover documentation for the client.`;
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'ProjectService',
        method: 'generateReportSummary'
      });
      console.error('[PROJECT REPORT SUMMARY ERROR]', errorInfo.message);
      return `EXECUTIVE PROJECT REPORT SUMMARY\n\nProject "${projectName}" for ${clientName} has achieved ${completionPercentage}% overall completion. Active phases are progressing systematically in alignment with quality and design standards.\n\nFinancial tracking shows ₹${spent.toLocaleString()} expended out of the total ₹${totalBudget.toLocaleString()} budget allocation. All primary procurement items remain well-budgeted.\n\nUpcoming focus will center on completing final installations and preparing site handover documentation for the client.`;
    }
  }

  /**
   * 6. Generate Client Email Update Content
   */
  async generateClientEmailContent(projectData, userId = null) {
    const { projectName, clientName, completionPercentage, overallStatus, phases } = projectData;
    const currentPhase = phases?.find(p => p.status === 'in-progress')?.phaseName || 'Design & Execution';

    const prompt = `Generate a warm, professional, non-technical client progress email update:

Project Name: ${projectName}
Client Name: ${clientName}
Progress: ${completionPercentage}% complete
Current Phase: ${currentPhase}
Status: ${overallStatus}

Write a clear, reassuring email to the client with a subject line and friendly body copy.`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: false,
        temperature: 0.8,
        maxTokens: 600
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'projectClientEmail',
        userId,
        '/api/projects/report/email',
        response.model
      );

      return response.text || `Subject: Exciting Progress Update on Your Project: ${projectName}!\n\nDear ${clientName},\n\nWe are delighted to update you that your project "${projectName}" is currently ${completionPercentage}% complete! We are actively working through the ${currentPhase} phase.\n\nOur team is ensuring every detail aligns perfectly with your vision. You can check your project portal anytime for live updates.\n\nWarm regards,\nRiddha Interio Mart Team`;
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'ProjectService',
        method: 'generateClientEmailContent'
      });
      console.error('[PROJECT CLIENT EMAIL ERROR]', errorInfo.message);
      return `Subject: Exciting Progress Update on Your Project: ${projectName}!\n\nDear ${clientName},\n\nWe are delighted to update you that your project "${projectName}" is currently ${completionPercentage}% complete! We are actively working through the ${currentPhase} phase.\n\nOur team is ensuring every detail aligns perfectly with your vision. You can check your project portal anytime for live updates.\n\nWarm regards,\nRiddha Interio Mart Team`;
    }
  }
}

module.exports = new ProjectService();
