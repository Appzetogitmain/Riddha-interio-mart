const Project = require('../models/Project');
const ProjectAlert = require('../models/ProjectAlert');
const ProjectReport = require('../models/ProjectReport');
const ClientBrief = require('../models/ClientBrief');
const User = require('../models/User');
const geminiProjectService = require('../services/geminiProjectService');
const emailService = require('../services/emailService');

// Helper: Calculate overall completion percentage and health score
const calculateProjectMetrics = (project) => {
  // Phase progress
  const phases = project.phases || [];
  let phaseProgress = 0;
  if (phases.length > 0) {
    const completedPhases = phases.filter(p => p.status === 'completed').length;
    const inProgressPhases = phases.filter(p => p.status === 'in-progress').length;
    phaseProgress = ((completedPhases + (inProgressPhases * 0.5)) / phases.length) * 100;
  }

  // Deliverable progress
  const deliverables = project.deliverables || [];
  let deliverableProgress = 0;
  if (deliverables.length > 0) {
    const completedDeliverables = deliverables.filter(d => d.status === 'completed').length;
    const inProgressDeliverables = deliverables.filter(d => d.status === 'in-progress').length;
    deliverableProgress = ((completedDeliverables + (inProgressDeliverables * 0.5)) / deliverables.length) * 100;
  }

  // Combined completion percentage
  const completionPercentage = Math.round(
    phases.length > 0 && deliverables.length > 0
      ? (phaseProgress * 0.5) + (deliverableProgress * 0.5)
      : phases.length > 0 ? phaseProgress : deliverableProgress
  );

  // Health Score Calculation (1-100)
  // Budget health
  const totalBudget = project.budget?.total || 100000;
  const spent = project.budget?.categories?.reduce((acc, cat) => acc + (cat.spent || 0), 0) || 0;
  const budgetRatio = spent / (totalBudget || 1);
  let budgetScore = 100;
  if (budgetRatio > 1.0) budgetScore = 30;
  else if (budgetRatio > 0.85) budgetScore = 70;

  // Timeline health
  let timelineScore = 100;
  const overdueDeliverables = deliverables.filter(d => d.dueDate && new Date(d.dueDate) < new Date() && d.status !== 'completed').length;
  if (overdueDeliverables > 2) timelineScore = 50;
  else if (overdueDeliverables > 0) timelineScore = 75;

  const healthScore = Math.round((budgetScore * 0.4) + (timelineScore * 0.3) + (completionPercentage * 0.3));

  // Determine overall status if not explicitly set to on-hold/completed
  let overallStatus = project.overallStatus;
  if (overallStatus !== 'completed' && overallStatus !== 'on-hold') {
    if (healthScore < 60 || overdueDeliverables > 2 || budgetRatio > 1.0) {
      overallStatus = 'at-risk';
    } else {
      overallStatus = 'on-track';
    }
  }

  return { completionPercentage, healthScore, overallStatus, spent };
};

