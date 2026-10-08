import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiSend, FiUser, FiCompass,
  FiShoppingBag, FiTruck, FiCornerDownRight, FiCheckCircle,
  FiAlertCircle, FiLogIn, FiHelpCircle, FiFileText, FiDollarSign,
  FiBox, FiShield, FiCheckSquare, FiList, FiMic, FiMicOff,
  FiVolume2, FiVolumeX, FiZap, FiArrowUpRight, FiRotateCcw
} from 'react-icons/fi';
import { LuCrown, LuSparkles } from 'react-icons/lu';
import { useUser } from '../data/UserContext';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';
import TejasAvatar from './TejasAvatar';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import SubscriptionModal from './SubscriptionModal';
import B2CSubscriptionModal from './B2CSubscriptionModal';

const AiAssistantWidget = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [handoverState, setHandoverState] = useState(null);
  const [expression, setExpression] = useState('idle'); // idle | listening | thinking | speaking | confused | celebrating
  
  // Subscription Modals for B2B Pro voice actions
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isB2CSubscriptionModalOpen, setIsB2CSubscriptionModalOpen] = useState(false);

  const messagesEndRef = useRef(null);

  // Compute current dashboard / role context from location path
  const getRoleContext = () => {
    const path = location.pathname;
    if (path.startsWith('/seller')) return 'seller';
    if (path.startsWith('/delivery')) return 'delivery';
    if (path.startsWith('/admin')) return 'admin';
    return 'user';
  };

  const roleContext = getRoleContext();

  const getLoginPath = () => {
    if (roleContext === 'seller') return '/seller/login';
    if (roleContext === 'delivery') return '/delivery/login';
    if (roleContext === 'admin') return '/admin/login';
    return '/login';
  };

  // Speak ref helper to avoid cyclic dependency
  const speakRef = useRef(null);

  // Message Sending Handler
  const handleSendMessage = useCallback(async (textToSend) => {
    const text = textToSend || inputText;
    if (!text || text.trim().length === 0 || isLoading) return;

    // Always clear input field when sending
    setInputText('');

    // If user is not logged in: DO NOT send HTTP request to /assistant/chat!
    // Instead show the user message and assistant login prompt directly in chat.
    if (!user) {
      const tempUserMsg = {
        role: 'user',
        content: text,
        createdAt: new Date().toISOString()
      };
      const loginPromptMsg = {
        role: 'assistant',
        content: "Please log in first to chat with me! 🔐\n\nOnce logged in, you'll get instant AI interior design advice, live GPS order tracking, bulk RFQ estimates, and personalized recommendations.",
        metadata: {
          expression: 'happy',
          actions: [
            { type: 'LOGIN', label: 'Log In / Sign Up', icon: FiLogIn }
          ]
        },
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempUserMsg, loginPromptMsg]);
      setExpression('happy');
      speakRef.current?.("Please log in first to chat with me.");
      return;
    }

    const tempUserMsg = {
      role: 'user',
      content: text,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsLoading(true);
    setExpression('thinking');

    try {
      const currentRole = getRoleContext();
      const payload = {
        message: text,
        conversationId,
        roleContext: currentRole
      };

      const res = await api.post('/assistant/chat', payload);
      if (res.data && res.data.success) {
        setConversationId(res.data.conversationId);
        
        // Detect expression from response or fallback
        const returnedExpression = res.data.expression || 
          (res.data.message?.toLowerCase().includes('oh no') ? 'confused' : 'happy');

        setExpression(returnedExpression);

        const botMsg = {
          role: 'assistant',
          content: res.data.message,
          metadata: {
            expression: returnedExpression,
            products: res.data.products || [],
            orders: res.data.orders || [],
            actions: res.data.actions || [],
            handover: res.data.handover || null
          },
          createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, botMsg]);

        // Speak response aloud if TTS is enabled
        speakRef.current?.(res.data.message);

        if (res.data.handover?.reason) {
          setHandoverState(res.data.handover);
          toast.success('Escalated to human support team.');
        }
      }
    } catch (e) {
      if (e.response?.status === 401 || e.response?.data?.requiresLogin) {
        setExpression('happy');
        const loginPromptMsg = {
          role: 'assistant',
          content: "Please log in first to chat with me! 🔐 Click below to sign in.",
          metadata: {
            expression: 'happy',
            actions: [{ type: 'LOGIN', label: 'Log In Now', icon: FiLogIn }]
          },
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, loginPromptMsg]);
        return;
      }

      const errMsg = e.response?.data?.error || 'Failed to send message. Please retry.';
      toast.error(errMsg);
      setExpression('confused');
      
      const fallbackMsg = "Oh no! 🥺 I am having trouble connecting to the network right now. Please try again in a moment.";
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fallbackMsg,
        metadata: { expression: 'confused' },
        createdAt: new Date().toISOString()
      }]);
      speakRef.current?.(fallbackMsg);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, conversationId, user, location.pathname]);

  // Voice command execution handler
  const handleVoiceCommand = useCallback((command, rawText) => {
    if (!user) {
      const loginPromptMsg = {
        role: 'assistant',
        content: "Please log in first to use voice commands and chat with Tejas! 🎙️🔐",
        metadata: {
          expression: 'happy',
          actions: [
            { type: 'LOGIN', label: 'Log In / Sign Up', icon: FiLogIn }
          ]
        },
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, loginPromptMsg]);
      setExpression('happy');
      return;
    }

    switch (command.type) {
      case 'UPGRADE_PRO':
        setExpression('celebrating');
        toast.success('Voice Command: B2B Upgrade to Pro', { icon: '👑' });
        if (user?.userType === 'enterpriser' || user?.userType === 'enterprise') {
          setIsSubscriptionModalOpen(true);
        } else {
          setIsB2CSubscriptionModalOpen(true);
        }
        break;

      case 'TRACK_ORDER':
        setExpression('celebrating');
        toast.success('Voice Command: Live GPS Tracking', { icon: '🚚' });
        navigate(command.path || '/orders/track');
        setIsOpen(false);
        break;

      case 'CREATE_RFQ':
        setExpression('celebrating');
        toast.success('Voice Command: Create RFQ', { icon: '📋' });
        navigate(command.path || '/rfq/new');
        setIsOpen(false);
        break;

      case 'NAVIGATE':
        if (command.path) {
          setExpression('happy');
          toast.success(`Voice Command: ${command.label}`, { icon: '🧭' });
          navigate(command.path);
          setIsOpen(false);
        }
        break;

      default:
        // Populate spoken text into input box so user can review and edit before sending
        setInputText(rawText);
    }
  }, [user, navigate]);

  // Speech-to-text transcript handlers: populate input text for editing
  const onTranscriptChangeHandler = useCallback((text) => {
    setInputText(text);
  }, []);

  const onFinalTranscriptHandler = useCallback((finalText) => {
    if (finalText && finalText.trim()) {
      setInputText(finalText.trim());
    }
  }, []);

  // Voice recognition hook
  const {
    isListening,
    isSpeaking,
    isSupported,
    isTtsEnabled,
    setIsTtsEnabled,
    interimTranscript,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  } = useVoiceRecognition({
    onTranscriptChange: onTranscriptChangeHandler,
    onFinalTranscript: onFinalTranscriptHandler,
    onVoiceCommand: handleVoiceCommand
  });

  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

  // Dynamic expression management
  useEffect(() => {
    if (isListening) {
      setExpression('listening');
    } else if (isLoading) {
      setExpression('thinking');
    } else if (isSpeaking) {
      setExpression('speaking');
    } else if (expression === 'listening' || expression === 'thinking' || expression === 'speaking') {
      const timer = setTimeout(() => setExpression('idle'), 2500);
      return () => clearTimeout(timer);
    }
  }, [isListening, isLoading, isSpeaking]);

  // Reset conversation selection if role context changes
  useEffect(() => {
    setConversationId(null);
    setMessages([]);
    setHandoverState(null);
    if (isOpen && user) {
      loadConversation();
    }
  }, [location.pathname, user]);

  // Reset conversation handler for starting fresh chat
  const handleResetConversation = () => {
    setConversationId(null);
    setMessages([]);
    setHandoverState(null);
    setInputText('');
    setExpression('idle');
    toast.success('Started a fresh conversation with Tejas.', { icon: '✨' });
  };

  // Load conversation thread when opening chat
  useEffect(() => {
    if (isOpen) {
      if (user) {
        loadConversation();
      }
    } else {
      stopListening();
      stopSpeaking();
    }
  }, [isOpen, user]);

  // Scroll to bottom on new message
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async () => {
    if (!user) return;
    try {
      const currentRole = getRoleContext();
      const params = { roleContext: currentRole };
      
      const res = await api.get('/assistant/conversations', { params });
      if (res.data && res.data.success && res.data.conversations.length > 0) {
        const latestId = res.data.conversations[0].conversationId;
        setConversationId(latestId);
        
        const detailRes = await api.get(`/assistant/conversations/${latestId}`, { params });
        if (detailRes.data && detailRes.data.success && detailRes.data.conversation) {
          const loadedConversation = detailRes.data.conversation;
          setMessages(loadedConversation.messages || []);
          if (loadedConversation.status === 'handover') {
            setHandoverState({ status: 'pending' });
          } else {
            setHandoverState(null);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load conversation history:', e.message);
    }
  };

  // Quick Action click handler
  const handleActionClick = (action) => {
    switch (action.type) {
      case 'UPGRADE_PRO':
        setExpression('celebrating');
        if (user?.userType === 'enterpriser' || user?.userType === 'enterprise') {
          setIsSubscriptionModalOpen(true);
        } else {
          setIsB2CSubscriptionModalOpen(true);
        }
        break;

      case 'VIEW_PRODUCT':
        if (action.payload?.productId) {
          setIsOpen(false);
          navigate(`/product/${action.payload.productId}`);
        }
        break;

      case 'TRACK_ORDER':
        if (action.payload?.orderId) {
          setIsOpen(false);
          navigate(`/track-order/${action.payload.orderId}`);
        } else {
          setIsOpen(false);
          navigate('/orders/track');
        }
        break;

      case 'VIEW_MY_ORDERS':
        setIsOpen(false);
        navigate('/orders');
        break;

      case 'CONTACT_SUPPORT':
        handleSendMessage('Connect me to support');
        break;

      case 'LOGIN':
        setIsOpen(false);
        navigate(getLoginPath(), { state: { redirect: location.pathname } });
        break;

      case 'NAVIGATE':
        if (action.payload?.path) {
          let targetPath = action.payload.path;
          if (targetPath.includes('quiz') || targetPath.includes('persona')) {
            targetPath = '/designer-quiz';
          } else if (targetPath.includes('visualizer')) {
            targetPath = '/ai-room-visualizer';
          } else if (targetPath.includes('estimator') || targetPath.includes('cost')) {
            targetPath = '/cost-estimator';
          } else if (targetPath.includes('boq')) {
            targetPath = '/boq-generator';
          }
          setIsOpen(false);
          navigate(targetPath);
        }
        break;

      // Seller Actions
      case 'VIEW_SELLER_ORDERS':
        setIsOpen(false);
        navigate('/seller/orders');
        break;
      case 'VIEW_SELLER_STOCK':
        setIsOpen(false);
        navigate('/seller/stock-management');
        break;
      case 'VIEW_SELLER_PRODUCTS':
        setIsOpen(false);
        navigate('/seller/my-products');
        break;
      case 'VIEW_SELLER_WALLET':
        setIsOpen(false);
        navigate('/seller/wallet');
        break;

      // Delivery Actions
      case 'VIEW_DELIVERY_TASKS':
        setIsOpen(false);
        navigate('/delivery/dashboard');
        break;
      case 'VIEW_DELIVERY_HISTORY':
        setIsOpen(false);
        navigate('/delivery/history');
        break;

      // Admin Actions
      case 'VIEW_ADMIN_ORDERS':
        setIsOpen(false);
        navigate('/admin/orders');
        break;
      case 'VIEW_ADMIN_SELLERS':
        setIsOpen(false);
        navigate('/admin/active-sellers');
        break;
      case 'VIEW_ADMIN_HANDOVERS':
        setIsOpen(false);
        navigate('/admin/dashboard');
        break;

      default:
        console.warn('Unknown action:', action.type);
    }
  };

  const getQuickActions = () => {
    if (handoverState) return [];

    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.metadata?.actions?.length > 0) {
      return lastMsg.metadata.actions;
    }

    if (roleContext === 'seller') {
      return [
        { type: 'PROMPT', label: 'Low Stock Alert', icon: FiAlertCircle, isPrompt: true, text: 'Show my low stock products' },
        { type: 'PROMPT', label: 'My Orders', icon: FiShoppingBag, isPrompt: true, text: 'Show orders for my store' },
        { type: 'PROMPT', label: 'Store Revenue', icon: FiDollarSign, isPrompt: true, text: 'Give me my seller summary and revenue' },
        { type: 'VIEW_SELLER_PRODUCTS', label: 'Catalog Items', icon: FiBox }
      ];
    }

    if (roleContext === 'delivery') {
      return [
        { type: 'PROMPT', label: 'Assigned Deliveries', icon: FiTruck, isPrompt: true, text: 'Show my assigned deliveries' },
        { type: 'PROMPT', label: 'COD Summary', icon: FiDollarSign, isPrompt: true, text: 'Summary of COD collection today' },
        { type: 'VIEW_DELIVERY_HISTORY', label: 'Delivery History', icon: FiList }
      ];
    }

    if (roleContext === 'admin') {
      return [
        { type: 'PROMPT', label: 'Platform Performance', icon: FiShield, isPrompt: true, text: 'Give me platform sales and commission summary' },
        { type: 'PROMPT', label: 'Pending Handovers', icon: FiAlertCircle, isPrompt: true, text: 'Show pending support handovers' },
        { type: 'PROMPT', label: 'Pending Sellers', icon: FiCheckSquare, isPrompt: true, text: 'List sellers waiting for approval' },
        { type: 'VIEW_ADMIN_ORDERS', label: 'All Orders', icon: FiShoppingBag }
      ];
    }

    // Default Customer / B2B mode
    return [
      { type: 'UPGRADE_PRO', label: 'B2B Upgrade to Pro', icon: LuCrown },
      { type: 'TRACK_ORDER', label: 'Live GPS Tracking', icon: FiTruck },
      { type: 'NAVIGATE', label: 'Create Bulk RFQ', icon: FiFileText, payload: { path: '/rfq/new' } },
      { type: 'SUGGEST_DESIGN', label: 'Design Persona Quiz', icon: FiCompass, isPrompt: true, text: 'Take AI design quiz' },
      { type: 'CONTACT_SUPPORT', label: 'Contact Support', icon: FiHelpCircle }
    ];
  };

  const handleQuickAction = (act) => {
    if (!user && act.type !== 'LOGIN') {
      const loginPromptMsg = {
        role: 'assistant',
        content: `Please log in first to use "${act.label}" and chat with Tejas! 🔐`,
        metadata: {
          expression: 'happy',
          actions: [
            { type: 'LOGIN', label: 'Log In / Sign Up', icon: FiLogIn }
          ]
        },
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, loginPromptMsg]);
      setExpression('happy');
      return;
    }
    if (act.isPrompt) {
      const text = act.text || act.label;
      handleSendMessage(text);
    } else {
      handleActionClick(act);
    }
  };

  const getHeaderInfo = () => {
    if (roleContext === 'seller') {
      return {
        title: 'Tejas',
        subtitle: 'Seller Business Advisor',
        badge: 'SELLER ASSISTANT',
        greeting: `Namaste ${user?.shopName || 'Seller'} ji! 🙏`,
        intro: 'Ask me about your store inventory, low stock warnings, seller orders, or revenue details.'
      };
    }
    if (roleContext === 'delivery') {
      return {
        title: 'Tejas',
        subtitle: 'Logistics & Delivery Advisor',
        badge: 'DELIVERY ASSISTANT',
        greeting: `Namaste ${user?.fullName || 'Partner'} ji! 🚚`,
        intro: 'Ask me about your assigned packages, pickup/drop addresses, or COD collection summaries.'
      };
    }
    if (roleContext === 'admin') {
      return {
        title: 'Tejas',
        subtitle: 'Platform Operations Executive',
        badge: 'ADMIN ASSISTANT',
        greeting: `Namaste ${user?.fullName || 'Admin'} ji! 👑`,
        intro: 'Ask me about overall platform sales, commission profit, pending seller approvals, or customer support handovers.'
      };
    }
    return {
      title: 'Ask Tejas',
      subtitle: 'Interior & Voice Consultant',
      badge: 'AI VOICE CONSULTANT',
      greeting: 'Namaste! I am Tejas. 🙏',
      intro: 'Speak or type any command! Try saying "B2B Upgrade to Pro", "Mera order track karo", or ask for interior design & Vastu advice!'
    };
  };

  const headerInfo = getHeaderInfo();

  return (
    <>
      <div className={`fixed right-6 z-[99999] print:hidden ${roleContext === 'user' ? 'bottom-28 md:bottom-24' : 'bottom-6 md:bottom-6'}`}>
        
        {/* ── Animated Mascot Trigger Button ── */}
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="relative"
        >
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Ask Tejas"
            className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-2xl transition-all focus:outline-none overflow-hidden ${
              isOpen ? 'bg-[#189D91] text-white ring-4 ring-[#189D91]/20' : 'bg-white p-1 hover:shadow-[0_20px_35px_rgba(24,157,145,0.25)] border-2 border-teal-100'
            }`}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                  <FiX size={32} />
                </motion.div>
              ) : (
                <motion.img
                  key="tejas-original-logo"
                  src="/ask tejas final icon.png"
                  alt="Ask Tejas"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full object-contain rounded-full select-none"
                />
              )}
            </AnimatePresence>
          </button>

          {/* Quick Voice Wave Hint when closed */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#189D91] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#189D91] border-2 border-white text-[7px] text-white font-black items-center justify-center">🎤</span>
            </span>
          )}
        </motion.div>

        {/* ── Expandable Interactive Chat & Voice Drawer ── */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="absolute bottom-[86px] right-0 w-[350px] sm:w-[400px] h-[520px] max-h-[calc(100vh-140px)] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
            >
              {/* Header with Avatar & Audio Controls */}
              <div className="bg-gradient-to-r from-[#0E544D] via-[#189D91] to-[#127F75] text-white px-4 py-3.5 flex items-center justify-between border-b border-white/10 shadow-md">
                <div className="flex items-center gap-3">
                  <TejasAvatar expression={expression} size={42} showReactionBadge={true} />
                  <div>
                    <h3 className="font-black text-sm tracking-tight leading-none text-white">{headerInfo.title}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-amber-400 animate-ping' : 'bg-[#4ADE80]'}`}></span>
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-teal-100">
                        {isListening ? 'Voice Listening...' : headerInfo.subtitle}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Start Fresh Conversation */}
                  <button
                    onClick={handleResetConversation}
                    title="Start New Chat"
                    className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                  >
                    <FiRotateCcw size={15} />
                  </button>

                  {/* TTS Voice Audio Toggle */}
                  <button
                    onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                    title={isTtsEnabled ? 'Voice Audio Enabled' : 'Voice Audio Muted'}
                    className={`p-1.5 rounded-full transition-all ${
                      isTtsEnabled ? 'bg-white/20 text-amber-300' : 'text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {isTtsEnabled ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
                  </button>

                  {/* Close button */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 no-scrollbar">
                
                {/* Unauthenticated / Guest Welcome & Login Card */}
                {messages.length === 0 && !user && (
                  <div className="text-center py-6 px-4 space-y-4 bg-gradient-to-b from-white to-teal-50/40 rounded-3xl border border-teal-100 shadow-sm">
                    <div className="flex justify-center">
                      <div className="p-2.5 bg-teal-50/80 rounded-full border border-teal-100 shadow-inner">
                        <TejasAvatar expression="happy" size={54} />
                      </div>
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/60 rounded-full text-[10px] font-black text-amber-800 uppercase tracking-wider mb-2">
                        <FiLogIn size={11} className="text-amber-600" /> Login Required
                      </div>
                      <h4 className="font-black text-slate-800 text-sm tracking-tight">{headerInfo.greeting}</h4>
                      <p className="text-xs text-gray-600 font-medium leading-relaxed mt-1.5">
                        Please log in first to chat with me! Unlock personalized interior styling, live GPS order tracking, and voice assistance.
                      </p>
                    </div>

                    {/* Primary Login Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        navigate(getLoginPath(), { state: { redirect: location.pathname } });
                      }}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-[#189D91] to-[#127F75] hover:from-[#14847a] hover:to-[#0e635b] text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
                    >
                      <FiLogIn size={14} />
                      Log In to Start Chat
                    </button>

                    {/* Sign Up Link */}
                    <p className="text-[11px] text-gray-500 font-medium">
                      New to Riddha Mart?{' '}
                      <Link
                        to="/signup"
                        onClick={() => setIsOpen(false)}
                        className="font-bold text-[#189D91] hover:underline"
                      >
                        Create an account
                      </Link>
                    </p>

                    {/* Feature Highlights */}
                    <div className="pt-3 border-t border-gray-100 text-left space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">What you can do with Tejas:</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 bg-white p-2 rounded-xl border border-gray-100 shadow-2xs">
                          <span>🎨</span> Room Styling
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 bg-white p-2 rounded-xl border border-gray-100 shadow-2xs">
                          <span>🚚</span> GPS Tracking
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 bg-white p-2 rounded-xl border border-gray-100 shadow-2xs">
                          <span>🎙️</span> Voice Commands
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 bg-white p-2 rounded-xl border border-gray-100 shadow-2xs">
                          <span>📋</span> Instant RFQ
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Authenticated Welcome Card */}
                {messages.length === 0 && user && (
                  <div className="text-center py-5 px-3 space-y-3 bg-white rounded-2xl border border-teal-100/60 shadow-sm">
                    <div className="flex justify-center">
                      <TejasAvatar expression="idle" size={54} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm">{headerInfo.greeting}</h4>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">
                        {headerInfo.intro}
                      </p>
                    </div>

                    {/* Quick Voice Command Tips */}
                    <div className="pt-2 border-t border-gray-100 text-left space-y-1.5">
                      <p className="text-[10px] font-black text-[#189D91] uppercase tracking-wider">🎙️ Try Voice Commands:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['"B2B Upgrade to Pro"', '"Mera order track karo"', '"Create RFQ"', '"Vastu tips for home"'].map((tip, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(tip.replace(/"/g, ''))}
                            className="text-[10px] bg-teal-50 hover:bg-teal-100 text-[#189D91] px-2.5 py-1 rounded-lg font-bold transition-colors"
                          >
                            {tip}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Message Stream */}
                {messages.map((msg, index) => (
                  <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}>
                    
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 ml-1">
                        <TejasAvatar
                          expression={msg.metadata?.expression || (msg.content?.toLowerCase().includes('oh no') ? 'confused' : 'idle')}
                          size={24}
                          showReactionBadge={false}
                        />
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500">Tejas</span>
                      </div>
                    )}
                    
                    <div className={`max-w-[88%] px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-[#189D91] text-white rounded-tr-none'
                        : msg.content?.toLowerCase().includes('oh no')
                        ? 'bg-amber-50/80 text-slate-800 rounded-tl-none border border-amber-200 shadow-sm'
                        : 'bg-white text-slate-800 rounded-tl-none border border-gray-100'
                    }`}>
                      <p className="whitespace-pre-line">{msg.content}</p>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center justify-end pt-1 -mb-1">
                          <button
                            onClick={() => speakRef.current?.(msg.content)}
                            title="Listen with Tejas's Indian Voice"
                            className="text-gray-400 hover:text-[#189D91] transition-colors p-0.5 rounded flex items-center gap-1 text-[10px]"
                          >
                            <FiVolume2 size={12} />
                            <span className="text-[9px] font-semibold">Listen</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Direct Action Chips */}
                    {msg.metadata?.actions?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 max-w-[90%]">
                        {msg.metadata.actions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => handleActionClick(act)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ${
                              act.type === 'UPGRADE_PRO'
                                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-300'
                                : 'bg-[#189D91] text-white hover:bg-[#14847a]'
                            }`}
                          >
                            {act.type === 'UPGRADE_PRO' && <LuCrown size={12} />}
                            {act.label}
                            <FiArrowUpRight size={11} />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Products Grid */}
                    {msg.metadata?.products?.length > 0 && (
                      <div className="w-full grid grid-cols-2 gap-2.5 pt-1.5">
                        {msg.metadata.products.map((p, idx) => (
                          <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-2 flex flex-col shadow-sm">
                            <div className="aspect-square w-full rounded-xl bg-gray-50 overflow-hidden relative border border-gray-50 shrink-0">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#189D91]/5 text-[#189D91] text-[9px] font-bold">Riddha Mart</div>
                              )}
                            </div>
                            <div className="mt-2 flex-1 flex flex-col justify-between">
                              <div>
                                <h5 className="font-bold text-[11px] text-slate-800 line-clamp-1 leading-tight">{p.name}</h5>
                                <p className="text-[11px] font-black text-slate-900 mt-0.5">₹{Number(p.price).toLocaleString()}</p>
                              </div>
                              <button
                                onClick={() => handleActionClick({ type: 'VIEW_PRODUCT', payload: { productId: p.productId } })}
                                className="w-full mt-2 py-1.5 bg-[#189D91]/10 hover:bg-[#189D91] text-[#189D91] hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all leading-none"
                              >
                                View Item
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Orders */}
                    {msg.metadata?.orders?.length > 0 && (
                      <div className="w-full pt-1">
                        {msg.metadata.orders.map((o, idx) => (
                          <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm space-y-2">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                              <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">Order Ref</p>
                                <p className="text-[11px] font-black text-slate-800 mt-1">#{o.orderId.substring(o.orderId.length - 8).toUpperCase()}</p>
                              </div>
                              <span className="text-[9px] font-bold uppercase bg-[#189D91]/10 text-[#189D91] px-2 py-1 rounded-full border border-[#189D91]/15">
                                {o.status}
                              </span>
                            </div>
                            <button
                              onClick={() => handleActionClick({ type: 'TRACK_ORDER', payload: { orderId: o.orderId } })}
                              className="w-full py-2 bg-teal-50 hover:bg-teal-100 text-[#189D91] font-bold rounded-xl text-[10px] flex items-center justify-center gap-1.5 transition-all"
                            >
                              <FiTruck size={12} /> Live GPS Tracking
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Handover Card */}
                    {msg.metadata?.handover?.reason && (
                      <div className="w-full pt-1.5">
                        <div className="bg-[#FF6B35]/5 border border-[#FF6B35]/15 rounded-2xl p-3 flex items-start gap-2.5 shadow-sm">
                          <FiAlertCircle className="text-[#FF6B35] shrink-0 mt-0.5" size={16} />
                          <div>
                            <h5 className="text-[11px] font-black text-slate-800 leading-none">Support Ticket Generated</h5>
                            <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                              {msg.metadata.handover.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Live Speech Recognition Wave Banner */}
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl flex items-center gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-5 bg-[#189D91] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-7 bg-[#189D91] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-4 bg-[#189D91] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="w-1.5 h-6 bg-[#189D91] rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-[#189D91] uppercase tracking-wider">Listening to you...</p>
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {interimTranscript || 'Speak your command now...'}
                      </p>
                    </div>
                    <button
                      onClick={stopListening}
                      className="px-2.5 py-1 bg-[#189D91] text-white text-[10px] font-black rounded-lg uppercase"
                    >
                      Done
                    </button>
                  </motion.div>
                )}

                {/* Thinking Animation */}
                {isLoading && (
                  <div className="flex flex-col items-start space-y-1">
                    <div className="flex items-center gap-1.5 ml-1">
                      <TejasAvatar expression="thinking" size={24} showReactionBadge={false} />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Tejas is thinking...</span>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-[#189D91] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-[#189D91] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-[#189D91] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions Carousel */}
              {!handoverState && (
                <div className="px-3 pt-2 pb-1 border-t border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap bg-white shrink-0">
                  {getQuickActions().map((act, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickAction(act)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                        act.type === 'UPGRADE_PRO'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black'
                          : 'bg-gray-50 hover:bg-[#189D91]/10 text-slate-700 hover:text-[#189D91] border border-gray-100'
                      }`}
                    >
                      {act.icon && <act.icon size={12} className={act.type === 'UPGRADE_PRO' ? 'text-amber-600' : ''} />}
                      {act.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Login Required Notice Bar if unauthenticated */}
              {!user && (
                <div className="px-3.5 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200/70 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                    <p className="text-[11px] font-bold text-amber-900 truncate">
                      Login first to chat with Tejas
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate(getLoginPath(), { state: { redirect: location.pathname } });
                    }}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black rounded-lg uppercase tracking-wider transition-all shrink-0 active:scale-95 flex items-center gap-1 shadow-sm"
                  >
                    <FiLogIn size={11} /> Log In
                  </button>
                </div>
              )}

              {/* Chat & Voice Input Bar */}
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="p-3 border-t border-gray-100 flex items-center gap-2 bg-white shrink-0"
              >
                {/* Voice Input Microphone Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      setExpression('happy');
                      const loginPromptMsg = {
                        role: 'assistant',
                        content: "Please log in first to use voice commands with Tejas! 🎙️🔐",
                        metadata: {
                          expression: 'happy',
                          actions: [
                            { type: 'LOGIN', label: 'Log In Now', icon: FiLogIn }
                          ]
                        },
                        createdAt: new Date().toISOString()
                      };
                      setMessages(prev => [...prev, loginPromptMsg]);
                      return;
                    }
                    isListening ? stopListening() : startListening();
                  }}
                  title={!user ? 'Login required for voice' : (isListening ? 'Stop listening' : 'Start voice command')}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse shadow-lg ring-4 ring-red-100'
                      : 'bg-teal-50 hover:bg-teal-100 text-[#189D91]'
                  }`}
                >
                  {isListening ? <FiMicOff size={16} /> : <FiMic size={16} />}
                </button>

                <input
                  type="text"
                  disabled={isLoading}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    !user
                      ? "Ask Tejas (Login required to chat)..."
                      : isListening
                      ? "Listening to voice..."
                      : "Ask Tejas or speak command..."
                  }
                  className="flex-1 bg-gray-50 border border-transparent focus:border-[#189D91]/30 focus:bg-white focus:outline-none rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 transition-all"
                />

                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className="w-10 h-10 bg-[#189D91] hover:bg-[#14847a] disabled:bg-gray-100 text-white disabled:text-gray-400 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-sm active:scale-95"
                >
                  <FiSend size={15} />
                </button>
              </form>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Direct Pro Upgrade Modals for Voice Command Execution */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />

      <B2CSubscriptionModal
        isOpen={isB2CSubscriptionModalOpen}
        onClose={() => setIsB2CSubscriptionModalOpen(false)}
      />
    </>
  );
};

export default AiAssistantWidget;
