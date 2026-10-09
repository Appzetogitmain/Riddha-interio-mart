const Seller = require('../models/Seller');
const User = require('../models/User');
const B2BLead = require('../models/B2BLead');
const Order = require('../models/Order');
const Product = require('../models/Product');
const SystemSettings = require('../models/SystemSettings');
const { generateSellerFullAgreementPDF } = require('../utils/documentPdfGenerator');
const PDFDocument = require('pdfkit');

// Helper to sanitize search regex
const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

// Normalize seller to unified directory schema
const mapSeller = (s) => {
  const docs = [];
  if (s.gstDoc || s.gstCertificateUrl) docs.push({ name: 'GST Certificate', url: s.gstDoc || s.gstCertificateUrl, type: 'gst' });
  if (s.panDoc || s.panCardUrl) docs.push({ name: 'PAN Card', url: s.panDoc || s.panCardUrl, type: 'pan' });
  if (s.shopDoc || s.shopLicenseUrl) docs.push({ name: 'Shop / Establishment / Udyam License', url: s.shopDoc || s.shopLicenseUrl, type: 'shop' });
  if (s.digitalSignatureUrl) docs.push({ name: 'Digital E-Signature', url: s.digitalSignatureUrl, type: 'signature' });
  if (s.signatureImage) docs.push({ name: 'Signature Stamp', url: s.signatureImage, type: 'signature' });
  if (s.sopSignature) docs.push({ name: 'SOP Agreement Signature', url: s.sopSignature, type: 'sop_signature' });

  return {
    _id: s._id,
    id: s._id,
    entityType: 'seller',
    fullName: s.fullName || 'Unnamed Seller',
    companyName: s.shopName || s.onboarding?.legalEntityName || 'Unnamed Shop',
    email: s.email || '',
    phone: s.phone || '',
    city: s.location?.city || s.city || (s.shopAddress ? s.shopAddress.split(',').pop().trim() : 'N/A'),
    address: s.shopAddress || s.location?.address || 'Online Only',
    status: s.status === 'approved' ? 'Active' : s.status === 'suspended' ? 'Suspended' : 'Pending',
    verificationStatus: s.verificationStatus || (s.isVerified ? 'verified' : 'unverified'),
    createdAt: s.createdAt,
    avatar: s.avatar || s.logo || '',
    onboarding: s.onboarding || {},
    bankDetails: s.bankDetails || {},
    deliveryCapabilities: s.deliveryCapabilities || {},
    hsnNumber: s.hsnNumber || '',
    location: s.location || {},
    region: s.region || 'pan_india',
    sellingCategories: s.sellingCategories || [],
    businessDetails: {
      gstNumber: s.gstNumber || '',
      panNumber: s.panNumber || '',
      hsnNumber: s.hsnNumber || '',
      tradeLicenceNo: s.onboarding?.tradeLicenceNo || '',
      udyamMsmeNo: s.onboarding?.udyamMsmeNo || '',
      entityType: s.onboarding?.entityType || 'Proprietorship',
      bankDetails: s.bankDetails || {}
    },
    documents: docs,
    metrics: {
      productCount: s.productCount || 0,
      totalSales: s.totalSales || 0,
      orderCount: s.orderCount || 0
    },
    raw: s
  };
};

