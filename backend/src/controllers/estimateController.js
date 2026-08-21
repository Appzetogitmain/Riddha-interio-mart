const CostEstimate = require('../models/CostEstimate');
const CostingRate = require('../models/CostingRate');
const { calculateEstimateCosts, calculateTierComparison } = require('../utils/costingEngine');
const estimatorService = require('../services/estimatorService');
const { generateEstimatePDF } = require('../utils/estimatePdfGenerator');
const emailService = require('../services/emailService');
const mongoose = require('mongoose');

// 1. Create Cost Estimate
exports.createEstimate = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      estimateName,
      roomType = 'Living Room',
      area = 400,
      dimensions = { length: 20, width: 20, unit: 'ft' },
      scope = [],
      materialTier = 'standard',
      timeline = 'soon',
      additionalServices = [],
      projectId,
      clientEmail
    } = req.body;

    // Calculate itemized costs
    const calculatedCosts = calculateEstimateCosts({
      roomType,
      area,
      materialTier,
      timeline,
      scope,
      additionalServices
    });

    // Calculate 3-tier side-by-side comparison
    const tierCompTotals = calculateTierComparison({
      roomType,
      area,
      scope,
      additionalServices,
      timeline
    });

    // Run Gemini AI prompt analyses in parallel
    const [
      costBreakdownAnalysis,
      optimizationSuggestions,
      tierAnalysis,
      timelineImpact,
      riskAssessment
    ] = await Promise.all([
      estimatorService.analyzeCostBreakdown({ roomType, area, materialTier, costBreakdown: calculatedCosts }, userId),
      estimatorService.suggestOptimizations({ roomType, area, materialTier, costBreakdown: calculatedCosts }, userId),
      estimatorService.compareTiers(tierCompTotals.economy, tierCompTotals.standard, tierCompTotals.premium, roomType, area, userId),
      estimatorService.analyzeTimelineImpact(timeline, calculatedCosts.timelineAdjustment, calculatedCosts.grandTotal, userId),
      estimatorService.assessRisksAndContingency({ roomType, scope, costBreakdown: calculatedCosts }, userId)
    ]);

    const estimate = await CostEstimate.create({
      userId,
      projectId: projectId || undefined,
      estimateName: estimateName || `${roomType} Cost Estimate`,
      roomType,
      area: Number(area),
      dimensions,
      scope,
      materialTier,
      timeline,
      additionalServices,
      costBreakdown: calculatedCosts,
      aiAnalysis: {
        costBreakdownAnalysis,
        optimizationSuggestions,
        tierComparison: {
          economy: tierCompTotals.economy.grandTotal,
          standard: tierCompTotals.standard.grandTotal,
          premium: tierCompTotals.premium.grandTotal,
          analysis: tierAnalysis
        },
        timelineImpact,
        riskAssessment,
        generatedAt: new Date()
      },
      clientEmail: clientEmail || ''
    });

    res.status(201).json({
      success: true,
      message: 'Cost estimate generated successfully',
      data: estimate
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get User's Saved Cost Estimates
exports.getEstimates = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { status, limit = 20, offset = 0 } = req.query;

    const query = { userId, isTemplate: false };
    if (status) query.status = status;

    const total = await CostEstimate.countDocuments(query);
    const estimates = await CostEstimate.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: {
        estimates,
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Full Estimate Details
exports.getEstimateById = async (req, res, next) => {
  try {
    const { estimateId } = req.params;
    const estimate = await CostEstimate.findById(estimateId);
    if (!estimate) {
      return res.status(404).json({ success: false, message: 'Cost estimate not found' });
    }

    res.status(200).json({
      success: true,
      data: estimate
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Estimate Parameters & Recalculate
exports.updateEstimate = async (req, res, next) => {
  try {
    const { estimateId } = req.params;
    const estimate = await CostEstimate.findById(estimateId);
    if (!estimate) {
      return res.status(404).json({ success: false, message: 'Cost estimate not found' });
    }

    const fields = ['estimateName', 'roomType', 'area', 'dimensions', 'scope', 'materialTier', 'timeline', 'additionalServices', 'clientEmail', 'status', 'notes'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) estimate[field] = req.body[field];
    });

    // Recalculate costs
    const calculatedCosts = calculateEstimateCosts({
      roomType: estimate.roomType,
      area: estimate.area,
      materialTier: estimate.materialTier,
      timeline: estimate.timeline,
      scope: estimate.scope,
      additionalServices: estimate.additionalServices
    });
    estimate.costBreakdown = calculatedCosts;

    // Recalculate 3-tier totals
    const tierCompTotals = calculateTierComparison({
      roomType: estimate.roomType,
      area: estimate.area,
      scope: estimate.scope,
      additionalServices: estimate.additionalServices,
      timeline: estimate.timeline
    });
    if (estimate.aiAnalysis && estimate.aiAnalysis.tierComparison) {
      estimate.aiAnalysis.tierComparison.economy = tierCompTotals.economy.grandTotal;
      estimate.aiAnalysis.tierComparison.standard = tierCompTotals.standard.grandTotal;
      estimate.aiAnalysis.tierComparison.premium = tierCompTotals.premium.grandTotal;
    }

    await estimate.save();

    res.status(200).json({
      success: true,
      data: estimate
    });
  } catch (error) {
    next(error);
  }
};

// 5. Get Tier Comparison Details
exports.getTierComparison = async (req, res, next) => {
  try {
    const { estimateId } = req.params;
    const estimate = await CostEstimate.findById(estimateId);
    if (!estimate) {
      return res.status(404).json({ success: false, message: 'Estimate not found' });
    }

    const tierCompTotals = calculateTierComparison({
      roomType: estimate.roomType,
      area: estimate.area,
      scope: estimate.scope,
      additionalServices: estimate.additionalServices,
      timeline: estimate.timeline
    });

    const comparisonAnalysis = await estimatorService.compareTiers(
      tierCompTotals.economy,
      tierCompTotals.standard,
      tierCompTotals.premium,
      estimate.roomType,
      estimate.area,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: {
        economy: tierCompTotals.economy,
        standard: tierCompTotals.standard,
        premium: tierCompTotals.premium,
        analysis: comparisonAnalysis
      }
    });
  } catch (error) {
    next(error);
  }
};

// 6. Download PDF Estimate directly
exports.exportEstimatePDF = async (req, res, next) => {
  try {
    const { estimateId } = req.params;
    const estimate = await CostEstimate.findById(estimateId);
    if (!estimate) {
      return res.status(404).json({ success: false, message: 'Cost estimate not found' });
    }

    const pdfBuffer = await generateEstimatePDF(estimate);
    const safeFileName = `${(estimate.estimateName || 'Estimate').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// 7. Email Estimate PDF to Client
exports.emailEstimate = async (req, res, next) => {
  try {
    const { estimateId } = req.params;
    const { clientEmail } = req.body;

    const estimate = await CostEstimate.findById(estimateId);
    if (!estimate) {
      return res.status(404).json({ success: false, message: 'Cost estimate not found' });
    }

    const recipient = clientEmail || estimate.clientEmail;
    if (!recipient) {
      return res.status(400).json({ success: false, message: 'Client email is required' });
    }

    const pdfBuffer = await generateEstimatePDF(estimate);
    const filename = `${(estimate.estimateName || 'Estimate').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    const subject = `Riddha Interio Mart - Cost Estimate: ${estimate.estimateName} (Rs. ${(estimate.costBreakdown?.grandTotal || 0).toLocaleString()})`;
    const htmlContent = `<div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
      <h2 style="color: #3d2b1f;">Riddha Interio Mart - Cost Estimate Report</h2>
      <p>Dear Client,</p>
      <p>Please find attached your detailed interior cost estimate report for <strong>${estimate.roomType} (${estimate.area} sq ft)</strong>.</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p style="margin: 0; font-weight: bold; color: #059669;">Estimated Total: Rs. ${(estimate.costBreakdown?.grandTotal || 0).toLocaleString()}</p>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">Tier: ${(estimate.materialTier || 'standard').toUpperCase()} | Timeline: ${(estimate.timeline || 'soon').toUpperCase()}</p>
      </div>
      <p>A detailed PDF breakdown and AI cost analysis report is attached to this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
      <p style="font-size: 12px; color: #777;">Riddha Interior Mart Pvt. Ltd. • Support: support@riddhamart.com</p>
    </div>`;

    const attachments = [{ filename, content: pdfBuffer, contentType: 'application/pdf' }];

    if (emailService.sendMailDirect) {
      await emailService.sendMailDirect(recipient, subject, htmlContent, attachments);
    } else {
      await emailService.sendEmail({ to: recipient, subject, text: `Cost estimate: ${estimate.estimateName}`, html: htmlContent, attachments });
    }

    estimate.status = 'sent';
    estimate.sentAt = new Date();
    estimate.clientEmail = recipient;
    await estimate.save();

    res.status(200).json({
      success: true,
      message: `Estimate report emailed successfully to ${recipient}`,
      data: { sent: true, recipient }
    });
  } catch (error) {
    next(error);
  }
};

// 8. Save as Template & List Templates
exports.saveAsTemplate = async (req, res, next) => {
  try {
    const { estimateId } = req.params;
    const { templateName } = req.body;

    const estimate = await CostEstimate.findById(estimateId);
    if (!estimate) {
      return res.status(404).json({ success: false, message: 'Estimate not found' });
    }

    const template = await CostEstimate.create({
      userId: req.user._id,
      estimateName: templateName || `Template: ${estimate.roomType}`,
      isTemplate: true,
      templateName: templateName || `Template: ${estimate.roomType}`,
      roomType: estimate.roomType,
      area: estimate.area,
      dimensions: estimate.dimensions,
      scope: estimate.scope,
      materialTier: estimate.materialTier,
      timeline: estimate.timeline,
      additionalServices: estimate.additionalServices,
      costBreakdown: estimate.costBreakdown
    });

    res.status(201).json({
      success: true,
      message: 'Template saved successfully',
      data: template
    });
  } catch (error) {
    next(error);
  }
};

exports.getTemplates = async (req, res, next) => {
  try {
    const templates = await CostEstimate.find({ userId: req.user._id, isTemplate: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: { templates } });
  } catch (error) {
    next(error);
  }
};

// 9. Delete Estimate
exports.deleteEstimate = async (req, res, next) => {
  try {
    const { estimateId } = req.params;
    await CostEstimate.findByIdAndDelete(estimateId);
    res.status(200).json({ success: true, message: 'Estimate deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 10. Admin Costing Rates CRUD
exports.getCostingRates = async (req, res, next) => {
  try {
    const rates = await CostingRate.find().sort({ roomType: 1, category: 1 });
    res.status(200).json({ success: true, data: { rates } });
  } catch (error) {
    next(error);
  }
};

exports.updateCostingRate = async (req, res, next) => {
  try {
    const { rateId } = req.params;
    const rate = await CostingRate.findByIdAndUpdate(rateId, req.body, { new: true });
    res.status(200).json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};
