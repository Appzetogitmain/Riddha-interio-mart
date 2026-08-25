const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const https = require("https");
const path = require("path");
const fs = require("fs");

// Helper to download signature image securely if it's a URL
const downloadImage = (url) => {
  return new Promise((resolve) => {
    if (!url || !url.startsWith("http")) {
      resolve(null);
      return;
    }
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        resolve(null);
        return;
      }
      const data = [];
      res.on("data", (chunk) => data.push(chunk));
      res.on("end", () => resolve(Buffer.concat(data)));
      res.on("error", () => resolve(null));
    }).on("error", () => resolve(null));
  });
};

// Helper to draw table rows in pdfkit
const drawTableRow = (doc, y, values, widths, alignments, isHeader = false) => {
  // Must match the x=40 the surrounding table/row rects are drawn at (see tableTop
  // rects below) — starting 10pt further right than the rects caused the last
  // column ("Total (Rs)") to spill past the table border and the page margin.
  let currentX = 40;
  doc.fontSize(isHeader ? 8 : 7).font(isHeader ? "Helvetica-Bold" : "Helvetica");
  
  for (let i = 0; i < values.length; i++) {
    const val = values[i] !== undefined && values[i] !== null ? values[i].toString() : "";
    const w = widths[i];
    const align = alignments[i] || "left";
    doc.text(val, currentX, y, { width: w, align: align });
    currentX += w;
  }
};

class InvoicePdfService {
  /**
   * Generates Bill A: Seller to Marketplace Tax Invoice
   */
  async generateSellerToMarketplaceInvoice(order, seller, settings) {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    
    // Header Bar
    doc.rect(40, 40, 515, 25).fill("#0f766e");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10).text("TAX INVOICE", 50, 48);
    doc.fontSize(8).font("Helvetica").text("(Sale of Goods)", 480, 49);
    
    // Logo & Meta Data
    doc.fillColor("#000000");
    const logoPath = path.join(__dirname, "../../../frontend/public/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 75, { width: 100 });
    } else {
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#189D91").text("Riddha", 40, 75);
    }
    
    const metaY = 75;
    doc.fontSize(8).fillColor("#000000");
    doc.font("Helvetica-Bold").text("Invoice No. (Seller)", 280, metaY);
    doc.font("Helvetica").text(`: ${order.sellerInvoiceNumber || "N/A"}`, 390, metaY);
    
    doc.font("Helvetica-Bold").text("Invoice Date", 280, metaY + 12);
    doc.font("Helvetica").text(`: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, 390, metaY + 12);
    
    doc.font("Helvetica-Bold").text("Marketplace Order Ref.", 280, metaY + 24);
    doc.font("Helvetica").text(`: ${order._id.toString().toUpperCase()}`, 390, metaY + 24);
    
    doc.font("Helvetica-Bold").text("Order Date", 280, metaY + 36);
    doc.font("Helvetica").text(`: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, 390, metaY + 36);
    
    doc.font("Helvetica-Bold").text("Payment Status", 280, metaY + 48);
    doc.font("Helvetica").text(`: To Be Settled`, 390, metaY + 48);
    
    doc.font("Helvetica-Bold").text("Place of Supply", 280, metaY + 60);
    doc.font("Helvetica").text(`: ${order.shippingAddress?.state || "N/A"}`, 390, metaY + 60);
    
    doc.font("Helvetica-Bold").text("Supply Type", 280, metaY + 72);
    doc.font("Helvetica").text(`: ${order.taxType === "inter-state" ? "Inter-State" : "Intra-State"} Supply`, 390, metaY + 72);
    
    // Address Info Cards
    const addrY = 165;
    // Seller Info Card
    doc.rect(40, addrY, 250, 95).stroke("#cccccc");
    doc.fillColor("#0f766e").font("Helvetica-Bold").fontSize(8).text("SELLER (SUPPLIER)", 48, addrY + 8);
    doc.fillColor("#000000").font("Helvetica-Bold").fontSize(9).text(seller.shopName || seller.fullName, 48, addrY + 22);
    doc.font("Helvetica").fontSize(8).text(seller.shopAddress || "N/A", 48, addrY + 34, { width: 230 });
    doc.font("Helvetica-Bold").text(`GSTIN: ${seller.gstNumber || "N/A"}`, 48, addrY + 65);
    doc.font("Helvetica").text(`Phone: ${seller.phone || "N/A"} | Email: ${seller.email || "N/A"}`, 48, addrY + 77);
    
