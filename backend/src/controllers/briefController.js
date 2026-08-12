const ClientBrief = require('../models/ClientBrief');
const geminiBriefService = require('../services/geminiBriefService');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

/**
 * 1. Start new brief creation
 * POST /api/briefs/start
 */
exports.startBrief = async (req, res, next) => {
  try {
    const { projectName, guestSessionId } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!userId && !guestSessionId) {
      return res.status(400).json({ success: false, error: 'User login or guestSessionId is required to start a brief.' });
    }

    const briefData = {
      projectName: projectName || 'Interior Design Project Brief',
      status: 'draft',
      formAnswers: [],
      briefContent: {}
    };

    if (userId) {
      briefData.userId = userId;
    } else {
      briefData.guestSessionId = guestSessionId;
    }

    const brief = await ClientBrief.create(briefData);

    return res.status(201).json({
      success: true,
      data: {
        briefId: brief._id,
        status: brief.status,
        projectName: brief.projectName,
        createdAt: brief.createdAt
      }
    });
  } catch (err) {
    console.error('Start brief error:', err);
    return res.status(500).json({ success: false, error: 'Failed to initialize project brief.' });
  }
};

/**
 * 2. Save answer to form question
 * POST /api/briefs/:briefId/answer
 */
exports.saveAnswer = async (req, res, next) => {
  try {
    const { briefId } = req.params;
    const { questionId, answer } = req.body;

    if (!mongoose.Types.ObjectId.isValid(briefId)) {
      return res.status(400).json({ success: false, error: 'Invalid brief ID.' });
    }

    if (questionId === undefined || answer === undefined) {
      return res.status(400).json({ success: false, error: 'questionId and answer are required.' });
    }

    const qNum = Number(questionId);

    // Atomic update if questionId already exists in formAnswers array
    let updatedBrief = await ClientBrief.findOneAndUpdate(
      { _id: briefId, 'formAnswers.questionId': qNum },
      {
        $set: { 'formAnswers.$.answer': answer, updatedAt: new Date() }
      },
      { new: true }
    );

    // If questionId does not exist yet in formAnswers array, push it atomically
    if (!updatedBrief) {
      updatedBrief = await ClientBrief.findByIdAndUpdate(
        briefId,
        {
          $push: { formAnswers: { questionId: qNum, answer } },
          $set: { updatedAt: new Date() }
        },
        { new: true }
      );
    }

    if (!updatedBrief) {
      return res.status(404).json({ success: false, error: 'Client brief not found.' });
    }

    return res.status(200).json({
      success: true,
      data: {
        questionId: qNum,
        saved: true,
        totalAnswers: updatedBrief.formAnswers.length
      }
    });
  } catch (err) {
    console.error('Save answer error:', err);
    return res.status(500).json({ success: false, error: 'Failed to save question answer.' });
  }
};

/**
 * 3. Generate brief from answers (Triggers Gemini AI)
 * POST /api/briefs/:briefId/generate
 */
exports.generateBrief = async (req, res, next) => {
  try {
    const { briefId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(briefId)) {
      return res.status(400).json({ success: false, error: 'Invalid brief ID.' });
    }

    const brief = await ClientBrief.findById(briefId);
    if (!brief) {
      return res.status(404).json({ success: false, error: 'Client brief not found.' });
    }

    brief.status = 'generating';
    await brief.save();

    const userId = req.user ? req.user.id : null;
    const result = await geminiBriefService.generateFullBrief(brief.formAnswers, userId);

    brief.briefContent = result.briefContent;
    brief.status = 'finalized';
    brief.geminiTokensUsed = result.tokensUsed;
    brief.updatedAt = new Date();
    await brief.save();

    return res.status(200).json({
      success: true,
      data: {
        briefId: brief._id,
        status: brief.status,
        briefContent: brief.briefContent,
        updatedAt: brief.updatedAt
      }
    });
  } catch (err) {
    console.error('Generate brief error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate brief via Gemini AI.' });
  }
};

