const ChatConversation = require('../models/ChatConversation');
const AiSupportRequest = require('../models/AiSupportRequest');
const assistantService = require('../services/assistantService');
const mongoose = require('mongoose');

// @desc    Send a message to the AI Assistant
// @route   POST /api/assistant/chat
// @access  Public (Guest & Authenticated Users)
exports.startOrContinueChat = async (req, res, next) => {
  try {
    const { message, conversationId, guestSessionId } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message content is required.' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ success: false, error: 'Message content is too long. Limit is 1000 characters.' });
    }

    const userId = req.user ? req.user.id : null;

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

    // 2. If conversation doesn't exist, create a new one
    if (!conversation) {
      const createData = {
        status: 'active',
        messages: []
      };

      if (userId) {
        createData.user = userId;
      } else if (guestSessionId) {
        createData.guestSessionId = guestSessionId;
      } else {
        return res.status(400).json({ success: false, error: 'guestSessionId or user login is required to start a chat.' });
      }

      conversation = await ChatConversation.create(createData);
    }

    // 3. Prevent chat interaction if already escalated to human support
    if (conversation.status === 'handover') {
      const supportRequest = await AiSupportRequest.findOne({ conversationId: conversation._id });
      return res.status(200).json({
        success: true,
        conversationId: conversation._id,
        message: "Your conversation has been forwarded to our support representatives. We will get back to you shortly.",
        products: [],
        orders: [],
        actions: [],
        handover: {
          requestId: supportRequest ? supportRequest._id : null,
          status: supportRequest ? supportRequest.status : 'pending'
        }
      });
    }

    // 4. Run Assistant Service Gemini Loop
    const response = await assistantService.getAiResponse(conversation, message, userId);

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
    const { guestSessionId } = req.query;
    const userId = req.user ? req.user.id : null;

    let query = {};
    if (userId) {
      query.user = userId;
    } else if (guestSessionId) {
      query.guestSessionId = guestSessionId;
    } else {
      return res.status(400).json({ success: false, error: 'guestSessionId or user login is required.' });
    }

    const conversations = await ChatConversation.find(query)
      .sort({ updatedAt: -1 })
      .select('status messages updatedAt');

    // Clean outputs: return id, status, and last message snippet
    const result = conversations.map(c => {
      const lastMessage = c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;
      return {
        conversationId: c._id,
        status: c.status,
        updatedAt: c.updatedAt,
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
