const mongoose = require("mongoose");
const Order = require("../models/Order");
const Seller = require("../models/Seller");
const SystemSettings = require("../models/SystemSettings");
const invoicePdfService = require("../services/invoicePdfService");
const { generateInvoiceNumbers } = require("../utils/invoiceNumberGenerator");
const { getProductPurchaseTermsContent } = require("../utils/getProductPurchaseTerms");

// Order pages display the short "ORD-<last 8 chars>" form, not the full Mongo _id,
// so an invalid/truncated id here is a routine mistake rather than a server error.
const isOrderNotFoundError = (error) => error.name === "CastError" && error.kind === "ObjectId";

// Standard sample data for the admin's invoice-template preview — lets the admin see how
// their template settings (logo, GST, footer text) render without needing a real order,
// and lets them check both GST split styles by switching supply type.
const buildSampleOrder = (supplyType) => {
  const isInterState = supplyType === "inter-state";
  const itemsPrice = 32000;
  const taxRate = 18;
  const taxAmount = Math.round(itemsPrice * (taxRate / 100));

  return {
    _id: new mongoose.Types.ObjectId(),
    createdAt: new Date(),
    sellerInvoiceNumber: "SAMPLE/24-25/0001",
    marketplaceInvoiceNumber: "SAMPLE/24-25/0001",
    eWayBillNumber: "2517 6458 3210",
    isPaid: true,
    taxType: isInterState ? "inter-state" : "intra-state",
    itemsPrice,
    taxAmount,
    cgst: isInterState ? 0 : taxRate / 2,
    sgst: isInterState ? 0 : taxRate / 2,
    igst: isInterState ? taxRate : 0,
    totalPrice: itemsPrice + taxAmount,
    orderItems: [
      { name: "Premium Wooden Wardrobe", quantity: 1, price: 15000, product: { hsnCode: "9403" } },
      { name: "Modular Study Table", quantity: 2, price: 8500, product: { hsnCode: "9403" } }
    ],
    shippingAddress: {
      fullName: "Sample Customer",
      mobileNumber: "9876543210",
      pincode: "452001",
      city: isInterState ? "Mumbai" : "Indore",
      state: isInterState ? "Maharashtra" : "Madhya Pradesh",
      fullAddress: "45, Green Park Colony"
    }
  };
};

const buildSampleSeller = () => ({
  shopName: "Sample Furniture Works",
  fullName: "Sample Seller",
  shopAddress: "Plot 12, Industrial Area, Indore, Madhya Pradesh - 452001",
  gstNumber: "23BBBBB1111B1Z6",
  phone: "9998887770",
  email: "seller@example.com",
  bankDetails: { bankName: "Sample Bank", accountNumber: "000123456789", ifscCode: "SMPL0000123" }
});

const resolveSupplyType = (req) => (req.query.supplyType === "inter-state" ? "inter-state" : "intra-state");

// @desc    Download Bill A (Seller to Marketplace Invoice)
// @route   GET /api/invoices/orders/:id/invoice/seller
// @access  Private (Seller/Admin)
const downloadSellerInvoice = async (req, res) => {
  try {
    let order = await Order.findById(req.params.id).populate('orderItems.product', 'hsnCode');
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Auth check: Admin can access, or the seller who owns the order
    if (req.user.role !== "admin" && order.seller.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to access this invoice" });
    }

    // Auto-generate invoice numbers if not already generated
    order = await generateInvoiceNumbers(order);

    const seller = await Seller.findById(order.seller);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller profile not found" });
    }

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = {};
    }

    const pdfBuffer = await invoicePdfService.generateSellerToMarketplaceInvoice(order, seller, settings);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Seller_Invoice_${order.sellerInvoiceNumber.replace(/\//g, "-")}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    if (isOrderNotFoundError(error)) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    console.error("Error generating seller invoice:", error);
    return res.status(500).json({ success: false, message: "Failed to generate invoice", error: error.message });
  }
};

// @desc    Share Seller Invoice (marks shared, unlocks labels, schedules Bill C send)
// @route   POST /api/invoices/orders/:id/invoice/share
// @access  Private (Seller)
const shareSellerInvoice = async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.seller.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to share this invoice" });
    }

    // Auto-generate invoice numbers if not already generated
    order = await generateInvoiceNumbers(order);

    order.sellerInvoiceShared = true;
    order.sellerInvoiceSharedAt = new Date();
    order.labelDownloadEnabled = true;
    order.customerInvoiceSentStatus = "pending"; // marks for background delivery in 5 mins
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Invoice shared successfully. E-Way Bill & Delivery Challan downloads are now unlocked.",
      data: {
        sellerInvoiceShared: order.sellerInvoiceShared,
        sellerInvoiceSharedAt: order.sellerInvoiceSharedAt,
        labelDownloadEnabled: order.labelDownloadEnabled
      }
    });
  } catch (error) {
    if (isOrderNotFoundError(error)) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    console.error("Error sharing seller invoice:", error);
    return res.status(500).json({ success: false, message: "Failed to share invoice", error: error.message });
  }
};

