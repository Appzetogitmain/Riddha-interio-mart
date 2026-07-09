const PDFDocument = require("pdfkit");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

/**
 * Builds PDF content onto a PDFDocument.
 * Call doc.end() after this to finalize.
 */
const buildPdfContent = (doc, order, user, settings) => {
  const invSet = settings.invoiceSettings;

  const logoPath = path.join(__dirname, '../../../frontend/src/assets/transparent_logo.png');
  const LOGO_W = 130;
  const LOGO_H = 60;
  const LOGO_X = 50;
  const LOGO_Y = 38;

      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, LOGO_X, LOGO_Y, { width: LOGO_W, height: LOGO_H, fit: [LOGO_W, LOGO_H] });
      } else {
        doc.fontSize(22).font("Helvetica-Bold").fillColor("#189D91").text(invSet.adminName.split(' ')[0], LOGO_X, LOGO_Y);
      }

      // Invoice title on right
      doc
        .fontSize(15)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("TAX INVOICE / DELIVERY CHALLAN", 0, LOGO_Y + 2, { align: "right", width: 545 });
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#555555")
        .text(`Invoice No: #${order._id.toString().slice(-8).toUpperCase()}`, 0, LOGO_Y + 22, { align: "right", width: 545 });
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#888888")
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, 0, LOGO_Y + 36, { align: "right", width: 545 });

      // Separator below logo
      const lineY = LOGO_Y + LOGO_H + 10;
      doc.moveTo(50, lineY).lineTo(545, lineY).strokeColor("#dddddd").lineWidth(1).stroke();

      // Billing Info
      const infoY = lineY + 12;

      // Sold By
      if ((order.seller && invSet.showSellerDetails) || (!order.seller && invSet.showAdminDetails)) {
        const sellerShopName = order.seller?.shopName || invSet.adminName;
        const sellerAddress = order.seller?.shopAddress || invSet.adminAddress;
        const sellerGst = order.seller?.gstNumber || invSet.adminGST;
        
        doc
          .fontSize(7)
          .font("Helvetica-Bold")
          .fillColor("#888888")
          .text("SOLD BY", 50, infoY, { letterSpacing: 1 });
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor("#000000")
          .text(sellerShopName, 50, infoY + 12);
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#444444")
          .text(sellerAddress, 50, infoY + 26, { width: 150 });
        
        if ((order.seller && sellerGst) || (!order.seller && invSet.showAdminGST)) {
          doc
            .font("Helvetica-Bold")
            .fillColor("#000000")
            .text(`GSTIN: ${sellerGst}`, 50, infoY + 50);
        }
      }

      // Bill To
      if (invSet.showBillingDetails) {
        doc
          .fontSize(7)
          .font("Helvetica-Bold")
          .fillColor("#888888")
          .text("BILL TO", 220, infoY, { letterSpacing: 1 });

        let customerName = order.shippingAddress?.fullName || (user ? (user.fullName || user.name) : "Customer");
        if (order.businessDetails?.shopName) {
          customerName = order.businessDetails.shopName;
        }

        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor("#000000")
          .text(customerName, 220, infoY + 12);

        let currentBillY = infoY + 26;
        if (order.businessDetails?.gstNumber && invSet.showGSTBreakdown) {
          doc
            .fontSize(9)
            .font("Helvetica-Bold")
            .text(`GSTIN: ${order.businessDetails.gstNumber}`, 220, currentBillY);
          currentBillY += 13;
        }

        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#444444")
          .text(
            `${order.shippingAddress?.fullAddress || ""}, ${order.shippingAddress?.city || ""} - ${order.shippingAddress?.pincode || ""}`,
            220,
            currentBillY,
            { width: 150 }
          );
        doc.text(
          `Phone: ${order.shippingAddress?.mobileNumber || ""}`,
          220,
          currentBillY + 25,
        );
      }

      // Ship To
      if (invSet.showShippingDetails) {
        doc
          .fontSize(7)
          .font("Helvetica-Bold")
          .fillColor("#888888")
          .text("SHIP TO", 390, infoY, { letterSpacing: 1 });

        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor("#000000")
          .text(order.shippingAddress?.fullName || "Customer", 390, infoY + 12);

        let currentShipY = infoY + 26;
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#444444")
          .text(
            `${order.shippingAddress?.fullAddress || ""}, ${order.shippingAddress?.city || ""} - ${order.shippingAddress?.pincode || ""}`,
            390,
            currentShipY,
            { width: 150 }
          );
        doc.text(
          `Phone: ${order.shippingAddress?.mobileNumber || ""}`,
          390,
          currentShipY + 25,
        );
      }

      // Order Meta
      const metaBaseY = infoY + 82;
      doc.moveTo(50, metaBaseY).lineTo(545, metaBaseY).strokeColor("#eeeeee").stroke();

      const metaY = metaBaseY + 10;

      doc
        .fontSize(7)
        .font("Helvetica-Bold")
        .fillColor("#888888")
        .text("ORDER ID", 50, metaY, { letterSpacing: 1 });
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(`#${order._id.toString().slice(-12).toUpperCase()}`, 50, metaY + 12);

      doc
        .fontSize(7)
        .font("Helvetica-Bold")
        .fillColor("#888888")
        .text("PAYMENT", 230, metaY, { letterSpacing: 1 });
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(order.paymentMethod || "COD", 230, metaY + 12);

      doc
        .fontSize(7)
        .font("Helvetica-Bold")
        .fillColor("#888888")
        .text("STATUS", 390, metaY, { letterSpacing: 1 });
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#008000")
        .text(order.isPaid ? "PAID" : "PENDING", 390, metaY + 12);

      // Table Header
      const tableTop = metaY + 38;
      doc.moveTo(50, tableTop).lineTo(545, tableTop).strokeColor("#cccccc").stroke();
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#555555");
      doc.text("ITEM DESCRIPTION & HSN", 50, tableTop + 8, { width: 210 });
      doc.text("WEIGHT", 268, tableTop + 8, { width: 55, align: "center" });
      doc.text("QTY", 328, tableTop + 8, { width: 40, align: "center" });
      doc.text("RATE", 373, tableTop + 8, { width: 75, align: "right" });
      doc.text("AMOUNT", 453, tableTop + 8, { width: 92, align: "right" });

      doc.moveDown(1);
      doc.moveTo(50, tableTop + 24).lineTo(545, tableTop + 24).strokeColor("#eeeeee").stroke();

      // Table Rows
      let rowY = tableTop + 32;
      doc.font("Helvetica").fillColor("#000000").fontSize(9);

      order.orderItems.forEach((item) => {
        const hsnCode = item.hsnCode || '9403';
        const weight = item.weight ? `${item.weight} KG` : '5 KG';

        doc.font("Helvetica-Bold").fillColor("#000000").text(item.name, 50, rowY, { width: 210 });
        doc.font("Helvetica").fillColor("#777777").fontSize(8).text(`HSN/SAC: ${hsnCode}`, 50, rowY + 13, { width: 210 });

        doc.fontSize(9).fillColor("#000000").text(weight, 268, rowY, { width: 55, align: "center" });
        doc.text(item.quantity.toString(), 328, rowY, { width: 40, align: "center" });
        doc.font("Helvetica").text(`Rs. ${item.price.toLocaleString()}`, 373, rowY, { width: 75, align: "right" });
        doc.font("Helvetica-Bold").text(`Rs. ${(item.price * item.quantity).toLocaleString()}`, 453, rowY, { width: 92, align: "right" });

        rowY += 36;
      });

      doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor("#cccccc").stroke();

      // Summary
      const summaryY = rowY + 20;

      const subExclTax =
        (order.pricingBreakdown?.subtotal || order.itemsPrice) -
        (order.pricingBreakdown?.taxAmount || order.taxAmount || order.taxPrice || 0);
      const taxAmt = order.pricingBreakdown?.taxAmount || order.taxAmount || order.taxPrice || 0;
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
          453, summaryY, { width: 92, align: "right" },
        );

      let gstPercentage = 0;
      if (subExclTax > 0 && taxAmt > 0) {
        gstPercentage = Math.round((taxAmt / subExclTax) * 100);
      }
      const gstText = gstPercentage > 0 ? `Inclusive GST (${gstPercentage}%)` : "Inclusive GST";

      doc.fontSize(10).font("Helvetica").fillColor("#888888");
      doc.text(gstText, 340, summaryY + 20);
      doc
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(
          `Rs. ${Number(taxAmt.toFixed(2)).toLocaleString()}`,
          453, summaryY + 20, { width: 92, align: "right" },
        );

      doc.fontSize(10).font("Helvetica").fillColor("#888888");
      doc.text("Discount", 340, summaryY + 40);
      doc
        .font("Helvetica-Bold")
        .fillColor("#B71C1C")
        .text(
          `-Rs. ${Number(discAmt.toFixed(2)).toLocaleString()}`,
          453, summaryY + 40, { width: 92, align: "right" },
        );

      doc.fontSize(10).font("Helvetica").fillColor("#888888");
      doc.text("Shipping", 340, summaryY + 60);
      const shippingText = shippingAmt === 0 ? "FREE" : `Rs. ${shippingAmt}`;
      doc
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(shippingText, 453, summaryY + 60, { width: 92, align: "right" });

      doc
        .moveTo(340, summaryY + 85)
        .lineTo(545, summaryY + 85)
        .strokeColor("#000000")
        .stroke();

      doc.fontSize(12).font("Helvetica-Bold").fillColor("#000000");
      doc.text("GRAND TOTAL", 340, summaryY + 100);
      doc
        .fontSize(14)
        .text(`Rs. ${order.totalPrice.toLocaleString()}`, 453, summaryY + 99, {
          width: 92,
          align: "right",
        });

      // Footer
      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#888888")
        .text("DECLARATION:", 50, 670);
        
      doc
        .fontSize(7)
        .font("Helvetica")
        .fillColor("#888888")
        .text(invSet.invoiceFooterText, 50, 680, { width: 500 });

      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#888888")
        .text("Authorized Signatory", 450, 700, { align: "right" });

      doc
        .fontSize(7)
        .font("Helvetica-Bold")
        .fillColor("#cccccc")
        .text("Computer Generated Invoice - No signature required", 50, 730, {
          align: "center",
          letterSpacing: 1,
        });
};

