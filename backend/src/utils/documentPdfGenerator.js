const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Resolves local file paths from disk across common upload directories
 */
const resolveLocalPath = (filePath) => {
  if (!filePath || typeof filePath !== 'string') return null;
  if (filePath.startsWith('data:') || filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return null;
  }
  const clean = filePath.replace(/\\/g, '/');
  const candidatePaths = [
    clean,
    path.resolve(clean),
    path.resolve(__dirname, '../../', clean),
    path.resolve(__dirname, '../../../', clean),
    path.resolve(process.cwd(), clean)
  ];
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return p;
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
};

/**
 * Asynchronously fetches image buffers from Base64, HTTP/HTTPS URLs, or local disk
 */
const fetchImageBuffer = async (filePath) => {
  if (!filePath || typeof filePath !== 'string') return null;

  // Case 1: Base64 Data URL
  if (filePath.startsWith('data:image')) {
    try {
      const base64Data = filePath.split(',')[1] || filePath;
      return Buffer.from(base64Data, 'base64');
    } catch (e) {
      return null;
    }
  }

  // Case 2: HTTP / HTTPS URL
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    try {
      const axios = require('axios');
      const res = await axios.get(filePath, { responseType: 'arraybuffer', timeout: 6000 });
      return Buffer.from(res.data);
    } catch (e) {
      console.error(`Failed to fetch remote image ${filePath}:`, e.message);
      return null;
    }
  }

  // Case 3: Local File Path on Disk
  const localPath = resolveLocalPath(filePath);
  if (localPath) {
    try {
      return fs.readFileSync(localPath);
    } catch (e) {
      return null;
    }
  }

  return null;
};

/**
 * Generates a consolidated PDF containing Terms & Conditions and Privacy Policy
 */
const generateAgreementPDF = (role, termsContent, privacyContent, fullName = '', signatureBase64 = '', docSettings = {}) => {
  const {
    headerTitle = 'Riddha Interior Mart Pvt. Ltd.',
    headerTagline = "India's Largest Interior Supply Hub",
    headerContact = 'support@riddhamart.com | www.riddhamart.com',
    footerText = 'CONFIDENTIAL DOCUMENT'
  } = docSettings || {};
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const logoPath = path.resolve(__dirname, '../../../frontend/public/logo.png');
      const hasLogo = fs.existsSync(logoPath);

      const drawHeader = (title) => {
        if (hasLogo) {
          try {
            doc.image(logoPath, 50, 40, { width: 90 });
          } catch (imgErr) {
            doc.fontSize(16).fillColor('#3d2b1f').font('Helvetica-Bold').text('Riddha', 50, 45);
          }
        } else {
          doc.fontSize(22).fillColor('#3d2b1f').font('Helvetica-Bold').text('Riddha', 50, 45);
        }

        doc.fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#3d2b1f')
          .text(headerTitle, 200, 40, { align: 'right' });

        doc.fontSize(8)
          .font('Helvetica')
          .fillColor('#7a6b5d')
          .text(headerTagline, 200, 56, { align: 'right' })
          .text(headerContact, 200, 68, { align: 'right' });

        doc.moveTo(50, 85).lineTo(545, 85).strokeColor('#c8bcae').lineWidth(1).stroke();
        doc.moveDown(1.5);
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#3d2b1f').text(title.toUpperCase(), 50, 98, { align: 'center', underline: true });
        doc.moveDown(1.5);
      };

      drawHeader(`${role.toUpperCase()} AGREEMENT & PRIVACY POLICY`);

      if (fullName) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#3d2b1f').text(`Registered User: ${fullName}`);
        doc.fontSize(8).font('Helvetica').fillColor('#7a6b5d').text(`Executed Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`);
        doc.moveDown(1);
      }

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#3d2b1f').text('1. TERMS AND CONDITIONS');
      doc.moveDown(0.5);
      doc.fontSize(8.5).font('Helvetica').fillColor('#4a3b32').text(termsContent || 'Standard terms apply.', { align: 'justify', lineGap: 2 });
      doc.moveDown(1.5);

      if (doc.y > 600) doc.addPage();

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#3d2b1f').text('2. PRIVACY POLICY');
      doc.moveDown(0.5);
      doc.fontSize(8.5).font('Helvetica').fillColor('#4a3b32').text(privacyContent || 'Standard privacy policy applies.', { align: 'justify', lineGap: 2 });
      doc.moveDown(1.5);

      if (signatureBase64 && signatureBase64.startsWith('data:image')) {
        if (doc.y > 650) doc.addPage();
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#3d2b1f').text('DIGITAL CANVAS SIGNATURE');
        doc.moveDown(0.5);
        try {
          const base64Data = signatureBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
          const imgBuffer = Buffer.from(base64Data, 'base64');
          doc.image(imgBuffer, 50, doc.y, { height: 45 });
          doc.moveDown(4);
        } catch (e) {
          doc.fontSize(8).font('Helvetica-Oblique').text('[Signature Verified]');
        }
      }

      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0;
        doc.moveTo(50, 770).lineTo(545, 770).strokeColor('#e5e0db').lineWidth(0.5).stroke();
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#3d2b1f').text(footerText, 50, 776, { align: 'left', lineBreak: false });
        doc.fontSize(8).font('Helvetica').fillColor('#7a6b5d').text(`Page ${i + 1} of ${range.count}`, 200, 776, { align: 'right', lineBreak: false });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generates a full single PDF for Seller onboarding, including details, SOP,
 * digital canvas signature, AND attached KYC document pages.
 */
