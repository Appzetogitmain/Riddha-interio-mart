const ChatConversation = require('../models/ChatConversation');
const AiSupportRequest = require('../models/AiSupportRequest');
const assistantService = require('../services/assistantService');
const mongoose = require('mongoose');

// @desc    Send a message to the AI Assistant
// @route   POST /api/assistant/chat
// @access  Public (Guest & Authenticated Users)
exports.startOrContinueChat = async (req, res, next) => {
  try {
    const { message, conversationId, guestSessionId, roleContext = 'user' } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message content is required.' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ success: false, error: 'Message content is too long. Limit is 1000 characters.' });
    }

    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? (req.user.role || req.user.type || 'user') : 'guest';

    // Verify security boundaries for roleContext
    if (roleContext === 'seller' && userRole !== 'seller') {
      return res.status(403).json({ success: false, error: 'Access denied. Seller Assistant is restricted to authenticated sellers.' });
    }
    if (roleContext === 'delivery' && userRole !== 'delivery') {
      return res.status(403).json({ success: false, error: 'Access denied. Delivery Assistant is restricted to delivery partners.' });
    }
    if (roleContext === 'admin' && (userRole !== 'admin' && userRole !== 'assistant')) {
      return res.status(403).json({ success: false, error: 'Access denied. Admin Assistant is restricted to administrators and assistant staff.' });
    }

    let conversation = null;

    // 1. Try to find existing conversation by ID
    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      conversation = await ChatConversation.findById(conversationId);

      // Verify ownership boundaries
      if (conversation) {
        if (userId && conversation.user && conversation.user.toString() !== userId.toString()) {
          return res.status(403).json({ success: false, error: 'Unauthorized access to this conversation.' });
        }
        if (!userId && conversation.guestSessionId && conversation.guestSessionId !== guestSessionId) {
          return res.status(403).json({ success: false, error: 'Unauthorized access to this conversation.' });
        }
      }
    }

    // 2. If conversation doesn't exist, create a new one for this role context
    if (!conversation) {
      const createData = {
        status: 'active',
        messages: [],
        roleContext: roleContext
      };

      if (userId) {
        createData.user = userId;
      } else if (guestSessionId) {
        createData.guestSessionId = guestSessionId;
      } else {
        return res.status(401).json({ success: false, error: 'Please log in first to chat with the assistant.', requiresLogin: true });
      }

      conversation = await ChatConversation.create(createData);
    }

    // 3. If conversation was previously in handover state and user asks a new question, reactivate AI chat
    if (conversation.status === 'handover') {
      conversation.status = 'active';
      await conversation.save();
    }

    // 4. Run Assistant Service OpenAI Loop with roleContext and user profile
    const response = await assistantService.getAiResponse(conversation, message, userId, roleContext, req.user);

    return res.status(200).json({
      success: true,
      conversationId: conversation._id,
      ...response
    });

  } catch (err) {
    console.error('Chat endpoint error:', err);
    return res.status(500).json({ success: false, error: 'AI Assistant failed to process request.' });
  }
};

// @desc    Get user/guest conversation threads list
// @route   GET /api/assistant/conversations
// @access  Public
exports.getConversations = async (req, res, next) => {
  try {
    const { guestSessionId, roleContext = 'user' } = req.query;
    const userId = req.user ? req.user.id : null;

    let query = { roleContext };
    if (userId) {
      query.user = userId;
    } else if (guestSessionId) {
      query.guestSessionId = guestSessionId;
    } else {
      return res.status(200).json({ success: true, conversations: [] });
    }

    const conversations = await ChatConversation.find(query)
      .sort({ updatedAt: -1 })
      .select('status messages updatedAt roleContext');

    // Clean outputs: return id, status, and last message snippet
    const result = conversations.map(c => {
      const lastMessage = c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;
      return {
        conversationId: c._id,
        status: c.status,
        updatedAt: c.updatedAt,
        roleContext: c.roleContext,
        lastMessage: lastMessage ? {
          role: lastMessage.role,
          content: lastMessage.content.length > 60 ? lastMessage.content.substring(0, 60) + '...' : lastMessage.content
        } : null
      };
    });

    return res.status(200).json({ success: true, conversations: result });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve conversations.' });
  }
};

