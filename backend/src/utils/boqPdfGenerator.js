const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Generates a clean PDF document for a Bill of Quantities (BOQ)
 * @param {Object} boq - The BOQ model instance
 * @returns {Promise<Buffer>} - Buffer of generated PDF
 */
const generateBOQPDF = (boq) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const drawHeader = () => {
        const logoPath = path.resolve(__dirname, '../../../frontend/public/logo.png');
        if (fs.existsSync(logoPath)) {
          try { doc.image(logoPath, 40, 30, { width: 80 }); } catch (e) {
            doc.fontSize(18).fillColor('#3d2b1f').font('Helvetica-Bold').text('Riddha', 40, 35);
          }
        } else {
          doc.fontSize(18).fillColor('#3d2b1f').font('Helvetica-Bold').text('Riddha', 40, 35);
        }

        doc.fontSize(12).font('Helvetica-Bold').fillColor('#3d2b1f').text('Riddha Interio Mart', 200, 30, { align: 'right' });
        doc.fontSize(8).font('Helvetica').fillColor('#7c6f64')
          .text('Official Bill of Quantities (BOQ) Document', 200, 44, { align: 'right' })
          .text(`Date: ${new Date(boq.createdAt || Date.now()).toLocaleDateString()}`, 200, 56, { align: 'right' });

        doc.moveTo(40, 72).lineTo(555, 72).strokeColor('#e2e8f0').lineWidth(1).stroke();
      };

      drawHeader();

      let y = 84;
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a202c').text(boq.boqName || 'Bill of Quantities', 40, y);
      y = doc.y + 4;

      const summary = boq.summary || {};
      doc.fontSize(8.5).font('Helvetica').fillColor('#4a5568')
        .text(`Total Items: ${boq.items?.length || 0}   |   Est. Total Cost: Rs. ${(summary.totalEstimatedCost || 0).toLocaleString()}   |   Completeness Score: ${summary.completenessScore || 85}%`, 40, y);
      y = doc.y + 14;

      // Table Headers
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1e293b');
      doc.text('#', 40, y, { width: 20 });
      doc.text('Item & Description', 65, y, { width: 180 });
      doc.text('Category', 250, y, { width: 75 });
      doc.text('Qty', 330, y, { width: 45, align: 'right' });
      doc.text('Unit Cost', 380, y, { width: 75, align: 'right' });
      doc.text('Total (Rs.)', 460, y, { width: 95, align: 'right' });
      y = doc.y + 6;

      doc.moveTo(40, y).lineTo(555, y).strokeColor('#cbd5e1').lineWidth(0.75).stroke();
      y += 8;

      const items = boq.items || [];
      items.forEach((item, index) => {
        if (y > 720) {
          doc.addPage();
          drawHeader();
          y = 90;
        }

        const itemTotal = item.totalCost || (item.quantity * item.unitCost) || 0;

        doc.fontSize(8).font('Helvetica-Bold').fillColor('#334155').text(`${index + 1}`, 40, y, { width: 20 });
        doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a').text(item.itemName, 65, y, { width: 180 });
        doc.fontSize(8).font('Helvetica').fillColor('#475569').text(item.category || 'Furniture', 250, y, { width: 75 });
        doc.fontSize(8).font('Helvetica').fillColor('#334155').text(`${item.quantity} ${item.unit || ''}`, 330, y, { width: 45, align: 'right' });
        doc.fontSize(8).font('Helvetica').fillColor('#334155').text(`Rs. ${(item.unitCost || 0).toLocaleString()}`, 380, y, { width: 75, align: 'right' });
        doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#059669').text(`Rs. ${itemTotal.toLocaleString()}`, 460, y, { width: 95, align: 'right' });

        y = doc.y + 2;
        if (item.description) {
          doc.fontSize(7.5).font('Helvetica').fillColor('#64748b').text(item.description, 65, y, { width: 180, lineGap: 1 });
          y = doc.y + 4;
        } else {
          y += 4;
        }

        doc.moveTo(40, y).lineTo(555, y).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
        y += 6;
      });

      // Total Summary Box
      if (y > 680) {
        doc.addPage();
        drawHeader();
        y = 90;
      }

      y += 8;
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#059669').text('Grand Total Estimated BOQ Cost:', 250, y);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#059669').text(`Rs. ${(summary.totalEstimatedCost || 0).toLocaleString()}`, 450, y, { align: 'right' });
      y = doc.y + 20;

      // Page footers
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#a0aec0').font('Helvetica')
          .text(`Riddha Interio Mart • Official Bill of Quantities (BOQ) • Page ${i + 1} of ${pageCount}`, 40, 790, { align: 'center' });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generates a clean CSV string for BOQ items
 */
const generateBOQCSV = (boq) => {
  let csv = 'S.No,Item Name,Category,Description,Quantity,Unit,Unit Cost (Rs.),Total Cost (Rs.),Supplier,Delivery Timeline,Priority\n';
  (boq.items || []).forEach((item, index) => {
    const total = item.totalCost || (item.quantity * item.unitCost) || 0;
    const name = `"${(item.itemName || '').replace(/"/g, '""')}"`;
    const category = `"${(item.category || '').replace(/"/g, '""')}"`;
    const desc = `"${(item.description || '').replace(/"/g, '""')}"`;
    const supplier = `"${(item.supplier || '').replace(/"/g, '""')}"`;
    const timeline = `"${(item.deliveryTimeline || '').replace(/"/g, '""')}"`;
    csv += `${index + 1},${name},${category},${desc},${item.quantity},${item.unit || 'Pieces'},${item.unitCost || 0},${total},${supplier},${timeline},${item.priority || 'essential'}\n`;
  });
  return csv;
};

module.exports = { generateBOQPDF, generateBOQCSV };
