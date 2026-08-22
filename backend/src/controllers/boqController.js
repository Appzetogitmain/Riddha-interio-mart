const BOQ = require('../models/BOQ');
const ClientBrief = require('../models/ClientBrief');
const boqService = require('../services/boqService');
const { generateBOQPDF, generateBOQCSV } = require('../utils/boqPdfGenerator');
const emailService = require('../services/emailService');

// Helper to recalculate summary fields & category cost maps
const calculateBOQSummary = (items = []) => {
  let totalEstimatedCost = 0;
  let totalQuantity = 0;
  const costByCategory = {};

  items.forEach(item => {
    const itemTotal = item.totalCost || (item.quantity * item.unitCost) || 0;
    item.totalCost = itemTotal;
    totalEstimatedCost += itemTotal;
    totalQuantity += (item.quantity || 1);

    const cat = item.category || 'Furniture';
    costByCategory[cat] = (costByCategory[cat] || 0) + itemTotal;
  });

  return {
    totalItems: items.length,
    totalQuantity,
    totalEstimatedCost,
    costByCategory
  };
};

// 1. Create New BOQ (Manual)
exports.createBOQ = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { boqName = 'Bill of Quantities', description = '', projectId, briefId, items = [] } = req.body;

    const summary = calculateBOQSummary(items);
    const analysis = await boqService.analyzeMissingItems(items, 'Living Room', userId);
    summary.completenessScore = analysis.completenessScore || 85;

    const boq = await BOQ.create({
      userId,
      projectId: projectId || undefined,
      briefId: briefId || undefined,
      boqName,
      description,
      boqType: 'manual',
      items,
      summary,
      aiAnalysis: {
        missingItems: analysis.missingItems || [],
        warnings: analysis.warnings || [],
        generatedAt: new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'BOQ created successfully',
      data: boq
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get User's Saved BOQs
exports.getBOQs = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId, limit = 20, offset = 0 } = req.query;

    const query = { userId };
    if (projectId) query.projectId = projectId;

    const total = await BOQ.countDocuments(query);
    const boqs = await BOQ.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: { boqs, total, limit: Number(limit), offset: Number(offset) }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Full BOQ Details
exports.getBOQById = async (req, res, next) => {
  try {
    const { boqId } = req.params;
    const boq = await BOQ.findById(boqId);
    if (!boq) {
      return res.status(404).json({ success: false, message: 'BOQ not found' });
    }

    res.status(200).json({
      success: true,
      data: boq
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update BOQ (Header details or entire items array)
exports.updateBOQ = async (req, res, next) => {
  try {
    const { boqId } = req.params;
    const boq = await BOQ.findById(boqId);
    if (!boq) {
      return res.status(404).json({ success: false, message: 'BOQ not found' });
    }

    if (req.body.boqName !== undefined) boq.boqName = req.body.boqName;
    if (req.body.description !== undefined) boq.description = req.body.description;
    if (req.body.status !== undefined) boq.status = req.body.status;
    if (req.body.clientEmail !== undefined) boq.clientEmail = req.body.clientEmail;

    if (Array.isArray(req.body.items)) {
      boq.items = req.body.items;
      const summary = calculateBOQSummary(boq.items);
      const analysis = await boqService.analyzeMissingItems(boq.items, 'Living Room', req.user._id);
      summary.completenessScore = analysis.completenessScore || 85;
      boq.summary = summary;
      boq.aiAnalysis.missingItems = analysis.missingItems || [];
      boq.aiAnalysis.warnings = analysis.warnings || [];
    }

    await boq.save();

    res.status(200).json({
      success: true,
      data: boq
    });
  } catch (error) {
    next(error);
  }
};

// 5. Add Single Item to BOQ
exports.addItemToBOQ = async (req, res, next) => {
  try {
    const { boqId } = req.params;
    const boq = await BOQ.findById(boqId);
    if (!boq) {
      return res.status(404).json({ success: false, message: 'BOQ not found' });
    }

    const { itemName, category = 'Furniture', description = '', quantity = 1, unit = 'Pieces', unitCost = 0, supplier, deliveryTimeline, notes, priority } = req.body;
    const totalCost = (Number(quantity) || 1) * (Number(unitCost) || 0);

    const newItem = {
      itemName,
      category,
      description,
      quantity: Number(quantity) || 1,
      unit: unit || 'Pieces',
      unitCost: Number(unitCost) || 0,
      totalCost,
      supplier: supplier || 'Riddha Preferred Vendor',
      deliveryTimeline: deliveryTimeline || '1-2 weeks',
      notes: notes || '',
      priority: priority || 'essential'
    };

    const syncedItems = await boqService.syncItemsWithProductCatalog([newItem]);
    boq.items.push(syncedItems[0]);
    const summary = calculateBOQSummary(boq.items);
    boq.summary = summary;
    await boq.save();

    res.status(201).json({
      success: true,
      data: boq
    });
  } catch (error) {
    next(error);
  }
};

// 6. Update BOQ Item
exports.updateBOQItem = async (req, res, next) => {
  try {
    const { boqId, itemId } = req.params;
    const boq = await BOQ.findById(boqId);
    if (!boq) {
      return res.status(404).json({ success: false, message: 'BOQ not found' });
    }

    const item = boq.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'BOQ item not found' });
    }

    const fields = ['itemName', 'category', 'description', 'quantity', 'unit', 'unitCost', 'supplier', 'deliveryTimeline', 'notes', 'priority'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) item[f] = req.body[f];
    });
    item.totalCost = (Number(item.quantity) || 1) * (Number(item.unitCost) || 0);

    const summary = calculateBOQSummary(boq.items);
    boq.summary = summary;
    await boq.save();

    res.status(200).json({
      success: true,
      data: boq
    });
  } catch (error) {
    next(error);
  }
};

// 7. Delete BOQ Item
exports.deleteBOQItem = async (req, res, next) => {
  try {
    const { boqId, itemId } = req.params;
    const boq = await BOQ.findById(boqId);
    if (!boq) {
      return res.status(404).json({ success: false, message: 'BOQ not found' });
    }

    boq.items.pull(itemId);
    const summary = calculateBOQSummary(boq.items);
    boq.summary = summary;
    await boq.save();

    res.status(200).json({
      success: true,
      data: boq
    });
  } catch (error) {
    next(error);
  }
};

// Rasterizes page 1 of an uploaded PDF into a PNG buffer so it can flow through
// the same OpenAI vision pipeline used for JPG/PNG/WEBP drawing uploads.
async function rasterizePdfFirstPage(buffer) {
  const { pdf } = await import('pdf-to-img');
  const document = await pdf(buffer, { scale: 2.0 });
  try {
    return await document.getPage(1);
  } finally {
    await document.destroy();
  }
}

// 8. AI Vision Drawing Upload & Extraction
exports.extractFromDrawing = async (req, res, next) => {
  try {
    const userId = req.user._id;
    let base64Image = null;
    let mimeType = 'image/jpeg';

    if (req.file) {
      if (req.file.mimetype === 'application/pdf') {
        try {
          const pageBuffer = await rasterizePdfFirstPage(req.file.buffer);
          base64Image = pageBuffer.toString('base64');
          mimeType = 'image/png';
        } catch (pdfErr) {
          console.error('[BOQ Drawing PDF Conversion Error]', pdfErr.message);
          return res.status(400).json({ success: false, message: 'Could not read that PDF. Please make sure it is not corrupted or password-protected, or upload an image instead.' });
        }
      } else {
        base64Image = req.file.buffer.toString('base64');
        mimeType = req.file.mimetype;
      }
    }

    const extractedItems = await boqService.extractItemsFromDrawing(base64Image, mimeType, userId);
    const summary = calculateBOQSummary(extractedItems);
    const analysis = await boqService.analyzeMissingItems(extractedItems, 'Living Room', userId);
    summary.completenessScore = analysis.completenessScore || 85;

    const boq = await BOQ.create({
      userId,
      boqName: `Drawing Sketch BOQ (${new Date().toLocaleDateString()})`,
      description: 'Auto-extracted from uploaded interior drawing sketch image.',
      boqType: 'from-drawing',
      items: extractedItems,
      summary,
      sourceData: {
        extractionNotes: 'AI extracted items from drawing sketch via AI Vision'
      },
      aiAnalysis: {
        missingItems: analysis.missingItems || [],
        warnings: analysis.warnings || [],
        generatedAt: new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Items extracted from drawing image successfully',
      data: boq
    });
  } catch (error) {
    next(error);
  }
};

// 9. Auto-Generate BOQ from Client Brief
exports.generateFromBrief = async (req, res, next) => {
  try {
    const { briefId } = req.params;
    const userId = req.user._id;

    const brief = await ClientBrief.findById(briefId);
    if (!brief) {
      return res.status(404).json({ success: false, message: 'Client Brief not found' });
    }

    const briefData = {
      roomType: brief.roomType || 'Living Room',
      area: brief.roomDimensions?.totalArea || 400,
      designStyle: brief.designStyle || 'Modern',
      scope: brief.functionalScope || []
    };

    const generatedItems = await boqService.generateBOQFromBrief(briefData, userId);
    const summary = calculateBOQSummary(generatedItems);
    const analysis = await boqService.analyzeMissingItems(generatedItems, briefData.roomType, userId);
    summary.completenessScore = analysis.completenessScore || 90;

    const boq = await BOQ.create({
      userId,
      briefId: brief._id,
      projectId: brief.projectId || undefined,
      boqName: `${briefData.roomType} BOQ (From Brief)`,
      description: `Auto-generated Bill of Quantities from ${briefData.roomType} Client Brief.`,
      boqType: 'from-brief',
      items: generatedItems,
      summary,
      aiAnalysis: {
        missingItems: analysis.missingItems || [],
        warnings: analysis.warnings || [],
        generatedAt: new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'BOQ generated from Client Brief successfully',
      data: boq
    });
  } catch (error) {
    next(error);
  }
};

// 10. Export BOQ PDF
exports.exportBOQPDF = async (req, res, next) => {
  try {
    const { boqId } = req.params;
    const boq = await BOQ.findById(boqId);
    if (!boq) {
      return res.status(404).json({ success: false, message: 'BOQ not found' });
    }

    const pdfBuffer = await generateBOQPDF(boq);
    const filename = `${(boq.boqName || 'BOQ').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// 11. Export BOQ CSV
exports.exportBOQCSV = async (req, res, next) => {
  try {
    const { boqId } = req.params;
    const boq = await BOQ.findById(boqId);
    if (!boq) {
      return res.status(404).json({ success: false, message: 'BOQ not found' });
    }

    const csvContent = generateBOQCSV(boq);
    const filename = `${(boq.boqName || 'BOQ').replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

// 12. Email BOQ Report to Client or Supplier
exports.emailBOQ = async (req, res, next) => {
  try {
    const { boqId } = req.params;
    const { emails } = req.body;

    const boq = await BOQ.findById(boqId);
    if (!boq) {
      return res.status(404).json({ success: false, message: 'BOQ not found' });
    }

    const recipient = Array.isArray(emails) ? emails[0] : (emails || boq.clientEmail);
    if (!recipient) {
      return res.status(400).json({ success: false, message: 'Recipient email address is required' });
    }

    const pdfBuffer = await generateBOQPDF(boq);
    const filename = `${(boq.boqName || 'BOQ').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    const subject = `Riddha Interio Mart - Bill of Quantities: ${boq.boqName}`;
    const htmlContent = `<div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
      <h2 style="color: #3d2b1f;">Riddha Interio Mart - Bill of Quantities (BOQ)</h2>
      <p>Please find attached the official Bill of Quantities (BOQ) report for <strong>${boq.boqName}</strong>.</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p style="margin: 0; font-weight: bold; color: #059669;">Total Items: ${boq.items?.length || 0}</p>
        <p style="margin: 5px 0 0 0; font-weight: bold; color: #059669;">Est. Total Cost: Rs. ${(boq.summary?.totalEstimatedCost || 0).toLocaleString()}</p>
      </div>
      <p>The complete itemized specifications and vendor delivery schedules are attached as a PDF document.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
      <p style="font-size: 12px; color: #777;">Riddha Interior Mart Pvt. Ltd. • Support: support@riddhamart.com</p>
    </div>`;

    const attachments = [{ filename, content: pdfBuffer, contentType: 'application/pdf' }];

    if (emailService.sendMailDirect) {
      await emailService.sendMailDirect(recipient, subject, htmlContent, attachments);
    } else {
      await emailService.sendEmail({ to: recipient, subject, text: `BOQ: ${boq.boqName}`, html: htmlContent, attachments });
    }

    boq.status = 'sent';
    boq.sentAt = new Date();
    boq.clientEmail = recipient;
    await boq.save();

    res.status(200).json({
      success: true,
      message: `BOQ report emailed successfully to ${recipient}`,
      data: { sent: true, recipient }
    });
  } catch (error) {
    next(error);
  }
};

// 13. Enhance Item Description via Gemini AI
exports.enhanceItemDescription = async (req, res, next) => {
  try {
    const { boqId, itemId } = req.params;
    const boq = await BOQ.findById(boqId);
    if (!boq) {
      return res.status(404).json({ success: false, message: 'BOQ not found' });
    }

    const item = boq.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'BOQ item not found' });
    }

    const enhancedDesc = await boqService.enhanceItemDescription(item.itemName, item.category, req.user._id);
    item.description = enhancedDesc;
    await boq.save();

    res.status(200).json({
      success: true,
      data: { itemId, enhancedDescription: enhancedDesc }
    });
  } catch (error) {
    next(error);
  }
};

// 14. Delete BOQ
exports.deleteBOQ = async (req, res, next) => {
  try {
    const { boqId } = req.params;
    await BOQ.findByIdAndDelete(boqId);
    res.status(200).json({ success: true, message: 'BOQ deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 15. Request Sourcing for Unlisted BOQ Item
exports.requestItemSourcing = async (req, res, next) => {
  try {
    const { boqId, itemId } = req.params;
    const { notes } = req.body;

    const boq = await BOQ.findById(boqId);
    if (!boq) {
      return res.status(404).json({ success: false, message: 'BOQ not found' });
    }

    const item = boq.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'BOQ item not found' });
    }

    item.isSourcingRequested = true;
    item.sourcingStatus = 'pending';
    item.sourcingRequestedAt = new Date();
    if (notes) item.sourcingNotes = notes;

    await boq.save();

    res.status(200).json({
      success: true,
      message: `Sourcing request submitted for "${item.itemName}"`,
      data: boq
    });
  } catch (error) {
    next(error);
  }
};

// 16. Request Sourcing for ALL Unlisted BOQ Items
exports.requestAllUnlistedSourcing = async (req, res, next) => {
  try {
    const { boqId } = req.params;
    const boq = await BOQ.findById(boqId);
    if (!boq) {
      return res.status(404).json({ success: false, message: 'BOQ not found' });
    }

    let requestedCount = 0;
    boq.items.forEach(item => {
      if (!item.productId || item.supplier !== 'Riddha Interio Catalog') {
        item.isSourcingRequested = true;
        item.sourcingStatus = 'pending';
        item.sourcingRequestedAt = new Date();
        requestedCount++;
      }
    });

    await boq.save();

    res.status(200).json({
      success: true,
      message: `Sourcing requested for ${requestedCount} unlisted items!`,
      data: boq
    });
  } catch (error) {
    next(error);
  }
};

// 17. Admin: Fetch All Sourcing Requests across BOQs
exports.getAdminSourcingRequests = async (req, res, next) => {
  try {
    const boqs = await BOQ.find({ 'items.isSourcingRequested': true })
      .populate('userId', 'fullName name email phone')
      .sort({ updatedAt: -1 });

    const requests = [];
    boqs.forEach(boq => {
      boq.items.forEach(item => {
        if (item.isSourcingRequested) {
          requests.push({
            boqId: boq._id,
            boqName: boq.boqName,
            client: boq.userId || { name: 'Client', email: boq.clientEmail || 'N/A' },
            item,
            sourcingStatus: item.sourcingStatus || 'pending',
            requestedAt: item.sourcingRequestedAt || boq.updatedAt
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      data: { requests, total: requests.length }
    });
  } catch (error) {
    next(error);
  }
};

// 18. Admin: Update Sourcing Request Status & Link Sourced Product
exports.updateAdminSourcingStatus = async (req, res, next) => {
  try {
    const { boqId, itemId } = req.params;
    const { sourcingStatus, unitCost, productId, notes } = req.body;

    const boq = await BOQ.findById(boqId);
    if (!boq) {
      return res.status(404).json({ success: false, message: 'BOQ not found' });
    }

    const item = boq.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'BOQ item not found' });
    }

    if (sourcingStatus) item.sourcingStatus = sourcingStatus;
    if (unitCost !== undefined && Number(unitCost) > 0) {
      item.unitCost = Number(unitCost);
      item.totalCost = (item.quantity || 1) * Number(unitCost);
    }
    if (productId) {
      item.productId = productId;
      item.supplier = 'Riddha Interio Catalog (Sourced)';
    }
    if (notes) item.sourcingNotes = notes;

    await boq.save();

    res.status(200).json({
      success: true,
      message: `Sourcing status updated to ${sourcingStatus}`,
      data: boq
    });
  } catch (error) {
    next(error);
  }
};