// @desc    Download Bill B (E-Way Bill & Label combined PDF)
// @route   GET /api/invoices/orders/:id/invoice/label
// @access  Private (Seller/Admin)
const downloadShippingLabels = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('orderItems.product', 'hsnCode');
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Auth check: admin, the owning seller, or the delivery partner assigned to carry this
    // order (needs the E-Way Bill on hand for transport/handoff).
    const isOwner = req.user.role === "admin"
      || order.seller.toString() === req.user.id
      || (req.user.role === "delivery" && order.deliveryBoy?.toString() === req.user.id);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: "Not authorized to access these labels" });
    }

    // Check if label download is unlocked
    if (!order.labelDownloadEnabled && !order.sellerInvoiceShared) {
      return res.status(400).json({
        success: false,
        message: "Download Label is locked. You must share the tax invoice with marketplace first."
      });
    }

    const seller = await Seller.findById(order.seller);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    const pdfBuffer = await invoicePdfService.generateEWayBillAndLabel(order, seller);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=EWayBill_Label_${order._id.toString().slice(-8).toUpperCase()}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    if (isOrderNotFoundError(error)) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    console.error("Error generating labels:", error);
    return res.status(500).json({ success: false, message: "Failed to generate label documents", error: error.message });
  }
};

// @desc    Download Bill C (Marketplace to Customer Invoice)
// @route   GET /api/invoices/orders/:id/invoice/customer
// @access  Private (Admin only)
const downloadCustomerInvoice = async (req, res) => {
  try {
    let order = await Order.findById(req.params.id).populate('orderItems.product', 'hsnCode');
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Auth check: Admin can access any order's invoice, the customer who placed it, or the
    // delivery partner currently assigned to carry it (needs to show the invoice on handoff).
    const isOwner = req.user.role === "admin"
      || order.user.toString() === req.user.id
      || (req.user.role === "delivery" && order.deliveryBoy?.toString() === req.user.id);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: "Not authorized to access this invoice" });
    }

    // Auto-generate invoice numbers if not already generated
    order = await generateInvoiceNumbers(order);

    const seller = await Seller.findById(order.seller);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = {};
    }

    const termsContent = await getProductPurchaseTermsContent();

    const pdfBuffer = await invoicePdfService.generateMarketplaceToCustomerInvoice(order, seller, settings, termsContent);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Customer_Invoice_${order.marketplaceInvoiceNumber.replace(/\//g, "-")}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    if (isOrderNotFoundError(error)) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    console.error("Error generating customer invoice:", error);
    return res.status(500).json({ success: false, message: "Failed to generate customer invoice", error: error.message });
  }
};

// @desc    Preview Bill A (Seller to Marketplace Invoice) with standard sample data —
//          lets the admin check template settings without needing a real order.
// @route   GET /api/invoices/preview/seller?supplyType=intra-state|inter-state
// @access  Private/Admin
const previewSellerInvoice = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    const order = buildSampleOrder(resolveSupplyType(req));
    const seller = buildSampleSeller();
    let settings = await SystemSettings.findOne();
    if (!settings) settings = {};

    const pdfBuffer = await invoicePdfService.generateSellerToMarketplaceInvoice(order, seller, settings);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=Sample_Seller_Invoice.pdf");
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating sample seller invoice:", error);
    return res.status(500).json({ success: false, message: "Failed to generate sample invoice", error: error.message });
  }
};

// @desc    Preview Bill B (E-Way Bill & Label) with standard sample data.
// @route   GET /api/invoices/preview/label?supplyType=intra-state|inter-state
// @access  Private/Admin
const previewShippingLabels = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    const order = buildSampleOrder(resolveSupplyType(req));
    const seller = buildSampleSeller();

    const pdfBuffer = await invoicePdfService.generateEWayBillAndLabel(order, seller);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=Sample_EWayBill_Label.pdf");
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating sample label documents:", error);
    return res.status(500).json({ success: false, message: "Failed to generate sample label documents", error: error.message });
  }
};

// @desc    Preview Bill C (Marketplace to Customer Invoice) with standard sample data.
// @route   GET /api/invoices/preview/customer?supplyType=intra-state|inter-state
// @access  Private/Admin
const previewCustomerInvoice = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    const order = buildSampleOrder(resolveSupplyType(req));
    const seller = buildSampleSeller();
    let settings = await SystemSettings.findOne();
    if (!settings) settings = {};

    const termsContent = await getProductPurchaseTermsContent();

    const pdfBuffer = await invoicePdfService.generateMarketplaceToCustomerInvoice(order, seller, settings, termsContent);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=Sample_Customer_Invoice.pdf");
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating sample customer invoice:", error);
    return res.status(500).json({ success: false, message: "Failed to generate sample customer invoice", error: error.message });
  }
};

module.exports = {
  downloadSellerInvoice,
  shareSellerInvoice,
  downloadShippingLabels,
  downloadCustomerInvoice,
  previewSellerInvoice,
  previewShippingLabels,
  previewCustomerInvoice
};
