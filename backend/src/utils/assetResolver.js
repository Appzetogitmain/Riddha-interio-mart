const path = require('path');
const fs = require('fs');

/**
 * Asset Resolver for Email Attachments and External Media (e.g. WhatsApp Cloud API)
 */
class AssetResolver {
  /**
   * Resolves the local absolute filesystem path for Userwellcome.png
   * Checks multiple candidate locations to work across development and production.
   */
  static getWelcomeImagePath() {
    const candidatePaths = [
      path.resolve(__dirname, '../assets/Userwellcome.png'),
      path.resolve(__dirname, '../../../frontend/public/Userwellcome.png'),
      path.resolve(process.cwd(), 'src/assets/Userwellcome.png'),
      path.resolve(process.cwd(), '../frontend/public/Userwellcome.png'),
      path.resolve(process.cwd(), 'uploads/Userwellcome.png')
    ];

    for (const p of candidatePaths) {
      try {
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
          return p;
        }
      } catch (_) {}
    }

    // Default fallback
    return path.resolve(__dirname, '../../../frontend/public/Userwellcome.png');
  }

  /**
   * Resolves the local absolute filesystem path for logo.png
   */
  static getLogoPath() {
    const candidatePaths = [
      path.resolve(__dirname, '../assets/logo.png'),
      path.resolve(__dirname, '../../../frontend/public/logo.png'),
      path.resolve(process.cwd(), 'src/assets/logo.png'),
      path.resolve(process.cwd(), '../frontend/public/logo.png')
    ];

    for (const p of candidatePaths) {
      try {
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
          return p;
        }
      } catch (_) {}
    }

    return path.resolve(__dirname, '../../../frontend/public/logo.png');
  }

  /**
   * Resolves the public URL for Userwellcome.png for WhatsApp Cloud API or external webhooks
   */
  static getWelcomeImageUrl() {
    const customBase = process.env.WHATSAPP_MEDIA_URL_BASE || process.env.PUBLIC_ASSETS_BASE_URL || process.env.FRONTEND_URL || 'https://www.riddhainteriormart.com';
    const cleanBase = customBase.replace(/\/+$/, '');
    return `${cleanBase}/Userwellcome.png`;
  }
}

module.exports = AssetResolver;