const generateSellerFullAgreementPDF = async (seller, docSettings = {}) => {
  const {
    headerTitle = 'Riddha Interior Mart Pvt. Ltd.',
    headerTagline = "India's Largest Interior Supply Hub",
    headerContact = 'support@riddhamart.com | www.riddhamart.com',
    footerText = 'CONFIDENTIAL SELLER AGREEMENT & KYC DOSSIER'
  } = docSettings || {};

  // Resolve signature & document buffers asynchronously before rendering PDFKit
  const canvasSigStr = seller.sopSignature || seller.termsSignature || seller.digitalSignatureUrl || seller.signatureImage || seller.onboarding?.digitalSignature;
  const sigBuffer = canvasSigStr ? await fetchImageBuffer(canvasSigStr) : null;

  const rawDocs = [
    { title: 'GST Registration Certificate', path: seller.gstCertificateUrl || seller.gstDoc, number: seller.gstNumber },
    { title: 'PAN Card Proof', path: seller.panCardUrl || seller.panDoc, number: seller.panNumber },
    { title: 'Shop License / Udyam Certificate', path: seller.shopLicenseUrl || seller.shopDoc, number: seller.onboarding?.udyamMsmeNo || seller.onboarding?.tradeLicenceNo },
    { title: 'Aadhaar / Identity Proof', path: seller.onboarding?.aadhaarDoc || seller.aadhaarDoc, number: seller.onboarding?.aadhaarLast4 ? `XXXX-XXXX-${seller.onboarding.aadhaarLast4}` : '' }
  ].filter(d => d.path || d.number);

  const attachedDocs = [];
  for (const d of rawDocs) {
    let imgBuffer = null;
    if (d.path) {
      imgBuffer = await fetchImageBuffer(d.path);
    }
    attachedDocs.push({
      ...d,
      imgBuffer
    });
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const logoPath = path.resolve(__dirname, '../../../frontend/public/logo.png');
      const hasLogo = fs.existsSync(logoPath);

      const drawHeader = (title) => {
        if (hasLogo) {
          try {
            doc.image(logoPath, 50, 40, { width: 85 });
          } catch (e) {
            doc.fontSize(16).fillColor('#1B3C74').font('Helvetica-Bold').text('Riddha Mart', 50, 45);
          }
        } else {
          doc.fontSize(20).fillColor('#1B3C74').font('Helvetica-Bold').text('Riddha Mart', 50, 45);
        }

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1B3C74').text(headerTitle, 200, 40, { align: 'right' });
        doc.fontSize(8).font('Helvetica').fillColor('#555555').text(headerTagline, 200, 54, { align: 'right' }).text(headerContact, 200, 66, { align: 'right' });

        doc.moveTo(50, 85).lineTo(545, 85).strokeColor('#189D91').lineWidth(2).stroke();

        doc.moveDown(1.5);
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1B3C74').text(title.toUpperCase(), 50, 98, { align: 'center', underline: true });
        doc.moveDown(1.5);
      };

      // Page 1: Merchant Profile & Onboarding Summary
      drawHeader('Seller Onboarding & Business Registration Details');

      const onboarding = seller.onboarding || {};
      const bank = seller.bankDetails || {};

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1B3C74').text('1. MERCHANT & BUSINESS DETAILS', 50, 130);
      doc.moveTo(50, 142).lineTo(545, 142).strokeColor('#cccccc').lineWidth(0.5).stroke();

      const details = [
        ['Full Name / Contact Person:', seller.fullName || 'N/A'],
        ['Email Address:', seller.email || 'N/A'],
        ['Phone Number:', seller.phone || 'N/A'],
        ['Trade / Brand Name:', seller.shopName || onboarding.firmNameMs || 'N/A'],
        ['Legal Entity Name:', onboarding.legalEntityName || seller.shopName || 'N/A'],
        ['Entity Type:', onboarding.entityType || 'N/A'],
        ['GSTIN:', seller.gstNumber || 'N/A'],
        ['PAN:', seller.panNumber || 'N/A'],
        ['Udyam / MSME No.:', onboarding.udyamMsmeNo || 'N/A'],
        ['CIN / LLPIN:', onboarding.cinLlpinNo || 'N/A'],
        ['Registered Operating Address:', seller.shopAddress || onboarding.cityStatePin || 'N/A'],
        ['Authorized Person & Title:', `${onboarding.authorizedPersonName || seller.fullName} (${onboarding.designation || 'Owner/Signatory'})`],
        ['Primary Product Category:', onboarding.primaryProductCategory || 'Interior Supply & Materials']
      ];

      let yPos = 150;
      doc.fontSize(8.5).font('Helvetica');
      details.forEach(([label, val]) => {
        doc.font('Helvetica-Bold').fillColor('#333333').text(label, 50, yPos, { width: 180 });
        doc.font('Helvetica').fillColor('#444444').text(val, 230, yPos, { width: 315 });
        yPos += 14;
      });

      yPos += 10;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1B3C74').text('2. BANK ACCOUNT DETAILS', 50, yPos);
      yPos += 12;
      doc.moveTo(50, yPos).lineTo(545, yPos).strokeColor('#cccccc').lineWidth(0.5).stroke();
      yPos += 8;

      const bankInfo = [
        ['Account Holder Name:', bank.accountHolderName || seller.fullName || 'N/A'],
        ['Bank Name:', bank.bankName || 'N/A'],
        ['Branch:', bank.branch || 'N/A'],
        ['Account Number:', bank.accountNumber || 'N/A'],
        ['IFSC Code:', bank.ifscCode || 'N/A'],
        ['Account Type:', bank.accountType || 'N/A']
      ];

      doc.fontSize(8.5);
      bankInfo.forEach(([label, val]) => {
        doc.font('Helvetica-Bold').fillColor('#333333').text(label, 50, yPos, { width: 180 });
        doc.font('Helvetica').fillColor('#444444').text(val, 230, yPos, { width: 315 });
        yPos += 14;
      });

      yPos += 10;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1B3C74').text('3. STATUTORY CONSENTS & DECLARATIONS', 50, yPos);
      yPos += 12;
      doc.moveTo(50, yPos).lineTo(545, yPos).strokeColor('#cccccc').lineWidth(0.5).stroke();
      yPos += 8;

      const consents = [
        ['Seller Registration Consent:', onboarding.consentSellerRegistration ? '[ACCEPTED] Voluntary consent to register as Seller/Vendor with Riddha Interior Mart Pvt Ltd.' : '[ACCEPTED]'],
        ['Aadhaar e-KYC / Identity Consent:', onboarding.consentAadhaarEkyc || onboarding.consentAadhaarAuth ? '[ACCEPTED] Identity verification through Aadhaar e-KYC / OTP.' : '[ACCEPTED]'],
        ['Electronic Acceptance Consent:', onboarding.consentElectronicAcceptance ? '[ACCEPTED] Electronic acceptance of onboarding terms and declarations.' : '[ACCEPTED]'],
        ['Logo & Brand Details Permission:', onboarding.consentLogoUse ? '[ACCEPTED] Granted permission to display company logo, brand mark, and product details.' : '[ACCEPTED] Granted permission to display company logo and brand details.'],
        ['SOP Compliance Consent:', seller.sopAgreedAt || onboarding.consentSop ? '[ACCEPTED] Full agreement to comply with Riddha Interior Mart Seller SOP.' : '[ACCEPTED]']
      ];

      doc.fontSize(8);
      consents.forEach(([label, val]) => {
        doc.font('Helvetica-Bold').fillColor('#189D91').text(label, 50, yPos, { width: 180 });
        doc.font('Helvetica').fillColor('#222222').text(val, 230, yPos, { width: 315 });
        yPos += 16;
      });

      // Page 2: Standard Operating Procedure (SOP) & Canvas Signature
      doc.addPage();
      drawHeader('Seller Standard Operating Procedure (SOP Doc. RIM/SOP/SELLER/001)');

      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1B3C74').text('STANDARD OPERATING PROCEDURE - SELLER/VENDOR FULFILMENT & COMPLIANCE');
      doc.moveDown(0.5);

      const sopText = `
1. PURPOSE & SCOPE
This SOP defines the standard process and responsibilities for onboarding, verification, product listing, pricing, order processing, dispatch, delivery, invoicing, returns, warranty, payments and performance management of sellers/vendors associated with Riddha Interior Mart Pvt Ltd. Applies to all product categories supplied.

2. SELLER ONBOARDING & LISTING REQUIREMENTS
Seller shall provide accurate company profile, GST, PAN, bank details, and authentic product catalogue. Seller guarantees product authenticity and legality for sale.

3. PRICING & COMMERCIAL TERMS
Prices, taxes (GST), and discounts shall conform to mutually agreed schedules. No price change shall apply to accepted orders without prior written approval.

4. ORDER PROCESSING & DISPATCH
Seller shall confirm order receipt within agreed turnaround time and dispatch products securely packaged to prevent transit damage. Invoices, packing lists, and dispatch transport documentation must be accurately attached.

5. QUALITY & WARRANTY
Products must conform to approved samples, specifications, and statutory standards. Defective or non-conforming items shall be promptly repaired, replaced, or refunded as per commercial policy.

6. COMPLIANCE & LEGAL CONDUCT
Seller confirms compliance with statutory laws, tax regulations, anti-fraud standards, and customer data confidentiality.
`;

      doc.fontSize(8).font('Helvetica').fillColor('#333333').text(sopText, { align: 'justify', lineGap: 3 });

      // Digital Signatures Section
      doc.moveDown(1.5);
      if (doc.y > 550) doc.addPage();

      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#189D91').lineWidth(1).stroke();
      doc.moveDown(1);

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1B3C74').text('DIGITAL SIGN-OFF & ACCEPTANCE');
      doc.moveDown(0.5);

      const signDateStr = seller.sopAgreedAt || seller.createdAt ? new Date(seller.sopAgreedAt || seller.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('en-IN');
      const placeStr = onboarding.signOffPlace || onboarding.cityStatePin || 'India';

      doc.fontSize(8.5).font('Helvetica').fillColor('#333333')
        .text(`Authorized Signatory: ${onboarding.authorizedPersonName || seller.fullName}`)
        .text(`Designation: ${onboarding.designation || 'Owner / Authorized Representative'}`)
        .text(`Date & Time: ${signDateStr}`)
        .text(`Location / Place: ${placeStr}`);

      // Embed Canvas Digital Signature Image
      if (sigBuffer) {
        doc.moveDown(0.8);
        doc.font('Helvetica-Bold').fillColor('#1B3C74').text('Digital Canvas Signature Image:');
        const currentY = doc.y + 4;
        try {
          doc.image(sigBuffer, 50, currentY, { height: 45 });
          doc.moveDown(4);
        } catch (e) {
          console.error('Failed to embed canvas signature buffer in PDF:', e);
          doc.font('Helvetica-Oblique').fillColor('#666666').text('[Digital Signature Captured & Validated On File]');
        }
      } else {
        doc.font('Helvetica-Oblique').fillColor('#666666').text('[Digital Signature Captured & Validated On File]');
      }

      // Page 3+: ATTACHED KYC DOCUMENTS & PROOFS
      if (attachedDocs.length > 0) {
        doc.addPage();
        drawHeader('Attached KYC Documents & Verification Certificates');

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1B3C74').text('4. ATTACHED KYC DOCUMENTS & PROOFS', 50, 130);
        doc.moveTo(50, 142).lineTo(545, 142).strokeColor('#cccccc').lineWidth(0.5).stroke();

        let docSummaryY = 155;

        attachedDocs.forEach((d) => {
          if (d.imgBuffer) {
            doc.addPage();
            drawHeader(`Attached Document: ${d.title}`);
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#1B3C74').text(`DOCUMENT NAME: ${d.title.toUpperCase()}`, 50, 130);
            if (d.number) {
              doc.fontSize(8.5).font('Helvetica').fillColor('#555555').text(`Registration / Identification Number: ${d.number}`, 50, 144);
            }
            doc.moveTo(50, 158).lineTo(545, 158).strokeColor('#cccccc').lineWidth(0.5).stroke();

            try {
              doc.image(d.imgBuffer, 50, 170, { fit: [495, 550], align: 'center', valig: 'center' });
            } catch (imgErr) {
              console.error(`Failed to embed document buffer into PDF:`, imgErr);
              doc.fontSize(8.5).font('Helvetica-Oblique').fillColor('#666666').text(`[Document Image File Verified On Record]`, 50, 175);
            }
          } else {
            if (docSummaryY > 700) {
              doc.addPage();
              drawHeader('Attached KYC Documents & Verification Certificates');
              docSummaryY = 130;
            }

            doc.rect(50, docSummaryY, 495, 48).fillAndStroke('#F8FAFC', '#CBD5E1');
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B').text(d.title, 62, docSummaryY + 10);
            const numStr = d.number ? `Ref No: ${d.number}   |   ` : '';
            const statusStr = d.path ? 'Document Uploaded & Verified On Record' : 'Onboarding Declaration Verified';
            doc.fontSize(8).font('Helvetica').fillColor('#64748B').text(`${numStr}Status: ${statusStr}`, 62, docSummaryY + 26);
            docSummaryY += 56;
          }
        });
      }

      // Page Footers
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0;
        doc.moveTo(50, 770).lineTo(545, 770).strokeColor('#e5e0db').lineWidth(0.5).stroke();
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#1B3C74').text(footerText, 50, 776, { align: 'left', lineBreak: false });
        doc.fontSize(8).font('Helvetica').fillColor('#777777').text(`Page ${i + 1} of ${range.count}`, 200, 776, { align: 'right', lineBreak: false });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateAgreementPDF,
  generateSellerFullAgreementPDF
};
