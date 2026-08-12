const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Generates a clean PDF document for an interior cost estimate
 * @param {Object} estimate - The cost estimate model instance
 * @returns {Promise<Buffer>} - Buffer of the generated PDF
 */
const generateEstimatePDF = (estimate) => {
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
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Draw Header
      const drawHeader = () => {
        const logoPath = path.resolve(__dirname, '../../../frontend/public/logo.png');
        if (fs.existsSync(logoPath)) {
          try {
            doc.image(logoPath, 50, 35, { width: 85 });
          } catch (e) {
            doc.fontSize(18).fillColor('#3d2b1f').font('Helvetica-Bold').text('Riddha', 50, 40);
          }
        } else {
          doc.fontSize(18).fillColor('#3d2b1f').font('Helvetica-Bold').text('Riddha', 50, 40);
        }

        doc.fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#3d2b1f')
          .text('Riddha Interio Mart', 200, 35, { align: 'right' });
        doc.fontSize(8)
          .font('Helvetica')
          .fillColor('#7c6f64')
          .text('AI-Powered Interior Cost Estimate Report', 200, 50, { align: 'right' })
          .text(`Date: ${new Date(estimate.createdAt || Date.now()).toLocaleDateString()}`, 200, 62, { align: 'right' });

        doc.moveTo(50, 78).lineTo(545, 78).strokeColor('#e2e8f0').lineWidth(1).stroke();
      };

      drawHeader();

      let y = 92;
      doc.fontSize(15).font('Helvetica-Bold').fillColor('#1a202c').text(estimate.estimateName || 'Interior Design Cost Estimate', 50, y);
      y = doc.y + 4;

      // Parameters Box
      doc.fontSize(9).font('Helvetica').fillColor('#4a5568')
        .text(`Room Type: ${estimate.roomType}   |   Area: ${estimate.area} sq ft   |   Tier: ${(estimate.materialTier || 'standard').toUpperCase()}   |   Timeline: ${(estimate.timeline || 'soon').toUpperCase()}`, 50, y);
      y = doc.y + 4;

      if (estimate.scope && estimate.scope.length > 0) {
        doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#059669')
          .text(`Design Scope: ${estimate.scope.join(', ')}`, 50, y);
        y = doc.y + 14;
      } else {
        y += 10;
      }

      // Cost Breakdown Table
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#2d3748').text('Itemized Cost Breakdown', 50, y);
      y = doc.y + 8;

      const breakdown = estimate.costBreakdown || {};
      const lineItems = [
        { label: 'Furniture & Built-ins', amount: breakdown.furniture || 0 },
        { label: 'Flooring & Surfaces', amount: breakdown.flooring || 0 },
        { label: 'Lighting & Electrical', amount: breakdown.lighting || 0 },
        { label: 'Decor & Accessories', amount: breakdown.decor || 0 },
        { label: 'Paint & Wall Treatment', amount: breakdown.paint || 0 },
        { label: 'Labor & Installation', amount: breakdown.labor || 0 },
        { label: 'Additional Services', amount: breakdown.additionalServices || 0 }
      ];

      lineItems.forEach(item => {
        if (item.amount > 0) {
          doc.fontSize(9).font('Helvetica').fillColor('#2d3748').text(`-  ${item.label}`, 50, y);
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#1a202c').text(`Rs. ${item.amount.toLocaleString()}`, 400, y, { align: 'right' });
          y = doc.y + 4;
        }
      });

      doc.moveTo(50, y + 4).lineTo(545, y + 4).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
      y += 10;

      // Summary Totals
      doc.fontSize(9).font('Helvetica').fillColor('#4a5568').text('Subtotal:', 300, y);
      doc.fontSize(9).font('Helvetica').fillColor('#1a202c').text(`Rs. ${(breakdown.subtotal || 0).toLocaleString()}`, 400, y, { align: 'right' });
      y = doc.y + 4;

      if (breakdown.timelineAdjustment !== 0) {
        doc.fontSize(9).font('Helvetica').fillColor('#4a5568').text(`Timeline Adjustment (${estimate.timeline}):`, 250, y);
        doc.fontSize(9).font('Helvetica').fillColor('#1a202c').text(`Rs. ${(breakdown.timelineAdjustment || 0).toLocaleString()}`, 400, y, { align: 'right' });
        y = doc.y + 4;
      }

      doc.fontSize(9).font('Helvetica').fillColor('#4a5568').text('Contingency Reserve (10%):', 250, y);
      doc.fontSize(9).font('Helvetica').fillColor('#1a202c').text(`Rs. ${(breakdown.contingency || 0).toLocaleString()}`, 400, y, { align: 'right' });
      y = doc.y + 6;

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#059669').text('Grand Total Cost:', 250, y);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#059669').text(`Rs. ${(breakdown.grandTotal || 0).toLocaleString()}`, 400, y, { align: 'right' });
      y = doc.y + 4;

      doc.fontSize(8.5).font('Helvetica').fillColor('#64748b').text(`Estimated Cost per Sq Ft: Rs. ${(breakdown.costPerSqFt || 0).toLocaleString()} / sq ft`, 300, y, { align: 'right' });
      y = doc.y + 20;

      // AI Analysis Section
      if (y > 640) {
        doc.addPage();
        drawHeader();
        y = 95;
      }

      if (estimate.aiAnalysis?.costBreakdownAnalysis) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#2d3748').text('Gemini AI Cost Analysis', 50, y);
        y = doc.y + 6;

        doc.fontSize(8.5).font('Helvetica').fillColor('#334155')
          .text(estimate.aiAnalysis.costBreakdownAnalysis, 50, y, { width: 495, align: 'left', lineGap: 2 });
        y = doc.y + 16;
      }

      if (estimate.aiAnalysis?.riskAssessment) {
        if (y > 660) {
          doc.addPage();
          drawHeader();
          y = 95;
        }

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#2d3748').text('Risk Assessment & Contingency Plan', 50, y);
        y = doc.y + 6;

        doc.fontSize(8.5).font('Helvetica').fillColor('#334155')
          .text(estimate.aiAnalysis.riskAssessment, 50, y, { width: 495, align: 'left', lineGap: 2 });
      }

      // Add Page Footers
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#a0aec0').font('Helvetica')
          .text(`Riddha Interio Mart • Confidential Cost Estimate Report • Page ${i + 1} of ${pageCount}`, 50, 785, { align: 'center' });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateEstimatePDF };
