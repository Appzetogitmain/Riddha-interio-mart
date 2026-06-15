const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5173';
const OUT = 'C:/Users/Priyank/AppData/Local/Temp/riddha_audit';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const results = [];

async function shot(page, name, note = '') {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`[SHOT] ${name}`);
  return file;
}

async function check(page, name, url, actions = [], expectedText = null) {
  const entry = { name, url, status: 'PASS', issues: [], screenshot: '' };
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
    await page.waitForTimeout(1200);

    // Run any actions
    for (const action of actions) {
      try { await action(page); } catch (e) { entry.issues.push(`Action failed: ${e.message}`); }
    }

    // Check for JS errors baked into console
    if (expectedText) {
      const content = await page.content();
      if (!content.includes(expectedText)) {
        entry.issues.push(`Expected text "${expectedText}" not found`);
      }
    }

    // Check for broken/empty page
    const bodyText = await page.evaluate(() => document.body?.innerText?.trim() || '');
    if (bodyText.length < 10) {
      entry.issues.push('Page appears empty or failed to render');
      entry.status = 'FAIL';
    }

    entry.screenshot = await shot(page, name);
  } catch (e) {
    entry.status = 'FAIL';
    entry.issues.push(e.message);
    try { entry.screenshot = await shot(page, name + '_error'); } catch (_) {}
  }
  results.push(entry);
  return entry;
}

