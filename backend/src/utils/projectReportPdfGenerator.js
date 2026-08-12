const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Generates a clean, professional PDF document for an interior design project report
 * @param {Object} project - The project model instance
 * @param {string} reportContent - Executive summary / AI content
 * @returns {Promise<Buffer>} - Buffer of the generated PDF
 */
const generateProjectReportPDF = (project, reportContent = '') => {
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

      // Helper function to draw company header
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
          .text('Interior Design Project Management Report', 200, 50, { align: 'right' })
          .text(`Generated: ${new Date().toLocaleDateString()}`, 200, 62, { align: 'right' });

        doc.moveTo(50, 78).lineTo(545, 78).strokeColor('#e2e8f0').lineWidth(1).stroke();
      };

      drawHeader();

      // Project Overview Block
      let y = 92;
      doc.fontSize(15).font('Helvetica-Bold').fillColor('#1a202c').text(project.projectName || 'Interior Design Project', 50, y);
      y = doc.y + 4;

      doc.fontSize(9).font('Helvetica').fillColor('#4a5568')
        .text(`Client: ${project.clientName || 'Valued Client'}   |   Room: ${project.roomType || 'Living Room'}   |   Style: ${project.designStyle || 'Modern'}`, 50, y);
      y = doc.y + 4;

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#059669')
        .text(`Overall Progress: ${project.completionPercentage || 0}% Complete   |   Status: ${(project.overallStatus || 'on-track').toUpperCase()}`, 50, y);
      y = doc.y + 16;

      // Executive Summary / AI Report Section
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#2d3748').text('Executive Progress Summary', 50, y);
      y = doc.y + 6;

      const summaryText = reportContent || project.aiInsights?.healthNarrative || 'Project progress is moving systematically according to timeline standards.';
      doc.fontSize(9).font('Helvetica').fillColor('#2d3748')
        .text(summaryText, 50, y, { width: 495, align: 'left', lineGap: 2 });
      
      // Dynamically get exact y position after executive summary text rendering
      y = doc.y + 20;

      // Page break check before Milestone & Phase Progress
      if (y > 660) {
        doc.addPage();
        drawHeader();
        y = 95;
      }

      // Phases Table
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#2d3748').text('Milestone & Phase Progress', 50, y);
      y = doc.y + 8;

      const phases = project.phases || [];
      phases.forEach((phase) => {
        if (y > 720) {
          doc.addPage();
          drawHeader();
          y = 95;
        }

        const currentY = y;
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#1a202c').text(`•  ${phase.phaseName}`, 50, currentY);
        doc.fontSize(8.5).font('Helvetica').fillColor('#718096').text(`Status: ${phase.status}`, 300, currentY);
        doc.fontSize(8.5).font('Helvetica').fillColor('#718096').text(`Target: ${phase.targetEndDate ? new Date(phase.targetEndDate).toLocaleDateString() : 'TBD'}`, 430, currentY);
        y = doc.y + 6;
      });
      y += 14;

      // Page break check before Budget Tracking
      if (y > 660) {
        doc.addPage();
        drawHeader();
        y = 95;
      }

      // Financial & Budget Tracking Table
      if (project.budget) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#2d3748').text('Financial & Budget Tracking', 50, y);
        y = doc.y + 8;

        const categories = project.budget.categories || [];
        categories.forEach((cat) => {
          if (y > 720) {
            doc.addPage();
            drawHeader();
            y = 95;
          }

          const catSpent = cat.spent || 0;
          const catPlanned = cat.planned || 1;
          const currentY = y;
          doc.fontSize(9).font('Helvetica').fillColor('#2d3748').text(`-  ${cat.name}`, 50, currentY);
          doc.fontSize(8.5).font('Helvetica').fillColor('#4a5568')
            .text(`Spent: Rs. ${catSpent.toLocaleString()}  /  Planned: Rs. ${catPlanned.toLocaleString()}`, 250, currentY);
          y = doc.y + 6;
        });
      }

      // Add page numbers on all pages in footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#a0aec0').font('Helvetica')
          .text(`Riddha Interio Mart • Confidential Project Update Report • Page ${i + 1} of ${pageCount}`, 50, 785, { align: 'center' });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateProjectReportPDF };
