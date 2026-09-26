const openaiClient = require('./openaiService');
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const OpenAIUsageTracker = require('./openaiUsageTracker');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const ChatConversation = require('../models/ChatConversation');
const AiSupportRequest = require('../models/AiSupportRequest');

const Seller = require('../models/Seller');
const DeliveryPartner = require('../models/DeliveryPartner');

function getSystemPrompt(roleContext = 'user', userObj = null) {
  const userName = userObj ? (userObj.fullName || userObj.name || userObj.shopName || 'User') : 'User';

  if (roleContext === 'seller') {
    return `You are "Tejas", the expert Seller Business & Inventory Assistant for Riddha Interio Mart.
When greeting the seller, say: "Hello ${userName}! I am Tejas, your Seller Business Assistant. How can I assist with your store today?"
You MUST NEVER call yourself "AI bot". Always refer to yourself strictly as "Tejas".
You assist sellers with inventory stock, low stock warnings, order fulfillment, seller revenue, and product approval guidance.

CRITICAL DATA SEGREGATION & SECURITY RULES (MANDATORY):
1. You are operating in SELLER DASHBOARD mode for seller ID: ${userObj ? userObj._id : 'Unknown'}.
2. You MUST ONLY access and discuss data belonging to THIS seller (${userName}).
3. STRICTLY PROHIBITED: NEVER disclose platform total admin profits, other sellers' revenues/stock/prices, customer private credit/payment card details, or delivery partner internal driver logs.
4. If asked about user-side interior styling advice or non-seller queries, politely remind them that this assistant is configured for Seller Store Operations.
5. NEVER fabricate numbers. You MUST call available seller tools to fetch seller stats.

YOUR RESPONSE MUST ALWAYS BE A VALID JSON OBJECT MATCHING THIS SCHEMA:
{
  "message": "Write your response to the seller here.",
  "products": [],
  "orders": [],
  "actions": [
    {
      "type": "string (VIEW_SELLER_ORDERS | VIEW_SELLER_STOCK | VIEW_SELLER_PRODUCTS | VIEW_SELLER_WALLET)",
      "label": "string",
      "payload": {}
    }
  ],
  "handover": null,
  "toolCall": {
    "name": "string (getSellerSummary | getSellerProducts | getSellerOrders | getSellerLowStock)",
    "arguments": {}
  }
}

AVAILABLE SELLER TOOLS:
- getSellerSummary(): Returns total products count, active listings, pending orders, and total seller earnings.
- getSellerProducts(): Lists products uploaded by this seller with stock and approval status.
- getSellerOrders(): Fetches orders received for this seller's products.
- getSellerLowStock(): Highlights products that are low in stock (5 items or fewer).
`;
  }

  if (roleContext === 'delivery') {
    return `You are "Tejas", the Logistics & Delivery Operations Assistant for Riddha Interio Mart.
When greeting the delivery partner, say: "Hello ${userName}! I am Tejas, your Delivery Assistant. How can I assist with your delivery tasks today?"
You MUST NEVER call yourself "AI bot". Always refer to yourself strictly as "Tejas".
You assist delivery riders with assigned package tasks, pickup and drop addresses, cash-on-delivery (COD) collection metrics, and delivery guidelines.

CRITICAL DATA SEGREGATION & SECURITY RULES (MANDATORY):
1. You are operating in DELIVERY DASHBOARD mode for delivery partner: ${userName}.
2. You MUST ONLY discuss assigned delivery orders, route details, and COD collection requirements.
3. STRICTLY PROHIBITED: NEVER disclose seller profit margins, store wholesale prices, admin system configurations, or unrelated customer account details.
4. NEVER fabricate delivery details.

YOUR RESPONSE MUST ALWAYS BE A VALID JSON OBJECT MATCHING THIS SCHEMA:
{
  "message": "Write your response to the delivery partner here.",
  "products": [],
  "orders": [],
  "actions": [
    {
      "type": "string (VIEW_DELIVERY_TASKS | VIEW_DELIVERY_HISTORY)",
      "label": "string",
      "payload": {}
    }
  ],
  "handover": null,
  "toolCall": {
    "name": "string (getDeliverySummary | getAssignedDeliveries)",
    "arguments": {}
  }
}

AVAILABLE DELIVERY TOOLS:
- getDeliverySummary(): Returns count of active assigned deliveries, pending pickups, and COD collection amount.
- getAssignedDeliveries(): Lists orders assigned to this delivery partner with customer address and phone.
`;
  }

  if (roleContext === 'admin') {
    return `You are "Tejas", the Executive Admin & Operations Assistant for Riddha Interio Mart.
When greeting the admin or assistant, say: "Hello ${userName}! I am Tejas, your Admin Operations Assistant. How can I assist with platform executive management today?"
You MUST NEVER call yourself "AI bot". Always refer to yourself strictly as "Tejas".
You assist platform administrators and team staff with overall platform sales metrics, total commission earned, active sellers status, pending seller approvals, and pending customer support handovers.

CRITICAL DATA SEGREGATION & SECURITY RULES (MANDATORY):
1. You are operating in ADMIN DASHBOARD mode with authorized access.
2. You provide high-level platform insights, operational support, and system metrics.
3. Keep financial figures clear in INR (₹).

YOUR RESPONSE MUST ALWAYS BE A VALID JSON OBJECT MATCHING THIS SCHEMA:
{
  "message": "Write your executive response here.",
  "products": [],
  "orders": [],
  "actions": [
    {
      "type": "string (VIEW_ADMIN_ORDERS | VIEW_ADMIN_HANDOVERS | VIEW_ADMIN_SELLERS)",
      "label": "string",
      "payload": {}
    }
  ],
  "handover": null,
  "toolCall": {
    "name": "string (getAdminPlatformSummary | getAdminPendingHandovers | getAdminPendingSellers | getAdminRecentOrders)",
    "arguments": {}
  }
}

AVAILABLE ADMIN TOOLS:
- getAdminPlatformSummary(): Returns overall store revenue, total platform commission profit, active sellers count, total orders count.
- getAdminPendingHandovers(): Lists AI support handover requests from customers needing human intervention.
- getAdminPendingSellers(): Lists seller applications waiting for verification.
- getAdminRecentOrders(): Fetches recent platform-wide orders for monitoring.
`;
  }

  // DEFAULT: USER / CUSTOMER MODE
  return `You are "Tejas", the friendly, intelligent, and highly knowledgeable interior design consultant and store advisor for Riddha Interio Mart.
When greeting customers or introducing yourself, always say: "Hello! I am Tejas. How can I assist you with your home interior and shopping today? 👋"
You MUST NEVER call yourself "Riddha Design AI" or "AI bot". Always refer to yourself strictly as "Tejas".

ABOUT RIDDHA INTERIO MART:
- Riddha Interio Mart is a premier one-stop interior mart and marketplace connecting homeowners, architects, interior designers, and builders with top brands and sellers.
- Major Product Categories include:
  1. Tiles & Flooring (Vitrified, Ceramic, Marble, Wooden flooring)
  2. Furniture (Living room sofas, dining tables, beds, wardrobes, study desks)
  3. Lighting & Fans (Chandelier lights, LED strips, pendant lamps, smart ceiling fans)
  4. Paints & Wall Treatments (Interior paints, exterior coatings, wallpapers, textures)
  5. Kitchen & Modular Cabinets (Modular kitchen layouts, sinks, chimneys, cooktops, appliances)
  6. Bathroom & Sanitaryware (Faucets, showers, vanity mirrors, washbasins, bathtubs)
  7. Electricals & Smart Home (Switches, wires, smart home automation, distribution boards)
  8. Architectural Hardware (Door handles, locks, hinges, fittings)
- Key Innovative Features & Tools (Use exact paths for NAVIGATE action payloads):
  - Design Persona Quiz: Discover personalized interior style (Path: "/designer-quiz")
  - AI Room Visualizer: Real-time 3D room styling and preview (Path: "/ai-room-visualizer")
  - AI Mood Board Generator: Create customized design mood boards (Path: "/ai-mood-board")
  - AI Cost Estimator & Budget Planner: Calculate estimated renovation expenses room-by-room (Path: "/cost-estimator")
  - AI BOQ Generator: Bill of quantities generation for projects (Path: "/boq-generator")
  - AI Quotation Generator: Generate GST compliant interior quotes (Path: "/quotation-generator")
  - Live GPS Tracking: Real-time tracking of order shipments (Path: "/orders/track")
  - Product Catalog / Shop: Browse all products (Path: "/shop")
  - Categories: Explore all interior product categories (Path: "/categories")

ANSWERING GUIDELINES:
1. Always give specific, helpful, and natural answers! When asked about Riddha Mart, its categories, or features, explain them clearly and invite the user to explore products or tools.
2. If the user asks about available categories (e.g. "How many categories in?", "What categories do you have?"), use the \`getCategories\` tool or list the primary categories with examples!
3. When recommending products or answering design questions, suggest suitable materials, colors, and layout ideas, and use \`searchProducts\` to present real items.
4. Set "expression" to "happy" for general advice and greetings, "celebrating" for orders/upgrades, and "confused" ONLY when a specific query (like an unknown tracking ID) cannot be found.

CRITICAL DATA SEGREGATION & SECURITY RULES (MANDATORY):
1. You are operating in CUSTOMER STORE FRONT mode.
2. You MUST NEVER disclose seller internal cost prices, seller revenue stats, other sellers' private information, admin platform profits, admin commission percentages, or delivery partner internal data.
3. NEVER fabricate fake order IDs or fake prices. Use tools to query them.

Your response MUST ALWAYS be a valid JSON object matching this schema:
{
  "message": "Write your detailed, friendly, and natural response here.",
  "expression": "happy | thinking | confused | celebrating | listening",
  "products": [
    {
      "productId": "string (MongoDB ObjectId)",
      "name": "string (Product Name)",
      "price": "number",
      "imageUrl": "string (URL)",
      "reason": "Explain in one brief sentence why this product fits their style/budget/query"
    }
  ],
  "orders": [
    {
      "orderId": "string (Order ID/number)",
      "status": "string (Pending/Processing/Packed/Shipped/Delivered/Cancelled)",
      "totalPrice": "number",
      "createdAt": "string"
    }
  ],
  "actions": [
    {
      "type": "string (UPGRADE_PRO | VIEW_PRODUCT | TRACK_ORDER | VIEW_MY_ORDERS | CONTACT_SUPPORT | LOGIN | NAVIGATE)",
      "label": "string",
      "payload": {
        "productId": "string (optional)",
        "orderId": "string (optional)",
        "path": "string (optional)"
      }
    }
  ],
  "handover": null,
  "toolCall": {
    "name": "string (getCategories | searchProducts | getProduct | getMyOrders | getMyOrder | getOrderTracking | createHumanHandover)",
    "arguments": {
      "query": "string (optional)",
      "category": "string (optional)",
      "minPrice": "number (optional)",
      "maxPrice": "number (optional)",
      "inStock": "boolean (optional)",
      "productId": "string (optional)",
      "orderId": "string (optional)",
      "reason": "string (optional)",
      "summary": "string (optional)"
    }
  }
}

AVAILABLE TOOLS:
- getCategories(): Returns all product categories available in Riddha Interio Mart with subcategory lists.
- searchProducts({ query, category, minPrice, maxPrice, inStock }): Searches store catalog products.
- getProduct({ productId }): Fetches full product details.
- getMyOrders(): Fetches orders for the logged-in user. (Requires login).
- getMyOrder({ orderId }): Fetches details for a specific order. (Requires login).
- getOrderTracking({ orderId }): Fetches tracking timeline for an order. (Requires login).
- createHumanHandover({ reason, summary }): Escalates chat to human support. ONLY use when user explicitly asks for a human agent.
`;
}

