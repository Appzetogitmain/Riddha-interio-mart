import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiMessageSquare, FiInfo, FiCheckCircle, FiStar, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Recommendation = () => {
  const [formData, setFormData] = useState({
    subject: '',
    category: 'feature_request',
    description: '',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Save to localStorage for demo purposes (so Admin can see it)
    const recommendations = JSON.parse(localStorage.getItem('seller_recommendations') || '[]');
    const userData = JSON.parse(localStorage.getItem('riddha_user') || '{}');
    const newRecommendation = {
      ...formData,
      id: Date.now(),
      sellerName: userData.storeName || userData.fullName || 'Riddha Seller',
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    localStorage.setItem('seller_recommendations', JSON.stringify([newRecommendation, ...recommendations]));
    
    setIsSubmitting(false);
    setSubmitted(true);
    toast.success('Recommendation submitted successfully!');
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[40px] shadow-2xl border border-gray-100 text-center max-w-lg w-full"
        >
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <FiCheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 uppercase italic mb-4">Awesome!</h2>
          <p className="text-gray-500 font-medium mb-8">
            Your recommendation has been sent to the admin team. We appreciate your feedback to make Riddha better!
          </p>
          <button 
            onClick={() => {
              setSubmitted(false);
              setFormData({ subject: '', category: 'feature_request', description: '', priority: 'medium' });
            }}
            className="w-full py-4 bg-[#bd3b64] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#a03255] transition-all shadow-lg active:scale-95"
          >
            Send Another One
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="mb-10 text-center md:text-left">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-black uppercase italic tracking-tight text-gray-900 flex items-center justify-center md:justify-start gap-3">
            Suggest <span className="text-[#bd3b64]">Features</span>
            <FiZap className="text-amber-400" />
          </h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">
            Help us build the best marketplace for you
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2">
          <motion.form 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6"
          >
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">
                Subject / Title
              </label>
              <input
                required
                type="text"
                placeholder="e.g., Add Bulk Image Editing feature"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 focus:border-[#bd3b64] focus:bg-white rounded-2xl py-4 px-6 outline-none text-sm font-bold transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 focus:border-[#bd3b64] focus:bg-white rounded-2xl py-4 px-6 outline-none text-sm font-bold transition-all appearance-none"
                >
                  <option value="feature_request">Feature Request</option>
                  <option value="ui_improvement">UI Improvement</option>
                  <option value="bug_report">Bug Report</option>
                  <option value="other">Other Suggestion</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">
                  Priority level
                </label>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p })}
                      className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        formData.priority === p 
                        ? 'bg-gray-900 text-white border-gray-900' 
                        : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">
                Detailed Description
              </label>
              <textarea
                required
                rows={6}
                placeholder="Explain what you want to see in the app and how it will help sellers..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 focus:border-[#bd3b64] focus:bg-white rounded-2xl py-4 px-6 outline-none text-sm font-bold transition-all resize-none"
              ></textarea>
            </div>

            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full py-5 bg-[#bd3b64] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#a03255] transition-all shadow-xl shadow-[#bd3b64]/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiSend />
                  Submit Recommendation
                </>
              )}
            </button>
          </motion.form>
        </div>

        {/* Right Column: Info Cards */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900 text-white p-8 rounded-[32px] shadow-lg relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <FiMessageSquare className="text-amber-400" size={24} />
              </div>
              <h3 className="text-lg font-black uppercase italic mb-4">Why suggest?</h3>
              <p className="text-gray-400 text-xs font-medium leading-relaxed">
                We value our sellers! Your suggestions directly influence our development roadmap. Tell us what's missing, and we'll try to build it for you.
              </p>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#bd3b64] rounded-full blur-[80px] opacity-20"></div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                <FiInfo size={20} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Submission Tips</h4>
            </div>
            <ul className="space-y-4">
              {[
                'Be specific with feature names',
                'Explain the benefit for sellers',
                'Mention if it saves time or money',
                'Keep descriptions clear and concise'
              ].map((tip, i) => (
                <li key={i} className="flex gap-3 text-[11px] font-bold text-gray-500">
                  <FiStar className="text-amber-400 mt-0.5 shrink-0" size={12} />
                  {tip}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Recommendation;