    // Billed To Marketplace Card
    const adminSet = settings?.invoiceSettings || {
      adminName: "Riddha Interior Mart Pvt. Ltd. (RIMX)",
      adminAddress: "SDF Building, 123, New Town, Kolkata - 700156, West Bengal, India",
      adminGST: "19AAJCR1234C1Z5"
    };
    doc.rect(305, addrY, 250, 95).stroke("#cccccc");
    doc.fillColor("#0f766e").font("Helvetica-Bold").fontSize(8).text("BILLED TO (MARKETPLACE)", 313, addrY + 8);
    doc.fillColor("#000000").font("Helvetica-Bold").fontSize(9).text(adminSet.adminName, 313, addrY + 22);
    doc.font("Helvetica").fontSize(8).text(adminSet.adminAddress, 313, addrY + 34, { width: 230 });
    doc.font("Helvetica-Bold").text(`GSTIN: ${adminSet.adminGST}`, 313, addrY + 65);
    doc.font("Helvetica").text("Phone: +91 9876543210 | Email: accounts@riddhamart.com", 313, addrY + 77);
    
    // Table
    const tableTop = 275;
    const colWidths = [20, 160, 45, 25, 25, 45, 40, 50, 50, 55]; // sum = 515
    const colAlignments = ["center", "left", "center", "center", "center", "right", "right", "right", "right", "right"];
    const headers = ["Sl.", "Description of Goods", "HSN/SAC", "Qty", "Unit", "Rate (Rs)", "Disc (Rs)", "Taxable Value", "GST Rate", "Total (Rs)"];
    
    doc.rect(40, tableTop, 515, 20).fill("#0f766e");
    doc.fillColor("#ffffff");
    drawTableRow(doc, tableTop + 6, headers, colWidths, colAlignments, true);
    
    let currentY = tableTop + 20;
    doc.fillColor("#000000");
    
    // Iterate items
    order.orderItems.forEach((item, index) => {
      const rate = item.price;
      const discount = 0; 
      const taxableVal = item.price * item.quantity;
      const taxRate = order.itemsPrice > 0 ? Math.round((order.taxAmount / order.itemsPrice) * 100) : 18;
      const gstAmount = taxableVal * (taxRate / 100);
      const itemTotal = taxableVal + gstAmount;
      
      const row = [
        index + 1,
        item.name,
        item.product?.hsnCode || "6907", // Fallback dummy HSN when the product has none set
        item.quantity,
        "Box",
        rate.toFixed(2),
        discount.toFixed(2),
        taxableVal.toFixed(2),
        `${taxRate}%`,
        itemTotal.toFixed(2)
      ];
      
      doc.rect(40, currentY, 515, 22).stroke("#dddddd");
      drawTableRow(doc, currentY + 7, row, colWidths, colAlignments, false);
      currentY += 22;
    });
    
    // Total Row
    doc.rect(40, currentY, 515, 26).fill("#f1f5f9").stroke("#cccccc");
    doc.fillColor("#000000").font("Helvetica-Bold").fontSize(8);
    doc.text("Total", 40, currentY + 9);
    doc.text(`${order.orderItems.reduce((acc, curr) => acc + curr.quantity, 0)} Items`, 210, currentY + 9);
    doc.text(`Rs. ${order.itemsPrice.toFixed(2)}`, 370, currentY + 9, { align: "right", width: 80 });
    doc.fillColor("#0f766e").fontSize(10).text(`Rs. ${order.totalPrice.toFixed(2)}`, 460, currentY + 8, { align: "right", width: 95 });
    doc.fillColor("#000000");
    currentY += 31;

    // Bank details & declaration & signature
    const bottomY = currentY;
    