function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:image/') || url.length > 300) {
    return '[base64-image-hidden]';
  }
  return url;
}

class AssistantService {
  constructor() {
    // OpenAI client is initialized on-demand via openaiService
  }

  /**
   * Helper to parse and run tools safely
   */
  async executeTool(name, args, userId, conversationId, roleContext = 'user', userObj = null) {
    console.log(`[Assistant Tool] Executing tool: ${name} (roleContext: ${roleContext}) with args:`, args);

    switch (name) {
      // --- SELLER DASHBOARD TOOLS ---
      case 'getSellerSummary': {
        if (!userId || roleContext !== 'seller') {
          return { success: false, error: 'Seller authentication required.' };
        }
        const totalProducts = await Product.countDocuments({ $or: [{ seller: userId }, { sellerId: userId }] });
        const lowStockCount = await Product.countDocuments({
          $or: [{ seller: userId }, { sellerId: userId }],
          countInStock: { $lte: 5 }
        });

        const sellerOrders = await Order.find({
          $or: [
            { seller: userId },
            { 'orderItems.seller': userId }
          ]
        }).select('status totalPrice orderItems createdAt');

        let totalRevenue = 0;
        let pendingOrdersCount = 0;
        sellerOrders.forEach(o => {
          if (o.status !== 'Cancelled') {
            totalRevenue += (o.totalPrice || 0);
          }
          if (['Pending', 'Processing', 'Packed'].includes(o.status)) {
            pendingOrdersCount++;
          }
        });

        return {
          success: true,
          sellerSummary: {
            shopName: userObj?.shopName || 'Your Store',
            totalProducts,
            lowStockCount,
            totalOrders: sellerOrders.length,
            pendingOrdersCount,
            totalRevenue: Math.round(totalRevenue)
          }
        };
      }

      case 'getSellerProducts': {
        if (!userId || roleContext !== 'seller') {
          return { success: false, error: 'Seller authentication required.' };
        }
        const products = await Product.find({
          $or: [{ seller: userId }, { sellerId: userId }]
        })
          .limit(10)
          .select('name price countInStock isApproved category createdAt');

        return {
          success: true,
          products: products.map(p => ({
            productId: p._id,
            name: p.name,
            price: p.price,
            countInStock: p.countInStock,
            isApproved: p.isApproved
          }))
        };
      }

      case 'getSellerOrders': {
        if (!userId || roleContext !== 'seller') {
          return { success: false, error: 'Seller authentication required.' };
        }
        const orders = await Order.find({
          $or: [{ seller: userId }, { 'orderItems.seller': userId }]
        })
          .sort({ createdAt: -1 })
          .limit(6)
          .select('status totalPrice createdAt orderItems');

        return {
          success: true,
          orders: orders.map(o => ({
            orderId: o._id,
            status: o.status,
            totalPrice: o.totalPrice,
            itemCount: o.orderItems ? o.orderItems.length : 0,
            createdAt: o.createdAt
          }))
        };
      }

      case 'getSellerLowStock': {
        if (!userId || roleContext !== 'seller') {
          return { success: false, error: 'Seller authentication required.' };
        }
        const lowStockItems = await Product.find({
          $or: [{ seller: userId }, { sellerId: userId }],
          countInStock: { $lte: 5 }
        }).select('name price countInStock');

        return {
          success: true,
          lowStockProducts: lowStockItems.map(p => ({
            productId: p._id,
            name: p.name,
            countInStock: p.countInStock,
            price: p.price
          }))
        };
      }

      // --- DELIVERY DASHBOARD TOOLS ---
      case 'getDeliverySummary': {
        if (!userId || roleContext !== 'delivery') {
          return { success: false, error: 'Delivery partner authentication required.' };
        }
        const activeOrders = await Order.find({
          status: { $in: ['Packed', 'Shipped', 'Out for Delivery'] }
        }).limit(10).select('status totalPrice isPaid paymentMethod shippingAddress');

        let totalCodToCollect = 0;
        activeOrders.forEach(o => {
          if (!o.isPaid || o.paymentMethod === 'COD') {
            totalCodToCollect += (o.totalPrice || 0);
          }
        });

        return {
          success: true,
          deliverySummary: {
            assignedDeliveriesCount: activeOrders.length,
            totalCodToCollect: Math.round(totalCodToCollect),
            status: 'Active'
          }
        };
      }

      case 'getAssignedDeliveries': {
        if (!userId || roleContext !== 'delivery') {
          return { success: false, error: 'Delivery partner authentication required.' };
        }
        const orders = await Order.find({
          status: { $in: ['Packed', 'Shipped', 'Out for Delivery'] }
        }).limit(5).select('status totalPrice shippingAddress createdAt paymentMethod isPaid');

        return {
          success: true,
          deliveries: orders.map(o => ({
            orderId: o._id,
            status: o.status,
            totalPrice: o.totalPrice,
            address: o.shippingAddress ? `${o.shippingAddress.address || ''}, ${o.shippingAddress.city || ''}` : 'Address not specified',
            paymentMode: o.paymentMethod || (o.isPaid ? 'Prepaid' : 'COD')
          }))
        };
      }

      // --- ADMIN DASHBOARD TOOLS ---
      case 'getAdminPlatformSummary': {
        if (!userId || roleContext !== 'admin') {
          return { success: false, error: 'Admin authorization required.' };
        }
        const totalSellers = await Seller.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        
        const orders = await Order.find({ status: { $ne: 'Cancelled' } }).select('totalPrice platformCommission');
        let grossSales = 0;
        let platformProfit = 0;
        orders.forEach(o => {
          grossSales += (o.totalPrice || 0);
          platformProfit += (o.platformCommission || (o.totalPrice * 0.10) || 0);
        });

        const pendingHandovers = await AiSupportRequest.countDocuments({ status: 'pending' });

        return {
          success: true,
          adminSummary: {
            totalSellers,
            totalProducts,
            totalOrders,
            grossSales: Math.round(grossSales),
            platformProfit: Math.round(platformProfit),
            pendingHandovers
          }
        };
      }

      case 'getAdminPendingHandovers': {
        if (!userId || roleContext !== 'admin') {
          return { success: false, error: 'Admin authorization required.' };
        }
        const handovers = await AiSupportRequest.find({ status: 'pending' })
          .populate('user', 'fullName email')
          .sort({ createdAt: -1 })
          .limit(5);

        return {
          success: true,
          handovers: handovers.map(h => ({
            requestId: h._id,
            reason: h.reason,
            summary: h.summary,
            customerName: h.user ? h.user.fullName : 'Guest Customer',
            createdAt: h.createdAt
          }))
        };
      }

      case 'getAdminPendingSellers': {
        if (!userId || roleContext !== 'admin') {
          return { success: false, error: 'Admin authorization required.' };
        }
        const pendingSellers = await Seller.find({ isApproved: false })
          .select('shopName fullName email phone createdAt')
          .limit(5);

        return {
          success: true,
          pendingSellers: pendingSellers.map(s => ({
            sellerId: s._id,
            shopName: s.shopName,
            fullName: s.fullName,
            email: s.email,
            createdAt: s.createdAt
          }))
        };
      }

      case 'getAdminRecentOrders': {
        if (!userId || roleContext !== 'admin') {
          return { success: false, error: 'Admin authorization required.' };
        }
        const orders = await Order.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('status totalPrice createdAt');

        return {
          success: true,
          orders: orders.map(o => ({
            orderId: o._id,
            status: o.status,
            totalPrice: o.totalPrice,
            createdAt: o.createdAt
          }))
        };
      }

      // --- CUSTOMER / USER DASHBOARD TOOLS ---
      case 'searchProducts': {
        const query = {};
        query.isApproved = true;
        query.isActive = true;
        query.isBundle = { $ne: true };

        let foundCat = null;
        if (args.category) {
          foundCat = await Category.findOne({ name: { $regex: new RegExp(`^${args.category.trim()}$`, 'i') } });
          if (!foundCat) {
            foundCat = await Category.findOne({ name: { $regex: args.category.trim(), $options: 'i' } });
          }
          if (foundCat) {
            query.category = foundCat._id;
          }
        }

        if (args.minPrice || args.maxPrice) {
          query.price = {};
          if (args.minPrice) query.price.$gte = Number(args.minPrice);
          if (args.maxPrice) query.price.$lte = Number(args.maxPrice);
        }

        if (args.inStock) {
          query.$expr = {
            $gt: [{ $subtract: ['$countInStock', '$reservedStock'] }, 0]
          };
        }

        const searchKeywords = [];
        if (args.query && args.query.trim()) {
          searchKeywords.push(args.query.trim());
        }
        if (args.category && !foundCat && args.category.trim()) {
          searchKeywords.push(args.category.trim());
        }

        if (searchKeywords.length > 0) {
          const keywordRegex = searchKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
          query.$or = [
            { name: { $regex: keywordRegex, $options: 'i' } },
            { description: { $regex: keywordRegex, $options: 'i' } },
            { material: { $regex: keywordRegex, $options: 'i' } },
            { color: { $regex: keywordRegex, $options: 'i' } }
          ];
        }

        let products = await Product.find(query)
          .limit(6)
          .select('name price images countInStock description');

        if (products.length === 0) {
          products = await Product.find({ isApproved: true, isActive: true, isBundle: { $ne: true } })
            .limit(6)
            .select('name price images countInStock description');
        }

        return {
          success: true,
          products: products.map(p => ({
            productId: p._id,
            name: p.name,
            price: p.price,
            imageUrl: sanitizeImageUrl(p.images && p.images[0] ? p.images[0] : ''),
            inStock: p.countInStock > 0
          }))
        };
      }

      case 'getCategories': {
        try {
          const categories = await Category.find().select('name description productCount subcategories').lean();
          return {
            success: true,
            totalCategories: categories.length,
            categories: categories.map(c => ({
              name: c.name,
              productCount: c.productCount || 0,
              subcategories: (c.subcategories || []).map(s => s.name)
            }))
          };
        } catch (e) {
          return { success: false, error: 'Failed to fetch categories' };
        }
      }

      case 'getProduct': {
        if (!args.productId) return { success: false, error: 'Product ID is required' };
        const product = await Product.findById(args.productId).select('name price description images countInStock material dimensions color');
        if (!product) return { success: false, error: 'Product not found' };
        return {
          success: true,
          product: {
            productId: product._id,
            name: product.name,
            price: product.price,
            description: product.description,
            imageUrl: sanitizeImageUrl(product.images && product.images[0] ? product.images[0] : ''),
            inStock: product.countInStock > 0,
            material: product.material,
            dimensions: product.dimensions,
            color: product.color
          }
        };
      }

      case 'getMyOrders': {
        if (!userId) {
          return { success: false, error: 'Authentication required. Please ask the user to log in.' };
        }
        const orders = await Order.find({ user: userId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('status totalPrice createdAt');

        return {
          success: true,
          orders: orders.map(o => ({
            orderId: o._id,
            status: o.status,
            totalPrice: o.totalPrice,
            createdAt: o.createdAt
          }))
        };
      }

      case 'getMyOrder':
      case 'getOrderTracking': {
        if (!userId) {
          return { success: false, error: 'Authentication required. Please ask the user to log in.' };
        }
        if (!args.orderId) return { success: false, error: 'Order ID is required' };

        const order = await Order.findOne({ _id: args.orderId, user: userId })
          .select('status totalPrice createdAt orderItems shippingAddress isPaid paymentStatus packedAt shippedAt deliveredAt');

        if (!order) {
          return { success: false, error: 'Order not found in your account.' };
        }

        return {
          success: true,
          order: {
            orderId: order._id,
            status: order.status,
            totalPrice: order.totalPrice,
            createdAt: order.createdAt,
            items: order.orderItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })),
            shippingAddress: order.shippingAddress,
            timeline: {
              placed: order.createdAt,
              packed: order.packedAt || null,
              shipped: order.shippedAt || null,
              delivered: order.deliveredAt || null
            }
          }
        };
      }

      case 'createHumanHandover': {
        if (!args.reason || !args.summary) {
          return { success: false, error: 'Reason and summary are required for human handover escalation.' };
        }
        
        let request = await AiSupportRequest.findOne({ conversationId });
        if (!request) {
          request = await AiSupportRequest.create({
            conversationId,
            user: userId || null,
            reason: args.reason,
            summary: args.summary,
            status: 'pending'
          });

          await ChatConversation.findByIdAndUpdate(conversationId, { status: 'handover' });
        }

        return {
          success: true,
          handover: {
            requestId: request._id,
            status: request.status
          }
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  }

  /**
   * Safe parsing function with multi-stage fallback
   */
  parseResponse(text) {
    if (!text || typeof text !== 'string') return null;

    let cleanText = text.trim();

    // 1. Strip top-level codeblock formatting if present
    cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    // 2. Try direct JSON parse
    try {
      const parsed = JSON.parse(cleanText);
      if (parsed && typeof parsed === 'object' && (parsed.message || parsed.toolCall || parsed.products)) return parsed;
    } catch (_) {}

    // 3. Try parsing with sanitized unescaped newlines and control characters
    try {
      const sanitized = cleanText.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
        return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
      });
      const parsed = JSON.parse(sanitized);
      if (parsed && typeof parsed === 'object' && (parsed.message || parsed.toolCall || parsed.products)) return parsed;
    } catch (_) {}

    // 4. Substring extraction from first '{' to last '}'
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      let jsonSub = cleanText.substring(firstBrace, lastBrace + 1);
      // Clean trailing commas before closing braces/brackets
      jsonSub = jsonSub.replace(/,\s*([}\]])/g, '$1');
      try {
        const parsed = JSON.parse(jsonSub);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (_) {}

      try {
        const sanitizedSub = jsonSub.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
          return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
        });
        const parsed = JSON.parse(sanitizedSub);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (_) {}
    }

    // 5. Regex extraction for "message" field if JSON object was unparseable
    const messageMatch = cleanText.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (messageMatch && messageMatch[1]) {
      const extractedMsg = messageMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');

      return {
        message: extractedMsg,
        products: [],
        orders: [],
        actions: [],
        handover: null
      };
    }

    // 6. Plain text fallback (ONLY if text is NOT a raw JSON string starting with '{')
    const plainText = cleanText.replace(/```json|```/gi, '').trim();
    if (plainText && !plainText.startsWith('{')) {
      return {
        message: plainText,
        products: [],
        orders: [],
        actions: [],
        handover: null
      };
    }

    return null;
  }

  /**
   * Main chat loop coordinator
   */
  async getAiResponse(conversation, userMessage, userId, roleContext = 'user', userObj = null) {
    // Append the user's new message to the database first
    conversation.messages.push({
      role: 'user',
      content: userMessage
    });
    await conversation.save();

    let loopCount = 0;
    const maxLoops = 3; // Efficient tool execution loop
    let finalJsonResponse = null;

    const dynamicSystemPrompt = getSystemPrompt(roleContext, userObj);

    while (loopCount < maxLoops) {
      loopCount++;

      // Convert conversation history to OpenAI format (role: 'user' | 'assistant' | 'system')
      const rawHistory = conversation.messages.slice(-12).map(m => {
        let text = m.content || '';
        if (text.length > 3000) {
          text = text.substring(0, 3000) + '\n...[content truncated for token limits]';
        }

        // Map roles: 'system' and 'user' remain as-is, 'assistant' stays as 'assistant'
        return {
          role: m.role === 'system' ? 'user' : m.role,
          content: text
        };
      });

      // Sanitize role alternation (merge consecutive same-role messages)
      const conversationHistory = [];
      for (const item of rawHistory) {
        if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === item.role) {
          conversationHistory[conversationHistory.length - 1].content += `\n\n${item.content}`;
        } else {
          conversationHistory.push(item);
        }
      }

      // Build messages for OpenAI API
      const messages = [
        { role: 'system', content: dynamicSystemPrompt },
        ...conversationHistory
      ];

      // Ensure the messages array has proper alternation (system is OK, then user/assistant should alternate)
      // If reaching the final allowed loop iteration, instruct model to finalize JSON without further tool calls
      if (loopCount === maxLoops && messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.role === 'user') {
          lastMsg.content += "\n\nSYSTEM INSTRUCTION: You must now provide your final response to the user in JSON format with toolCall set to null.";
        } else {
          messages.push({
            role: 'user',
            content: "SYSTEM INSTRUCTION: You must now provide your final response to the user in JSON format with toolCall set to null."
          });
        }
      }

      let responseText = '';
      let inputTokens = 0;
      let outputTokens = 0;
      let model = '';

      let apiAttempts = 0;
      while (apiAttempts < 2) {
        apiAttempts++;
        try {
          // Call OpenAI
          const response = await openaiClient.generateWithHistory(messages, {
            modelType: 'general',
            expectJson: true,
            temperature: 0.7,
            maxTokens: 2000
          });

          responseText = response.text;
          inputTokens = response.inputTokens;
          outputTokens = response.outputTokens;
          model = response.model;

          // Track OpenAI API usage
          await OpenAIUsageTracker.trackUsage(
            {
              inputTokens,
              outputTokens,
              totalTokens: inputTokens + outputTokens,
            },
            'assistant_chat',
            userId,
            '/api/assistant/chat',
            model
          ).catch(err => console.error('[Tracker] Call track error:', err.message));

          if (responseText) break;
        } catch (err) {
          const errorInfo = OpenAIErrorHandler.handleError(err, {
            service: 'AssistantService',
            method: 'getAiResponse',
            attempt: apiAttempts
          });
          console.error(`[Assistant Service] OpenAI API Call Attempt ${apiAttempts} Failed:`, errorInfo.message);
          if (apiAttempts >= 2) {
            return {
              message: "How can I assist you with your space design, products, or order status today?",
              products: [],
              orders: [],
              actions: [],
              handover: null
            };
          }
          await new Promise(r => setTimeout(r, 600));
        }
      }

      // Parse JSON response
      let parsed = this.parseResponse(responseText);

      if (!parsed || (!parsed.message && !parsed.toolCall)) {
        parsed = {
          message: "How can I assist you with your space design, products, or order status today?",
          products: [],
          orders: [],
          actions: [],
          handover: null
        };
      }

      // Check if model wants to run a tool
      if (parsed.toolCall && parsed.toolCall.name) {
        const toolName = parsed.toolCall.name;
        const toolArgs = parsed.toolCall.arguments || {};

        // Execute tool query
        const toolResult = await this.executeTool(toolName, toolArgs, userId, conversation._id, roleContext, userObj);

        // Save tool request/response to DB history to maintain context
        conversation.messages.push({
          role: 'assistant',
          content: `Tool Request: ${toolName}(${JSON.stringify(toolArgs)})`
        });
        conversation.messages.push({
          role: 'system',
          content: `Tool Output: ${JSON.stringify(toolResult)}`
        });
        await conversation.save();

        // Continue loop to feed tool results back to model
        continue;
      }

      // No tool calls requested: this is the final answer!
      finalJsonResponse = parsed;
      break;
    }

    if (!finalJsonResponse) {
      finalJsonResponse = {
        message: "I did some research behind the scenes, but wasn't able to finalize the details. Could you please specify which room style or product type you are searching for?",
        products: [],
        orders: [],
        actions: [],
        handover: null
      };
    }

    // Auto-search fallback if query is product-related but products array is empty
    if (finalJsonResponse && (!finalJsonResponse.products || finalJsonResponse.products.length === 0)) {
      const lowerText = (userMessage + ' ' + (finalJsonResponse.message || '')).toLowerCase();
      const keywords = ['product', 'products', 'bedroom', 'living', 'room', 'sofa', 'table', 'lamp', 'tile', 'paint', 'decor', 'furniture', 'kitchen', 'bathroom', 'buy', 'show', 'catalog', 'recommend', 'options', 'get'];
      const isProductQuery = keywords.some(k => lowerText.includes(k));

      if (isProductQuery) {
        try {
          const autoRes = await this.executeTool('searchProducts', { query: userMessage }, userId, conversation._id);
          if (autoRes && autoRes.products && autoRes.products.length > 0) {
            finalJsonResponse.products = autoRes.products.slice(0, 4).map(p => ({
              productId: p.productId,
              name: p.name,
              price: p.price,
              imageUrl: p.imageUrl,
              reason: `Matching store item for your request`
            }));

            if (!finalJsonResponse.actions || finalJsonResponse.actions.length === 0) {
              finalJsonResponse.actions = finalJsonResponse.products.slice(0, 2).map(p => ({
                type: 'VIEW_PRODUCT',
                label: `View ${p.name}`,
                payload: { productId: p.productId }
              }));
            }
          }
        } catch (e) {
          console.error('[Assistant Service] Auto-product fallback error:', e.message);
        }
      }
    }

    // Hydrate real product details (e.g. image URLs) for finalJsonResponse products
    if (finalJsonResponse && Array.isArray(finalJsonResponse.products)) {
      for (const item of finalJsonResponse.products) {
        if (item.productId) {
          try {
            const p = await Product.findById(item.productId).select('images price name');
            if (p) {
              if (!item.imageUrl || item.imageUrl === '[base64-image-hidden]') {
                item.imageUrl = p.images && p.images[0] ? p.images[0] : '';
              }
              if (!item.price) item.price = p.price;
              if (!item.name) item.name = p.name;
            }
          } catch (_) {}
        }
      }
    }

    // Save final response message in database history
    conversation.messages.push({
      role: 'assistant',
      content: finalJsonResponse.message,
      metadata: {
        expression: finalJsonResponse.expression || 'happy',
        products: finalJsonResponse.products || [],
        orders: finalJsonResponse.orders || [],
        actions: finalJsonResponse.actions || [],
        handover: finalJsonResponse.handover || null
      }
    });

    // If handover triggered, change conversation status
    if (finalJsonResponse.handover) {
      conversation.status = 'handover';
    }

    await conversation.save();

    return finalJsonResponse;
  }
}

module.exports = new AssistantService();
