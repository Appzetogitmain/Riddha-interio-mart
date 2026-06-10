import React, { useState, useEffect, useRef } from 'react';
import PageWrapper from '../components/PageWrapper';
import { 
  HelpCircle, 
  Book, 
  MessageCircle, 
  Phone, 
  Mail, 
  Search, 
  ChevronRight, 
  FileText, 
  Zap, 
  Shield, 
  ExternalLink,
  LifeBuoy,
  PlayCircle,
  Plus,
  Send,
  X,
  Paperclip,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Inbox,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { uploadImage } from '../../../shared/utils/upload';
import api from '../../../shared/utils/api';

const HelpCenter = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('faqs');
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    category: 'Orders',
    priority: 'Low',
    description: '',
    attachments: []
  });

  // Drawer states for active chat thread
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const [email, setEmail] = useState('');
  const imageUploadInputRef = useRef(null);
  const pdfUploadInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (selectedTicket) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedTicket, selectedTicket?.replies]);

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        { q: "How do I list my first product?", a: "Navigate to the 'Add Product' section in your sidebar. Fill in the product details, upload high-quality images, and set your pricing. Once submitted, our team will review it within 24 hours." },
        { q: "What are the document requirements?", a: "You need a valid GSTIN, PAN Card, and a bank account in the business name to start selling on Riddha Mart." }
      ]
    },
    {
      category: "Orders & Shipping",
      questions: [
        { q: "How do I process an order?", a: "Go to the 'Orders' tab. New orders will appear under 'Pending'. Click 'Process' to confirm the order and prepare it for pickup." },
        { q: "Who handles the delivery?", a: "Riddha Mart provides a dedicated delivery network. You can assign our delivery partners directly from your dashboard." }
      ]
    },
    {
      category: "Payments & Wallet",
      questions: [
        { q: "When do I get my payments?", a: "Payments are settled into your wallet within 7 days of successful order delivery. You can withdraw funds directly to your bank account." },
        { q: "Are there any hidden fees?", a: "We believe in transparency. Our fee structure includes a flat commission based on the product category plus a small delivery facilitation fee." }
      ]
    }
  ];

  const contactChannels = [
    { 
      title: "Chat with Support", 
      detail: "Open a support ticket", 
      icon: <MessageCircle size={24} />, 
      color: "bg-blue-50 text-blue-600",
      action: () => { setActiveTab('tickets'); setIsCreateModalOpen(true); }
    },
    { 
      title: "Email Support", 
      detail: "support@riddhamart.com", 
      icon: <Mail size={24} />, 
      color: "bg-purple-50 text-purple-600",
      action: () => { window.location.href = "mailto:support@riddhamart.com?subject=Seller Support Request"; }
    },
    { 
      title: "Call Hotline", 
      detail: "+91 1800-RIDDHA", 
      icon: <Phone size={24} />, 
      color: "bg-emerald-50 text-emerald-600",
      action: () => { window.location.href = 'tel:+911800743342'; }
    },
  ];

  const quickResources = [
    {
      label: "Seller Handbook",
      icon: <FileText size={16} />,
      color: "text-blue-600",
      action: () => {
        setSearchQuery('');
        setActiveTab('faqs');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    {
      label: "Ticket Dashboard",
      icon: <LifeBuoy size={16} />,
      color: "text-rose-600",
      action: () => {
        setActiveTab('tickets');
        fetchTickets(false);
      }
    },
    {
      label: "Policies & Terms",
      icon: <Shield size={16} />,
      color: "text-emerald-600",
      action: () => navigate('/seller/terms')
    },
    {
      label: "Growth Recommendations",
      icon: <Zap size={16} />,
      color: "text-amber-600",
      action: () => navigate('/seller/recommendations')
    },
  ];

  // Fetch Tickets on Mount
  const fetchTickets = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data } = await api.get('/support/tickets');
      if (data.success) {
        setTickets(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load tickets.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Fetch individual ticket details when selecting or updating
  const handleSelectTicket = async (ticketId) => {
    try {
      const { data } = await api.get(`/support/tickets/${ticketId}`);
      if (data.success) {
        setSelectedTicket(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load ticket details.');
    }
  };

  // FAQ Instant Filter
  const filteredFaqs = faqs.map(cat => {
    const questions = cat.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...cat, questions };
  }).filter(cat => cat.questions.length > 0);

  // File Upload Stream
  const handleAttachmentUpload = async (e) => {
    const input = e.target;
    const files = Array.from(input.files || []);
    if (!files.length) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => uploadImage(file));
      const urls = await Promise.all(uploadPromises);
      const successfulUrls = urls.filter(Boolean);

      if (successfulUrls.length > 0) {
        setNewTicketForm(prev => ({
          ...prev,
          attachments: [...prev.attachments, ...successfulUrls]
        }));
        toast.success(`Successfully uploaded ${successfulUrls.length} file(s)`);
      } else {
        toast.error('File upload failed.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'File upload failed. Use gallery images or PDF files only.');
    } finally {
      setIsUploading(false);
      input.value = '';
    }
  };

  // Remove Attachment
  const handleRemoveAttachment = (idx) => {
    setNewTicketForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== idx)
    }));
  };

  // Create Ticket Submission
  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    if (!newTicketForm.subject.trim() || !newTicketForm.description.trim()) {
      toast.error('Please fill in both subject and description.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/support/tickets', newTicketForm);
      if (data.success) {
        toast.success('Support ticket raised successfully!');
        setNewTicketForm({
          subject: '',
          category: 'Orders',
          priority: 'Low',
          description: '',
          attachments: []
        });
        setIsCreateModalOpen(false);
        fetchTickets(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to raise support ticket.');
    } finally {
      setLoading(false);
    }
  };

  // Send Thread Reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsReplying(true);
    try {
      const { data } = await api.post(`/support/tickets/${selectedTicket._id}/replies`, {
        text: replyText
      });
      if (data.success) {
        setSelectedTicket(data.data);
        setReplyText('');
        toast.success('Reply submitted successfully.');
        fetchTickets(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit reply.');
    } finally {
      setIsReplying(false);
    }
  };

  // Newsletter subscription
  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter a valid email address.');
      return;
    }
    toast.success('Subscribed successfully to platform newsletter!');
    setEmail('');
  };

  // Helper Badge Color Styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1.5 w-max"><Clock size={12} /> Open</span>;
      case 'In Progress':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1.5 w-max"><AlertCircle size={12} /> In Progress</span>;
      case 'Resolved':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1.5 w-max"><CheckCircle2 size={12} /> Resolved</span>;
      case 'Closed':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-50 text-slate-500 border border-slate-200 flex items-center gap-1.5 w-max"><X size={12} /> Closed</span>;
      default:
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-50 text-slate-600 border border-slate-100 w-max">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Low':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-600">Low</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-50 text-blue-600">Medium</span>;
      case 'High':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-orange-50 text-orange-600 font-bold">High</span>;
      case 'Urgent':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-red-50 text-red-600 font-extrabold animate-pulse">Urgent</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-600">{priority}</span>;
    }
  };

  // Analytics counts
  const ticketStats = {
    total: tickets.length,
    active: tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length
  };

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-10 pb-20">
        
        {/* Hero Section */}
        <div className="relative bg-white rounded-[2.5rem] p-8 md:p-16 overflow-hidden text-center border border-slate-100 shadow-xl shadow-slate-200/40">
           <div className="absolute top-0 right-0 w-96 h-96 bg-seller-primary/5 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -ml-32 -mb-32"></div>
           
           <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100 text-slate-400 text-[10px] font-semibold uppercase tracking-widest">
                 <LifeBuoy size={14} className="text-seller-primary" /> Seller Support Center
              </div>
              <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight leading-tight">
                 How can we help you <br />
                 <span className="text-[#E36666]">grow your business?</span>
              </h1>
              
              <div className="relative max-w-xl mx-auto mt-10 group">
                  <div className="absolute inset-y-0 left-6 flex items-center text-slate-400 group-focus-within:text-seller-primary transition-colors">
                     <Search size={20} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search for articles, guides, or FAQs..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-16 pr-6 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-seller-primary/20 focus:bg-white transition-all text-sm font-medium shadow-sm"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (activeTab !== 'faqs') setActiveTab('faqs');
                    }}
                  />
              </div>
           </div>
        </div>

        {/* Support Channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {contactChannels.map((channel, i) => (
             <motion.div 
               key={i}
               whileHover={{ y: -5 }}
               onClick={channel.action}
               className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center text-center gap-4 group cursor-pointer"
             >
                <div className={`w-16 h-16 rounded-2xl ${channel.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                   {channel.icon}
                </div>
                <div>
                   <h3 className="text-lg font-semibold text-slate-900">{channel.title}</h3>
                   <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">{channel.detail}</p>
                </div>
             </motion.div>
           ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-8 border-b border-slate-100 pb-px">
          <button 
            onClick={() => setActiveTab('faqs')}
            className={`pb-4 text-sm font-semibold transition-all relative ${activeTab === 'faqs' ? 'text-seller-primary font-bold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Knowledge Base & FAQs
            {activeTab === 'faqs' && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-seller-primary" />
            )}
          </button>
          
          <button 
            onClick={() => {
              setActiveTab('tickets');
              fetchTickets(false);
            }}
            className={`pb-4 text-sm font-semibold transition-all relative flex items-center gap-2 ${activeTab === 'tickets' ? 'text-seller-primary font-bold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Support Tickets Dashboard
            {tickets.length > 0 && (
              <span className="bg-seller-primary/10 text-seller-primary text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                {tickets.length}
              </span>
            )}
            {activeTab === 'tickets' && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-seller-primary" />
            )}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* 1. FAQs Tab */}
            {activeTab === 'faqs' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-10"
              >
                {/* FAQs content left */}
                <div className="lg:col-span-2 space-y-8">
                   <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
                         <div className="w-1.5 h-6 bg-seller-primary rounded-full" />
                         Frequently Asked Questions
                      </h2>
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="text-[10px] font-semibold text-slate-400 hover:text-seller-primary uppercase tracking-wider"
                        >
                          Clear Search
                        </button>
                      )}
                   </div>

                   <div className="space-y-8">
                     {filteredFaqs.length > 0 ? (
                       filteredFaqs.map((cat, idx) => (
                         <div key={idx} className="space-y-4">
                            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">{cat.category}</h4>
                            <div className="grid grid-cols-1 gap-4">
                               {cat.questions.map((item, i) => (
                                 <div key={i} className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center justify-between mb-2">
                                       <p className="text-sm font-semibold text-slate-900 group-hover:text-seller-primary transition-colors">{item.q}</p>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">{item.a}</p>
                                 </div>
                               ))}
                            </div>
                         </div>
                       ))
                     ) : (
                       <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                          <Inbox size={48} className="mx-auto text-slate-300 mb-4" />
                          <h3 className="text-base font-semibold text-slate-700">No matching FAQs found</h3>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            Try broadening your keywords or create a support ticket directly in the Tickets section.
                          </p>
                       </div>
                     )}
                   </div>
                </div>

                {/* FAQ Resources sidebar right */}
                <div className="space-y-8">
                   <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                         <Book size={20} className="text-seller-primary" /> Quick Resources
                      </h3>
                      <div className="space-y-3">
                         {quickResources.map((item, i) => (
                           <button 
                             key={i} 
                             onClick={item.action}
                             className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 transition-all group"
                           >
                              <div className="flex items-center gap-3">
                                 <span className={item.color}>{item.icon}</span>
                                 <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                              </div>
                              <ExternalLink size={14} className="text-slate-300 group-hover:scale-110 transition-transform" />
                           </button>
                         ))}
                      </div>
                   </div>

                   {/* Newsletter Updates */}
                   <div className="bg-white rounded-[2.5rem] p-8 text-slate-900 relative overflow-hidden group border border-slate-100 shadow-xl shadow-slate-200/40">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-seller-primary/5 rounded-full blur-2xl -mr-12 -mt-12"></div>
                      <h4 className="text-lg font-semibold mb-2 relative z-10">Stay Updated!</h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-6 relative z-10 leading-relaxed">
                         Get latest platform updates and seller tips directly in your inbox.
                      </p>
                      <form onSubmit={handleSubscribe} className="relative z-10">
                         <input 
                           type="email" 
                           placeholder="Email address"
                           className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs placeholder-slate-400 focus:outline-none focus:bg-white transition-all mb-3 text-slate-700"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                         />
                         <button type="submit" className="w-full py-3 bg-[#E36666] text-white rounded-xl font-semibold text-[10px] uppercase tracking-widest hover:bg-[#D45555] transition-all shadow-lg shadow-[#E36666]/20">Subscribe</button>
                      </form>
                   </div>
                </div>
              </motion.div>
            )}

            {/* 2. Tickets Tab */}
            {activeTab === 'tickets' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Tickets Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Inquiries Raised</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-2">{ticketStats.total}</h3>
                    </div>
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
                      <Inbox size={22} />
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Support Threads</p>
                      <h3 className="text-2xl font-bold text-[#E36666] mt-2">{ticketStats.active}</h3>
                    </div>
                    <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-seller-primary">
                      <Clock size={22} />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolved Tickets</p>
                      <h3 className="text-2xl font-bold text-emerald-600 mt-2">{ticketStats.resolved}</h3>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                      <CheckCircle2 size={22} />
                    </div>
                  </div>
                </div>

                {/* Dashboard Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
                       <div className="w-1.5 h-6 bg-seller-primary rounded-full" />
                       Merchant Support Tickets
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Review, follow-up, and resolve active inquiries raised by your store.</p>
                  </div>
                  
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-[#E36666] text-white rounded-2xl font-semibold text-xs uppercase tracking-widest hover:bg-[#D45555] transition-all shadow-lg shadow-[#E36666]/25"
                  >
                    <Plus size={16} /> Raise Support Ticket
                  </button>
                </div>

                {/* Tickets Grid/List */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <Loader2 size={36} className="text-seller-primary animate-spin" />
                    <p className="text-xs text-slate-400 mt-3 font-semibold uppercase tracking-wider">Syncing support registry...</p>
                  </div>
                ) : tickets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tickets.map((ticket) => (
                      <motion.div 
                        key={ticket._id}
                        whileHover={{ y: -3 }}
                        onClick={() => handleSelectTicket(ticket._id)}
                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4 relative group overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="space-y-3 relative z-10">
                          {/* Ticket ID & Category */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 font-mono">{ticket.ticketId}</span>
                            <div className="flex items-center gap-2">
                              {getPriorityBadge(ticket.priority)}
                              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-50 text-slate-500 border border-slate-100">{ticket.category}</span>
                            </div>
                          </div>
                          
                          {/* Subject */}
                          <h4 className="text-sm font-bold text-slate-800 group-hover:text-seller-primary transition-colors line-clamp-1">{ticket.subject}</h4>
                          {/* Description */}
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{ticket.description}</p>
                        </div>

                        {/* Status Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50 relative z-10">
                          <span className="text-[10px] text-slate-400 font-semibold font-mono">
                            Last activity: {new Date(ticket.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          {getStatusBadge(ticket.status)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                    <LifeBuoy size={56} className="mx-auto text-slate-300 mb-4 animate-bounce" />
                    <h3 className="text-lg font-bold text-slate-700">No support tickets active</h3>
                    <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                      Need help regarding your orders, delayed payments, product inventory approvals, or account verification? Raise a formal ticket now and our dedicated executive will assist you.
                    </p>
                    <button 
                      onClick={() => setIsCreateModalOpen(true)}
                      className="mt-6 px-6 py-3 bg-slate-50 hover:bg-[#E36666]/5 border border-slate-200 text-slate-700 hover:text-seller-primary font-bold text-xs rounded-2xl transition-all"
                    >
                      Raise Your First Ticket
                    </button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* 3. Create Ticket Modal Overlay */}
        <AnimatePresence>
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              
              {/* Modal Container */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-2xl rounded-[2.5rem] border border-slate-100 shadow-2xl p-6 md:p-10 relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-100 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-seller-primary flex items-center justify-center">
                      <LifeBuoy size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Raise Support Ticket</h3>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Submit store inquiry to administration</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsCreateModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Form fields */}
                <form onSubmit={handleCreateTicketSubmit} className="flex-1 overflow-y-auto py-6 space-y-6 pr-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category Dropdown */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-100 focus:border-slate-200 focus:bg-white rounded-xl py-3 px-4 text-xs font-semibold text-slate-700 focus:outline-none transition-all shadow-sm"
                        value={newTicketForm.category}
                        onChange={(e) => setNewTicketForm(prev => ({ ...prev, category: e.target.value }))}
                      >
                        <option value="Orders">Orders & Logistics</option>
                        <option value="Payments">Payments & Wallet Payouts</option>
                        <option value="Catalog">Catalog & Product Approvals</option>
                        <option value="Technical">Technical Issues</option>
                        <option value="Account">Account Verification</option>
                      </select>
                    </div>

                    {/* Priority Dropdown */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Urgency / Priority</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-100 focus:border-slate-200 focus:bg-white rounded-xl py-3 px-4 text-xs font-semibold text-slate-700 focus:outline-none transition-all shadow-sm"
                        value={newTicketForm.priority}
                        onChange={(e) => setNewTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                      >
                        <option value="Low">Low - General query</option>
                        <option value="Medium">Medium - Standard issue</option>
                        <option value="High">High - Payout/logistic delay</option>
                        <option value="Urgent">Urgent - Account / Store blocked</option>
                      </select>
                    </div>
                  </div>

                  {/* Subject Line */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subject Line</label>
                    <input 
                      type="text" 
                      placeholder="Summarize the issue (e.g. Delayed payout for invoice RIDDHA-1042)"
                      className="w-full bg-slate-50 border border-slate-100 focus:border-slate-200 focus:bg-white rounded-xl py-3.5 px-4 text-xs font-semibold text-slate-700 focus:outline-none transition-all shadow-sm"
                      value={newTicketForm.subject}
                      onChange={(e) => setNewTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Detailed Description */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Detailed Description</label>
                    <textarea 
                      rows={5}
                      placeholder="Please explain the details of the issue so our engineering or accounts team can troubleshoot it quickly."
                      className="w-full bg-slate-50 border border-slate-100 focus:border-slate-200 focus:bg-white rounded-2xl py-3.5 px-4 text-xs font-semibold text-slate-700 focus:outline-none transition-all shadow-sm resize-none"
                      value={newTicketForm.description}
                      onChange={(e) => setNewTicketForm(prev => ({ ...prev, description: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Attachments Section */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attach Screenshots or Docs</label>
                    <p className="text-[10px] font-semibold text-slate-400">Upload images from gallery/files or attach PDF documents.</p>
                    
                    <div className="flex flex-wrap gap-4 items-center">
                      {/* Upload Button */}
                      <label className={`h-16 w-28 rounded-xl border border-dashed border-slate-200 bg-slate-50 hover:bg-[#E36666]/5 hover:border-seller-primary/30 flex flex-col items-center justify-center cursor-pointer transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isUploading ? (
                          <Loader2 size={16} className="text-seller-primary animate-spin" />
                        ) : (
                          <>
                            <Paperclip size={16} className="text-slate-400 group-hover:text-seller-primary" />
                            <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Add Image</span>
                          </>
                        )}
                        <input
                          type="file"
                          ref={imageUploadInputRef}
                          className="hidden"
                          onChange={handleAttachmentUpload}
                          disabled={isUploading}
                          accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
                          multiple
                        />
                      </label>

                      <label className={`h-16 w-28 rounded-xl border border-dashed border-slate-200 bg-slate-50 hover:bg-[#E36666]/5 hover:border-seller-primary/30 flex flex-col items-center justify-center cursor-pointer transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isUploading ? (
                          <Loader2 size={16} className="text-seller-primary animate-spin" />
                        ) : (
                          <>
                            <FileText size={16} className="text-slate-400" />
                            <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Add PDF</span>
                          </>
                        )}
                        <input
                          type="file"
                          ref={pdfUploadInputRef}
                          className="hidden"
                          onChange={handleAttachmentUpload}
                          disabled={isUploading}
                          accept=".pdf"
                          multiple
                        />
                      </label>

                      {/* Display Uploaded Attachments */}
                      {newTicketForm.attachments.map((url, idx) => (
                        <div key={idx} className="h-16 w-28 rounded-xl border border-slate-100 relative group overflow-hidden bg-slate-50">
                          {url.toLowerCase().endsWith('.pdf') ? (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400 font-mono">PDF</div>
                          ) : (
                            <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                          )}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveAttachment(idx)}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Form Actions Footer */}
                  <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-50 flex-shrink-0">
                    <button 
                      type="button" 
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-5 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-2xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading || isUploading}
                      className="flex items-center justify-center px-6 py-3 bg-[#E36666] text-white rounded-2xl font-semibold text-xs uppercase tracking-widest hover:bg-[#D45555] transition-all shadow-lg shadow-[#E36666]/20 disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : 'Raise Ticket'}
                    </button>
                  </div>
                </form>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 4. Support Ticket Details / Chat Side-Drawer */}
        <AnimatePresence>
          {selectedTicket && (
            <div className="fixed inset-0 z-50 overflow-hidden">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedTicket(null)}
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
              />

              {/* Drawer Container */}
              <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                <motion.div 
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-100"
                >
                  {/* Drawer Header */}
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-slate-400">{selectedTicket.ticketId}</span>
                        {getPriorityBadge(selectedTicket.priority)}
                      </div>
                      <h3 className="text-base font-bold text-slate-800 line-clamp-1">{selectedTicket.subject}</h3>
                    </div>
                    <button 
                      onClick={() => setSelectedTicket(null)}
                      className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Chat / Thread Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40">
                    {/* Ticket Context box */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Original Inquiry Details</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono lowercase tracking-normal">Category: {selectedTicket.category}</span>
                      </div>
                      
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                      
                      {/* Original Attachments */}
                      {selectedTicket.attachments?.length > 0 && (
                        <div className="pt-2">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Original Attachments</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedTicket.attachments.map((url, i) => (
                              <a 
                                key={i}
                                href={url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="h-12 w-20 rounded-lg border border-slate-100 relative group overflow-hidden bg-slate-50 block cursor-pointer"
                              >
                                {url.toLowerCase().endsWith('.pdf') ? (
                                  <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-slate-400">PDF</div>
                                ) : (
                                  <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                                )}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timeline Divider */}
                    <div className="text-center relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                      <span className="relative z-10 px-3 bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Conversation Log</span>
                    </div>

                    {/* Replies Thread */}
                    <div className="space-y-4">
                      {selectedTicket.replies?.length > 0 ? (
                        selectedTicket.replies.map((reply, i) => {
                          const isAdmin = reply.senderModel === 'Admin';
                          return (
                            <div 
                              key={i} 
                              className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'} gap-1`}
                            >
                              <div className="flex items-center gap-1.5 px-1">
                                <span className="text-[9px] font-bold text-slate-400">
                                  {isAdmin ? 'Riddha Support Executive' : 'You (Store)'}
                                </span>
                                <span className="text-[8px] text-slate-300 font-semibold font-mono">
                                  {new Date(reply.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <div 
                                className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${isAdmin ? 'bg-white text-slate-700 border border-slate-100 rounded-tl-none' : 'bg-seller-primary text-white rounded-tr-none'}`}
                              >
                                <p className="whitespace-pre-wrap">{reply.text}</p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Waiting for Administrative response...</p>
                          <p className="text-[9px] text-slate-300 mt-1">Our support personnel will reply here shortly.</p>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Drawer Footer input reply form */}
                  <div className="p-4 border-t border-slate-100 bg-white">
                    {selectedTicket.status === 'Closed' ? (
                      <div className="text-center py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        This support ticket has been closed.
                      </div>
                    ) : (
                      <form onSubmit={handleSendReply} className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Type follow-up details here..."
                          className="flex-1 bg-slate-50 border border-slate-100 focus:border-slate-200 focus:bg-white rounded-xl px-4 text-xs font-semibold text-slate-700 focus:outline-none transition-all"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          disabled={isReplying}
                          required
                        />
                        <button 
                          type="submit" 
                          disabled={isReplying || !replyText.trim()}
                          className="w-10 h-10 rounded-xl bg-seller-primary hover:bg-[#D45555] text-white flex items-center justify-center transition-colors disabled:opacity-50 flex-shrink-0 shadow-lg shadow-[#E36666]/10"
                        >
                          {isReplying ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                      </form>
                    )}
                  </div>

                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </PageWrapper>
  );
};

export default HelpCenter;