    // Tax summary block
    doc.rect(40, bottomY, 150, 75).stroke("#cccccc");
    doc.fillColor("#0f766e").font("Helvetica-Bold").fontSize(7).text("GST SUMMARY", 46, bottomY + 6);
    doc.fillColor("#000000").font("Helvetica").fontSize(7);
    doc.text(`Taxable Value  : Rs. ${order.itemsPrice.toFixed(2)}`, 46, bottomY + 18);
    doc.text(`CGST (${(order.cgst || 9)}%) : Rs. ${(order.taxAmount / 2).toFixed(2)}`, 46, bottomY + 28);
    doc.text(`SGST (${(order.sgst || 9)}%) : Rs. ${(order.taxAmount / 2).toFixed(2)}`, 46, bottomY + 38);
    doc.font("Helvetica-Bold").text(`Total Tax      : Rs. ${order.taxAmount.toFixed(2)}`, 46, bottomY + 52);
    
    // Bank details
    const bank = seller.bankDetails || {};
    doc.rect(200, bottomY, 170, 75).stroke("#cccccc");
    doc.fillColor("#0f766e").font("Helvetica-Bold").fontSize(7).text("BANK DETAILS (SELLER)", 206, bottomY + 6);
    doc.fillColor("#000000").font("Helvetica").fontSize(7);
    doc.text(`Bank Name  : ${bank.bankName || "N/A"}`, 206, bottomY + 18);
    doc.text(`A/c No.    : ${bank.accountNumber || "N/A"}`, 206, bottomY + 28);
    doc.text(`IFSC Code  : ${bank.ifscCode || "N/A"}`, 206, bottomY + 38);
    doc.text(`Branch     : Vashi, Navi Mumbai`, 206, bottomY + 48);
    
    // Declaration & Sign
    doc.rect(380, bottomY, 175, 75).stroke("#cccccc");
    doc.fillColor("#0f766e").font("Helvetica-Bold").fontSize(7).text(`For ${seller.shopName}`, 386, bottomY + 6);
    
    // Seller signature image if exists
    if (seller.signatureImage) {
      const sigBuffer = await downloadImage(seller.signatureImage);
      if (sigBuffer) {
        try {
          doc.image(sigBuffer, 395, bottomY + 15, { width: 140, height: 35, fit: [140, 35] });
        } catch (sigErr) {
          doc.fillColor("#cccccc").font("Helvetica-Oblique").fontSize(8).text(seller.fullName, 390, bottomY + 25);
        }
      } else {
        doc.fillColor("#cccccc").font("Helvetica-Oblique").fontSize(8).text(seller.fullName, 390, bottomY + 25);
      }
    } else {
      doc.fillColor("#cccccc").font("Helvetica-Oblique").fontSize(8).text("Upload signature to view", 390, bottomY + 25);
    }
    
    doc.fillColor("#555555").font("Helvetica").fontSize(7).text("Authorised Signatory", 386, bottomY + 58, { align: "center", width: 163 });
    
    // Footer notes
    doc.fillColor("#888888").font("Helvetica").fontSize(7).text("Note: This is a computer generated invoice and does not require a physical signature.", 40, bottomY + 90, { align: "center", width: 515 });
    
