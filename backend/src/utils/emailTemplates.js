const getBaseTemplate = (title, bodyContent) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f7fafc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f7fafc;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      overflow: hidden;
      border: 1px solid #edf2f7;
    }
    .header {
      background: linear-gradient(135deg, #1a365d 0%, #2a4365 100%);
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }
    .content {
      padding: 40px 30px;
      color: #2d3748;
      line-height: 1.6;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #718096;
      border-top: 1px solid #edf2f7;
    }
    .btn {
      display: inline-block;
      background-color: #3182ce;
      color: #ffffff !important;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .highlight-box {
      background-color: #ebf8ff;
      border-left: 4px solid #3182ce;
      padding: 20px;
      border-radius: 0 8px 8px 0;
      margin: 20px 0;
    }
    .price-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .price-table th, .price-table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    .price-table th {
      background-color: #f7fafc;
      color: #4a5568;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Riddha Interior Mart</h1>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Riddha Interior Mart. All rights reserved.</p>
        <p>This is an automated transactional notification. Please do not reply directly to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

exports.getOtpTemplate = (otp) =>
  getBaseTemplate(
    "Verify Your Email Address",
    `
  <h2>Confirm Your Verification Code</h2>
  <p>Thank you for choosing Riddha Interior Mart. Use the verification code below to complete your registration or verification request. This code is valid for exactly <strong>10 minutes</strong>.</p>
  <div class="highlight-box" style="text-align: center;">
    <span style="font-size: 32px; font-weight: 800; letter-spacing: 0.2em; color: #2b6cb0;">${otp}</span>
  </div>
  <p>If you did not request this OTP, please ignore this email or contact support if you suspect unauthorized activity.</p>
  `,
  );

exports.getWelcomeTemplate = (fullName) =>
  getBaseTemplate(
    "Welcome to Riddha Mart!",
    `
  <h2>Welcome aboard, ${fullName}!</h2>
  <p>We are absolutely thrilled to welcome you to <strong>Riddha Interior Mart</strong>, your ultimate destination for premium quality tiles, marbles, and designer sanitaryware.</p>
  <p>Your account is officially active. You can now browse our catalog, save your favorite pieces, and manage checkouts with state-wise GST split breakdowns.</p>
  <div style="text-align: center;">
    <a href="http://localhost:5173" class="btn">Explore the Catalog</a>
  </div>
  `,
  );

exports.getPasswordResetTemplate = (resetUrl) =>
  getBaseTemplate(
    "Reset Your Password",
    `
  <h2>Password Reset Requested</h2>
  <p>You are receiving this email because you (or someone else) requested a password reset for your Riddha Mart account. Click the button below to configure a new password:</p>
  <div style="text-align: center;">
    <a href="${resetUrl}" class="btn">Reset Password</a>
  </div>
  <p>If you did not make this request, your account remains secure and no action is required.</p>
  `,
  );

exports.getSellerApprovalTemplate = (shopName, status) => {
  const isApproved = status === "approved";
  return getBaseTemplate(
    `Seller Application Update`,
    `
    <h2>Application Status: ${status.toUpperCase()}</h2>
    <p>Dear Partner, your application for <strong>${shopName}</strong> has been processed by our administrative team.</p>
    <div class="highlight-box" style="${isApproved ? "background-color: #f0fff4; border-left-color: #38a169;" : "background-color: #fff5f5; border-left-color: #e53e3e;"}">
      <p style="margin: 0; font-weight: bold; color: ${isApproved ? "#276749;" : "#9b2c2c;"}">
        Your merchant status is currently: ${status.toUpperCase()}
      </p>
    </div>
    ${isApproved ? "<p>You can now log in to the merchant panel and start uploading your custom state-wise taxation products catalog!</p>" : "<p>Please contact our partner onboarding desk at partners@riddhamart.com to appeal or resubmit documents.</p>"}
    `,
  );
};

exports.getOrderConfirmationTemplate = (order) =>
  getBaseTemplate(
    "Order Confirmed",
    `
  <h2>Thank you for your order!</h2>
  <p>Your order #${order._id.toString().slice(-8).toUpperCase()} has been successfully processed and is currently being packed by our sellers.</p>
  
  <h3>Order Breakdown</h3>
  <table class="price-table">
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Price</th>
      </tr>
    </thead>
    <tbody>
      ${order.orderItems
        .map(
          (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>₹${item.price}</td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>

  <div class="highlight-box">
    <p style="margin: 5px 0;"><strong>Subtotal:</strong> ₹${order.totalPrice - (order.taxPrice || 0)}</p>
    <p style="margin: 5px 0;"><strong>Tax (GST):</strong> ₹${order.taxPrice || 0}</p>
    <p style="margin: 5px 0; font-size: 18px;"><strong>Grand Total:</strong> <strong>₹${order.totalPrice}</strong></p>
  </div>
  `,
  );

exports.getRefundTemplate = (order, refundAmount) =>
  getBaseTemplate(
    "Refund Confirmed",
    `
  <h2>Refund Processed Successfully</h2>
  <p>We are writing to confirm that a refund has been issued for your order #${order._id.toString().slice(-8).toUpperCase()}.</p>
  
  <div class="highlight-box" style="background-color: #f0fff4; border-left-color: #38a169;">
    <p style="margin: 5px 0; font-size: 18px; color: #276749;"><strong>Refunded Amount:</strong> <strong>₹${refundAmount}</strong></p>
    <p style="margin: 5px 0; color: #276749;">The credit has been routed back to your original source of payment.</p>
  </div>
  `,
  );