async function loginAs(page, role, email, password) {
  const loginUrl = role === 'user' ? `${BASE}/login`
    : role === 'seller' ? `${BASE}/seller/login-form`
    : role === 'admin' ? `${BASE}/admin/login`
    : `${BASE}/delivery/login`;

  await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
  await page.waitForTimeout(800);

  // Fill email/identifier
  const emailSel = ['input[type="email"]', 'input[type="text"]', 'input[placeholder*="mail"]', 'input[placeholder*="Phone"]'];
  for (const sel of emailSel) {
    const el = page.locator(sel).first();
    if (await el.count()) { await el.fill(email); break; }
  }
  // Fill password
  const pwSel = ['input[type="password"]'];
  for (const sel of pwSel) {
    const el = page.locator(sel).first();
    if (await el.count()) { await el.fill(password); break; }
  }
  // Submit
  const btnSel = ['button[type="submit"]', 'button:has-text("Login")', 'button:has-text("LOGIN")', 'button:has-text("Sign In")'];
  for (const sel of btnSel) {
    const el = page.locator(sel).first();
    if (await el.count()) { await el.click(); break; }
  }
  await page.waitForTimeout(2500);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Collect console errors per page
  const consoleErrors = {};
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const url = page.url();
      if (!consoleErrors[url]) consoleErrors[url] = [];
      consoleErrors[url].push(msg.text());
    }
  });

  // ── PUBLIC USER PAGES ─────────────────────────────────────
  console.log('\n=== PUBLIC PAGES ===');
  await check(page, '01_splash', `${BASE}/splash`);
  await check(page, '02_onboarding', `${BASE}/onboarding`);
  await check(page, '03_login', `${BASE}/login`);
  await check(page, '04_signup', `${BASE}/signup`);
  await check(page, '05_forgot_password', `${BASE}/forgot-password`);

  // ── HOME (via session storage trick) ──────────────────────
  await page.evaluate(() => sessionStorage.setItem('splashCompleted', 'true'));
  await check(page, '06_homepage', `${BASE}/`);
  await check(page, '07_products', `${BASE}/products`);
  await check(page, '08_categories', `${BASE}/categories`);
  await check(page, '09_brands', `${BASE}/brands`);
  await check(page, '10_cart', `${BASE}/cart`);
  await check(page, '11_wishlist', `${BASE}/wishlist`);
  await check(page, '12_profile', `${BASE}/profile`);
  await check(page, '13_orders', `${BASE}/orders`);
  await check(page, '14_search', `${BASE}/search`);
  await check(page, '15_shop', `${BASE}/shop`);
  await check(page, '16_stores', `${BASE}/stores`);
  await check(page, '17_about', `${BASE}/about`);
  await check(page, '18_contact', `${BASE}/contact`);
  await check(page, '19_terms', `${BASE}/terms`);
  await check(page, '20_cancellation', `${BASE}/policies/cancellation`);
  await check(page, '21_returns', `${BASE}/policies/returns`);
  await check(page, '22_refund', `${BASE}/policies/refund`);
  await check(page, '23_referral', `${BASE}/referral`);
  await check(page, '24_notifications', `${BASE}/notifications`);

  // ── USER LOGIN & PROTECTED PAGES ──────────────────────────
  console.log('\n=== USER LOGIN FLOW ===');
  await loginAs(page, 'user', 'user1@gmail.com', '12345');
  await shot(page, '25_user_after_login');
  const userLoginResult = { name: '25_user_login_flow', url: `${BASE}/login`, status: 'INFO', issues: [], screenshot: '' };
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    userLoginResult.issues.push('Login may have failed - still on login page');
    userLoginResult.status = 'WARN';
  } else {
    userLoginResult.status = 'PASS';
  }
  userLoginResult.screenshot = `${OUT}/25_user_after_login.png`;
  results.push(userLoginResult);

  await check(page, '26_checkout', `${BASE}/checkout`);
  await check(page, '27_address', `${BASE}/address`);
  await check(page, '28_payment', `${BASE}/payment`);
  await check(page, '29_addresses', `${BASE}/addresses`);
  await check(page, '30_edit_profile', `${BASE}/profile/edit`);
  await check(page, '31_contractor_reg', `${BASE}/contractor-registration`);
  await check(page, '32_designer_reg', `${BASE}/designer-registration`);
  await check(page, '33_builder_reg', `${BASE}/builder-registration`);
  await check(page, '34_referral_rewards', `${BASE}/referral-rewards`);

  // ── SELLER PAGES ──────────────────────────────────────────
  console.log('\n=== SELLER PAGES ===');
  await check(page, '35_seller_join', `${BASE}/seller/join`);
  await check(page, '36_seller_login', `${BASE}/seller/login`);
  await check(page, '37_seller_login_form', `${BASE}/seller/login-form`);
  await check(page, '38_seller_signup', `${BASE}/seller/signup`);
  await check(page, '39_seller_terms', `${BASE}/seller/terms`);

  await loginAs(page, 'seller', 'seller1@gmail.com', '12345');
  await shot(page, '40_seller_after_login');
  const sellerUrl = page.url();
  const sellerLoginResult = { name: '40_seller_login_flow', url: `${BASE}/seller/login-form`, status: sellerUrl.includes('dashboard') ? 'PASS' : 'WARN', issues: sellerUrl.includes('login') ? ['Still on login - credentials may be wrong'] : [], screenshot: `${OUT}/40_seller_after_login.png` };
  results.push(sellerLoginResult);

  await check(page, '41_seller_dashboard', `${BASE}/seller/dashboard`);
  await check(page, '42_seller_orders', `${BASE}/seller/orders`);
  await check(page, '43_seller_products', `${BASE}/seller/my-products`);
  await check(page, '44_seller_add_product', `${BASE}/seller/add-product`);
  await check(page, '45_seller_wallet', `${BASE}/seller/wallet`);
  await check(page, '46_seller_stock', `${BASE}/seller/stock-management`);
  await check(page, '47_seller_catalog', `${BASE}/seller/catalog`);
  await check(page, '48_seller_profile', `${BASE}/seller/profile`);
  await check(page, '49_seller_notifications', `${BASE}/seller/notifications`);
  await check(page, '50_seller_reviews', `${BASE}/seller/reviews`);
  await check(page, '51_seller_customers', `${BASE}/seller/customers`);
  await check(page, '52_seller_marketing', `${BASE}/seller/marketing`);
  await check(page, '53_seller_help', `${BASE}/seller/help`);
  await check(page, '54_seller_bulk_upload', `${BASE}/seller/bulk-upload`);
  await check(page, '55_seller_bulk_orders', `${BASE}/seller/bulk-orders`);
  await check(page, '56_seller_sales_report', `${BASE}/seller/reports/sales`);
  await check(page, '57_seller_return_orders', `${BASE}/seller/return`);

  // ── ADMIN PAGES ───────────────────────────────────────────
  console.log('\n=== ADMIN PAGES ===');
  await check(page, '58_admin_login', `${BASE}/admin/login`);

  await loginAs(page, 'admin', 'admin@riddhamart.com', 'Admin@123');
  await shot(page, '59_admin_after_login');
  const adminUrl = page.url();
  const adminLoginResult = { name: '59_admin_login_flow', url: `${BASE}/admin/login`, status: adminUrl.includes('dashboard') ? 'PASS' : 'WARN', issues: adminUrl.includes('login') ? ['Still on login - check credentials'] : [], screenshot: `${OUT}/59_admin_after_login.png` };
  results.push(adminLoginResult);

  await check(page, '60_admin_dashboard', `${BASE}/admin/dashboard`);
  await check(page, '61_admin_catalog', `${BASE}/admin/catalog`);
  await check(page, '62_admin_inventory', `${BASE}/admin/inventory`);
  await check(page, '63_admin_categories', `${BASE}/admin/categories`);
  await check(page, '64_admin_orders_all', `${BASE}/admin/orders/all`);
  await check(page, '65_admin_orders_pending', `${BASE}/admin/orders/pending`);
  await check(page, '66_admin_sellers', `${BASE}/admin/sellers`);
  await check(page, '67_admin_customers', `${BASE}/admin/customers`);
  await check(page, '68_admin_delivery', `${BASE}/admin/delivery`);
  await check(page, '69_admin_analytics', `${BASE}/admin/analytics`);
  await check(page, '70_admin_manage_hero', `${BASE}/admin/manage-hero`);
  await check(page, '71_admin_manage_promo', `${BASE}/admin/manage-promo`);
  await check(page, '72_admin_manage_featured', `${BASE}/admin/manage-featured`);
  await check(page, '73_admin_manage_brands', `${BASE}/admin/manage-brands`);
  await check(page, '74_admin_manage_grid', `${BASE}/admin/manage-grid`);
  await check(page, '75_admin_payments_users', `${BASE}/admin/payments/users`);
  await check(page, '76_admin_payments_sellers', `${BASE}/admin/payments/sellers`);
  await check(page, '77_admin_payments_delivery', `${BASE}/admin/payments/delivery`);
  await check(page, '78_admin_referrals', `${BASE}/admin/referrals`);
  await check(page, '79_admin_team', `${BASE}/admin/team`);
  await check(page, '80_admin_settings', `${BASE}/admin/settings`);
  await check(page, '81_admin_feedback', `${BASE}/admin/feedback`);
  await check(page, '82_admin_support', `${BASE}/admin/support-tickets`);
  await check(page, '83_admin_product_batches', `${BASE}/admin/product-batches`);
  await check(page, '84_admin_bulk_orders', `${BASE}/admin/bulk-orders`);
  await check(page, '85_admin_profile', `${BASE}/admin/profile`);
  await check(page, '86_admin_activity', `${BASE}/admin/activity`);

  // ── DELIVERY PAGES ────────────────────────────────────────
  console.log('\n=== DELIVERY PAGES ===');
  await check(page, '87_delivery_landing', `${BASE}/delivery`);
  await check(page, '88_delivery_login', `${BASE}/delivery/login`);
  await check(page, '89_delivery_signup', `${BASE}/delivery/signup`);
  await check(page, '90_delivery_terms', `${BASE}/delivery/terms`);

  await loginAs(page, 'delivery', 'delivery1@gmail.com', '12345');
  await shot(page, '91_delivery_after_login');
  const deliveryUrl = page.url();
  const deliveryLoginResult = { name: '91_delivery_login_flow', url: `${BASE}/delivery/login`, status: deliveryUrl.includes('dashboard') ? 'PASS' : 'WARN', issues: deliveryUrl.includes('login') ? ['Still on login - check credentials'] : [], screenshot: `${OUT}/91_delivery_after_login.png` };
  results.push(deliveryLoginResult);

  await check(page, '92_delivery_dashboard', `${BASE}/delivery/dashboard`);
  await check(page, '93_delivery_orders', `${BASE}/delivery/orders`);
  await check(page, '94_delivery_history', `${BASE}/delivery/delivery-history`);
  await check(page, '95_delivery_earnings', `${BASE}/delivery/earnings`);
  await check(page, '96_delivery_wallet', `${BASE}/delivery/wallet`);
  await check(page, '97_delivery_profile', `${BASE}/delivery/profile`);
  await check(page, '98_delivery_settings', `${BASE}/delivery/settings`);
  await check(page, '99_delivery_help', `${BASE}/delivery/help`);
  await check(page, '100_delivery_notifications', `${BASE}/delivery/notifications`);

  // ── INTERACTIVE TESTS ─────────────────────────────────────
  console.log('\n=== INTERACTIVE TESTS ===');

  // Test Login with wrong credentials
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); document.cookie.split(";").forEach(c => { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); }); });
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const emailInput = page.locator('input[type="text"], input[placeholder*="Phone"]').first();
  if (await emailInput.count()) await emailInput.fill('wrong@email.com');
  const pwInput = page.locator('input[type="password"]').first();
  if (await pwInput.count()) await pwInput.fill('wrongpass');
  const submitBtn = page.locator('button[type="submit"]').first();
  if (await submitBtn.count()) await submitBtn.click();
  await page.waitForTimeout(2000);
  await shot(page, 'INT01_login_wrong_credentials');
  const loginError = await page.evaluate(() => document.body.innerText);
  results.push({ name: 'INT01_Login Error State', url: `${BASE}/login`, status: loginError.toLowerCase().includes('invalid') || loginError.toLowerCase().includes('error') ? 'PASS' : 'WARN', issues: loginError.toLowerCase().includes('invalid') ? [] : ['No error message shown for wrong credentials'], screenshot: `${OUT}/INT01_login_wrong_credentials.png` });

  // Test Signup form validation
  await page.goto(`${BASE}/signup`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const signupBtn = page.locator('button[type="submit"]').first();
  if (await signupBtn.count()) await signupBtn.click();
  await page.waitForTimeout(1500);
  await shot(page, 'INT02_signup_empty_submit');
  results.push({ name: 'INT02_Signup Empty Validation', url: `${BASE}/signup`, status: 'INFO', issues: [], screenshot: `${OUT}/INT02_signup_empty_submit.png` });

  // Test Cart flow
  await page.evaluate(() => sessionStorage.setItem('splashCompleted', 'true'));
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await shot(page, 'INT03_homepage_loaded');
  results.push({ name: 'INT03_Homepage Render', url: `${BASE}/`, status: 'INFO', issues: [], screenshot: `${OUT}/INT03_homepage_loaded.png` });

  // Check mobile viewport
  await ctx.close();
  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.evaluate(() => sessionStorage.setItem('splashCompleted', 'true'));
  await mobilePage.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 12000 });
  await mobilePage.waitForTimeout(1500);
  await mobilePage.screenshot({ path: `${OUT}/MOB01_homepage_mobile.png`, fullPage: false });
  await mobilePage.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: `${OUT}/MOB02_login_mobile.png`, fullPage: false });
  await mobilePage.goto(`${BASE}/products`, { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForTimeout(1200);
  await mobilePage.screenshot({ path: `${OUT}/MOB03_products_mobile.png`, fullPage: false });
  await mobilePage.goto(`${BASE}/cart`, { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: `${OUT}/MOB04_cart_mobile.png`, fullPage: false });
  console.log('[MOBILE] 4 mobile screenshots captured');
  await mobileCtx.close();

  await browser.close();

  // Write results JSON
  fs.writeFileSync(`${OUT}/results.json`, JSON.stringify({ results, consoleErrors }, null, 2));

  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const warn = results.filter(r => r.status === 'WARN').length;
  const info = results.filter(r => r.status === 'INFO').length;
  console.log(`\n===== SUMMARY =====`);
  console.log(`PASS: ${pass} | WARN: ${warn} | FAIL: ${fail} | INFO: ${info} | TOTAL: ${results.length}`);
  console.log(`Results saved to ${OUT}/results.json`);
  console.log(`Screenshots saved to ${OUT}/`);
})();
