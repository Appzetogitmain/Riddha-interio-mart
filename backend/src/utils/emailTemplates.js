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
      background-color: #ffffff;
      padding: 24px 30px;
      text-align: center;
      border-bottom: 1px solid #edf2f7;
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
        <img src="cid:riddhalogo" alt="Riddha Interior Mart" style="max-height: 60px; max-width: 100%; object-fit: contain; margin: 0 auto; display: block;" />
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

exports.getSellerWelcomeTemplate = ({ fullName, shopName, email, portalUrl }) =>
  getBaseTemplate(
    "Welcome to Riddha Interior Mart - Seller Onboarding",
    `
  <div style="text-align: center; margin-bottom: 24px;">
    <img src="cid:userwelcome" alt="Welcome to Riddha Interior Mart" style="width: 100%; max-width: 560px; height: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: block; margin: 0 auto;" />
  </div>

  <h2 style="color: #1a202c; font-size: 22px; font-weight: 800; margin-top: 10px; margin-bottom: 6px;">Welcome aboard, ${fullName || 'Partner'}! 🎉</h2>
  <p style="color: #4a5568; font-size: 15px; margin-top: 0; line-height: 1.6;">
    Congratulations on successfully onboarding <strong>${shopName || 'your store'}</strong> with <strong>Riddha Interior Mart</strong> — India's largest B2B and consumer marketplace for premium interior and construction supplies!
  </p>

  <div class="highlight-box" style="background-color: #f0fdfa; border-left: 4px solid #189D91; padding: 18px 20px; border-radius: 0 10px 10px 0; margin: 24px 0;">
    <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 700; color: #115e59;">✨ What you can do next as a verified seller:</p>
    <ul style="margin: 0; padding-left: 20px; color: #134e4a; font-size: 14px; line-height: 1.7;">
      <li><strong>Showcase Your Catalog:</strong> Upload your products, tile slabs, sanitaryware, paints, and hardware.</li>
      <li><strong>Smart Stock & Pricing:</strong> Manage real-time inventory, B2B wholesale tiers, and state-wise GST taxes.</li>
      <li><strong>AI Assistant Tejas:</strong> Your 24/7 dedicated AI business & stock advisor right in your dashboard.</li>
      <li><strong>Pan-India Reach:</strong> Connect directly with verified contractors, architects, designers, and retail buyers.</li>
    </ul>
  </div>

  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
    <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Your Login Information</p>
    <p style="margin: 4px 0; font-size: 14px; color: #1e293b;"><strong>Registered Email:</strong> ${email}</p>
    <p style="margin: 4px 0; font-size: 14px; color: #1e293b;"><strong>Registered Shop:</strong> ${shopName || 'N/A'}</p>
    <p style="margin: 4px 0; font-size: 12px; color: #64748b;">(Use your registered password configured during onboarding)</p>
  </div>

  <div style="text-align: center; margin: 30px 0 20px 0;">
    <a href="${portalUrl || 'http://localhost:3000/seller/login'}" class="btn" style="background: linear-gradient(135deg, #189D91 0%, #115e59 100%); color: #ffffff !important; padding: 14px 32px; font-size: 15px; font-weight: 700; border-radius: 8px; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(24, 157, 145, 0.35);">
      Access Seller Dashboard →
    </a>
  </div>

  <p style="font-size: 13px; color: #718096; line-height: 1.6; margin-top: 25px;">
    Need help setting up your catalog or have questions? Our partner support team is available at <a href="mailto:support@riddhainteriormart.com" style="color: #189D91; font-weight: 700; text-decoration: none;">support@riddhainteriormart.com</a> or <strong>+91 9230621957</strong>.
  </p>

  <p style="margin-top: 25px; color: #2d3748; font-size: 14px;">
    Best regards,<br/>
    <strong>Seller Onboarding Team</strong><br/>
    <span style="color: #718096; font-size: 13px;">Riddha Interior Mart Pvt Ltd</span><br/>
    <em style="color: #189D91; font-size: 12px; font-weight: 600;">Sell. Grow. Succeed Together.</em>
  </p>
  `,
  );

