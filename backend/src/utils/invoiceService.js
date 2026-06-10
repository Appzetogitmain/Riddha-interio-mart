const Order = require("../models/Order");
const User = require("../models/User");
const { generateInvoicePDF } = require("./pdfGenerator");
const sendEmail = require("./sendEmail");

/**
 * Generates an invoice PDF, saves it to the DB, and emails it to the user.
 * Designed to run asynchronously so it doesn't block the API response.
 *
 * @param {String} orderId - The ID of the order
 * @param {String} userId - The ID of the user who placed the order
 */
const processInvoiceAsync = async (orderId, userId) => {
  try {
    console.log(
      `[INVOICE_SERVICE] Starting invoice process for order ${orderId}`,
    );

    // Fetch full order and user data needed for PDF and Email
    const order = await Order.findById(orderId);
    const user = await User.findById(userId);

    if (!order || !user) {
      console.error(
        `[INVOICE_SERVICE] Order or User not found for orderId ${orderId}`,
      );
      return;
    }

    // 1. Generate PDF & Upload to Cloudinary
    console.log(`[INVOICE_SERVICE] Generating PDF for order ${orderId}`);
    const invoiceUrl = await generateInvoicePDF(order, user);

    console.log(`[INVOICE_SERVICE] PDF Generated and uploaded: ${invoiceUrl}`);

    // 2. Save URL to Order Model
    order.invoiceUrl = invoiceUrl;
    await order.save();
    console.log(`[INVOICE_SERVICE] Saved invoice URL to database`);

    // 3. Send Email to User
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #189D91;">Thank you for your order!</h2>
        <p>Hi ${user.fullName || "Customer"},</p>
        <p>Your order <strong>#${orderId.toString().slice(-8).toUpperCase()}</strong> has been confirmed and is currently being processed.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order Summary</h3>
          <p><strong>Total Amount:</strong> ₹${order.totalPrice.toLocaleString()}</p>
          <p><strong>Status:</strong> ${order.status}</p>
        </div>

        <p>Your official tax invoice has been generated. You can download or view it using the link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invoiceUrl}" target="_blank" style="background-color: #189D91; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View / Download Invoice</a>
        </div>

        <p>If you have any questions, feel free to reply to this email.</p>
        <br/>
        <p>Best regards,<br/><strong>Riddha Interior Mart</strong></p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: `Invoice for your order #${orderId.toString().slice(-8).toUpperCase()} from Riddha Mart`,
      message: `Your order #${orderId.toString().slice(-8).toUpperCase()} is confirmed. View your invoice here: ${invoiceUrl}`,
      html: emailHtml,
    });

    console.log(`[INVOICE_SERVICE] Invoice email sent to ${user.email}`);
  } catch (error) {
    console.error(
      `[INVOICE_SERVICE] Failed to process invoice for order ${orderId}:`,
      error,
    );
  }
};

module.exports = {
  processInvoiceAsync,
};