// Normalize professional (Designer, Architect, Contractor)
const mapProfessional = (item, entityType) => {
  const isLead = !item.userType && !item.professionalProfile;
  const docs = [];
  
  if (item.professionalProfile?.portfolio?.length) {
    item.professionalProfile.portfolio.forEach((pUrl, idx) => {
      docs.push({ name: `Portfolio Item #${idx + 1}`, url: pUrl, type: 'portfolio' });
    });
  }
  if (item.termsSignature) {
    docs.push({ name: 'Terms Signature', url: item.termsSignature, type: 'signature' });
  }

  const company = isLead ? (item.companyName || 'Independent') : (item.businessDetails?.shopName || 'Independent Studio');

  return {
    _id: item._id,
    id: item._id,
    entityType,
    fullName: item.fullName || 'Professional',
    companyName: company,
    email: item.email || '',
    phone: item.phone || '',
    city: item.city || 'N/A',
    address: isLead ? item.city : (item.businessDetails?.shopName || 'Registered Address'),
    status: isLead ? (item.status === 'Verified' ? 'Active' : item.status === 'Rejected' ? 'Suspended' : 'Pending') : 'Active',
    verificationStatus: isLead ? (item.status === 'Verified' ? 'verified' : 'unverified') : (item.businessDetails?.isVerified ? 'verified' : 'unverified'),
    createdAt: item.createdAt,
    avatar: item.avatar || '',
    businessDetails: {
      profession: item.profession || item.professionalProfile?.category || entityType,
      gstNumber: item.businessDetails?.gstNumber || '',
      taxationCode: item.businessDetails?.taxationCode || '',
      experience: item.experience || 'Not specified',
      rating: item.professionalProfile?.rating || 5.0,
      hourlyRate: item.professionalProfile?.hourlyRate || 0,
      fixedRate: item.professionalProfile?.fixedRate || 0
    },
    documents: docs,
    metrics: {
      rating: item.professionalProfile?.rating || 5.0,
      projectsCount: docs.length
    },
    raw: item
  };
};

// Normalize Customer
const mapCustomer = (u) => {
  return {
    _id: u._id,
    id: u._id,
    entityType: u.userType === 'enterpriser' ? 'enterpriser' : 'customer',
    fullName: u.fullName || 'Customer',
    companyName: u.businessDetails?.shopName || (u.userType === 'enterpriser' ? 'Enterpriser Client' : 'Individual Retail Client'),
    email: u.email || '',
    phone: u.phone || '',
    city: u.businessDetails?.taxationCode || 'N/A',
    address: u.businessDetails?.shopName || 'Residential Client',
    status: u.isBlocked ? 'Suspended' : 'Active',
    verificationStatus: u.isEmailVerified ? 'verified' : 'unverified',
    createdAt: u.createdAt,
    avatar: u.avatar || '',
    businessDetails: {
      userType: u.userType || 'customer',
      gstNumber: u.businessDetails?.gstNumber || '',
      subscription: u.b2cSubscription?.planName || (u.subscription?.planName ? `AI ${u.subscription.planName}` : 'Standard (Free)'),
      isSubscribed: Boolean(u.b2cSubscription?.status === 'active' || u.subscription?.status === 'active')
    },
    documents: u.termsSignature ? [{ name: 'Accepted Terms Signature', url: u.termsSignature, type: 'signature' }] : [],
    metrics: {
      totalOrders: u.totalOrders || 0,
      referralCount: u.referralCount || 0
    },
    raw: u
  };
};

