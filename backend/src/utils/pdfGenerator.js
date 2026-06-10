const PDFDocument = require("pdfkit");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

/**
 * Generates a PDF Invoice and uploads it to Cloudinary as a raw file
 * @param {Object} order - The populated Order object
 * @param {Object} user - The populated User object
 * @returns {Promise<String>} - The secure URL of the uploaded PDF invoice
 */
const generateInvoicePDF = (order, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      let buffers = [];

      // Buffer the PDF data in memory
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);

        // Upload the PDF buffer to Cloudinary
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            folder: "riddha_invoices",
            public_id: `invoice_${order._id}_${Date.now()}.pdf`,
            format: "pdf",
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary PDF Upload Error:", error);
              return reject(error);
            }
            resolve(result.secure_url);
          },
        );

        uploadStream.end(pdfData);
      });

      // --- Build the PDF Content --- //

      // Header
      doc.fontSize(28).font("Helvetica-Bold").text("Riddha.", { italic: true });
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#888888")
        .text("Premium Interio Mart", { letterSpacing: 2 });

      doc.moveUp(2);
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("TAX INVOICE", { align: "right" });
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`#${order._id.toString().slice(-8).toUpperCase()}`, {
          align: "right",
        });

      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#dddddd").stroke();
      doc.moveDown(1);

      // Billing Info
      const startY = doc.y;

      // Sold By
      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#888888")
        .text("SOLD BY", 50, startY, { letterSpacing: 1 });
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("Riddha Interior Mart Pvt. Ltd.", 50, startY + 15);
      doc
        .fontSize(10)
        .font("Helvetica")
        .text("123 Luxury Avenue, Design District", 50, startY + 30);
      doc.text("Indore, MP - 452001", 50, startY + 45);
      doc
        .font("Helvetica-Bold")
        .text("GSTIN: 23AAAAA0000A1Z5", 50, startY + 60);

      // Billing To
      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#888888")
        .text("BILLING TO", 300, startY, { letterSpacing: 1 });

      let customerName = order.shippingAddress.fullName;
      if (order.businessDetails?.shopName) {
        customerName = order.businessDetails.shopName;
      }

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(customerName, 300, startY + 15);

      let currentY = startY + 30;
      if (order.businessDetails?.gstNumber) {
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(`GSTIN: ${order.businessDetails.gstNumber}`, 300, currentY);
        currentY += 15;
      }

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(
          `${order.shippingAddress.fullAddress}, ${order.shippingAddress.city} - ${order.shippingAddress.pincode}`,
          300,
          currentY,
        );
      doc.text(
        `Phone: ${order.shippingAddress.mobileNumber}`,
        300,
        currentY + 15,
      );

      doc.moveDown(5);

      // Order Meta
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#eeeeee").stroke();
      doc.moveDown(1);

      const metaY = doc.y;
      const invoiceDate = new Date(order.createdAt).toLocaleDateString(
        "en-IN",
        { day: "numeric", month: "long", year: "numeric" },
      );

      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#888888")
        .text("DATE", 50, metaY, { letterSpacing: 1 });
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(invoiceDate, 50, metaY + 15);

      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#888888")
        .text("ORDER ID", 200, metaY, { letterSpacing: 1 });
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(`#${order._id.toString().slice(-12)}`, 200, metaY + 15);

      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#888888")
        .text("STATUS", 350, metaY, { letterSpacing: 1 });
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#008000")
        .text("PAID", 350, metaY + 15);

      doc.moveDown(3);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#eeeeee").stroke();
      doc.moveDown(1);

      // Table Header
      const tableTop = doc.y;
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#888888");
      doc.text("ITEM", 50, tableTop);
      doc.text("QTY", 300, tableTop, { width: 50, align: "center" });
      doc.text("PRICE", 370, tableTop, { width: 80, align: "right" });
      doc.text("TOTAL", 470, tableTop, { width: 80, align: "right" });

      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#eeeeee").stroke();
      doc.moveDown(1);

      // Table Rows
      let rowY = doc.y;
      doc.font("Helvetica").fillColor("#000000").fontSize(10);

      order.orderItems.forEach((item) => {
        const titleLines = doc.heightOfString(item.name, { width: 220 });

        doc.font("Helvetica-Bold").text(item.name, 50, rowY, { width: 220 });
        doc
          .font("Helvetica")
          .text(item.quantity.toString(), 300, rowY, {
            width: 50,
            align: "center",
          });
        doc.text(`Rs. ${item.price.toLocaleString()}`, 370, rowY, {
          width: 80,
          align: "right",
        });
        doc
          .font("Helvetica-Bold")
          .text(
            `Rs. ${(item.price * item.quantity).toLocaleString()}`,
            470,
            rowY,
            { width: 80, align: "right" },
          );

        rowY += titleLines + 15;
      });

      doc.moveTo(50, rowY).lineTo(550, rowY).strokeColor("#eeeeee").stroke();

      // Summary
      const summaryY = rowY + 20;

      const subExclTax =
        (order.pricingBreakdown?.subtotal || order.itemsPrice) -
        (order.pricingBreakdown?.taxAmount || order.taxAmount || 0);
      const taxAmt = order.pricingBreakdown?.taxAmount || order.taxAmount || 0;
      const discAmt =
        order.pricingBreakdown?.discountAmount || order.discountAmount || 0;
      const shippingAmt =
        order.pricingBreakdown?.shippingPrice || order.shippingPrice || 0;

      doc.fontSize(10).font("Helvetica").fillColor("#888888");
      doc.text("Subtotal (excl. GST)", 340, summaryY);
      doc
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(
          `Rs. ${Number(subExclTax.toFixed(2)).toLocaleString()}`,
          470,
          summaryY,
          { width: 80, align: "right" },
        );

      doc.fontSize(10).font("Helvetica").fillColor("#888888");
      doc.text("Inclusive GST", 340, summaryY + 20);
      doc
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(
          `Rs. ${Number(taxAmt.toFixed(2)).toLocaleString()}`,
          470,
          summaryY + 20,
          { width: 80, align: "right" },
        );

      doc.fontSize(10).font("Helvetica").fillColor("#888888");
      doc.text("Discount", 340, summaryY + 40);
      doc
        .font("Helvetica-Bold")
        .fillColor("#B71C1C")
        .text(
          `-Rs. ${Number(discAmt.toFixed(2)).toLocaleString()}`,
          470,
          summaryY + 40,
          { width: 80, align: "right" },
        );

      doc.fontSize(10).font("Helvetica").fillColor("#888888");
      doc.text("Shipping", 340, summaryY + 60);
      const shippingText = shippingAmt === 0 ? "FREE" : `Rs. ${shippingAmt}`;
      doc
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(shippingText, 470, summaryY + 60, { width: 80, align: "right" });

      doc
        .moveTo(340, summaryY + 85)
        .lineTo(550, summaryY + 85)
        .strokeColor("#000000")
        .stroke();

      doc.fontSize(12).font("Helvetica-Bold").fillColor("#000000");
      doc.text("GRAND TOTAL", 340, summaryY + 100);
      doc
        .fontSize(14)
        .text(`Rs. ${order.totalPrice.toLocaleString()}`, 450, summaryY + 99, {
          width: 100,
          align: "right",
        });

      // Footer
      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#888888")
        .text("Computer Generated Invoice", 50, 700, {
          align: "center",
          letterSpacing: 1,
        });

      // Finalize the PDF
      doc.end();
    } catch (err) {
      console.error("PDF Generation Error:", err);
      reject(err);
    }
  });
};

module.exports = {
  generateInvoicePDF,
};