// @desc    Delete a specific conversation thread
// @route   DELETE /api/assistant/conversations/:id
// @access  Public
exports.deleteConversation = async (req, res, next) => {
  try {
    const { guestSessionId } = req.body;
    const userId = req.user ? req.user.id : null;

    const conversation = await ChatConversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation thread not found.' });
    }

    // Ownership check
    if (userId && conversation.user && conversation.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized to delete this thread.' });
    }
    if (!userId && conversation.guestSessionId && conversation.guestSessionId !== guestSessionId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to delete this thread.' });
    }

    await ChatConversation.findByIdAndDelete(req.params.id);
    // Clean associated support request if any
    await AiSupportRequest.deleteMany({ conversationId: req.params.id });

    return res.status(200).json({ success: true, message: 'Conversation deleted.' });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to delete conversation.' });
  }
};

// @desc    Get a specific conversation thread messages
// @route   GET /api/assistant/conversations/:id
// @access  Public
exports.getConversationById = async (req, res, next) => {
  try {
    const { guestSessionId } = req.query;
    const userId = req.user ? req.user.id : null;

    const conversation = await ChatConversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation thread not found.' });
    }

    // Ownership check
    if (userId && conversation.user && conversation.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized to view this thread.' });
    }
    if (!userId && conversation.guestSessionId && conversation.guestSessionId !== guestSessionId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to view this thread.' });
    }

    return res.status(200).json({ success: true, conversation });

  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve conversation details.' });
  }
};

// @desc    Retrieve pending handover requests for Admin Dashboard
// @route   GET /api/assistant/admin/handovers
// @access  Private (Admin only)
exports.getHandovers = async (req, res, next) => {
  try {
    const handovers = await AiSupportRequest.find()
      .populate('user', 'fullName email mobileNumber')
      .populate('conversationId', 'messages')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, handovers });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve handover requests.' });
  }
};

// ───────────────────────── Admin: customer-wise Tejas chat history ─────────────────────────
const User = require('../models/User');
const { summarizeRequirements } = require('../utils/tejasHelpers');

const TOOL_MESSAGE = /^Tool (Request|Output)/;
const visibleMessages = (messages = []) =>
  messages.filter(m => (m.role === 'user' || m.role === 'assistant') && m.content && !TOOL_MESSAGE.test(m.content));