    doc.end();
    return new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
    });
  }

  /**
   * Generates Bill B: E-Way Bill + Delivery Challan + Shipping Label (Consolidated PDF)
   */
  async generateEWayBillAndLabel(order, seller) {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    
    // ==========================================
    // 1. E-WAY BILL SECTION
    // ==========================================
    doc.rect(40, 40, 515, 20).fill("#0f766e");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10).text("E - WAY BILL", 50, 46);
    
    // Generate mock QR code buffer for the e-way bill
    const qrData = `EWay:${order.eWayBillNumber || "N/A"}|Date:${new Date().toLocaleDateString()}|Vehicle:MH12AB1234`;
    let ewayQrBuffer;
    try {
      ewayQrBuffer = await QRCode.toBuffer(qrData, { margin: 1, width: 70 });
    } catch (e) {
      ewayQrBuffer = null;
    }
    
    doc.fillColor("#000000").fontSize(8);
    const ewayY = 70;
    doc.font("Helvetica-Bold").text("E-Way Bill No.", 50, ewayY);
    doc.font("Helvetica").text(`: ${order.eWayBillNumber || "2517 6458 3210"}`, 150, ewayY);
    
    doc.font("Helvetica-Bold").text("E-Way Bill Date", 50, ewayY + 12);
    doc.font("Helvetica").text(`: ${new Date(order.createdAt).toLocaleDateString("en-IN")} 10:45 AM`, 150, ewayY + 12);
    
    doc.font("Helvetica-Bold").text("Valid Upto", 50, ewayY + 24);
    const validDate = new Date(order.createdAt);
    validDate.setDate(validDate.getDate() + 3);
    doc.font("Helvetica").text(`: ${validDate.toLocaleDateString("en-IN")} 11:59 PM`, 150, ewayY + 24);
    
    if (ewayQrBuffer) {
      doc.image(ewayQrBuffer, 460, 65, { width: 70 });
    } else {
      doc.rect(460, 65, 70, 70).stroke("#cccccc");
      doc.text("[QR]", 480, 95);
    }
    
    doc.moveTo(40, 145).lineTo(555, 145).strokeColor("#cccccc").stroke();
    
    // ==========================================
    // 2. DELIVERY CHALLAN SECTION
    // ==========================================
    const dcY = 155;
    doc.rect(40, dcY, 515, 20).fill("#0f766e");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10).text("DELIVERY CHALLAN", 50, dcY + 6);
    
    doc.fillColor("#000000").fontSize(8);
    doc.font("Helvetica-Bold").text("Challan No.", 50, dcY + 28);
    doc.font("Helvetica").text(`: DC/${order._id.toString().slice(-8).toUpperCase()}`, 130, dcY + 28);
    
    doc.font("Helvetica-Bold").text("Challan Date", 50, dcY + 40);
    doc.font("Helvetica").text(`: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, 130, dcY + 40);
    
    doc.font("Helvetica-Bold").text("Order Ref.", 280, dcY + 28);
    doc.font("Helvetica").text(`: ${order._id.toString().toUpperCase()}`, 360, dcY + 28);
    
    doc.font("Helvetica-Bold").text("Invoice No.", 280, dcY + 40);
    doc.font("Helvetica").text(`: ${order.sellerInvoiceNumber || "N/A"}`, 360, dcY + 40);
    
    // Dispatch from / Deliver to
    const dcAddrY = dcY + 58;
    doc.rect(40, dcAddrY, 250, 70).stroke("#dddddd");
    doc.fillColor("#0f766e").font("Helvetica-Bold").fontSize(7).text("DISPATCH FROM (Seller)", 48, dcAddrY + 6);
    doc.fillColor("#000000").font("Helvetica-Bold").fontSize(8).text(seller.shopName || seller.fullName, 48, dcAddrY + 16);
    doc.font("Helvetica").fontSize(7.5).text(seller.shopAddress || "N/A", 48, dcAddrY + 26, { width: 230 });
    
    doc.rect(305, dcAddrY, 250, 70).stroke("#dddddd");
    doc.fillColor("#0f766e").font("Helvetica-Bold").fontSize(7).text("DELIVER TO (Customer)", 313, dcAddrY + 6);
    doc.fillColor("#000000").font("Helvetica-Bold").fontSize(8).text(order.shippingAddress?.fullName || "Customer", 313, dcAddrY + 16);
    doc.font("Helvetica").fontSize(7.5).text(`${order.shippingAddress?.fullAddress || ""}, ${order.shippingAddress?.city || ""} - ${order.shippingAddress?.pincode || ""}`, 313, dcAddrY + 26, { width: 230 });
    
    // Simple table for goods
    const dcTableY = dcAddrY + 80;
    doc.rect(40, dcTableY, 515, 15).fill("#0f766e");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(7);
    doc.text("Sl.", 50, dcTableY + 4);
    doc.text("Description of Goods", 80, dcTableY + 4);
    doc.text("HSN Code", 300, dcTableY + 4);
    doc.text("Qty", 380, dcTableY + 4);
    doc.text("Packages", 440, dcTableY + 4);
    doc.text("Weight", 500, dcTableY + 4);
    
    let dcItemY = dcTableY + 15;
    doc.fillColor("#000000").font("Helvetica").fontSize(7);
    
    order.orderItems.forEach((item, index) => {
      doc.rect(40, dcItemY, 515, 15).stroke("#eeeeee");
      doc.text(index + 1, 50, dcItemY + 4);
      doc.text(item.name, 80, dcItemY + 4);
      doc.text(item.product?.hsnCode || "6907", 300, dcItemY + 4);
      doc.text(item.quantity, 380, dcItemY + 4);
      doc.text("1", 440, dcItemY + 4);
      doc.text("25 KG", 500, dcItemY + 4);
      dcItemY += 15;
    });
    
    doc.font("Helvetica-Bold").text("Transporter: Safe Logistics", 40, dcItemY + 10);
    doc.text("Vehicle No: MH12AB1234", 180, dcItemY + 10);
    doc.text("LR No: 1234567890", 350, dcItemY + 10);
    
    doc.moveTo(40, dcItemY + 25).lineTo(555, dcItemY + 25).strokeColor("#cccccc").stroke();
    
    // ==========================================
    // 3. SHIPPING LABEL SECTION
    // ==========================================
    const labelY = dcItemY + 35;
    doc.rect(40, labelY, 515, 20).fill("#e11d48");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10).text("SHIPPING LABEL", 50, labelY + 6);
    
    doc.fillColor("#000000").fontSize(8);
    
    // Ship to Address
    const shipAddrY = labelY + 28;
    doc.rect(40, shipAddrY, 250, 100).stroke("#cccccc");
    doc.fillColor("#555555").font("Helvetica-Bold").text("SHIP TO:", 48, shipAddrY + 8);
    doc.fillColor("#000000").font("Helvetica-Bold").fontSize(10).text(order.shippingAddress?.fullName || "Customer", 48, shipAddrY + 20);
    doc.font("Helvetica").fontSize(8.5).text(`${order.shippingAddress?.fullAddress || ""}, ${order.shippingAddress?.city || ""} - ${order.shippingAddress?.pincode || ""}`, 48, shipAddrY + 35, { width: 230 });
    doc.font("Helvetica-Bold").fontSize(8.5).text(`Mob: ${order.shippingAddress?.mobileNumber || "N/A"}`, 48, shipAddrY + 82);
    
    // Label details box
    doc.rect(300, shipAddrY, 255, 100).stroke("#cccccc");
    const labelDetailsY = shipAddrY + 8;
    
    doc.fontSize(8);
    doc.font("Helvetica-Bold").text("Order No.", 310, labelDetailsY);
    doc.font("Helvetica").text(`: #${order._id.toString().slice(-8).toUpperCase()}`, 390, labelDetailsY);
    
    doc.font("Helvetica-Bold").text("Weight", 310, labelDetailsY + 15);
    doc.font("Helvetica").text(": 25 KG", 390, labelDetailsY + 15);
    
    doc.font("Helvetica-Bold").text("Packages", 310, labelDetailsY + 30);
    doc.font("Helvetica").text(`: ${order.orderItems.length}`, 390, labelDetailsY + 30);
    
    doc.font("Helvetica-Bold").text("Dimensions", 310, labelDetailsY + 45);
    doc.font("Helvetica").text(": 120x80x80 CM", 390, labelDetailsY + 45);
    
    doc.font("Helvetica-Bold").text("Payment Status", 310, labelDetailsY + 60);
    doc.font("Helvetica-Bold").fillColor(order.isPaid ? "#0f766e" : "#b91c1c").text(`: ${order.isPaid ? "PREPAID - PAID" : "COD - PENDING"}`, 390, labelDetailsY + 60);
    
    // Draw dummy barcode at the bottom
    doc.fillColor("#000000");
    const barcodeY = shipAddrY + 110;
    
    // Draw barcode lines
    let lineX = 40;
    for (let i = 0; i < 45; i++) {
      const lineWidth = Math.random() > 0.4 ? 1.5 : 3;
      const spacing = Math.random() > 0.3 ? 2 : 4;
      doc.rect(lineX, barcodeY, lineWidth, 25).fill("#000000");
      lineX += lineWidth + spacing;
    }
    
    doc.fontSize(7).font("Helvetica").text(`AWB / LR No.: 1234567890`, 40, barcodeY + 28);
    
    // Bottom icons box (Keep Dry, Fragile, This Side Up)
    const iconBoxX = 350;
    doc.rect(iconBoxX, barcodeY, 60, 30).stroke("#cccccc");
    doc.fontSize(6).text("KEEP DRY", iconBoxX, barcodeY + 22, { align: "center", width: 60 });
    
    doc.rect(iconBoxX + 65, barcodeY, 65, 30).stroke("#cccccc");
    doc.fontSize(6).text("FRAGILE", iconBoxX + 65, barcodeY + 22, { align: "center", width: 65 });
    
    doc.rect(iconBoxX + 135, barcodeY, 70, 30).stroke("#cccccc");
    doc.fontSize(6).text("THIS SIDE UP", iconBoxX + 135, barcodeY + 22, { align: "center", width: 70 });
    
    doc.end();
    return new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
    });
  }

  /**
   * Generates Bill C: Marketplace to Customer Tax Invoice (Not visible to seller)
   */
  async generateMarketplaceToCustomerInvoice(order, seller, settings, termsContent) {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    
    // Header Bar
    doc.rect(40, 40, 515, 25).fill("#e11d48");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10).text("TAX INVOICE", 50, 48);
    doc.fontSize(8).font("Helvetica").text("(Sale of Goods)", 480, 49);
    
    // Logo & Meta Data
    doc.fillColor("#000000");
    const logoPath = path.join(__dirname, "../../../frontend/public/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 75, { width: 100 });
    } else {
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#189D91").text("Riddha", 40, 75);
    }
    
    const metaY = 75;
    doc.fontSize(8).fillColor("#000000");
    doc.font("Helvetica-Bold").text("Invoice No. (Marketplace)", 280, metaY);
    doc.font("Helvetica").text(`: ${order.marketplaceInvoiceNumber || "N/A"}`, 390, metaY);
    
    doc.font("Helvetica-Bold").text("Invoice Date", 280, metaY + 12);
    doc.font("Helvetica").text(`: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, 390, metaY + 12);
    
    doc.font("Helvetica-Bold").text("Order No.", 280, metaY + 24);
    doc.font("Helvetica").text(`: ${order._id.toString().toUpperCase()}`, 390, metaY + 24);
    
    doc.font("Helvetica-Bold").text("Order Date", 280, metaY + 36);
    doc.font("Helvetica").text(`: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, 390, metaY + 36);
    
    doc.font("Helvetica-Bold").text("Payment Status", 280, metaY + 48);
    doc.font("Helvetica").text(`: ${order.isPaid ? "Paid" : "Pending"}`, 390, metaY + 48);
    
    doc.font("Helvetica-Bold").text("Place of Supply", 280, metaY + 60);
    doc.font("Helvetica").text(`: ${order.shippingAddress?.state || "N/A"}`, 390, metaY + 60);
    
    doc.font("Helvetica-Bold").text("Supply Type", 280, metaY + 72);
    doc.font("Helvetica").text(`: ${order.taxType === "inter-state" ? "Inter-State" : "Intra-State"} Supply`, 390, metaY + 72);
    
    // Address Info Cards
    const addrY = 165;
    // Billed to Customer Info Card
    doc.rect(40, addrY, 165, 95).stroke("#cccccc");
    doc.fillColor("#e11d48").font("Helvetica-Bold").fontSize(7).text("BILLED TO (CUSTOMER)", 46, addrY + 8);
    doc.fillColor("#000000").font("Helvetica-Bold").fontSize(8).text(order.shippingAddress?.fullName || "Customer", 46, addrY + 22);
    doc.font("Helvetica").fontSize(7).text(`${order.shippingAddress?.fullAddress || ""}, ${order.shippingAddress?.city || ""} - ${order.shippingAddress?.pincode || ""}`, 46, addrY + 34, { width: 153 });
    doc.font("Helvetica").text(`Mob: ${order.shippingAddress?.mobileNumber || "N/A"}`, 46, addrY + 70);
    
    // Ship to Address Info Card
    doc.rect(212, addrY, 165, 95).stroke("#cccccc");
    doc.fillColor("#e11d48").font("Helvetica-Bold").fontSize(7).text("SHIP TO (DELIVERY ADDRESS)", 218, addrY + 8);
    doc.fillColor("#000000").font("Helvetica-Bold").fontSize(8).text(order.shippingAddress?.fullName || "Customer", 218, addrY + 22);
    doc.font("Helvetica").fontSize(7).text(`${order.shippingAddress?.fullAddress || ""}, ${order.shippingAddress?.city || ""} - ${order.shippingAddress?.pincode || ""}`, 218, addrY + 34, { width: 153 });
    doc.font("Helvetica").text(`Mob: ${order.shippingAddress?.mobileNumber || "N/A"}`, 218, addrY + 70);
    
    // Sold by Marketplace Card
    const adminSet = settings?.invoiceSettings || {
      adminName: "Riddha Interior Mart Pvt. Ltd.",
      adminAddress: "SDF Building, 123, New Town, Kolkata - 700156, West Bengal, India",
      adminGST: "19AAJCR1234C1Z5"
    };
    doc.rect(385, addrY, 170, 95).stroke("#cccccc");
    doc.fillColor("#e11d48").font("Helvetica-Bold").fontSize(7).text("SOLD BY (SUPPLIER)", 391, addrY + 8);
    doc.fillColor("#000000").font("Helvetica-Bold").fontSize(8).text(adminSet.adminName, 391, addrY + 22);
    doc.font("Helvetica").fontSize(7).text(adminSet.adminAddress, 391, addrY + 34, { width: 158 });
    doc.font("Helvetica-Bold").text(`GSTIN: ${adminSet.adminGST}`, 391, addrY + 70);
    
    // Table
    const tableTop = 275;
    const colWidths = [20, 160, 45, 25, 25, 45, 40, 50, 50, 55]; // sum = 515
    const colAlignments = ["center", "left", "center", "center", "center", "right", "right", "right", "right", "right"];
    const headers = ["Sl.", "Description of Goods", "HSN/SAC", "Qty", "Unit", "Rate (Rs)", "Disc (Rs)", "Taxable Value", "GST Rate", "Total (Rs)"];
    
    doc.rect(40, tableTop, 515, 20).fill("#e11d48");
    doc.fillColor("#ffffff");
    drawTableRow(doc, tableTop + 6, headers, colWidths, colAlignments, true);
    
    let currentY = tableTop + 20;
    doc.fillColor("#000000");
    
    // Iterate items
    order.orderItems.forEach((item, index) => {
      const rate = item.price;
      const discount = 0; 
      const taxableVal = item.price * item.quantity;
      const taxRate = order.itemsPrice > 0 ? Math.round((order.taxAmount / order.itemsPrice) * 100) : 18;
      const gstAmount = taxableVal * (taxRate / 100);
      const itemTotal = taxableVal + gstAmount;
      
      const row = [
        index + 1,
        item.name,
        item.product?.hsnCode || "6907", // Fallback dummy HSN when the product has none set
        item.quantity,
        "Box",
        rate.toFixed(2),
        discount.toFixed(2),
        taxableVal.toFixed(2),
        `${taxRate}%`,
        itemTotal.toFixed(2)
      ];
      
      doc.rect(40, currentY, 515, 22).stroke("#dddddd");
      drawTableRow(doc, currentY + 7, row, colWidths, colAlignments, false);
      currentY += 22;
    });
    
    // Total Row
    doc.rect(40, currentY, 515, 26).fill("#f1f5f9").stroke("#cccccc");
    doc.fillColor("#000000").font("Helvetica-Bold").fontSize(8);
    doc.text("Total", 40, currentY + 9);
    doc.text(`${order.orderItems.reduce((acc, curr) => acc + curr.quantity, 0)} Items`, 210, currentY + 9);
    doc.text(`Rs. ${order.itemsPrice.toFixed(2)}`, 370, currentY + 9, { align: "right", width: 80 });
    doc.fillColor("#e11d48").fontSize(10).text(`Rs. ${order.totalPrice.toFixed(2)}`, 460, currentY + 8, { align: "right", width: 95 });
    doc.fillColor("#000000");
    currentY += 31;

    // Bank details & IRN block
    const bottomY = currentY;
    
    // Tax summary block
    doc.rect(40, bottomY, 140, 75).stroke("#cccccc");
    doc.fillColor("#e11d48").font("Helvetica-Bold").fontSize(7).text("GST SUMMARY (INTRA-STATE)", 46, bottomY + 6);
    doc.fillColor("#000000").font("Helvetica").fontSize(7);
    doc.text(`Taxable Value  : Rs. ${order.itemsPrice.toFixed(2)}`, 46, bottomY + 18);
    doc.text(`CGST (${(order.cgst || 9)}%) : Rs. ${(order.taxAmount / 2).toFixed(2)}`, 46, bottomY + 28);
    doc.text(`SGST (${(order.sgst || 9)}%) : Rs. ${(order.taxAmount / 2).toFixed(2)}`, 46, bottomY + 38);
    doc.font("Helvetica-Bold").text(`Total Tax      : Rs. ${order.taxAmount.toFixed(2)}`, 46, bottomY + 52);
    
    // ECO Declaration
    doc.rect(190, bottomY, 160, 75).stroke("#cccccc");
    doc.fillColor("#e11d48").font("Helvetica-Bold").fontSize(7).text("ECO DECLARATION", 196, bottomY + 6);
    doc.fillColor("#555555").font("Helvetica").fontSize(6.5);
    doc.text("Riddha Interior Mart Pvt. Ltd. is an Electronic Commerce Operator (ECO) and is not the supplier of the goods. The goods are sold by the seller mentioned on this invoice.", 196, bottomY + 18, { width: 148, align: "justify" });
    
    // Signature For Riddha
    doc.rect(360, bottomY, 195, 75).stroke("#cccccc");
    doc.fillColor("#e11d48").font("Helvetica-Bold").fontSize(7).text("For Riddha Interior Mart Pvt. Ltd.", 366, bottomY + 6);
    
    // Sign print
    doc.fillColor("#1e293b").font("Helvetica-Oblique").fontSize(12).text("Amit Sharma", 380, bottomY + 22);
    doc.fillColor("#555555").font("Helvetica").fontSize(7).text("Authorised Signatory", 366, bottomY + 58, { align: "center", width: 183 });
    
    // Second page or footer IRN & QR Block
    const irnY = bottomY + 85;
    doc.rect(40, irnY, 515, 75).stroke("#cccccc");
    doc.fillColor("#e11d48").font("Helvetica-Bold").fontSize(7).text("IRN & QR CODE INFO", 46, irnY + 6);
    
    doc.fillColor("#000000").font("Helvetica").fontSize(7);
    doc.font("Helvetica-Bold").text("IRN", 46, irnY + 18);
    const mockIrn = "7c5a9d8f3e1c9e7d4a8f3b1c9e7d4a8f3b1c9e2d7f4b3a6c8e7f";
    doc.font("Helvetica").text(`: ${mockIrn}`, 90, irnY + 18);
    
    doc.font("Helvetica-Bold").text("Ack No.", 46, irnY + 30);
    doc.font("Helvetica").text(": 1722628317892561", 90, irnY + 30);
    
    doc.font("Helvetica-Bold").text("Ack Date", 46, irnY + 42);
    doc.font("Helvetica").text(`: ${new Date(order.createdAt).toLocaleDateString("en-IN")} 11:32 AM`, 90, irnY + 42);
    
    // QR Code for e-Invoice
    let customerQrBuffer;
    try {
      customerQrBuffer = await QRCode.toBuffer(`IRN:${mockIrn}|Order:${order._id}|Total:Rs ${order.totalPrice}`, { margin: 1, width: 60 });
    } catch (e) {
      customerQrBuffer = null;
    }
    
    if (customerQrBuffer) {
      doc.image(customerQrBuffer, 480, irnY + 7, { width: 60 });
    } else {
      doc.rect(480, irnY + 7, 60, 60).stroke("#cccccc");
    }
    
    // Footer note
    doc.fillColor("#888888").font("Helvetica").fontSize(7).text("Note: This is a computer generated invoice and does not require a physical signature.", 40, irnY + 85, { align: "center", width: 515 });

    // Terms & Conditions (admin-managed, TermsCondition type: 'product_purchase') —
    // shown after all invoice details, since pdfkit auto-wraps/paginates doc.text
    // this is safe for arbitrarily long admin-authored content.
    if (termsContent) {
      const termsY = irnY + 85 + 25;
      doc.moveTo(40, termsY - 10).lineTo(555, termsY - 10).strokeColor("#cccccc").stroke();
      doc.fillColor("#e11d48").font("Helvetica-Bold").fontSize(8).text("TERMS & CONDITIONS", 40, termsY);
      doc.fillColor("#444444").font("Helvetica").fontSize(7).text(termsContent, 40, termsY + 14, { width: 515, align: "left" });
    }

    doc.end();
    return new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
    });
  }
}

module.exports = new InvoicePdfService();
