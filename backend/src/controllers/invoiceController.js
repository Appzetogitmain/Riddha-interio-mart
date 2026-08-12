const Order = require("../models/Order");
const Seller = require("../models/Seller");
const SystemSettings = require("../models/SystemSettings");
const invoicePdfService = require("../services/invoicePdfService");
const { generateInvoiceNumbers } = require("../utils/invoiceNumberGenerator");

// @desc    Download Bill A (Seller to Marketplace Invoice)
// @route   GET /api/invoices/orders/:id/invoice/seller
// @access  Private (Seller/Admin)
const downloadSellerInvoice = async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);
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
    console.error("Error sharing seller invoice:", error);
    return res.status(500).json({ success: false, message: "Failed to share invoice", error: error.message });
  }
};

// @desc    Download Bill B (E-Way Bill & Label combined PDF)
// @route   GET /api/invoices/orders/:id/invoice/label
// @access  Private (Seller/Admin)
const downloadShippingLabels = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Auth check
    if (req.user.role !== "admin" && order.seller.toString() !== req.user.id) {
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
    console.error("Error generating labels:", error);
    return res.status(500).json({ success: false, message: "Failed to generate label documents", error: error.message });
  }
};

// @desc    Download Bill C (Marketplace to Customer Invoice)
// @route   GET /api/invoices/orders/:id/invoice/customer
// @access  Private (Admin only)
const downloadCustomerInvoice = async (req, res) => {
  try {
    // Only Admin is allowed to access/download Bill C
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only Admin can view/download Customer invoices" });
    }

    let order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
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

    const pdfBuffer = await invoicePdfService.generateMarketplaceToCustomerInvoice(order, seller, settings);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Customer_Invoice_${order.marketplaceInvoiceNumber.replace(/\//g, "-")}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating customer invoice:", error);
    return res.status(500).json({ success: false, message: "Failed to generate customer invoice", error: error.message });
  }
};

module.exports = {
  downloadSellerInvoice,
  shareSellerInvoice,
  downloadShippingLabels,
  downloadCustomerInvoice
};