// @desc    Customers who chatted with Tejas, newest first, with what they were looking for
// @route   GET /api/assistant/admin/customers?search=&followUp=&page=&limit=
// @access  Private/Admin
exports.getAdminCustomers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const search = String(req.query.search || '').trim().toLowerCase();
    const followUpFilter = String(req.query.followUp || 'all');

    const convs = await ChatConversation.find({ roleContext: 'user' })
      .sort({ updatedAt: -1 })
      .limit(1500)
      .select('user guestSessionId status requirements followUp updatedAt createdAt messages.role messages.content messages.createdAt')
      .lean();

    const userIds = [...new Set(convs.filter(c => c.user).map(c => String(c.user)))];
    const users = await User.find({ _id: { $in: userIds } }).select('fullName email phone').lean();
    const userById = new Map(users.map(u => [String(u._id), u]));

    // one row per customer (guests are grouped by their browser session)
    const groups = new Map();
    for (const c of convs) {
      const msgs = visibleMessages(c.messages);
      if (msgs.length === 0) continue;
      const key = c.user ? `u:${c.user}` : `g:${c.guestSessionId || c._id}`;
      const u = c.user ? userById.get(String(c.user)) : null;
      const lastUser = [...msgs].reverse().find(m => m.role === 'user');
      const conv = {
        conversationId: c._id,
        status: c.status,
        followUp: c.followUp || { status: 'new', note: '' },
        requirements: c.requirements || {},
        summary: summarizeRequirements(c.requirements || {}),
        messageCount: msgs.length,
        lastUserMessage: lastUser ? lastUser.content.slice(0, 140) : '',
        updatedAt: c.updatedAt
      };
      if (!groups.has(key)) {
        groups.set(key, {
          customerKey: key,
          isGuest: !c.user,
          name: u?.fullName || (c.user ? 'Customer' : 'Guest visitor'),
          email: u?.email || '',
          phone: u?.phone || '',
          lastActivity: c.updatedAt,
          conversations: []
        });
      }
      groups.get(key).conversations.push(conv);
    }

    let customers = [...groups.values()].map(g => {
      const latest = g.conversations[0];
      return {
        ...g,
        conversationCount: g.conversations.length,
        totalMessages: g.conversations.reduce((n, c) => n + c.messageCount, 0),
        latestSummary: latest.summary,
        latestMessage: latest.lastUserMessage,
        followUpStatus: latest.followUp?.status || 'new'
      };
    });

    if (search) {
      customers = customers.filter(c =>
        [c.name, c.email, c.phone, c.latestSummary, c.latestMessage].join(' ').toLowerCase().includes(search));
    }
    if (followUpFilter !== 'all') customers = customers.filter(c => c.followUpStatus === followUpFilter);

    const total = customers.length;
    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      data: customers.slice((page - 1) * limit, page * limit)
    });
  } catch (err) {
    console.error('Admin customers error:', err);
    res.status(500).json({ success: false, error: 'Failed to load Tejas chat history.' });
  }
};

// @desc    Full transcript of one conversation (tool traffic hidden)
// @route   GET /api/assistant/admin/conversations/:id
// @access  Private/Admin
exports.getAdminConversation = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid conversation id' });
    }
    const conv = await ChatConversation.findById(req.params.id).lean();
    if (!conv) return res.status(404).json({ success: false, error: 'Conversation not found' });
    const u = conv.user ? await User.findById(conv.user).select('fullName email phone').lean() : null;
    res.status(200).json({
      success: true,
      data: {
        conversationId: conv._id,
        status: conv.status,
        customer: { name: u?.fullName || (conv.user ? 'Customer' : 'Guest visitor'), email: u?.email || '', phone: u?.phone || '', isGuest: !conv.user },
        requirements: conv.requirements || {},
        summary: summarizeRequirements(conv.requirements || {}),
        followUp: conv.followUp || { status: 'new', note: '' },
        startedAt: conv.createdAt,
        messages: visibleMessages(conv.messages).map(m => ({
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
          products: (m.metadata?.products || []).map(p => ({ productId: p.productId, name: p.name, price: p.price, category: p.category })),
          quickReplies: m.metadata?.quickReplies || []
        }))
      }
    });
  } catch (err) {
    console.error('Admin conversation error:', err);
    res.status(500).json({ success: false, error: 'Failed to load conversation.' });
  }
};

// @desc    Update follow-up status / note on a conversation
// @route   PUT /api/assistant/admin/conversations/:id/follow-up
// @access  Private/Admin
exports.updateFollowUp = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid conversation id' });
    }
    const { status, note } = req.body || {};
    if (status !== undefined && !['new', 'contacted', 'converted', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid follow-up status' });
    }
    const conv = await ChatConversation.findById(req.params.id).select('followUp roleContext');
    if (!conv) return res.status(404).json({ success: false, error: 'Conversation not found' });

    conv.followUp = {
      status: status !== undefined ? status : (conv.followUp?.status || 'new'),
      note: note !== undefined ? String(note).trim().slice(0, 1000) : (conv.followUp?.note || ''),
      updatedBy: req.user.fullName || req.user.email || 'Admin',
      updatedAt: new Date()
    };
    await conv.save();
    res.status(200).json({ success: true, data: conv.followUp });
  } catch (err) {
    console.error('Follow-up update error:', err);
    res.status(500).json({ success: false, error: 'Failed to update follow-up.' });
  }
};
