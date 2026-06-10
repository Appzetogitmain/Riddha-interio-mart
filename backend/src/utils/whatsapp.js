/**
 * Sends a WhatsApp notification via CallMeBot.
 * Fire-and-forget — never throws, never blocks the caller.
 * Requires CALLMEBOT_API_KEY and WHATSAPP_ADMIN_PHONE in .env
 */
const sendBulkOrderWhatsApp = async (order) => {
  const apiKey = process.env.CALLMEBOT_API_KEY;
  const phone  = process.env.WHATSAPP_ADMIN_PHONE;

  if (!apiKey || !phone) return; // not configured — skip silently

  const itemLines = (order.items || [])
    .map(i => `• ${i.name} x${i.quantity}`)
    .join('\n');

  const lines = [
    '🛒 *New Bulk Order Inquiry*',
    '',
    `👤 Name  : ${order.name}`,
    `📞 Phone : ${order.phone}`,
    `📧 Email : ${order.email}`,
    '',
    '*Products:*',
    itemLines,
  ];

  if (order.message) {
    lines.push('', `📝 Notes : ${order.message}`);
  }

  lines.push('', `📅 ${new Date().toLocaleDateString('en-IN')} — Riddha Mart`);

  const text = lines.join('\n');
  const url  = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${apiKey}`;

  try {
    await fetch(url);
  } catch (err) {
    console.error('[WhatsApp] Notification failed:', err.message);
  }
};

/**
 * Sends a WhatsApp notification to the admin number (WHATSAPP_ADMIN_PHONE)
 * showing which seller's products are involved in a bulk order.
 */
const sendSellerBulkOrderWhatsApp = async ({ sellerName, customerName, customerPhone, customerEmail, items, message }) => {
  const apiKey = process.env.CALLMEBOT_API_KEY;
  const phone  = process.env.WHATSAPP_ADMIN_PHONE;
  if (!apiKey || !phone) return;

  const itemLines = (items || []).map(i => `• ${i.name} x${i.quantity}`).join('\n');

  const lines = [
    '🏪 *Bulk Order — Seller Breakdown*',
    '',
    `🛍 Seller   : ${sellerName}`,
    `👤 Customer : ${customerName}`,
    `📞 Phone    : ${customerPhone}`,
    `📧 Email    : ${customerEmail}`,
    '',
    "*Seller's Products Ordered:*",
    itemLines,
  ];

  if (message) lines.push('', `📝 Notes : ${message}`);
  lines.push('', `📅 ${new Date().toLocaleDateString('en-IN')} — Riddha Mart`);

  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(lines.join('\n'))}&apikey=${apiKey}`;

  try {
    await fetch(url);
  } catch (err) {
    console.error('[WhatsApp] Seller breakdown notification failed:', err.message);
  }
};

module.exports = { sendBulkOrderWhatsApp, sendSellerBulkOrderWhatsApp };