// 1. Create Project (from ClientBrief or standalone)
exports.createProject = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { briefId, clientId, clientName, projectName, roomType, designStyle, budget, startDate, targetEndDate } = req.body;

    let initialData = {
      userId,
      projectName: projectName || 'Interior Design Project',
      clientName: clientName || 'Valued Client',
      roomType: roomType || 'Living Room',
      designStyle: designStyle || 'Modern Minimalist',
      startDate: startDate || new Date(),
      targetEndDate: targetEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      budget: budget || {
        total: 100000,
        categories: [
          { name: 'Furniture', planned: 40000, spent: 0, items: [] },
          { name: 'Flooring', planned: 20000, spent: 0, items: [] },
          { name: 'Lighting', planned: 15000, spent: 0, items: [] },
          { name: 'Decor', planned: 15000, spent: 0, items: [] },
          { name: 'Labor', planned: 10000, spent: 0, items: [] }
        ]
      },
      phases: [
        {
          phaseName: 'Design & Planning',
          startDate: new Date(),
          targetEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'in-progress',
          deliverables: ['Mood boards', 'Design concepts', 'Floor plans'],
          percentComplete: 30
        },
        {
          phaseName: 'Procurement',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          targetEndDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
          status: 'not-started',
          deliverables: ['Shopping list', 'Vendor purchase orders'],
          percentComplete: 0
        },
        {
          phaseName: 'Installation',
          startDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
          targetEndDate: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000),
          status: 'not-started',
          deliverables: ['Site setup', 'Furniture placement', 'Lighting installation'],
          percentComplete: 0
        },
        {
          phaseName: 'Finalization',
          startDate: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000),
          targetEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'not-started',
          deliverables: ['Project photos', 'Client walkthrough & handover'],
          percentComplete: 0
        }
      ],
      deliverables: [
        {
          name: 'Design concepts & Mood boards',
          description: 'Provide 3 high resolution interior style concepts',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          status: 'in-progress'
        },
        {
          name: 'Finalized Shopping List',
          description: 'Curated ecommerce order links with product details',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          status: 'pending'
        },
        {
          name: 'Space Layout & 3D Visualization',
          description: 'Detailed floorplan arrangements',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: 'pending'
        },
        {
          name: 'Color & Fabric Swatches',
          description: 'Material samples approval',
          dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
          status: 'pending'
        },
        {
          name: 'Installation & Setup Plan',
          description: 'Contractor schedule & walkthrough',
          dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
          status: 'pending'
        },
        {
          name: 'Project Photos & Handover',
          description: 'Final walkthrough and closure documentation',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'pending'
        }
      ],
      teamMembers: [
        { userId, role: 'designer', joinedDate: new Date() }
      ],
      activityLog: [
        { action: 'Project Created', actor: userId, details: 'Initial project setup completed', timestamp: new Date() }
      ]
    };

    if (briefId) {
      const brief = await ClientBrief.findById(briefId);
      if (brief) {
        initialData.briefId = brief._id;
        if (brief.projectName) initialData.projectName = brief.projectName;
        if (brief.briefContent?.projectOverview) initialData.description = brief.briefContent.projectOverview;
        if (brief.userId) initialData.clientId = brief.userId;
      }
    }

    if (clientId) {
      initialData.clientId = clientId;
      const clientUser = await User.findById(clientId);
      if (clientUser) {
        initialData.clientName = clientUser.name || clientUser.email;
      }
    }

    const project = await Project.create(initialData);

    // Link back to ClientBrief if provided
    if (briefId) {
      await ClientBrief.findByIdAndUpdate(briefId, { projectId: project._id });
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get User's Projects with Filters & Metrics
exports.getProjects = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { status, dateRange, sortBy = 'createdAt', search, limit = 20, offset = 0 } = req.query;

    const query = {
      $or: [{ userId }, { clientId: userId }, { 'teamMembers.userId': userId }],
      archivedAt: null
    };

    if (status && status !== 'all') {
      query.overallStatus = status;
    }

    if (search) {
      query.$and = [
        {
          $or: [
            { projectName: { $regex: search, $options: 'i' } },
            { clientName: { $regex: search, $options: 'i' } },
            { roomType: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    if (dateRange === 'this-month') {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      query.createdAt = { $gte: startOfMonth };
    } else if (dateRange === 'last-30-days') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: thirtyDaysAgo };
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === 'due-date') sortOption = { targetEndDate: 1 };
    else if (sortBy === 'budget') sortOption = { 'budget.total': -1 };
    else if (sortBy === 'name') sortOption = { projectName: 1 };
    else if (sortBy === 'last-updated') sortOption = { updatedAt: -1 };

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .sort(sortOption)
      .skip(Number(offset))
      .limit(Number(limit));

    // Calculate aggregated metrics for top dashboard cards
    const allUserProjects = await Project.find({
      $or: [{ userId }, { clientId: userId }, { 'teamMembers.userId': userId }],
      archivedAt: null
    });

    let totalActive = 0;
    let onTrackCount = 0;
    let atRiskCount = 0;
    let sumCompletion = 0;
    let totalBudgetAllocated = 0;
    let totalBudgetSpent = 0;

    allUserProjects.forEach(p => {
      const metrics = calculateProjectMetrics(p);
      if (p.overallStatus !== 'completed') totalActive++;
      if (metrics.overallStatus === 'on-track') onTrackCount++;
      if (metrics.overallStatus === 'at-risk') atRiskCount++;
      sumCompletion += metrics.completionPercentage;
      totalBudgetAllocated += (p.budget?.total || 0);
      totalBudgetSpent += metrics.spent;
    });

    const metricsSummary = {
      totalActiveProjects: totalActive,
      projectsOnTrackPercent: totalActive > 0 ? Math.round((onTrackCount / totalActive) * 100) : 100,
      projectsAtRiskCount: atRiskCount,
      avgCompletionPercentage: allUserProjects.length > 0 ? Math.round(sumCompletion / allUserProjects.length) : 0,
      totalBudgetAllocated,
      totalBudgetSpent
    };

    res.status(200).json({
      success: true,
      data: {
        projects,
        total,
        limit: Number(limit),
        offset: Number(offset),
        metricsSummary
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Full Project Details
exports.getProjectById = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId)
      .populate('userId', 'name email avatar')
      .populate('clientId', 'name email phone')
      .populate('teamMembers.userId', 'name email role');

    if (!project || project.archivedAt) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Recalculate metrics
    const metrics = calculateProjectMetrics(project);
    project.completionPercentage = metrics.completionPercentage;
    project.overallStatus = metrics.overallStatus;
    if (!project.aiInsights.healthScore) {
      project.aiInsights.healthScore = metrics.healthScore;
    }
    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Project Meta Details
exports.updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const fields = ['projectName', 'description', 'roomType', 'designStyle', 'overallStatus', 'startDate', 'targetEndDate', 'actualEndDate'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) project[field] = req.body[field];
    });

    if (req.body.budgetTotal) {
      project.budget.total = req.body.budgetTotal;
    }

    project.activityLog.push({
      action: 'Project Updated',
      actor: req.user._id,
      details: 'Updated project details',
      timestamp: new Date()
    });

    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// 5. Update Phase Status
exports.updatePhaseStatus = async (req, res, next) => {
  try {
    const { projectId, phaseId } = req.params;
    const { status, actualEndDate, notes, percentComplete } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const phase = project.phases.id(phaseId);
    if (!phase) {
      return res.status(404).json({ success: false, message: 'Phase not found' });
    }

    if (status) phase.status = status;
    if (actualEndDate) phase.actualEndDate = actualEndDate;
    if (percentComplete !== undefined) phase.percentComplete = percentComplete;
    if (status === 'completed') {
      phase.percentComplete = 100;
      phase.actualEndDate = phase.actualEndDate || new Date();
    }

    // Recalculate metrics
    const metrics = calculateProjectMetrics(project);
    project.completionPercentage = metrics.completionPercentage;
    project.overallStatus = metrics.overallStatus;

    project.activityLog.push({
      action: 'Phase Updated',
      actor: req.user._id,
      details: `Phase "${phase.phaseName}" updated to ${phase.status}`,
      timestamp: new Date()
    });

    await project.save();

    // Trigger AI summary for phase update
    let aiSummary = '';
    try {
      aiSummary = await geminiProjectService.generateHealthNarrative(project, req.user._id);
      project.aiInsights.healthNarrative = aiSummary;
      project.aiInsights.generatedAt = new Date();
      await project.save();
    } catch (e) {
      console.warn('AI summary generation failed:', e.message);
    }

    res.status(200).json({
      success: true,
      data: {
        phase,
        completionPercentage: project.completionPercentage,
        overallStatus: project.overallStatus,
        aiSummary
      }
    });
  } catch (error) {
    next(error);
  }
};

// 6. Update Deliverable Status
exports.updateDeliverable = async (req, res, next) => {
  try {
    const { projectId, deliverableId } = req.params;
    const { status, completionDate, notes, attachments, assignedTo } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const deliverable = project.deliverables.id(deliverableId);
    if (!deliverable) {
      return res.status(404).json({ success: false, message: 'Deliverable not found' });
    }

    if (status) deliverable.status = status;
    if (completionDate) deliverable.completionDate = completionDate;
    if (notes !== undefined) deliverable.notes = notes;
    if (assignedTo) deliverable.assignedTo = assignedTo;
    if (attachments && Array.isArray(attachments)) {
      deliverable.attachments = attachments;
    }
    if (status === 'completed' && !deliverable.completionDate) {
      deliverable.completionDate = new Date();
    }

    const metrics = calculateProjectMetrics(project);
    project.completionPercentage = metrics.completionPercentage;
    project.overallStatus = metrics.overallStatus;

    project.activityLog.push({
      action: 'Deliverable Updated',
      actor: req.user._id,
      details: `Deliverable "${deliverable.name}" status set to ${deliverable.status}`,
      timestamp: new Date()
    });

    await project.save();

    res.status(200).json({
      success: true,
      data: {
        deliverable,
        completionPercentage: project.completionPercentage,
        overallStatus: project.overallStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// 7. Add Budget Item / Expense
exports.addBudgetItem = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { categoryName, itemName, cost, receipt } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!project.budget) {
      project.budget = { total: 100000, categories: [] };
    }
    if (!project.budget.categories) {
      project.budget.categories = [];
    }

    const targetCategoryName = (categoryName || 'Furniture').trim();
    let category = project.budget.categories.find(c => (c.name || '').toLowerCase() === targetCategoryName.toLowerCase());
    
    if (!category) {
      project.budget.categories.push({
        name: targetCategoryName,
        planned: 10000,
        spent: 0,
        items: []
      });
      category = project.budget.categories[project.budget.categories.length - 1];
    }

    if (!category.items) {
      category.items = [];
    }

    const expenseCost = Number(cost) || 0;
    category.items.push({
      itemName: itemName || 'Item Expense',
      cost: expenseCost,
      date: new Date(),
      receipt: receipt || ''
    });
    category.spent = (category.spent || 0) + expenseCost;

    // Check budget alert threshold (>85% of category planned or total budget)
    const categoryRatio = category.spent / (category.planned || 1);
    if (categoryRatio >= 0.85) {
      const alertMessage = `Budget Alert: ${category.name} expenditure (₹${category.spent.toLocaleString()}) has reached ${Math.round(categoryRatio * 100)}% of planned budget (₹${category.planned.toLocaleString()}).`;
      
      let aiRec = `Monitor upcoming orders for ${category.name} to prevent budget overrun.`;
      try {
        const aiAlert = await geminiProjectService.generateAlertMessage('budget-alert', { name: category.name, spent: category.spent, planned: category.planned }, req.user?._id);
        aiRec = aiAlert?.aiRecommendation || aiRec;

        await ProjectAlert.create({
          projectId: project._id,
          userId: req.user?._id || project.userId,
          alertType: 'budget-alert',
          severity: categoryRatio >= 1.0 ? 'high' : 'medium',
          message: alertMessage,
          aiRecommendation: aiRec
        });
      } catch (alertErr) {
        console.warn('ProjectAlert creation skipped:', alertErr.message);
      }
    }

    if (!project.activityLog) {
      project.activityLog = [];
    }

    project.activityLog.push({
      action: 'Budget Expense Added',
      actor: req.user?._id || project.userId,
      details: `Added ₹${expenseCost} for "${itemName || 'Item Expense'}" in ${category.name}`,
      timestamp: new Date()
    });

    project.markModified('budget');
    project.markModified('activityLog');
    await project.save();

    res.status(201).json({
      success: true,
      message: 'Budget expense recorded successfully',
      data: project.budget
    });
  } catch (error) {
    next(error);
  }
};

// 8. Get AI Project Health Score & Insights
exports.getProjectHealth = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const metrics = calculateProjectMetrics(project);

    // Call Gemini services in parallel for fresh insights
    const [healthNarrative, riskAssessment, nextSteps] = await Promise.all([
      geminiProjectService.generateHealthNarrative(project, req.user._id),
      geminiProjectService.assessProjectRisks(project, req.user._id),
      geminiProjectService.recommendNextSteps(project, req.user._id)
    ]);

    project.aiInsights = {
      healthScore: metrics.healthScore,
      healthNarrative,
      riskAssessment,
      nextSteps,
      recommendations: [
        'Maintain weekly client syncs',
        'Verify vendor delivery schedules',
        'Keep budget expenses logged in real-time'
      ],
      generatedAt: new Date()
    };
    project.overallStatus = metrics.overallStatus;
    project.completionPercentage = metrics.completionPercentage;
    await project.save();

    res.status(200).json({
      success: true,
      data: {
        healthScore: metrics.healthScore,
        overallStatus: metrics.overallStatus,
        healthNarrative,
        riskAssessment,
        nextSteps,
        recommendations: project.aiInsights.recommendations
      }
    });
  } catch (error) {
    next(error);
  }
};

// 9. Generate Project Report
exports.generateReport = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { reportType = 'status' } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const summaryContent = await geminiProjectService.generateReportSummary(project, req.user?._id || project.userId);

    const report = await ProjectReport.create({
      projectId: project._id,
      reportType,
      generatedBy: req.user?._id || project.userId,
      content: summaryContent,
      pdfUrl: `/api/projects/${project._id}/report/download`
    });

    if (!project.activityLog) project.activityLog = [];
    project.activityLog.push({
      action: 'Report Generated',
      actor: req.user?._id || project.userId,
      details: `Generated ${reportType} report`,
      timestamp: new Date()
    });
    project.markModified('activityLog');
    await project.save();

    res.status(200).json({
      success: true,
      data: {
        reportId: report._id,
        pdfUrl: report.pdfUrl,
        content: report.content,
        createdAt: report.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// 10. Email Project Report to Client
exports.emailReport = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { emails, reportId } = req.body;

    const project = await Project.findById(projectId).populate('clientId');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const rawEmails = Array.isArray(emails) ? emails : (typeof emails === 'string' ? [emails] : []);
    const targetEmails = rawEmails
      .map(e => (typeof e === 'string' ? e.trim() : ''))
      .filter(e => e.length > 0);

    if (targetEmails.length === 0) {
      targetEmails.push(project.clientId?.email || 'client@example.com');
    }

    const clientEmailBody = await geminiProjectService.generateClientEmailContent(project, req.user?._id || project.userId);

    // Generate PDF attachment buffer
    const { generateProjectReportPDF } = require('../utils/projectReportPdfGenerator');
    let pdfBuffer = null;
    try {
      pdfBuffer = await generateProjectReportPDF(project, clientEmailBody);
    } catch (pdfErr) {
      console.warn('Project report PDF generation error:', pdfErr.message);
    }

    const attachments = pdfBuffer ? [
      {
        filename: `${(project.projectName || 'Project').replace(/[^a-zA-Z0-9_-]/g, '_')}_Report.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ] : [];

    // Send direct mail with PDF attachment using sendMailDirect or sendEmail fallback
    for (const recipient of targetEmails) {
      try {
        const subject = `Project Update: ${project.projectName} (${project.completionPercentage}% Complete)`;
        const htmlContent = `<div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
          <h2 style="color: #4A3E3D;">Riddha Interio Mart - Project Update</h2>
          <p>${(clientEmailBody || '').replace(/\n/g, '<br/>')}</p>
          <p style="margin-top: 15px; font-weight: bold; color: #4A3E3D;">📄 Detailed PDF project report attached.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
          <p style="font-size: 12px; color: #777;">Track your full project timeline, budget, and deliverables directly on your Riddha portal.</p>
        </div>`;

        if (emailService.sendMailDirect) {
          await emailService.sendMailDirect(recipient, subject, htmlContent, attachments);
        } else {
          await emailService.sendEmail({ to: recipient, subject, text: clientEmailBody, html: htmlContent, attachments });
        }
      } catch (err) {
        console.warn('Email dispatch warning:', err.message);
      }
    }

    const mongoose = require('mongoose');
    if (reportId && mongoose.Types.ObjectId.isValid(reportId)) {
      try {
        await ProjectReport.findByIdAndUpdate(reportId, { $addToSet: { sentToEmails: { $each: targetEmails } } });
      } catch (e) {}
    }

    res.status(200).json({
      success: true,
      data: { sent: true, recipientCount: targetEmails.length }
    });
  } catch (error) {
    next(error);
  }
};

// 11. Get Alerts & Mark Read
exports.getProjectAlerts = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const alerts = await ProjectAlert.find({ projectId }).sort({ createdAt: -1 });
    const unreadCount = alerts.filter(a => !a.isRead).length;

    res.status(200).json({
      success: true,
      data: { alerts, unreadCount }
    });
  } catch (error) {
    next(error);
  }
};

exports.markAlertRead = async (req, res, next) => {
  try {
    const { alertId } = req.params;
    await ProjectAlert.findByIdAndUpdate(alertId, { isRead: true });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// 12. Team Management & Archive
exports.addTeamMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { userId, role } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const existingMember = project.teamMembers.find(m => m.userId.toString() === userId);
    if (!existingMember) {
      project.teamMembers.push({ userId, role: role || 'designer', joinedDate: new Date() });
      await project.save();
    }

    res.status(201).json({ success: true, data: project.teamMembers });
  } catch (error) {
    next(error);
  }
};

exports.archiveProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findByIdAndUpdate(
      projectId,
      { archivedAt: new Date() },
      { new: true }
    );

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// 13. Download PDF Project Report directly
exports.downloadReportPDF = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const { generateProjectReportPDF } = require('../utils/projectReportPdfGenerator');
    const summaryText = project.aiInsights?.healthNarrative || project.description || 'Project progress is on track.';
    const pdfBuffer = await generateProjectReportPDF(project, summaryText);

    const safeFileName = `${(project.projectName || 'Project').replace(/[^a-zA-Z0-9_-]/g, '_')}_Report.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
