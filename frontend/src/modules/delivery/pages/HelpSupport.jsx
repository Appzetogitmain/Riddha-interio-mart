import React, { useState } from 'react';
import PageWrapper from '../components/PageWrapper';
import { LuMessageCircle, LuPhone, LuMail, LuChevronDown, LuChevronUp, LuSearch } from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const HelpSupport = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [formLoading, setFormLoading] = useState(false);

  const faqs = [
    {
      id: 1,
      question: 'How do I accept an order?',
      answer: 'Go to the Delivery History tab, click on "Available Orders", and click the "Accept" button on any order you want to take. Make sure you\'re online to receive orders.'
    },
    {
      id: 2,
      question: 'How are earnings calculated?',
      answer: 'Your earnings are calculated based on the distance of delivery, base fare, and any additional charges like waiting time or extra items. You can view detailed earnings in the Earnings section.'
    },
    {
      id: 3,
      question: 'How do I withdraw my earnings?',
      answer: 'Go to the Wallet section, click on the "Withdraw" tab, enter the amount you want to withdraw, and select your preferred withdrawal method (Bank Transfer or UPI). Withdrawals are processed within 24-48 hours.'
    },
    {
      id: 4,
      question: 'What if I can\'t complete a delivery?',
      answer: 'If you\'re unable to complete a delivery, contact customer support immediately through the app or call our helpline. Frequent cancellations may affect your rating and future order assignments.'
    },
    {
      id: 5,
      question: 'How do I update my vehicle details?',
      answer: 'Go to Settings > Account > Vehicle Details to update your vehicle information. You may need to upload updated documents if changing your vehicle type.'
    },
    {
      id: 6,
      question: 'How do I contact customer support?',
      answer: 'You can contact us through the "Contact Support" section below, call our helpline, or email us at support@riddhadelivery.com. Our support team is available 24/7.'
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }
    setFormLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Message sent successfully! We\'ll get back to you within 24 hours.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-deep-espresso">Help & Support</h1>
          <p className="text-warm-sand mt-2">Find answers to common questions or contact us.</p>
        </div>

        {/* Search */}
        <div className="relative">
          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#189D91]/40 bg-white placeholder-slate-400 text-slate-700"
          />
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => toast('Live Chat coming soon', { icon: '💬' })}
            className="bg-white border border-soft-oatmeal rounded-xl p-6 text-left hover:border-warm-sand transition-colors"
          >
            <div className="w-12 h-12 bg-warm-sand/10 text-warm-sand rounded-xl flex items-center justify-center mb-4">
              <LuMessageCircle size={24} />
            </div>
            <h3 className="font-bold text-deep-espresso mb-1">Live Chat</h3>
            <p className="text-sm text-dusty-cocoa">Chat with our support team</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => window.open('tel:+911800123456', '_self')}
            className="bg-white border border-soft-oatmeal rounded-xl p-6 text-left hover:border-warm-sand transition-colors"
          >
            <div className="w-12 h-12 bg-warm-sand/10 text-warm-sand rounded-xl flex items-center justify-center mb-4">
              <LuPhone size={24} />
            </div>
            <h3 className="font-bold text-deep-espresso mb-1">Call Us</h3>
            <p className="text-sm text-dusty-cocoa">+91 1800-123-4567</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => window.open('mailto:support@riddha.com', '_self')}
            className="bg-white border border-soft-oatmeal rounded-xl p-6 text-left hover:border-warm-sand transition-colors"
          >
            <div className="w-12 h-12 bg-warm-sand/10 text-warm-sand rounded-xl flex items-center justify-center mb-4">
              <LuMail size={24} />
            </div>
            <h3 className="font-bold text-deep-espresso mb-1">Email Us</h3>
            <p className="text-sm text-dusty-cocoa">support@riddha.com</p>
          </motion.button>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-soft-oatmeal overflow-hidden">
          <div className="p-6 border-b border-soft-oatmeal">
            <h3 className="text-lg font-bold text-deep-espresso">Frequently Asked Questions</h3>
          </div>
          <div className="divide-y divide-soft-oatmeal">
            {filteredFaqs.length > 0 ? filteredFaqs.map((faq) => (
              <div key={faq.id}>
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-soft-oatmeal/20 transition-colors"
                >
                  <span className="font-bold text-deep-espresso pr-4">{faq.question}</span>
                  {expandedFaq === faq.id ? (
                    <LuChevronUp size={20} className="text-warm-sand flex-shrink-0" />
                  ) : (
                    <LuChevronDown size={20} className="text-dusty-cocoa flex-shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedFaq === faq.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-6 pb-6"
                    >
                      <p className="text-dusty-cocoa">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )) : (
              <p className="p-6 text-sm text-slate-400 text-center">No results found for "{searchQuery}"</p>
            )}
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-soft-oatmeal p-6">
          <h3 className="text-lg font-bold text-deep-espresso mb-6">Send us a message</h3>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-deep-espresso mb-2">Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#189D91]/40 placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-deep-espresso mb-2">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#189D91]/40 placeholder-slate-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-deep-espresso mb-2">Subject</label>
              <input
                type="text"
                placeholder="What is this about?"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#189D91]/40 placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-deep-espresso mb-2">Message</label>
              <textarea
                rows="4"
                placeholder="Describe your issue in detail..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#189D91]/40 resize-none placeholder-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-deep-espresso text-white py-4 rounded-xl font-bold hover:bg-warm-sand transition-colors disabled:opacity-60"
            >
              {formLoading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
};

export default HelpSupport;
