const PDFDocument = require('pdfkit');

/**
 * PDF Exporter for Interior Design Quotations
 * Builds a multi-page branded PDF with Indian GST breakdown, payment terms, and signature block.
 */
const generateQuotationPDF = (quotation) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
      const buffers = [];

      doc.on('data', buffer => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      // Brand Colors
      const brandDark = '#0F172A';  // Slate 900
      const brandAmber = '#D97706'; // Amber 600
      const brandGreen = '#047857'; // Emerald 700
      const textGray = '#475569';   // Slate 600

      // Header Banner — identifies the designer/contractor who generated this quote,
      // not the marketplace (that credit moves to the footer as "Powered by Riddha Interio Mart").
      const generator = quotation.userId || {};
      const generatorName = generator.businessDetails?.shopName || generator.fullName || quotation.company?.contactPerson || 'Independent Designer';
      const generatorContact = [generator.email, generator.phone].filter(Boolean).join('  |  ');

      doc.rect(40, 40, 515, 65).fill(brandDark);
      doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text(generatorName, 55, 50, { width: 300 });
      doc.fontSize(8.5).font('Helvetica').text('Interior Design Quotation', 55, 70);
      if (generatorContact) {
        doc.fontSize(7.5).fillColor('#CBD5E1').text(generatorContact, 55, 83, { width: 300 });
      }

      // Quote Number & Date Box (Fixed positioning & explicit width alignment)
      const headerRightX = 370;
      const headerRightWidth = 175;
      doc.fillColor(brandAmber).fontSize(11).font('Helvetica-Bold').text(`${quotation.quotationNumber || 'QT-2026-001'}`, headerRightX, 48, { width: headerRightWidth, align: 'right' });
      doc.fillColor('#94A3B8').fontSize(8).font('Helvetica').text(`Date: ${new Date(quotation.quoteDate || Date.now()).toLocaleDateString()}`, headerRightX, 64, { width: headerRightWidth, align: 'right' });
      doc.text(`Valid Until: ${new Date(quotation.validUntil || Date.now() + 30 * 86400000).toLocaleDateString()}`, headerRightX, 78, { width: headerRightWidth, align: 'right' });

      // Client & Project Info Row
      let y = 120;
      doc.rect(40, y, 250, 75).fill('#F8FAFC').stroke('#E2E8F0');
      doc.fillColor(brandDark).fontSize(9).font('Helvetica-Bold').text('CLIENT DETAILS:', 50, y + 10);
      doc.fillColor(textGray).fontSize(8.5).font('Helvetica')
        .text(`Name: ${quotation.clientName || 'Valued Client'}`, 50, y + 25)
        .text(`Email: ${quotation.clientEmail || 'N/A'}`, 50, y + 38)
        .text(`Phone: ${quotation.clientPhone || 'N/A'}`, 50, y + 51);

      doc.rect(305, y, 250, 75).fill('#F8FAFC').stroke('#E2E8F0');
      doc.fillColor(brandDark).fontSize(9).font('Helvetica-Bold').text('PROJECT DETAILS:', 315, y + 10);
      doc.fillColor(textGray).fontSize(8.5).font('Helvetica')
        .text(`Project: ${quotation.projectName || 'Interior Setup'}`, 315, y + 25)
        .text(`GSTIN: ${quotation.company?.gstNumber || '29AAACR1234F1Z5'}`, 315, y + 38)
        .text(`Status: ${(quotation.status || 'draft').toUpperCase()}`, 315, y + 51);

      // Opening Message
      y += 90;
      if (quotation.openingMessage) {
        doc.fillColor(textGray).fontSize(8.5).font('Helvetica-Oblique').text(quotation.openingMessage, 40, y, { width: 515 });
        y += doc.heightOfString(quotation.openingMessage, { width: 515 }) + 15;
      }

      // Render Table Header Helper Function
      const renderTableHeader = (currentY) => {
        doc.rect(40, currentY, 515, 22).fill('#F1F5F9');
        doc.fillColor(brandDark).fontSize(8.5).font('Helvetica-Bold');
        doc.text('#', 45, currentY + 6, { width: 20 });
        doc.text('Description & Specs', 70, currentY + 6, { width: 170 });
        doc.text('HSN', 245, currentY + 6, { width: 45 });
        doc.text('Qty', 295, currentY + 6, { width: 40, align: 'right' });
        doc.text('Rate (Rs)', 340, currentY + 6, { width: 60, align: 'right' });
        doc.text('GST', 405, currentY + 6, { width: 40, align: 'right' });
        doc.text('Amount (Rs)', 450, currentY + 6, { width: 95, align: 'right' });
        return currentY + 26;
      };

      // Items Table Header Initial Render
      y = renderTableHeader(y);

      // Table Rows with DYNAMIC Row Height Calculation
      const items = quotation.items || [];
      items.forEach((item, index) => {
        const itemDesc = item.description || 'Item Spec';
        const descHeight = doc.heightOfString(itemDesc, { width: 170 });
        const rowHeight = Math.max(22, descHeight + 8);

        if (y + rowHeight > 730) {
          doc.addPage();
          y = renderTableHeader(40);
        }

        const isEven = index % 2 === 0;
        if (isEven) {
          doc.rect(40, y - 2, 515, rowHeight).fill('#FAFAFA');
        }

        doc.fillColor(textGray).fontSize(8).font('Helvetica');
        doc.text(`${index + 1}`, 45, y, { width: 20 });
        doc.text(itemDesc, 70, y, { width: 170 });
        doc.text(item.hsnCode || '9403', 245, y, { width: 45 });
        doc.text(`${item.quantity || 1} ${item.unit || ''}`, 295, y, { width: 40, align: 'right' });
        doc.text(`${(item.unitRate || 0).toLocaleString()}`, 340, y, { width: 60, align: 'right' });
        doc.text(`${item.taxRate || 18}%`, 405, y, { width: 40, align: 'right' });
        doc.fillColor(brandDark).font('Helvetica-Bold')
          .text(`${(item.amount || (item.quantity * item.unitRate) || 0).toLocaleString()}`, 450, y, { width: 95, align: 'right' });

        y += rowHeight + 4;
      });

      y += 10;
      if (y > 640) {
        doc.addPage();
        y = 40;
      }

      // Summary Box (Right Aligned) & GST Breakdown
      const pricing = quotation.pricing || {};
      const taxes = pricing.taxes || {};

      doc.rect(300, y, 255, 110).fill('#F8FAFC').stroke('#CBD5E1');
      let sumY = y + 8;

      const addSumRow = (label, val, isBold = false, color = brandDark) => {
        doc.fillColor(color).fontSize(8.5).font(isBold ? 'Helvetica-Bold' : 'Helvetica');
        doc.text(label, 310, sumY);
        doc.text(`Rs. ${val.toLocaleString()}`, 430, sumY, { width: 115, align: 'right' });
        sumY += 14;
      };

      addSumRow('Subtotal (Excl. Tax):', pricing.subtotal || 0);
      if (pricing.discounts?.globalDiscountAmount > 0) {
        addSumRow('Discount Applied:', -pricing.discounts.globalDiscountAmount, false, '#DC2626');
      }
      addSumRow('SGST Breakdown:', (taxes.sgst5 || 0) + (taxes.sgst12 || 0) + (taxes.sgst18 || 0));
      addSumRow('CGST Breakdown:', (taxes.cgst5 || 0) + (taxes.cgst12 || 0) + (taxes.cgst18 || 0));
      addSumRow('Total GST Tax:', taxes.totalGST || 0, true);

      doc.moveTo(310, sumY - 2).lineTo(545, sumY - 2).stroke('#CBD5E1');
      sumY += 4;
      addSumRow('GRAND TOTAL:', pricing.grandTotal || 0, true, brandGreen);

      // Bank & Payment Instructions (Left Side)
      const bank = quotation.company?.bankDetails || {};
      doc.rect(40, y, 245, 110).fill('#F8FAFC').stroke('#CBD5E1');
      doc.fillColor(brandDark).fontSize(8.5).font('Helvetica-Bold').text('PAYMENT & BANK DETAILS:', 50, y + 8);
      doc.fillColor(textGray).fontSize(7.5).font('Helvetica')
        .text(`Bank: ${bank.bankName || 'HDFC Bank Ltd'}`, 50, y + 24)
        .text(`A/C No: ${bank.accountNumber || '91800293847561'}`, 50, y + 36)
        .text(`IFSC Code: ${bank.ifscCode || 'HDFC0001234'}`, 50, y + 48)
        .text(`Holder: ${bank.accountHolderName || 'Riddha Interio Mart Pvt Ltd'}`, 50, y + 60)
        .text('UPI / RTGS / NEFT Accepted', 50, y + 74);

      y += 125;
      if (y > 670) {
        doc.addPage();
        y = 40;
      }

      // Payment Schedule Installments Table
      const installments = quotation.paymentTerms?.installments || [];
      if (installments.length > 0) {
        doc.fillColor(brandDark).fontSize(9).font('Helvetica-Bold').text('PAYMENT MILESTONE SCHEDULE:', 40, y);
        y += 15;
        doc.rect(40, y, 515, 18).fill('#F1F5F9');
        doc.fillColor(brandDark).fontSize(8).font('Helvetica-Bold');
        doc.text('#', 45, y + 4, { width: 20 });
        doc.text('Milestone Description', 70, y + 4, { width: 260 });
        doc.text('Share (%)', 330, y + 4, { width: 60, align: 'right' });
        doc.text('Amount (Rs)', 400, y + 4, { width: 145, align: 'right' });

        y += 20;
        installments.forEach((inst, idx) => {
          doc.fillColor(textGray).fontSize(8).font('Helvetica');
          doc.text(`${idx + 1}`, 45, y);
          doc.text(inst.description || `Installment ${idx + 1}`, 70, y, { width: 260 });
          doc.text(`${inst.percentage}%`, 330, y, { width: 60, align: 'right' });
          doc.fillColor(brandDark).font('Helvetica-Bold').text(`Rs. ${(inst.amount || 0).toLocaleString()}`, 400, y, { width: 145, align: 'right' });
          y += 16;
        });

        y += 15;
      }

      // Terms & Conditions Footer Block
      if (quotation.termsAndConditions?.content) {
        if (y > 670) {
          doc.addPage();
          y = 40;
        }
        doc.fillColor(brandDark).fontSize(9).font('Helvetica-Bold').text('TERMS & CONDITIONS:', 40, y);
        y += 12;
        doc.fillColor(textGray).fontSize(7.5).font('Helvetica').text(quotation.termsAndConditions.content, 40, y, { width: 515 });
        y += doc.heightOfString(quotation.termsAndConditions.content, { width: 515 }) + 15;
      }

      // Digital Signature Box
      if (y > 690) {
        doc.addPage();
        y = 40;
      }
      doc.rect(380, y, 175, 45).stroke('#CBD5E1');
      doc.fillColor(brandDark).fontSize(8).font('Helvetica-Bold').text('Authorized Signature & Seal', 390, y + 10);
      doc.fillColor(textGray).fontSize(7.5).font('Helvetica').text(generatorName, 390, y + 28);

      // Add Page Numbers & Marketplace Credit
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fillColor('#94A3B8').fontSize(7.5).font('Helvetica')
          .text(`Powered by Riddha Interio Mart  |  Page ${i + 1} of ${range.count}`, 40, 815, { align: 'center', width: 515 });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateQuotationPDF
};
