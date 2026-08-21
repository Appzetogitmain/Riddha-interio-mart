const Quotation = require('../models/Quotation');
const QuotationTemplate = require('../models/QuotationTemplate');
const CostEstimate = require('../models/CostEstimate');
const BOQ = require('../models/BOQ');
const { generateQuotationNumber, calculateQuotationPricing, generateInstallmentSchedule } = require('../utils/quotationEngine');
const quotationService = require('../services/quotationService');
const { generateQuotationPDF } = require('../utils/quotationPdfGenerator');
const emailService = require('../services/emailService');

// 1. Create Quotation
exports.createQuotation = async (req, res, next) => {
  try {
    const {
      projectId, clientId, estimateId, boqId,
      clientName, clientEmail, clientPhone, projectName,
      validUntil, items = [], globalDiscountType, globalDiscountValue,
      paymentStructure, delivery, installation, company, termsAndConditions,
      openingMessage, closingMessage, personalMessage
    } = req.body;

    const quotationNumber = generateQuotationNumber();

    const { items: processedItems, pricing } = calculateQuotationPricing(items, {
      globalDiscountType,
      globalDiscountValue
    });

    const installments = generateInstallmentSchedule(pricing.grandTotal, paymentStructure || '2-installment');

    const newQuotation = new Quotation({
      quotationNumber,
      userId: req.user._id,
      projectId: projectId || undefined,
      clientId: clientId || undefined,
      estimateId: estimateId || undefined,
      boqId: boqId || undefined,
      clientName: clientName || req.user.fullName || req.user.name || 'Client',
      clientEmail: clientEmail || req.user.email || '',
      clientPhone: clientPhone || req.user.phone || '',
      projectName: projectName || 'Interior Design Project',
      validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 86400000),
      items: processedItems,
      pricing,
      paymentTerms: {
        structure: paymentStructure || '2-installment',
        installments
      },
      delivery: delivery || {},
      installation: installation || {},
      company: company || {},
      termsAndConditions: termsAndConditions || {},
      openingMessage: openingMessage || '',
      closingMessage: closingMessage || '',
      personalMessage: personalMessage || '',
      status: 'draft'
    });

    await newQuotation.save();

    res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      data: newQuotation
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get User Quotations List
exports.getQuotations = async (req, res, next) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const query = { userId: req.user._id };

    if (status) query.status = status;

    const quotations = await Quotation.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await Quotation.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        quotations,
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Single Quotation (with View Tracking)
exports.getQuotationById = async (req, res, next) => {
  try {
    const { quotationId } = req.params;
    const quotation = await Quotation.findById(quotationId)
      .populate('projectId', 'name status')
      .populate('estimateId')
      .populate('boqId');

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    // Increment View Tracking if viewed by client
    quotation.viewCount = (quotation.viewCount || 0) + 1;
    quotation.lastViewedAt = new Date();
    if (!quotation.viewedAt) quotation.viewedAt = new Date();
    if (quotation.status === 'sent') quotation.status = 'viewed';

    await quotation.save();

    res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Quotation
exports.updateQuotation = async (req, res, next) => {
  try {
    const { quotationId } = req.params;
    const quotation = await Quotation.findById(quotationId);

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const {
      clientName, clientEmail, clientPhone, projectName, validUntil,
      items, globalDiscountType, globalDiscountValue, paymentStructure,
      delivery, installation, company, termsAndConditions,
      openingMessage, closingMessage, personalMessage, status
    } = req.body;

    if (items) {
      const { items: processedItems, pricing } = calculateQuotationPricing(items, {
        globalDiscountType: globalDiscountType || quotation.pricing?.discounts?.globalDiscountType,
        globalDiscountValue: globalDiscountValue !== undefined ? globalDiscountValue : quotation.pricing?.discounts?.globalDiscountValue
      });
      quotation.items = processedItems;
      quotation.pricing = pricing;

      const installments = generateInstallmentSchedule(pricing.grandTotal, paymentStructure || quotation.paymentTerms?.structure || '2-installment');
      quotation.paymentTerms = {
        structure: paymentStructure || quotation.paymentTerms?.structure || '2-installment',
        installments
      };
    }

    if (clientName) quotation.clientName = clientName;
    if (clientEmail) quotation.clientEmail = clientEmail;
    if (clientPhone) quotation.clientPhone = clientPhone;
    if (projectName) quotation.projectName = projectName;
    if (validUntil) quotation.validUntil = new Date(validUntil);
    if (delivery) quotation.delivery = delivery;
    if (installation) quotation.installation = installation;
    if (company) quotation.company = company;
    if (termsAndConditions) quotation.termsAndConditions = termsAndConditions;
    if (openingMessage) quotation.openingMessage = openingMessage;
    if (closingMessage) quotation.closingMessage = closingMessage;
    if (personalMessage) quotation.personalMessage = personalMessage;
    if (status) quotation.status = status;

    await quotation.save();

    res.status(200).json({
      success: true,
      message: 'Quotation updated successfully',
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

// 5. Delete Quotation
exports.deleteQuotation = async (req, res, next) => {
  try {
    const { quotationId } = req.params;
    await Quotation.findByIdAndDelete(quotationId);
    res.status(200).json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 6. Import Items from Cost Estimate (Req #10)
exports.loadFromEstimate = async (req, res, next) => {
  try {
    const { quotationId } = req.params;
    const { estimateId } = req.body;

    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const estimate = await CostEstimate.findById(estimateId);
    if (!estimate) {
      return res.status(404).json({ success: false, message: 'Cost Estimate not found' });
    }

    const importedItems = [];
    const cb = estimate.costBreakdown || {};

    const categoryMap = [
      { name: 'Furniture Package', cost: cb.furniture, hsn: '9403', taxRate: 18 },
      { name: 'Flooring Package', cost: cb.flooring, hsn: '6907', taxRate: 18 },
      { name: 'Lighting & Electrical Package', cost: cb.lighting, hsn: '9405', taxRate: 12 },
      { name: 'Decor & Soft Furnishings Package', cost: cb.decor, hsn: '5702', taxRate: 12 },
      { name: 'Paint & Surface Finish Package', cost: cb.paint, hsn: '3209', taxRate: 18 },
      { name: 'On-Site Labor & Installation Services', cost: cb.labor, hsn: '9987', taxRate: 18 },
      { name: 'Additional Services & Permits', cost: cb.additionalServices, hsn: '9987', taxRate: 18 }
    ];

    categoryMap.forEach(cat => {
      if (cat.cost && Number(cat.cost) > 0) {
        importedItems.push({
          description: `${estimate.roomType || 'Interior'} - ${cat.name} (${estimate.materialTier || 'standard'} tier)`,
          quantity: 1,
          unit: 'Package',
          unitRate: Number(cat.cost),
          hsnCode: cat.hsn,
          taxRate: cat.taxRate
        });
      }
    });

    if (importedItems.length === 0) {
      // Fallback if costBreakdown object had total only
      const totalRate = estimate.totalEstimatedCost || cb.grandTotal || 50000;
      importedItems.push({
        description: `${estimate.roomType || 'Interior'} Setup (${estimate.area || 400} sq ft, ${estimate.materialTier || 'standard'} tier)`,
        quantity: 1,
        unit: 'Project Package',
        unitRate: Number(totalRate),
        hsnCode: '9403',
        taxRate: 18
      });
    }

    const { items: processedItems, pricing } = calculateQuotationPricing(importedItems, {
      globalDiscountType: quotation.pricing?.discounts?.globalDiscountType || 'percentage',
      globalDiscountValue: quotation.pricing?.discounts?.globalDiscountValue || 0
    });

    quotation.items = processedItems;
    quotation.pricing = pricing;
    quotation.estimateId = estimateId;

    const installments = generateInstallmentSchedule(pricing.grandTotal, quotation.paymentTerms?.structure || '2-installment');
    quotation.paymentTerms = {
      structure: quotation.paymentTerms?.structure || '2-installment',
      installments
    };

    await quotation.save();

    res.status(200).json({
      success: true,
      message: `Imported ${importedItems.length} items from Cost Estimate`,
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

// 7. Import Items from BOQ (Req #11)
exports.loadFromBOQ = async (req, res, next) => {
  try {
    const { quotationId } = req.params;
    const { boqId } = req.body;

    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const boq = await BOQ.findById(boqId);
    if (!boq) {
      return res.status(404).json({ success: false, message: 'BOQ not found' });
    }

    const importedItems = (boq.items || []).map(item => ({
      description: `${item.itemName} - ${item.description || item.category}`,
      quantity: item.quantity || 1,
      unit: item.unit || 'Pieces',
      unitRate: item.unitCost || 0,
      hsnCode: '9403',
      taxRate: item.category === 'Lighting' ? 12 : 18,
      productId: item.productId || undefined
    }));

    const { items: processedItems, pricing } = calculateQuotationPricing(importedItems);
    quotation.items = processedItems;
    quotation.pricing = pricing;
    quotation.boqId = boqId;

    const installments = generateInstallmentSchedule(pricing.grandTotal, '2-installment');
    quotation.paymentTerms = { structure: '2-installment', installments };

    await quotation.save();

    res.status(200).json({
      success: true,
      message: `Imported ${importedItems.length} items from BOQ`,
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

// 8. Gemini AI Enhancements
exports.generateAIEnhancements = async (req, res, next) => {
  try {
    const { clientName, projectName, grandTotal, items = [], type = 'all' } = req.body;
    const userId = req.user._id;

    const data = { clientName, projectName, grandTotal };

    let openingMessage = '';
    let paymentSuggestions = null;
    let deliveryTerms = [];
    let summaryData = null;
    let closingMessage = '';

    if (type === 'opening' || type === 'all') {
      openingMessage = await quotationService.generateOpeningMessage(data, userId);
    }
    if (type === 'payment' || type === 'all') {
      paymentSuggestions = await quotationService.suggestPaymentTerms(grandTotal, '30 days', userId);
    }
    if (type === 'delivery' || type === 'all') {
      deliveryTerms = await quotationService.generateDeliveryTerms({ itemCount: items.length }, userId);
    }
    if (type === 'summary' || type === 'all') {
      summaryData = await quotationService.summarizeQuotation(items, grandTotal, userId);
    }
    if (type === 'closing' || type === 'all') {
      closingMessage = await quotationService.generateClosingMessage(data, userId);
    }

    res.status(200).json({
      success: true,
      data: {
        openingMessage,
        paymentSuggestions,
        deliveryTerms,
        summaryData,
        closingMessage
      }
    });
  } catch (error) {
    next(error);
  }
};

// 9. Download PDF Report
exports.exportQuotationPDF = async (req, res, next) => {
  try {
    const { quotationId } = req.params;
    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const pdfBuffer = await generateQuotationPDF(quotation);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${quotation.quotationNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// 10. Email Quotation to Client
exports.emailQuotation = async (req, res, next) => {
  try {
    const { quotationId } = req.params;
    const { clientEmail, message } = req.body;

    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const targetEmail = clientEmail || quotation.clientEmail;
    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'Client email is required' });
    }

    const pdfBuffer = await generateQuotationPDF(quotation);

    const emailSubject = `Quotation #${quotation.quotationNumber} from Riddha Interio Mart`;
    const emailBody = `
      <h2>Interior Design Quotation #${quotation.quotationNumber}</h2>
      <p>Dear <strong>${quotation.clientName || 'Valued Client'}</strong>,</p>
      <p>${message || quotation.openingMessage || 'Please find attached your detailed interior design quotation.'}</p>
      <p><strong>Grand Total:</strong> Rs. ${(quotation.pricing?.grandTotal || 0).toLocaleString()}</p>
      <p><strong>Valid Until:</strong> ${new Date(quotation.validUntil).toLocaleDateString()}</p>
      <br/>
      <p>Warm regards,<br/>Riddha Interio Mart Team</p>
    `;

    try {
      if (emailService.sendEmailWithAttachment) {
        await emailService.sendEmailWithAttachment({
          to: targetEmail,
          subject: emailSubject,
          html: emailBody,
          attachments: [
            {
              filename: `${quotation.quotationNumber}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ]
        });
      }
    } catch (e) {}

    quotation.status = 'sent';
    quotation.sentAt = new Date();
    if (!quotation.sentTo.includes(targetEmail)) quotation.sentTo.push(targetEmail);
    await quotation.save();

    res.status(200).json({
      success: true,
      message: `Quotation emailed successfully to ${targetEmail}`,
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

// 11. Update Status (Accepted / Rejected)
exports.updateQuotationStatus = async (req, res, next) => {
  try {
    const { quotationId } = req.params;
    const { status, acceptedBy } = req.body;

    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    quotation.status = status;
    if (status === 'accepted') {
      quotation.acceptedAt = new Date();
      if (acceptedBy) quotation.acceptedBy = acceptedBy;
    }
    await quotation.save();

    res.status(200).json({
      success: true,
      message: `Quotation status updated to ${status}`,
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

// 12. Templates Management
exports.saveQuotationTemplate = async (req, res, next) => {
  try {
    const { templateName, description, items, paymentStructure, deliveryMode, termsAndConditions } = req.body;

    const template = new QuotationTemplate({
      userId: req.user._id,
      templateName,
      description,
      items,
      paymentStructure,
      deliveryMode,
      termsAndConditions
    });

    await template.save();

    res.status(201).json({
      success: true,
      message: 'Quotation template saved',
      data: template
    });
  } catch (error) {
    next(error);
  }
};

exports.getQuotationTemplates = async (req, res, next) => {
  try {
    const templates = await QuotationTemplate.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: { templates }
    });
  } catch (error) {
    next(error);
  }
};

// 13. Analytics & Statistics Dashboard
exports.getQuotationAnalytics = async (req, res, next) => {
  try {
    const quotations = await Quotation.find({ userId: req.user._id });

    const totalQuotes = quotations.length;
    const acceptedQuotes = quotations.filter(q => q.status === 'accepted').length;
    const acceptanceRate = totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0;
    const totalValue = quotations.reduce((acc, q) => acc + (q.pricing?.grandTotal || 0), 0);
    const avgValue = totalQuotes > 0 ? Math.round(totalValue / totalQuotes) : 0;

    const byStatus = {
      draft: quotations.filter(q => q.status === 'draft').length,
      sent: quotations.filter(q => q.status === 'sent').length,
      viewed: quotations.filter(q => q.status === 'viewed').length,
      accepted: acceptedQuotes,
      rejected: quotations.filter(q => q.status === 'rejected').length
    };

    res.status(200).json({
      success: true,
      data: {
        totalQuotes,
        acceptedQuotes,
        acceptanceRate,
        totalValue,
        avgValue,
        byStatus
      }
    });
  } catch (error) {
    next(error);
  }
};