// @desc    Get Unified Partners & User Directory with Tabs and Badges
// @route   GET /api/auth/admin/directory
// @access  Private/Admin
exports.getDirectory = async (req, res, next) => {
  try {
    const { tab = 'sellers', search = '', status = 'all', page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Real-time Badge Counts across all tabs
    const [sellerCount, designerCount, architectCount, contractorCount, customerCount] = await Promise.all([
      Seller.countDocuments(),
      Promise.all([
        User.countDocuments({ 'professionalProfile.category': 'Designer' }),
        B2BLead.countDocuments({ profession: { $in: ['Designer', 'Interior Designer'] } })
      ]).then(([u, b]) => Math.max(u, b)),
      Promise.all([
        User.countDocuments({ 'professionalProfile.category': 'Architect' }),
        B2BLead.countDocuments({ profession: { $in: ['Architect', 'Builder'] } })
      ]).then(([u, b]) => Math.max(u, b)),
      Promise.all([
        User.countDocuments({ 'professionalProfile.category': 'Contractor' }),
        B2BLead.countDocuments({ profession: 'Contractor' })
      ]).then(([u, b]) => Math.max(u, b)),
      User.countDocuments({ role: 'user' })
    ]);

    const counts = {
      sellers: sellerCount,
      designers: designerCount,
      architects: architectCount,
      contractors: contractorCount,
      customers: customerCount
    };

    let items = [];
    let totalResults = 0;

    const searchRegex = search.trim() ? new RegExp(escapeRegex(search.trim()), 'i') : null;

    if (tab === 'sellers') {
      const match = {};
      if (status === 'active') match.status = { $in: ['approved', 'Active'] };
      else if (status === 'pending') match.status = 'pending';
      else if (status === 'suspended') match.status = 'suspended';

      if (searchRegex) {
        match.$or = [
          { fullName: searchRegex },
          { shopName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { gstNumber: searchRegex }
        ];
      }

      totalResults = await Seller.countDocuments(match);
      const sellers = await Seller.find(match)
        .populate('sellingCategories', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      // Enrich product and order counts
      const sellerIds = sellers.map(s => s._id);
      const [productStats, orderStats] = await Promise.all([
        Product.aggregate([
          { $match: { seller: { $in: sellerIds } } },
          { $group: { _id: '$seller', count: { $sum: 1 } } }
        ]),
        Order.aggregate([
          { $match: { 'items.seller': { $in: sellerIds } } },
          { $group: { _id: '$items.seller', count: { $sum: 1 }, totalSales: { $sum: '$totalAmount' } } }
        ])
      ]);

      const productMap = Object.fromEntries(productStats.map(p => [String(p._id), p.count]));
      const orderCountMap = Object.fromEntries(orderStats.map(o => [String(o._id), o.count]));
      const salesMap = Object.fromEntries(orderStats.map(o => [String(o._id), o.totalSales]));

      items = sellers.map(s => {
        s.productCount = productMap[String(s._id)] || 0;
        s.orderCount = orderCountMap[String(s._id)] || 0;
        s.totalSales = salesMap[String(s._id)] || 0;
        return mapSeller(s);
      });
    } else if (tab === 'designers' || tab === 'architects' || tab === 'contractors') {
      const professionMap = {
        designers: { userCat: 'Designer', leadProf: ['Designer', 'Interior Designer'] },
        architects: { userCat: 'Architect', leadProf: ['Architect', 'Builder'] },
        contractors: { userCat: 'Contractor', leadProf: ['Contractor'] }
      };

      const { userCat, leadProf } = professionMap[tab];

      const userMatch = { 'professionalProfile.category': userCat };
      const leadMatch = { profession: { $in: leadProf } };

      if (searchRegex) {
        userMatch.$or = [{ fullName: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
        leadMatch.$or = [{ fullName: searchRegex }, { companyName: searchRegex }, { email: searchRegex }, { phone: searchRegex }, { city: searchRegex }];
      }

      const [users, leads] = await Promise.all([
        User.find(userMatch).sort({ createdAt: -1 }).lean(),
        B2BLead.find(leadMatch).sort({ createdAt: -1 }).lean()
      ]);

      // Merge and deduplicate by email
      const seenEmails = new Set();
      const combined = [];

      for (const u of users) {
        if (u.email && !seenEmails.has(u.email.toLowerCase())) {
          seenEmails.add(u.email.toLowerCase());
          combined.push(mapProfessional(u, tab.slice(0, -1)));
        }
      }

      for (const l of leads) {
        if (l.email && !seenEmails.has(l.email.toLowerCase())) {
          seenEmails.add(l.email.toLowerCase());
          combined.push(mapProfessional(l, tab.slice(0, -1)));
        }
      }

      totalResults = combined.length;
      items = combined.slice(skip, skip + limitNum);
    } else if (tab === 'customers') {
      const match = { role: 'user' };
      if (status === 'active') match.isBlocked = false;
      else if (status === 'suspended') match.isBlocked = true;

      if (searchRegex) {
        match.$or = [
          { fullName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { 'businessDetails.shopName': searchRegex }
        ];
      }

      totalResults = await User.countDocuments(match);
      const usersAgg = await User.aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'user',
            as: 'orders'
          }
        },
        {
          $addFields: {
            totalOrders: { $size: '$orders' }
          }
        },
        { $project: { orders: 0, password: 0 } }
      ]);

      items = usersAgg.map(mapCustomer);
    }

    res.status(200).json({
      success: true,
      counts,
      data: items,
      page: pageNum,
      limit: limitNum,
      totalResults,
      totalPages: Math.ceil(totalResults / limitNum) || 1
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export Directory List to CSV format
// @route   GET /api/auth/admin/directory/export
// @access  Private/Admin
exports.exportDirectoryCSV = async (req, res, next) => {
  try {
    const { tab = 'sellers' } = req.query;

    let rows = [];
    const sanitize = (val) => `"${String(val || '').replace(/"/g, '""')}"`;

    if (tab === 'sellers') {
      const sellers = await Seller.find().sort({ createdAt: -1 }).lean();
      rows.push(['ID', 'Seller Name', 'Shop Name', 'Email', 'Phone', 'City', 'Status', 'GST Number', 'PAN Number', 'Registration Date']);
      sellers.forEach(s => {
        rows.push([
          s._id,
          s.fullName,
          s.shopName,
          s.email,
          s.phone,
          s.location?.city || s.city || 'N/A',
          s.status,
          s.gstNumber,
          s.panNumber,
          new Date(s.createdAt).toISOString().split('T')[0]
        ]);
      });
    } else if (tab === 'designers' || tab === 'architects' || tab === 'contractors') {
      const professionMap = {
        designers: ['Designer', 'Interior Designer'],
        architects: ['Architect', 'Builder'],
        contractors: ['Contractor']
      };
      const leads = await B2BLead.find({ profession: { $in: professionMap[tab] } }).sort({ createdAt: -1 }).lean();
      rows.push(['ID', 'Full Name', 'Company Name', 'Profession', 'Email', 'Phone', 'City', 'Status', 'Registration Date']);
      leads.forEach(l => {
        rows.push([
          l._id,
          l.fullName,
          l.companyName,
          l.profession,
          l.email,
          l.phone,
          l.city,
          l.status,
          new Date(l.createdAt).toISOString().split('T')[0]
        ]);
      });
    } else {
      const users = await User.find({ role: 'user' }).sort({ createdAt: -1 }).lean();
      rows.push(['ID', 'Name', 'User Type', 'Email', 'Phone', 'Status', 'Verified', 'Subscription', 'Registration Date']);
      users.forEach(u => {
        rows.push([
          u._id,
          u.fullName,
          u.userType || 'customer',
          u.email,
          u.phone,
          u.isBlocked ? 'Blocked' : 'Active',
          u.isEmailVerified ? 'Yes' : 'No',
          u.b2cSubscription?.planName || 'Free',
          new Date(u.createdAt).toISOString().split('T')[0]
        ]);
      });
    }

    const csvContent = rows.map(r => r.map(sanitize).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${tab}_registry_export_${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

// @desc    Download Dossier PDF for individual partner/user
// @route   GET /api/auth/admin/directory/:entityType/:id/pdf
// @access  Private/Admin
exports.downloadDossierPDF = async (req, res, next) => {
  try {
    const { entityType, id } = req.params;

    if (entityType === 'seller') {
      const seller = await Seller.findById(id);
      if (!seller) return res.status(404).json({ success: false, error: 'Seller record not found' });

      const settings = await SystemSettings.findOne();
      const docSettings = settings?.documentTemplateSettings;
      const pdfBuffer = await generateSellerFullAgreementPDF(seller, docSettings);

      const safeFilename = (seller.shopName || seller.fullName || 'Seller').replace(/[^a-zA-Z0-9_-]/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Seller_KYC_Dossier_${safeFilename}.pdf"`);
      return res.send(pdfBuffer);
    }

    // For Designer / Architect / Contractor / Customer Dossier
    let person = await User.findById(id).lean();
    if (!person) {
      person = await B2BLead.findById(id).lean();
    }
    if (!person) {
      return res.status(404).json({ success: false, error: 'Partner profile not found' });
    }

    const doc = new PDFDocument({ margin: 45, size: 'A4' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const result = Buffer.concat(chunks);
      const safeName = (person.fullName || person.companyName || entityType).replace(/[^a-zA-Z0-9_-]/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${entityType.toUpperCase()}_Dossier_${safeName}.pdf"`);
      res.send(result);
    });

    // Render Dossier Header
    doc.rect(45, 45, 505, 65).fillColor('#1B3C74').fill();
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#FFFFFF').text('RIDDHA INTERIO MART', 60, 60);
    doc.fontSize(10).font('Helvetica').fillColor('#E2E8F0').text(`OFFICIAL PARTNER VERIFICATION DOSSIER • ${entityType.toUpperCase()}`, 60, 82);

    // Profile Summary Card
    doc.fillColor('#000000');
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#1E293B').text('1. Personal & Professional Profile', 45, 130);
    doc.rect(45, 148, 505, 110).strokeColor('#CBD5E1').lineWidth(0.8).stroke();

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B').text('FULL NAME:', 60, 160);
    doc.font('Helvetica-Bold').fillColor('#0F172A').text(person.fullName || 'N/A', 150, 160);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B').text('COMPANY / FIRM:', 60, 180);
    doc.font('Helvetica').fillColor('#0F172A').text(person.companyName || person.businessDetails?.shopName || 'Independent', 150, 180);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B').text('EMAIL ADDRESS:', 60, 200);
    doc.font('Helvetica').fillColor('#0F172A').text(person.email || 'N/A', 150, 200);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B').text('PHONE NUMBER:', 60, 220);
    doc.font('Helvetica').fillColor('#0F172A').text(person.phone || 'N/A', 150, 220);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B').text('CITY / LOCATION:', 60, 240);
    doc.font('Helvetica').fillColor('#0F172A').text(person.city || 'Pan-India', 150, 240);

    // Registration & Compliance Status
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#1E293B').text('2. Verification & KYC Status', 45, 280);
    doc.rect(45, 298, 505, 90).strokeColor('#CBD5E1').lineWidth(0.8).stroke();

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B').text('REGISTRATION DATE:', 60, 312);
    doc.font('Helvetica').fillColor('#0F172A').text(new Date(person.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }), 190, 312);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B').text('STATUS ON PLATFORM:', 60, 332);
    doc.font('Helvetica-Bold').fillColor(person.status === 'Verified' || person.status === 'Active' ? '#16A34A' : '#D97706').text(person.status || 'Active', 190, 332);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B').text('GSTIN / TAX CODE:', 60, 352);
    doc.font('Helvetica').fillColor('#0F172A').text(person.businessDetails?.gstNumber || 'Unregistered / Exempt', 190, 352);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B').text('DOCUMENTS ATTACHED:', 60, 372);
    doc.font('Helvetica').fillColor('#0F172A').text('Aadhaar / Business Identity Declared', 190, 372);

    // Verification Seal Footer
    doc.rect(45, 420, 505, 120).fillColor('#F8FAFC').fill();
    doc.rect(45, 420, 505, 120).strokeColor('#E2E8F0').lineWidth(0.8).stroke();
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1B3C74').text('Official Platform Verification Seal', 60, 435);
    doc.fontSize(9).font('Helvetica').fillColor('#475569').text('This document confirms that the above individual or business entity is registered on the Riddha Interio Mart system. Credentials, contact points, and verified trade details are archived in accordance with platform partner compliance standards.', 60, 455, { width: 470, align: 'justify' });

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748B').text(`GENERATED AT: ${new Date().toLocaleString('en-IN')}`, 60, 515);
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#16A34A').text('STATUS: DIGITALLY RECORDED & VERIFIED BY ADMIN', 300, 515);

    doc.end();
  } catch (err) {
    next(err);
  }
};
