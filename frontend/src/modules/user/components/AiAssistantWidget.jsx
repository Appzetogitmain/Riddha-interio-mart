import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiSend, FiUser, FiCompass,
  FiShoppingBag, FiTruck, FiCornerDownRight, FiCheckCircle,
  FiAlertCircle, FiLogIn, FiHelpCircle, FiFileText, FiDollarSign,
  FiBox, FiShield, FiCheckSquare, FiList
} from 'react-icons/fi';

const TEJAS_ICON = '/ask tejas final icon.png';
import { useUser } from '../data/UserContext';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

const AiAssistantWidget = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [guestSessionId, setGuestSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [handoverState, setHandoverState] = useState(null); // { requestId, status }
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

  // Reset conversation selection if role context changes
  useEffect(() => {
    setConversationId(null);
    setMessages([]);
    setHandoverState(null);
    if (isOpen) {
      loadConversation();
    }
  }, [location.pathname, user]);

  // Initialize guest session ID if not logged in
  useEffect(() => {
    if (!user) {
      let savedId = localStorage.getItem('riddha_guest_assistant_session');
      if (!savedId) {
        savedId = 'guest_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('riddha_guest_assistant_session', savedId);
      }
      setGuestSessionId(savedId);
    } else {
      setGuestSessionId(null);
    }
  }, [user]);

  // Load conversation thread when opening chat
  useEffect(() => {
    if (isOpen) {
      loadConversation();
    }
  }, [isOpen, user, guestSessionId]);

  // Scroll to bottom on new message
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async () => {
    try {
      const currentRole = getRoleContext();
      const params = { roleContext: currentRole };
      if (!user && guestSessionId) {
        params.guestSessionId = guestSessionId;
      }
      
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

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text || text.trim().length === 0 || isLoading) return;

    if (!textToSend) {
      setInputText('');
    }

    const tempUserMsg = {
      role: 'user',
      content: text,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const currentRole = getRoleContext();
      const payload = {
        message: text,
        conversationId,
        roleContext: currentRole,
        guestSessionId: user ? undefined : guestSessionId
      };

      const res = await api.post('/assistant/chat', payload);
      if (res.data && res.data.success) {
        setConversationId(res.data.conversationId);
        
        const botMsg = {
          role: 'assistant',
          content: res.data.message,
          metadata: {
            products: res.data.products || [],
            orders: res.data.orders || [],
            actions: res.data.actions || [],
            handover: res.data.handover || null
          },
          createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, botMsg]);

        if (res.data.handover) {
          setHandoverState(res.data.handover);
          toast.success('Escalated to human support team.');
        }
      }
    } catch (e) {
      const errMsg = e.response?.data?.error || 'Failed to send message. Please retry.';
      toast.error(errMsg);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I am having trouble connecting right now. Please try again in a moment.",
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Action click handler
  const handleActionClick = (action) => {
    switch (action.type) {
      // Customer Actions
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
        navigate('/login');
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

    // Default Customer mode
    if (user) {
      return [
        { type: 'VIEW_MY_ORDERS', label: 'My Orders', icon: FiShoppingBag },
        { type: 'TRACK_ORDER', label: 'Track Order', icon: FiTruck },
        { type: 'SUGGEST_DESIGN', label: 'Design Ideas', icon: FiCompass, isPrompt: true, text: 'Suggest living room styling ideas' },
        { type: 'CONTACT_SUPPORT', label: 'Contact Support', icon: FiHelpCircle }
      ];
    } else {
      return [
        { type: 'BROWSE_PRODUCTS', label: 'Browse Products', icon: FiShoppingBag, isPrompt: true, text: 'Show me store products' },
        { type: 'SUGGEST_DESIGN', label: 'Design Ideas', icon: FiCompass, isPrompt: true, text: 'Suggest interior decor options' },
        { type: 'LOGIN', label: 'Login', icon: FiLogIn },
        { type: 'CONTACT_SUPPORT', label: 'Talk to Support', icon: FiHelpCircle }
      ];
    }
  };

  const handleQuickAction = (act) => {
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
        greeting: `Hello ${user?.shopName || 'Seller'}! 👋`,
        intro: 'Ask me about your store inventory, low stock warnings, seller orders, or revenue details.'
      };
    }
    if (roleContext === 'delivery') {
      return {
        title: 'Tejas',
        subtitle: 'Logistics & Delivery Advisor',
        badge: 'DELIVERY ASSISTANT',
        greeting: `Hello ${user?.fullName || 'Partner'}! 👋`,
        intro: 'Ask me about your assigned packages, pickup/drop addresses, or COD collection summaries.'
      };
    }
    if (roleContext === 'admin') {
      return {
        title: 'Tejas',
        subtitle: 'Platform Operations Executive',
        badge: 'ADMIN ASSISTANT',
        greeting: `Hello ${user?.fullName || 'Admin'}! 👋`,
        intro: 'Ask me about overall platform sales, commission profit, pending seller approvals, or customer support handovers.'
      };
    }
    return {
      title: 'Ask Tejas',
      subtitle: 'Interior & Shopping Consultant',
      badge: 'AI CONSULTANT',
      greeting: 'Hello! I am Tejas. 👋',
      intro: 'How can I assist you today? Ask me about products, interior design ideas, styling, or track your orders!'
    };
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className={`fixed right-6 z-[99999] print:hidden ${roleContext === 'user' ? 'bottom-28 md:bottom-24' : 'bottom-6 md:bottom-6'}`}>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Ask Tejas"
        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl border border-white/20 transition-colors focus:outline-none overflow-hidden ${
          isOpen ? 'bg-[#189D91] hover:bg-[#28a399] text-white' : 'bg-white'
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <FiX size={30} />
            </motion.div>
          ) : (
            <motion.img
              key="chat"
              src={TEJAS_ICON}
              alt="Ask Tejas"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="w-full h-full object-cover"
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Expandable Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="absolute bottom-[76px] right-0 w-[350px] sm:w-[380px] h-[450px] max-h-[calc(100vh-180px)] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#189D91] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#189D91]/15">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white overflow-hidden flex items-center justify-center border border-white/25 shrink-0">
                  <img src={TEJAS_ICON} alt="Ask Tejas" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight leading-none">{headerInfo.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-[#4ADE80]"></span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/80">{headerInfo.subtitle}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all">
                <FiX size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 no-scrollbar">
              {messages.length === 0 && (
                <div className="text-center py-6 px-4 space-y-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden mx-auto border border-[#189D91]/15">
                    <img src={TEJAS_ICON} alt="Ask Tejas" className="w-full h-full object-cover" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">{headerInfo.greeting}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {headerInfo.intro}
                  </p>
                </div>
              )}

              {messages.map((msg, index) => (
                <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}>
                  {msg.role === 'assistant' && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 ml-1">Tejas</span>
                  )}
                  
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-[#189D91] text-white rounded-tr-none'
                      : 'bg-white text-slate-700 rounded-tl-none border border-gray-100'
                  }`}>
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>

                  {/* Products */}
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
                              {p.reason && (
                                <p className="text-[9px] text-gray-400 line-clamp-2 mt-1 leading-normal italic">
                                  {p.reason}
                                </p>
                              )}
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
                          {o.totalPrice && (
                            <div className="flex justify-between text-[11px] font-bold text-slate-800">
                              <span>Total Amount:</span>
                              <span>₹{Number(o.totalPrice).toLocaleString()}</span>
                            </div>
                          )}
                          <button
                            onClick={() => handleActionClick({ type: 'TRACK_ORDER', payload: { orderId: o.orderId } })}
                            className="w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-100 text-slate-700 font-bold rounded-xl text-[10px] flex items-center justify-center gap-1.5 transition-all"
                          >
                            <FiTruck size={12} /> View Details
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Handover card */}
                  {msg.metadata?.handover && (
                    <div className="w-full pt-1.5">
                      <div className="bg-[#FF6B35]/5 border border-[#FF6B35]/15 rounded-2xl p-3 flex items-start gap-2.5 shadow-sm">
                        <FiAlertCircle className="text-[#FF6B35] shrink-0 mt-0.5" size={16} />
                        <div>
                          <h5 className="text-[11px] font-black text-slate-800 leading-none">Support Ticket Generated</h5>
                          <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                            We have recorded your chat and forwarded it to our customer support representatives.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Dot Loader */}
              {isLoading && (
                <div className="flex flex-col items-start space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 ml-1">Tejas</span>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#189D91] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-[#189D91] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-[#189D91] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions Bar */}
            {!handoverState && (
              <div className="px-4 pt-2.5 pb-1 border-t border-gray-50 flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap bg-white shrink-0">
                {getQuickActions().map((act, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(act)}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-[#189D91]/10 text-slate-700 hover:text-[#189D91] border border-gray-100 hover:border-[#189D91]/15 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    {act.icon && <act.icon size={11} />}
                    {act.label}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Input form */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="p-3 border-t border-gray-100 flex items-center gap-2 bg-white shrink-0"
            >
              <input
                type="text"
                disabled={isLoading || !!handoverState}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={handoverState ? "Support session active..." : "Ask Tejas anything..."}
                className="flex-1 bg-gray-50 border border-transparent focus:border-gray-100 focus:bg-white focus:outline-none rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 tracking-tight transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !!handoverState || !inputText.trim()}
                className="w-9 h-9 bg-[#189D91] hover:bg-[#28a399] disabled:bg-gray-100 text-white disabled:text-gray-400 rounded-xl flex items-center justify-center shrink-0 transition-colors focus:outline-none shadow-sm"
              >
                <FiSend size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiAssistantWidget;