/**
 * 4. Get full brief with all sections
 * GET /api/briefs/:briefId
 */
exports.getBrief = async (req, res, next) => {
  try {
    const { briefId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(briefId)) {
      return res.status(400).json({ success: false, error: 'Invalid brief ID.' });
    }

    const brief = await ClientBrief.findById(briefId)
      .populate('userId', 'name email mobileNumber')
      .populate('approvedBy', 'name email');

    if (!brief) {
      return res.status(404).json({ success: false, error: 'Client brief not found.' });
    }

    return res.status(200).json({
      success: true,
      data: brief
    });
  } catch (err) {
    console.error('Get brief error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch project brief.' });
  }
};

/**
 * 5. Check brief generation status
 * GET /api/briefs/:briefId/status
 */
exports.getBriefStatus = async (req, res, next) => {
  try {
    const { briefId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(briefId)) {
      return res.status(400).json({ success: false, error: 'Invalid brief ID.' });
    }

    const brief = await ClientBrief.findById(briefId).select('status updatedAt createdAt');
    if (!brief) {
      return res.status(404).json({ success: false, error: 'Client brief not found.' });
    }

    return res.status(200).json({
      success: true,
      data: {
        briefId: brief._id,
        status: brief.status,
        updatedAt: brief.updatedAt
      }
    });
  } catch (err) {
    console.error('Get brief status error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch brief status.' });
  }
};

/**
 * 6. Edit brief section
 * PUT /api/briefs/:briefId
 */
exports.updateBrief = async (req, res, next) => {
  try {
    const { briefId } = req.params;
    const { section, content, projectName } = req.body;

    if (!mongoose.Types.ObjectId.isValid(briefId)) {
      return res.status(400).json({ success: false, error: 'Invalid brief ID.' });
    }

    const brief = await ClientBrief.findById(briefId);
    if (!brief) {
      return res.status(404).json({ success: false, error: 'Client brief not found.' });
    }

    if (brief.status === 'approved') {
      return res.status(400).json({ success: false, error: 'Approved briefs are locked against editing.' });
    }

    if (projectName) {
      brief.projectName = projectName;
    }

    if (section && content !== undefined) {
      const allowedSections = [
        'executiveSummary', 'projectOverview', 'designScope',
        'requirements', 'timeline', 'budgetBreakdown',
        'constraints', 'deliverables'
      ];

      if (!allowedSections.includes(section)) {
        return res.status(400).json({ success: false, error: `Invalid section name '${section}'.` });
      }

      brief.briefContent[section] = content;
      brief.markModified('briefContent');
    }

    brief.updatedAt = new Date();
    await brief.save();

    return res.status(200).json({
      success: true,
      data: brief
    });
  } catch (err) {
    console.error('Update brief error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update brief section.' });
  }
};

/**
 * 7. Export brief as PDF
 * POST /api/briefs/:briefId/export
 */
