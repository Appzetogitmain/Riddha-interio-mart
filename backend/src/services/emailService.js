const nodemailer = require('nodemailer');
const EmailQueue = require('../models/EmailQueue');
const templates = require('../utils/emailTemplates');
const path = require('path');

class EmailService {
  constructor() {
    this.primaryTransporter = null;
    this.fallbackTransporter = null;
    this.isProcessing = false;
    this.initializeTransporters();
  }

  initializeTransporters() {
    // Configure Primary Transporter (e.g. SMTP from ENV or Mailtrap)
    const host = process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io';
    const port = parseInt(process.env.SMTP_PORT || '2525');
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    this.primaryTransporter = nodemailer.createTransport({
      host,
      port,
      auth: user ? { user, pass } : null,
      pool: true,
      maxConnections: 5,
      rateLimit: 10 // max 10 messages per second
    });

    // Configure Fallback Transporter (local fallback or mock backup SMTP)
    this.fallbackTransporter = nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: 'backup-mock-user',
        pass: 'backup-mock-pass'
      }
    });

    console.log('[EmailService] Transporter Pools initialized.');
  }

  /**
   * Directly sends mail with primary and fallback transporters
   */
  async sendMailDirect(to, subject, htmlContent, attachments = []) {
    const from = process.env.FROM_EMAIL || 'noreply@riddhamart.com';
    
    try {
      // Try primary
      await this.primaryTransporter.sendMail({
        from,
        to,
        subject,
        html: htmlContent,
        attachments
      });
      return { success: true, provider: 'primary' };
    } catch (primaryErr) {
      console.warn('[EmailService] Primary transporter failed. Retrying fallback...', primaryErr.message);
      
      try {
        // Try fallback
        await this.fallbackTransporter.sendMail({
          from: 'fallback@riddhamart.com',
          to,
          subject,
          html: htmlContent,
          attachments
        });
        return { success: true, provider: 'fallback' };
      } catch (fallbackErr) {
        console.error('[EmailService] All email transporters failed.');
        throw new Error(`SMTP Outbound Error: ${fallbackErr.message}`);
      }
    }
  }

  /**
   * Generates and sends terms & conditions & privacy policy PDF to registered users
   */
  async sendRegistrationDocuments(to, fullName, roleType, signatureBase64 = '') {
    try {
      const TermsCondition = require('../models/TermsCondition');
      const SystemSettings = require('../models/SystemSettings');
      const { generateAgreementPDF } = require('../utils/documentPdfGenerator');

      // Fetch Terms & Conditions
      let terms = await TermsCondition.findOne({ type: roleType });
      let termsText = terms ? terms.content : `Welcome to Riddha Interior Mart. These are the default ${roleType} terms and conditions.`;

      // Fetch Privacy Policy
      let privacy = await TermsCondition.findOne({ type: `${roleType}_privacy` });
      let privacyText = privacy ? privacy.content : `Welcome to Riddha Interior Mart. This is the default ${roleType} privacy policy.`;

      // Fetch admin-configured document header/footer
      const settings = await SystemSettings.findOne();
      const docSettings = settings?.documentTemplateSettings;

      // Generate the PDF
      const pdfBuffer = await generateAgreementPDF(roleType, termsText, privacyText, fullName, signatureBase64, docSettings);

      // Email template body
      const roleLabel = roleType === 'user' ? 'Customer' : roleType === 'seller' ? 'Seller' : 'Delivery Partner';
      const subject = `Riddha Mart - ${roleLabel} Terms & Conditions and Privacy Policy`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #718096; padding: 20px; text-align: center;">
            <img src="cid:riddhalogo" alt="Riddha Interior Mart" style="max-height: 60px; max-width: 100%; object-fit: contain; margin: 0 auto; display: block;" />
          </div>
          <div style="padding: 30px;">
            <p>Dear ${fullName},</p>
            <p>Thank you for registering with Riddha Interior Mart as a <strong>${roleLabel}</strong>!</p>
            <p>As part of our onboarding process, we have attached a copy of our current <strong>Terms & Conditions</strong> and <strong>Privacy Policy</strong> for your reference.</p>
            <p>Please review these documents carefully. By using our platform and services, you agree to abide by these guidelines and policies.</p>
            <p>If you have any questions or require support, feel free to reply to this email or contact us at <a href="mailto:support@riddhamart.com" style="color: #c5a880; text-decoration: none; font-weight: bold;">support@riddhamart.com</a>.</p>
            <br/>
            <p>Best regards,<br/><strong>Team Riddha</strong></p>
          </div>
          <div style="background-color: #f7fafc; padding: 15px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #e2e8f0;">
            This is an automated email. Please do not reply directly if you wish to write to support.
          </div>
        </div>
      `;

      const logoPath = path.resolve(__dirname, '../../../frontend/public/logo.png');
      const attachments = [
        {
          filename: `Riddha_${roleLabel}_Agreements.pdf`,
          content: pdfBuffer
        },
        {
          filename: 'logo.png',
          path: logoPath,
          cid: 'riddhalogo'
        }
      ];

      // Send the email directly
      await this.sendMailDirect(to, subject, htmlContent, attachments);
      console.log(`[EmailService] Sent agreement documents PDF to ${to}`);
    } catch (err) {
      console.error(`[EmailService] Failed to send registration documents to ${to}:`, err.message);
    }
  }

  /**
   * Generates and sends customer tax invoice (Bill C) via email
   */
  async sendCustomerInvoiceEmail(to, order, pdfBuffer) {
    try {
      const subject = `Tax Invoice - Order #${order._id.toString().slice(-8).toUpperCase()} - Riddha Interior Mart`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #e11d48; padding: 20px; text-align: center;">
            <span style="color: #ffffff; font-size: 20px; font-weight: bold; letter-spacing: 1px;">RIDDHA INTERIOR MART</span>
          </div>
          <div style="padding: 30px;">
            <p>Dear Customer,</p>
            <p>Thank you for shopping with Riddha Interior Mart!</p>
            <p>We are pleased to share the Tax Invoice for your recent purchase (Order ID: <strong>#${order._id.toString().toUpperCase()}</strong>).</p>
            <p>The total amount of <strong>Rs. ${order.totalPrice.toLocaleString()}</strong> has been processed successfully.</p>
            <p>Please find the attached PDF invoice for your records.</p>
            <br/>
            <p>Best regards,<br/><strong>Team Riddha</strong></p>
          </div>
          <div style="background-color: #f7fafc; padding: 15px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #e2e8f0;">
            This is an automated email. Please do not reply directly.
          </div>
        </div>
      `;

      const attachments = [
        {
          filename: `Invoice_${order.marketplaceInvoiceNumber ? order.marketplaceInvoiceNumber.replace(/\//g, '-') : order._id}.pdf`,
          content: pdfBuffer
        }
      ];

      await this.sendMailDirect(to, subject, htmlContent, attachments);
      console.log(`[EmailService] Sent Customer Tax Invoice PDF to ${to}`);
    } catch (err) {
      console.error(`[EmailService] Failed to send customer tax invoice email to ${to}:`, err.message);
      throw err;
    }
  }

  /**
   * Enqueues a new transactional email job
   */
  async queueEmail(to, subject, templateName, templateData) {
    const job = await EmailQueue.create({
      to,
      subject,
      templateName,
      templateData,
      status: 'pending'
    });
    
    // Proactively kick off queue processing in background thread
    this.processEmailQueue().catch(err => console.error('[EmailQueue] Processing failed:', err.message));
    return job;
  }

  /**
   * Cron-style/interval daemon that processes pending email jobs in queue
   */
  async processEmailQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Find all pending/failed jobs due for retry
      const jobs = await EmailQueue.find({
        status: { $in: ['pending', 'failed'] },
        attempts: { $lt: 3 },
        nextAttemptAt: { $lte: new Date() }
      }).limit(10);

      for (const job of jobs) {
        job.status = 'processing';
        job.attempts += 1;
        await job.save();

        try {
          // Resolve template HTML content dynamically
          let html = '';
          switch (job.templateName) {
            case 'otp':
              html = templates.getOtpTemplate(job.templateData.otp);
              break;
            case 'welcome':
              html = templates.getWelcomeTemplate(job.templateData.fullName);
              break;
            case 'reset_password':
              html = templates.getPasswordResetTemplate(job.templateData.resetUrl);
              break;
            case 'seller_approval':
              html = templates.getSellerApprovalTemplate(job.templateData.shopName, job.templateData.status);
              break;
            case 'order_confirmation':
              html = templates.getOrderConfirmationTemplate(job.templateData.order);
              break;
            case 'refund':
              html = templates.getRefundTemplate(job.templateData.order, job.templateData.refundAmount);
              break;
            default:
              html = `<p>${job.subject}</p><pre>${JSON.stringify(job.templateData, null, 2)}</pre>`;
          }

          // Trigger direct SMTP call
          const logoPath = path.resolve(__dirname, '../../../frontend/public/logo.png');
          await this.sendMailDirect(job.to, job.subject, html, [
            {
              filename: 'logo.png',
              path: logoPath,
              cid: 'riddhalogo'
            }
          ]);

          job.status = 'sent';
          await job.save();
          console.log(`[EmailQueue] Successfully sent job #${job._id} to ${job.to}`);

        } catch (jobErr) {
          console.error(`[EmailQueue] Failed attempt #${job.attempts} for job #${job._id}:`, jobErr.message);
          
          job.lastError = jobErr.message;
          
          if (job.attempts >= job.maxAttempts) {
            // Move to dead letter status
            job.status = 'failed';
          } else {
            // Exponential backoff retry lock
            const minutesBackoff = Math.pow(2, job.attempts);
            job.nextAttemptAt = new Date(Date.now() + minutesBackoff * 60 * 1000);
            job.status = 'failed';
          }
          await job.save();
        }
      }
    } catch (err) {
      console.error('[EmailQueue] Error processing queue:', err.message);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Starts the background daemon interval loops
   */
  startDaemon() {
    setInterval(() => {
      this.processEmailQueue().catch(err => console.error('[EmailDaemon] loop failed:', err.message));
    }, 15000); // scan queue every 15 seconds
    console.log('[EmailDaemon] Background queue scanner daemon active.');
  }
}

module.exports = new EmailService();
