const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const Notification = require('./models/Notification');
const User = require('./models/User');
const { sendPushNotificationForUser } = require('./services/firebaseAdmin');

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin:
        process.env.NODE_ENV === 'production'
          ? (process.env.SOCKET_CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean)
          : true,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const bearerToken =
        typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
          ? authHeader.slice('Bearer '.length)
          : null;

      // Helper to parse cookies from handshake headers
      const parseCookies = (cookieString) => {
        if (!cookieString) return {};
        return cookieString.split(';').reduce((acc, pair) => {
          const [key, value] = pair.split('=').map(c => c.trim());
          if (key && value) acc[key] = decodeURIComponent(value);
          return acc;
        }, {});
      };

      const cookies = parseCookies(socket.handshake.headers?.cookie);
      
      let token =
        cookies.access_token ||
        socket.handshake.auth?.token ||
        bearerToken ||
        socket.handshake.query?.token;

      // Handle case where token itself might have "Bearer " prefix from frontend
      if (token && token.startsWith('Bearer ')) {
        token = token.slice(7);
      }

      if (!token) {
        console.error('[Socket Auth] No token provided');
        return next(new Error('AUTH_TOKEN_REQUIRED'));
      }

      const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
      if (!secret) {
        console.error('[Socket Auth ERROR] ACCESS_TOKEN_SECRET or JWT_SECRET environment variables are missing!');
        return next(new Error('AUTH_CONFIG_ERROR'));
      }
      console.log(`[Socket Auth] Attempting verification. Token length: ${token.length}, Secret exists: true`);

      try {
        const decoded = jwt.verify(token, secret);
        socket.user = { id: decoded.id, role: decoded.role || 'user' };
        console.log(`[Socket Auth] Success! User ID: ${decoded.id}, Role: ${decoded.role}`);
      } catch (jwtErr) {
        console.error('[Socket Auth] JWT Verification failed:', jwtErr.message);
        return next(new Error('AUTH_INVALID'));
      }

      // Allow 'admin', 'seller', 'delivery', and 'user' roles
      if (!['seller', 'admin', 'delivery', 'user'].includes(socket.user.role)) {
        console.error(`[Socket Auth] Role ${socket.user.role} not allowed`);
        return next(new Error('AUTH_ROLE_NOT_ALLOWED'));
      }

      return next();
    } catch (err) {
      console.error('[Socket Auth] Invalid token:', err.message);
      return next(new Error('AUTH_INVALID'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.user || {};
    console.log(`[Socket] New connection: ${role}:${id}`);
    
    socket.join(`${role}:${id}`);
    console.log(`[Socket] Joined room: ${role}:${id}`);
    
    // Also join a generic role room for broadcasting to all admins or sellers
    socket.join(`role:${role}`);
    console.log(`[Socket] Joined generic role room: role:${role}`);
    
    socket.emit('socket:ready', { role, id });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('socket.io not initialized');
  return io;
}

// -----------------------------------------------------------------------------
// Presence Detection
// -----------------------------------------------------------------------------

/**
 * Check if a user/role is currently connected via Socket.IO.
 * Uses the in-memory adapter room map — zero DB cost.
 * @param {string} role  - 'user' | 'seller' | 'admin' | 'delivery'
 * @param {string|ObjectId} id
 * @returns {boolean}
 */
function isUserOnline(role, id) {
  if (!io) return false;
  const room = `${role}:${id}`;
  const roomSockets = io.sockets.adapter.rooms.get(room);
  return !!(roomSockets && roomSockets.size > 0);
}

// -----------------------------------------------------------------------------
// Database Persistence Helpers
// -----------------------------------------------------------------------------

async function persistNotification({ recipient, recipientModel, title, message, type, metadata }) {
  try {
    const notification = await Notification.create({
      recipient,
      recipientModel,
      title,
      message,
      type,
      metadata
    });
    return notification;
  } catch (err) {
    console.error('Failed to persist notification:', err);
    return null;
  }
}

async function persistForAdmins({ title, message, type, metadata }) {
  try {
    const Admin = require('./models/Admin');
    const admins = await Admin.find({}).lean();
    const notifications = admins.map(admin => ({
      recipient: admin._id,
      recipientModel: 'Admin',
      title,
      message,
      type,
      metadata
    }));
    if (notifications.length > 0) {
      const saved = await Notification.insertMany(notifications);
      return { admins, sample: saved[0] }; // Return admins list for per-admin FCM check
    }
  } catch (err) {
    console.error('Failed to persist admin notifications:', err);
  }
  return { admins: [], sample: null };
}

// -----------------------------------------------------------------------------
// FCM Push Helper (fires only for offline recipients)
// -----------------------------------------------------------------------------

/**
 * Dispatch FCM push for a single recipient if they are offline.
 */
async function maybePushToUser(role, id, recipientModel, { title, body, data }) {
  if (isUserOnline(role, id)) return; // Online → Socket.IO handles it, skip FCM
  await sendPushNotificationForUser(id, recipientModel, { title, body, data });
}

/**
 * Dispatch FCM push to each offline admin.
 * @param {Array} admins - Admin documents
 * @param {{ title, body, data }} pushPayload
 */
async function maybePushToOfflineAdmins(admins, pushPayload) {
  for (const admin of admins) {
    if (!isUserOnline('admin', admin._id.toString())) {
      await sendPushNotificationForUser(admin._id, 'Admin', pushPayload);
    }
  }
}

// -----------------------------------------------------------------------------
// Emitting Helpers
// -----------------------------------------------------------------------------

async function notifySellerNewOrder(sellerId, payload) {
  if (!io) return;
  const notif = await persistNotification({
    recipient: sellerId,
    recipientModel: 'Seller',
    title: 'New Order',
    message: payload.message || 'You have received a new order.',
    type: 'order_update',
    metadata: payload
  });
  io.to(`seller:${sellerId}`).emit('order:new', payload);
  if (notif) io.to(`seller:${sellerId}`).emit('notification:new', notif);

  // FCM: push only if seller is offline
  await maybePushToUser('seller', sellerId, 'Seller', {
    title: 'New Order',
    body: payload.message || 'You have received a new order.',
    data: { type: 'order_update', orderId: String(payload.orderId || '') }
  });
}

async function notifyAdminNewOrder(adminId, payload) {
  if (!io) return;
  if (adminId) {
    const notif = await persistNotification({
      recipient: adminId,
      recipientModel: 'Admin',
      title: 'New Order',
      message: payload.message || 'A new order was placed.',
      type: 'order_update',
      metadata: payload
    });
    io.to(`admin:${adminId}`).emit('order:new', payload);
    if (notif) io.to(`admin:${adminId}`).emit('notification:new', notif);

    // FCM: push only if this admin is offline
    await maybePushToUser('admin', adminId, 'Admin', {
      title: 'New Order',
      body: payload.message || 'A new order was placed.',
      data: { type: 'order_update', orderId: String(payload.orderId || '') }
    });
  } else {
    const { admins, sample: notif } = await persistForAdmins({
      title: 'New Order',
      message: payload.message || 'A new order was placed.',
      type: 'order_update',
      metadata: payload
    });
    io.to('role:admin').emit('order:new', payload);
    if (notif) io.to('role:admin').emit('notification:new', notif);

    // FCM: push to each offline admin individually
    await maybePushToOfflineAdmins(admins, {
      title: 'New Order',
      body: payload.message || 'A new order was placed.',
      data: { type: 'order_update', orderId: String(payload.orderId || '') }
    });
  }
}

async function notifyAdminNewProduct(payload) {
  if (!io) return;
  const { admins, sample: notif } = await persistForAdmins({
    title: 'New Product Approval',
    message: payload.message || 'A seller has requested product approval.',
    type: 'admin_alert',
    metadata: payload
  });
  io.to('role:admin').emit('product:new_request', payload);
  if (notif) io.to('role:admin').emit('notification:new', notif);

  await maybePushToOfflineAdmins(admins, {
    title: 'New Product Approval',
    body: payload.message || 'A seller has requested product approval.',
    data: { type: 'admin_alert', productId: String(payload.productId || '') }
  });
}

async function notifySellerProductApproval(sellerId, payload) {
  if (!io) return;
  const notif = await persistNotification({
    recipient: sellerId,
    recipientModel: 'Seller',
    title: 'Product Status Update',
    message: payload.message || 'Your product status has been updated.',
    type: 'seller_approval',
    metadata: payload
  });
  io.to(`seller:${sellerId}`).emit('product:approval_update', payload);
  if (notif) io.to(`seller:${sellerId}`).emit('notification:new', notif);

  await maybePushToUser('seller', sellerId, 'Seller', {
    title: 'Product Status Update',
    body: payload.message || 'Your product status has been updated.',
    data: { type: 'seller_approval', productId: String(payload.productId || '') }
  });
}

async function notifySellerAccountSuspended(sellerId, payload) {
  if (!io) return;
  const notif = await persistNotification({
    recipient: sellerId,
    recipientModel: 'Seller',
    title: 'Account Suspended',
    message: payload.message || 'Your seller account has been suspended.',
    type: 'admin_alert',
    metadata: payload
  });
  io.to(`seller:${sellerId}`).emit('seller:account_suspended', payload);
  if (notif) io.to(`seller:${sellerId}`).emit('notification:new', notif);

  await maybePushToUser('seller', sellerId, 'Seller', {
    title: 'Account Suspended',
    body: payload.message || 'Your seller account has been suspended.',
    data: { type: 'admin_alert', sellerId: String(sellerId || '') }
  });
}

async function notifySellerProductDeleted(sellerId, payload) {
  if (!io) return;
  const notif = await persistNotification({
    recipient: sellerId,
    recipientModel: 'Seller',
    title: 'Product Deleted',
    message: payload.message || 'A product was removed from your catalog.',
    type: 'admin_alert',
    metadata: payload
  });
  io.to(`seller:${sellerId}`).emit('product:deleted', payload);
  if (notif) io.to(`seller:${sellerId}`).emit('notification:new', notif);

  await maybePushToUser('seller', sellerId, 'Seller', {
    title: 'Product Deleted',
    body: payload.message || 'A product was removed from your catalog.',
    data: { type: 'admin_alert', productId: String(payload.productId || '') }
  });
}

async function notifyDeliveryAssignment(deliveryBoyId, payload) {
  if (!io) return;
  const notif = await persistNotification({
    recipient: deliveryBoyId,
    recipientModel: 'Delivery',
    title: 'New Delivery Assignment',
    message: payload.message || 'You have been assigned a new delivery.',
    type: 'delivery_update',
    metadata: payload
  });
  io.to(`delivery:${deliveryBoyId}`).emit('delivery:assigned', payload);
  if (notif) io.to(`delivery:${deliveryBoyId}`).emit('notification:new', notif);

  await maybePushToUser('delivery', deliveryBoyId, 'Delivery', {
    title: 'New Delivery Assignment',
    body: payload.message || 'You have been assigned a new delivery.',
    data: { type: 'delivery_update', orderId: String(payload.orderId || '') }
  });
}

async function notifySellerDeliveryResponse(sellerId, payload) {
  if (!io) return;
  const notif = await persistNotification({
    recipient: sellerId,
    recipientModel: 'Seller',
    title: 'Delivery Status Update',
    message: payload.message || 'A delivery status has been updated.',
    type: 'delivery_update',
    metadata: payload
  });
  io.to(`seller:${sellerId}`).emit('delivery:response', payload);
  if (notif) io.to(`seller:${sellerId}`).emit('notification:new', notif);

  await maybePushToUser('seller', sellerId, 'Seller', {
    title: 'Delivery Status Update',
    body: payload.message || 'A delivery status has been updated.',
    data: { type: 'delivery_update', orderId: String(payload.orderId || '') }
  });
}

async function notifyAdminDeliveryResponse(adminId, payload) {
  if (!io) return;
  if (adminId) {
    const notif = await persistNotification({
      recipient: adminId,
      recipientModel: 'Admin',
      title: 'Delivery Status Update',
      message: payload.message || 'A delivery status has been updated.',
      type: 'delivery_update',
      metadata: payload
    });
    io.to(`admin:${adminId}`).emit('delivery:response', payload);
    if (notif) io.to(`admin:${adminId}`).emit('notification:new', notif);

    await maybePushToUser('admin', adminId, 'Admin', {
      title: 'Delivery Status Update',
      body: payload.message || 'A delivery status has been updated.',
      data: { type: 'delivery_update', orderId: String(payload.orderId || '') }
    });
  } else {
    const { admins, sample: notif } = await persistForAdmins({
      title: 'Delivery Status Update',
      message: payload.message || 'A delivery status has been updated.',
      type: 'delivery_update',
      metadata: payload
    });
    io.to('role:admin').emit('delivery:response', payload);
    if (notif) io.to('role:admin').emit('notification:new', notif);

    await maybePushToOfflineAdmins(admins, {
      title: 'Delivery Status Update',
      body: payload.message || 'A delivery status has been updated.',
      data: { type: 'delivery_update', orderId: String(payload.orderId || '') }
    });
  }
}

async function notifyAdminNewDelivery(payload) {
  if (!io) return;
  const { admins, sample: notif } = await persistForAdmins({
    title: 'New Delivery Partner',
    message: payload.message || 'A new delivery partner has registered.',
    type: 'admin_alert',
    metadata: payload
  });
  io.to('role:admin').emit('delivery:new_registration', payload);
  if (notif) io.to('role:admin').emit('notification:new', notif);

  await maybePushToOfflineAdmins(admins, {
    title: 'New Delivery Partner',
    body: payload.message || 'A new delivery partner has registered.',
    data: { type: 'admin_alert' }
  });
}

async function notifyAdminNewSeller(payload) {
  if (!io) return;
  const { admins, sample: notif } = await persistForAdmins({
    title: 'New Seller Registration',
    message: payload.message || `${payload.fullName} has registered a new seller account.`,
    type: 'admin_alert',
    metadata: payload
  });
  io.to('role:admin').emit('seller:new_registration', payload);
  if (notif) io.to('role:admin').emit('notification:new', notif);

  await maybePushToOfflineAdmins(admins, {
    title: 'New Seller Registration',
    body: payload.message || `${payload.fullName} has registered a new seller account.`,
    data: { type: 'admin_alert' }
  });
}

async function notifyDeliveryApproval(deliveryBoyId, payload) {
  if (!io) return;
  const notif = await persistNotification({
    recipient: deliveryBoyId,
    recipientModel: 'Delivery',
    title: 'Account Approved',
    message: payload.message || 'Your delivery account has been approved.',
    type: 'admin_alert',
    metadata: payload
  });
  io.to(`delivery:${deliveryBoyId}`).emit('delivery:approval_update', payload);
  if (notif) io.to(`delivery:${deliveryBoyId}`).emit('notification:new', notif);

  await maybePushToUser('delivery', deliveryBoyId, 'Delivery', {
    title: 'Account Approved',
    body: payload.message || 'Your delivery account has been approved.',
    data: { type: 'admin_alert' }
  });
}

async function notifyUserOrderStatus(userId, payload) {
  if (!io) return;
  const notif = await persistNotification({
    recipient: userId,
    recipientModel: 'User',
    title: 'Order Status Update',
    message: payload.message || 'Your order status has changed.',
    type: 'order_update',
    metadata: payload
  });
  io.to(`user:${userId}`).emit('order:status_update', payload);
  if (notif) io.to(`user:${userId}`).emit('notification:new', notif);

  await maybePushToUser('user', userId, 'User', {
    title: 'Order Status Update',
    body: payload.message || 'Your order status has changed.',
    data: { type: 'order_update', orderId: String(payload.orderId || '') }
  });
}

async function notifyLowStock(sellerId, payload) {
  if (!io) return;
  
  // Notify specific seller
  if (sellerId) {
    const notif = await persistNotification({
      recipient: sellerId,
      recipientModel: 'Seller',
      title: 'Low Stock Alert',
      message: payload.message || 'A product is running low on stock.',
      type: 'stock_alert',
      metadata: payload
    });
    io.to(`seller:${sellerId}`).emit('product:low_stock', payload);
    if (notif) io.to(`seller:${sellerId}`).emit('notification:new', notif);

    await maybePushToUser('seller', sellerId, 'Seller', {
      title: 'Low Stock Alert',
      body: payload.message || 'A product is running low on stock.',
      data: { type: 'stock_alert', productId: String(payload.productId || '') }
    });
  }
  
  // Also notify admins
  const { admins, sample: adminNotif } = await persistForAdmins({
    title: 'Low Stock Alert',
    message: payload.message || 'A product is running low on stock.',
    type: 'stock_alert',
    metadata: payload
  });
  io.to('role:admin').emit('product:low_stock', payload);
  if (adminNotif) io.to('role:admin').emit('notification:new', adminNotif);

  await maybePushToOfflineAdmins(admins, {
    title: 'Low Stock Alert',
    body: payload.message || 'A product is running low on stock.',
    data: { type: 'stock_alert', productId: String(payload.productId || '') }
  });
}

module.exports = {
  initSocket,
  getIO,
  isUserOnline,
  notifySellerNewOrder,
  notifyAdminNewOrder,
  notifyAdminNewProduct,
  notifySellerProductApproval,
  notifySellerAccountSuspended,
  notifySellerProductDeleted,
  notifyDeliveryAssignment,
  notifySellerDeliveryResponse,
  notifyAdminDeliveryResponse,
  notifyAdminNewDelivery,
  notifyAdminNewSeller,
  notifyDeliveryApproval,
  notifyUserOrderStatus,
  notifyLowStock
};