exports.exportBriefPdf = async (req, res, next) => {
  try {
    const { briefId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(briefId)) {
      return res.status(400).json({ success: false, error: 'Invalid brief ID.' });
    }

    const brief = await ClientBrief.findById(briefId);
    if (!brief) {
      return res.status(404).json({ success: false, error: 'Client brief not found.' });
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${brief.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_Brief.pdf"`);

    doc.pipe(res);

    // Header
    doc.fillColor('#189D91').fontSize(22).font('Helvetica-Bold').text('RIDDHA INTERIO MART', { align: 'center' });
    doc.fillColor('#4A5568').fontSize(14).font('Helvetica-Bold').text(brief.projectName || 'Client Project Brief', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#718096').text(`Generated on: ${new Date(brief.createdAt).toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1.5);

    const c = brief.briefContent || {};

    // 1. Executive Summary
    doc.fillColor('#189D91').fontSize(14).font('Helvetica-Bold').text('1. EXECUTIVE SUMMARY');
    doc.fontSize(10).font('Helvetica').fillColor('#2D3748').text(c.executiveSummary || 'N/A', { align: 'justify' });
    doc.moveDown(1);

    // 2. Project Overview
    doc.fillColor('#189D91').fontSize(14).font('Helvetica-Bold').text('2. PROJECT OVERVIEW');
    doc.fontSize(10).font('Helvetica').fillColor('#2D3748').text(c.projectOverview || 'N/A', { align: 'justify' });
    doc.moveDown(1);

    // 3. Design Scope
    doc.fillColor('#189D91').fontSize(14).font('Helvetica-Bold').text('3. DESIGN SCOPE OPTIONS');
    if (c.designScope) {
      ['basic', 'standard', 'premium'].forEach(tier => {
        if (c.designScope[tier]) {
          const t = c.designScope[tier];
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#2D3748').text(`${tier.toUpperCase()}: ${t.title} (${t.estimatedEffort || ''})`);
          doc.fontSize(9).font('Helvetica').fillColor('#4A5568').text(`Description: ${t.description || ''}`);
          if (Array.isArray(t.includedItems)) {
            doc.text(`Includes: ${t.includedItems.join(', ')}`);
          }
          doc.moveDown(0.5);
        }
      });
    }
    doc.moveDown(1);

    // 4. Requirements
    doc.fillColor('#189D91').fontSize(14).font('Helvetica-Bold').text('4. PROJECT REQUIREMENTS');
    if (c.requirements) {
      Object.keys(c.requirements).forEach(cat => {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#2D3748').text(cat.toUpperCase());
        const list = c.requirements[cat];
        if (Array.isArray(list)) {
          list.forEach(item => doc.fontSize(9).font('Helvetica').fillColor('#4A5568').text(` • ${item}`));
        }
        doc.moveDown(0.5);
      });
    }
    doc.moveDown(1);

    // 5. Timeline
    doc.fillColor('#189D91').fontSize(14).font('Helvetica-Bold').text('5. PROJECT TIMELINE');
    if (c.timeline && Array.isArray(c.timeline.phases)) {
      c.timeline.phases.forEach((p, i) => {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#2D3748').text(`${p.phaseName} (${p.duration})`);
        doc.fontSize(9).font('Helvetica').fillColor('#4A5568').text(`Milestone: ${p.milestone || ''}`);
        if (Array.isArray(p.deliverables)) {
          doc.text(`Deliverables: ${p.deliverables.join(', ')}`);
        }
        doc.moveDown(0.5);
      });
    }
    doc.moveDown(1);

    // 6. Budget Breakdown
    doc.fillColor('#189D91').fontSize(14).font('Helvetica-Bold').text('6. BUDGET BREAKDOWN');
    if (c.budgetBreakdown && Array.isArray(c.budgetBreakdown.categories)) {
      c.budgetBreakdown.categories.forEach(cat => {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#2D3748').text(`${cat.name}: ${cat.percentage}% (₹${Number(cat.amount).toLocaleString('en-IN')})`);
        doc.fontSize(9).font('Helvetica').fillColor('#4A5568').text(`Included: ${cat.included}`);
        doc.moveDown(0.5);
      });
    }
    doc.moveDown(1);

    // 7. Constraints
    doc.fillColor('#189D91').fontSize(14).font('Helvetica-Bold').text('7. CONSTRAINTS ANALYSIS');
    if (Array.isArray(c.constraints)) {
      c.constraints.forEach((item, i) => {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#2D3748').text(`Constraint: ${item.constraint}`);
        doc.fontSize(9).font('Helvetica').fillColor('#4A5568').text(`Solution: ${item.solution}`);
        doc.moveDown(0.5);
      });
    }
    doc.moveDown(1);

    // 8. Deliverables
    doc.fillColor('#189D91').fontSize(14).font('Helvetica-Bold').text('8. FINAL DELIVERABLES');
    if (Array.isArray(c.deliverables)) {
      c.deliverables.forEach(d => {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#2D3748').text(`${d.name} (${d.timing})`);
        doc.fontSize(9).font('Helvetica').fillColor('#4A5568').text(`Format: ${d.format} - ${d.description}`);
        doc.moveDown(0.5);
      });
    }

    doc.end();
  } catch (err) {
    console.error('Export PDF error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate PDF export.' });
  }
};

/**
 * 8. Approve brief
 * POST /api/briefs/:briefId/approve
 */
exports.approveBrief = async (req, res, next) => {
  try {
    const { briefId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(briefId)) {
      return res.status(400).json({ success: false, error: 'Invalid brief ID.' });
    }

    const brief = await ClientBrief.findById(briefId);
    if (!brief) {
      return res.status(404).json({ success: false, error: 'Client brief not found.' });
    }

    const userId = req.user ? req.user.id : (req.body.approvedBy || null);

    brief.status = 'approved';
    brief.approvedAt = new Date();
    if (userId) brief.approvedBy = userId;

    await brief.save();

    return res.status(200).json({
      success: true,
      data: brief
    });
  } catch (err) {
    console.error('Approve brief error:', err);
    return res.status(500).json({ success: false, error: 'Failed to approve project brief.' });
  }
};

/**
 * 9. Share brief via email / link
 * POST /api/briefs/:briefId/share
 */
exports.shareBrief = async (req, res, next) => {
  try {
    const { briefId } = req.params;
    const { emails, message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(briefId)) {
      return res.status(400).json({ success: false, error: 'Invalid brief ID.' });
    }

    const brief = await ClientBrief.findById(briefId);
    if (!brief) {
      return res.status(404).json({ success: false, error: 'Client brief not found.' });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const shareLink = `${clientUrl}/client-brief/${brief._id}`;

    let sentCount = 0;
    if (Array.isArray(emails) && emails.length > 0 && process.env.SMTP_HOST) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        for (const recipient of emails) {
          await transporter.sendMail({
            from: `"Riddha Interio Mart" <${process.env.SMTP_USER || 'noreply@riddhamart.com'}>`,
            to: recipient,
            subject: `Project Brief: ${brief.projectName}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #189D91;">Riddha Interio Mart - Project Brief</h2>
                <p>Hello,</p>
                <p>A project brief for <strong>${brief.projectName}</strong> has been shared with you.</p>
                ${message ? `<p><em>"${message}"</em></p>` : ''}
                <p><a href="${shareLink}" style="background-color: #189D91; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block;">View Project Brief</a></p>
                <br/>
                <p>Best regards,<br/>Riddha Design AI Team</p>
              </div>
            `
          });
          sentCount++;
        }
      } catch (mailErr) {
        console.error('Nodemailer error:', mailErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        shareLink,
        recipientsEmailed: sentCount
      }
    });
  } catch (err) {
    console.error('Share brief error:', err);
    return res.status(500).json({ success: false, error: 'Failed to share project brief.' });
  }
};

/**
 * 10. List user's briefs
 * GET /api/briefs
 */
exports.listBriefs = async (req, res, next) => {
  try {
    const { status, guestSessionId, limit = 10, offset = 0 } = req.query;
    const userId = req.user ? req.user.id : null;

    const query = {};
    if (userId) {
      query.userId = userId;
    } else if (guestSessionId) {
      query.guestSessionId = guestSessionId;
    }

    if (status) {
      query.status = status;
    }

    const total = await ClientBrief.countDocuments(query);
    const briefs = await ClientBrief.find(query)
      .sort({ updatedAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .select('projectName status formAnswers createdAt updatedAt approvedAt');

    return res.status(200).json({
      success: true,
      data: {
        briefs,
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (err) {
    console.error('List briefs error:', err);
    return res.status(500).json({ success: false, error: 'Failed to list project briefs.' });
  }
};
