const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Generates a consolidated PDF containing Terms & Conditions and Privacy Policy
 * @param {string} role - 'user', 'seller', or 'delivery'
 * @param {string} termsContent - Terms & Conditions text
 * @param {string} privacyContent - Privacy Policy text
 * @param {string} fullName - Full name of the user
 * @param {string} signatureBase64 - Base64 string of the signature image
 * @returns {Promise<Buffer>} - Buffer of the generated PDF
 */
const generateAgreementPDF = (role, termsContent, privacyContent, fullName = '', signatureBase64 = '') => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true // Enable buffering to compute total page count for footer
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Resolve logo path
      // Note: frontend/public/logo.png is the source of the logo
      const logoPath = path.resolve(__dirname, '../../../frontend/public/logo.png');
      const hasLogo = fs.existsSync(logoPath);

      // Helper function to draw header on each page
      const drawHeader = (title) => {
        // Logo
        if (hasLogo) {
          try {
            doc.image(logoPath, 50, 40, { width: 90 });
          } catch (imgErr) {
            console.error('Failed to load logo in PDF, drawing text fallback instead:', imgErr);
            doc.fontSize(16).fillColor('#3d2b1f').font('Helvetica-Bold').text('Riddha', 50, 45);
          }
        } else {
          doc.fontSize(22).fillColor('#3d2b1f').font('Helvetica-Bold').text('Riddha', 50, 45);
        }

        // Company Details Right Aligned
        doc.fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#3d2b1f')
          .text('Riddha Interior Mart Pvt. Ltd.', 200, 40, { align: 'right' });
        
        doc.fontSize(8)
          .font('Helvetica')
          .fillColor('#7c6f64')
          .text("India's Largest Interior Supply Hub", 200, 55, { align: 'right' })
          .text('support@riddhamart.com | www.riddhamart.com', 200, 68, { align: 'right' });

        // Decorative Colored bar
        doc.moveDown(1.5);
        doc.moveTo(50, 90).lineTo(545, 90).strokeColor('#c5a880').lineWidth(2).stroke();
        
        // Title Header
        doc.moveDown(1.5);
        doc.fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#3d2b1f')
          .text(title.toUpperCase(), 50, 110, { align: 'center', underline: true });
        
        doc.moveDown(1.5);
      };

      // Role label helper
      const getRoleLabel = (r) => {
        if (r === 'user') return 'Customer';
        if (r === 'seller') return 'Seller';
        if (r === 'delivery') return 'Delivery Partner';
        return r;
      };

      // --- PAGE 1: Terms & Conditions ---
      drawHeader(`${getRoleLabel(role)} Terms & Conditions`);

      // Write Terms & Conditions Content
      doc.fontSize(9.5)
        .font('Helvetica')
        .fillColor('#222222')
        .text(termsContent, {
          align: 'justify',
          lineGap: 4,
          paragraphGap: 10
        });

      // --- PAGE 2: Privacy Policy ---
      doc.addPage();
      drawHeader(`${getRoleLabel(role)} Privacy Policy`);

      // Write Privacy Policy Content
      doc.fontSize(9.5)
        .font('Helvetica')
        .fillColor('#222222')
        .text(privacyContent, {
          align: 'justify',
          lineGap: 4,
          paragraphGap: 10
        });

      // --- SIGNATURE SECTION ---
      if (signatureBase64 && fullName) {
        doc.moveDown(3);
        
        // Ensure there is enough space on the page for the signature block, otherwise add a new page
        if (doc.y > 600) {
          doc.addPage();
        }

        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e0db').lineWidth(1).stroke();
        doc.moveDown(1.5);
        
        const sigStartY = doc.y;

        doc.fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#3d2b1f')
          .text('Electronic Signature Agreement', 50, sigStartY);
          
        doc.moveDown(1);
        doc.fontSize(10)
          .font('Helvetica')
          .fillColor('#222222')
          .text(`Agreed By: ${fullName}`);
          
        const dateStr = new Date().toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric'
        });
        doc.moveDown(0.5);
        doc.text(`Date: ${dateStr}`);

        try {
          // Parse base64 string
          const base64Data = signatureBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');
          
          doc.moveDown(1);
          const currentY = doc.y;
          doc.image(imageBuffer, 50, currentY, { height: 60 });
          doc.moveDown(6); // Move cursor down past the image
        } catch (imgErr) {
          console.error('Failed to embed signature image in PDF:', imgErr);
          doc.moveDown(1);
          doc.font('Helvetica-Oblique').fillColor('#7c6f64').text('[Signature Image Unavailable]');
          doc.moveDown(2);
        }
      }

      // Global footer application on all buffered pages
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        
        // Footer divider line
        doc.moveTo(50, 785).lineTo(545, 785).strokeColor('#e5e0db').lineWidth(0.5).stroke();

        doc.fontSize(8)
          .font('Helvetica-Bold')
          .fillColor('#7c6f64')
          .text('CONFIDENTIAL DOCUMENT', 50, 792, { align: 'left' });

        doc.fontSize(8)
          .font('Helvetica')
          .fillColor('#7c6f64')
          .text(`Page ${i + 1} of ${range.count}`, 200, 792, { align: 'right' });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateAgreementPDF
};