const SystemSettings = require('../models/SystemSettings');

/**
 * Generates a PDF Invoice Buffer (in-memory, no Cloudinary upload).
 * Use this for on-demand streaming.
 */
const buildPdfBuffer = async (order, user) => {
  let settings = await SystemSettings.findOne();
  if (!settings || !settings.invoiceSettings) {
    settings = { invoiceSettings: { showAdminDetails: true, showAdminGST: true, showSellerDetails: true, showShippingDetails: true, showBillingDetails: true, showGSTBreakdown: true, adminName: 'Riddha Interior Mart Pvt. Ltd.', adminAddress: '123 Luxury Avenue, Design District, Indore, MP - 452001', adminGST: '23AAAAA0000A1Z5', invoiceFooterText: 'This is a computer-generated invoice.' } };
  }
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      buildPdfContent(doc, order, user, settings);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generates a PDF Invoice and uploads it to Cloudinary as a raw file
 * @param {Object} order - The populated Order object
 * @param {Object} user - The populated User object
 * @returns {Promise<String>} - The secure URL of the uploaded PDF invoice
 */
const generateInvoicePDF = async (order, user) => {
  let settings = await SystemSettings.findOne();
  if (!settings || !settings.invoiceSettings) {
    settings = { invoiceSettings: { showAdminDetails: true, showAdminGST: true, showSellerDetails: true, showShippingDetails: true, showBillingDetails: true, showGSTBreakdown: true, adminName: 'Riddha Interior Mart Pvt. Ltd.', adminAddress: '123 Luxury Avenue, Design District, Indore, MP - 452001', adminGST: '23AAAAA0000A1Z5', invoiceFooterText: 'This is a computer-generated invoice.' } };
  }
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
            folder: 'riddha_invoices',
            public_id: `invoice_${order._id}_${Date.now()}.pdf`,
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary PDF Upload Error:', error);
              return reject(error);
            }
            resolve(result.secure_url);
          },
        );
        uploadStream.end(pdfData);
      });
      buildPdfContent(doc, order, user, settings);
      doc.end();
    } catch (err) {
      console.error('PDF Generation Error:', err);
      reject(err);
    }
  });
};

module.exports = {
  generateInvoicePDF,
  buildPdfBuffer,
};
