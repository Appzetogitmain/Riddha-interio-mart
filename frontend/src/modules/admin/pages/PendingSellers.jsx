import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { LuCheck, LuX, LuClock, LuBriefcase, LuMail, LuPhone, LuMapPin } from 'react-icons/lu';
import api from '../../../shared/utils/api';

const getDocumentUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.replace(/\\/g, '/');
  const apiBase = api.defaults.baseURL || `http://${window.location.hostname}:5000/api`;
  const backendBase = apiBase.replace(/\/api$/, '');
  return `${backendBase}/${cleanPath}`;
};

const PendingSellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPendingSellers();
  }, []);

  const fetchPendingSellers = async () => {
    try {
      const response = await api.get('/auth/admin/sellers/pending');
      setSellers(response.data.data);
    } catch (err) {
      console.error('Failed to fetch pending sellers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this seller?')) return;
    try {
      setActionLoading(id);
      await api.put(`/auth/admin/sellers/${id}/approve`);
      setSellers(sellers.filter(s => s._id !== id));
    } catch (err) {
      alert('Failed to approve seller');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject and delete this seller request?')) return;
    try {
      setActionLoading(id);
      await api.delete(`/auth/admin/sellers/${id}`);
      setSellers(sellers.filter(s => s._id !== id));
    } catch (err) {
      alert('Failed to reject seller');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-deep-espresso">Pending Sellers</h1>
            <p className="text-warm-sand text-sm font-medium">Review and approve new seller registration requests.</p>
          </div>
          <div className="px-4 py-2 bg-warm-sand/10 border border-warm-sand/20 rounded-xl text-xs font-bold text-warm-sand uppercase tracking-widest">
            {sellers.length} Pending Requests
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center animate-pulse text-warm-sand font-bold uppercase tracking-widest">Loading Requests...</div>
        ) : sellers.length === 0 ? (
          <div className="bg-white p-12 rounded-[40px] border border-soft-oatmeal text-center space-y-4 shadow-sm">
             <div className="w-20 h-20 bg-soft-oatmeal/10 rounded-3xl flex items-center justify-center mx-auto">
               <LuClock size={40} className="text-soft-oatmeal" />
             </div>
             <p className="font-display text-xl font-bold text-deep-espresso">No Pending Requests</p>
             <p className="text-warm-sand text-sm max-w-xs mx-auto">All seller registrations have been processed. New ones will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {sellers.map((seller) => (
                <motion.div
                  key={seller._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[32px] border border-soft-oatmeal p-6 shadow-sm hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 bg-soft-oatmeal/10 rounded-2xl flex items-center justify-center text-deep-espresso font-black text-xl border border-soft-oatmeal/20">
                      {seller.fullName[0]}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApprove(seller._id)}
                        disabled={actionLoading === seller._id}
                        className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
                        title="Approve Seller"
                      >
                        {actionLoading === seller._id ? (
                          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        ) : <LuCheck size={20} />}
                      </button>
                      <button 
                        onClick={() => handleReject(seller._id)}
                        disabled={actionLoading === seller._id}
                        className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                        title="Reject Request"
                      >
                        {actionLoading === seller._id ? (
                          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : <LuX size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-display font-bold text-deep-espresso text-lg">{seller.fullName}</h3>
                      <div className="flex items-center gap-2 text-warm-sand text-xs font-bold uppercase tracking-widest mt-1">
                        <LuBriefcase size={12} /> {seller.shopName}
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-4 border-t border-soft-oatmeal/50">
                      <div className="flex items-center gap-3 text-deep-espresso/70 text-sm">
                        <LuMail size={16} className="text-warm-sand" />
                        {seller.email}
                      </div>
                      <div className="flex items-center gap-3 text-deep-espresso/70 text-sm">
                        <LuPhone size={16} className="text-warm-sand" />
                        {seller.phone || 'No phone provided'}
                      </div>
                      <div className="flex items-center gap-3 text-deep-espresso/70 text-sm">
                        <LuMapPin size={16} className="text-warm-sand flex-shrink-0" />
                        <span className="line-clamp-1">{seller.shopAddress || 'No address provided'}</span>
                      </div>
                    </div>

                    {/* Compliance & Documents */}
                    {(seller.gstNumber || seller.panNumber || seller.gstDoc || seller.panDoc || seller.shopDoc) && (
                      <div className="pt-4 border-t border-soft-oatmeal/50 space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-warm-sand/60">Compliance Details</div>
                        <div className="grid grid-cols-2 gap-2">
                          {seller.gstNumber && (
                            <div className="bg-soft-oatmeal/5 p-2 rounded-xl border border-soft-oatmeal/20">
                              <span className="text-[9px] font-black uppercase tracking-widest text-warm-sand block">GSTIN</span>
                              <span className="font-mono text-xs font-bold text-deep-espresso">{seller.gstNumber}</span>
                            </div>
                          )}
                          {seller.panNumber && (
                            <div className="bg-soft-oatmeal/5 p-2 rounded-xl border border-soft-oatmeal/20">
                              <span className="text-[9px] font-black uppercase tracking-widest text-warm-sand block">PAN</span>
                              <span className="font-mono text-xs font-bold text-deep-espresso">{seller.panNumber}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {seller.gstDoc && (
                            <a 
                              href={getDocumentUrl(seller.gstDoc)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-2.5 py-1.5 bg-[#189D91]/10 text-[#189D91] hover:bg-[#189D91] hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors inline-block"
                            >
                              GST Doc
                            </a>
                          )}
                          {seller.panDoc && (
                            <a 
                              href={getDocumentUrl(seller.panDoc)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-2.5 py-1.5 bg-[#189D91]/10 text-[#189D91] hover:bg-[#189D91] hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors inline-block"
                            >
                              PAN Doc
                            </a>
                          )}
                          {seller.shopDoc && (
                            <a 
                              href={getDocumentUrl(seller.shopDoc)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-2.5 py-1.5 bg-[#189D91]/10 text-[#189D91] hover:bg-[#189D91] hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors inline-block"
                            >
                              Shop Doc
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-warm-sand/40 italic border-t border-soft-oatmeal/50">
                      <span>Joined {new Date(seller.createdAt).toLocaleDateString()}</span>
                      <span>Pending Verification</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default PendingSellers;
