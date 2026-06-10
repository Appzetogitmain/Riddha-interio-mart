import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import { motion } from 'framer-motion';
import { LuSearch, LuMail, LuPhone, LuTrendingUp, LuPackage, LuShieldCheck, LuBan, LuMapPin } from 'react-icons/lu';
import api from '../../../shared/utils/api';

const ActiveSellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchActiveSellers();
  }, []);

  const fetchActiveSellers = async () => {
    try {
      const response = await api.get('/auth/admin/sellers/active');
      setSellers(response.data.data);
    } catch (err) {
      console.error('Failed to fetch active sellers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (sellerId) => {
    const confirmSuspend = window.confirm("Are you sure you want to suspend this seller account? They will lose access immediately.");
    if (!confirmSuspend) return;
    try {
      await api.put(`/auth/admin/sellers/${sellerId}/suspend`);
      fetchActiveSellers();
    } catch (err) {
      console.error('Failed to suspend seller:', err);
      alert(err.response?.data?.error || 'Failed to suspend seller.');
    }
  };

  const filteredSellers = sellers.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.shopName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-8 pb-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-deep-espresso">Active Sellers</h1>
            <p className="text-warm-sand text-sm font-medium">Monitoring and managing your verified seller network.</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand" size={18} />
            <input 
              type="text" 
              placeholder="Search by store or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-soft-oatmeal rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all font-medium shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center animate-pulse text-warm-sand font-bold uppercase tracking-widest text-xs">Accessing Database...</div>
        ) : filteredSellers.length === 0 ? (
          <div className="bg-white p-20 rounded-[40px] border border-soft-oatmeal text-center space-y-4 shadow-sm">
             <p className="font-display text-xl font-bold text-deep-espresso">No Sellers Found</p>
             <p className="text-warm-sand text-sm">No active sellers match your search or criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSellers.map((seller) => (
              <motion.div
                key={seller._id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[40px] border border-soft-oatmeal p-8 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden relative group"
              >
                {/* Status Badge */}
                <div className="absolute top-0 right-0 px-6 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-bl-[20px] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Verified Active
                </div>

                <div className="flex items-center gap-5 mb-8">
                  <div className="w-20 h-20 bg-soft-oatmeal/5 rounded-[28px] border border-soft-oatmeal/30 flex items-center justify-center text-warm-sand font-black text-3xl group-hover:bg-warm-sand group-hover:text-white transition-all duration-500">
                    {seller.shopName[0]}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-deep-espresso text-xl leading-snug">{seller.shopName}</h3>
                    <p className="text-warm-sand text-xs font-bold uppercase tracking-widest mt-1">Owner: {seller.fullName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-soft-oatmeal/5 flex flex-col items-center justify-center py-4 rounded-3xl border border-soft-oatmeal/20">
                    <LuPackage size={20} className="text-warm-sand mb-1.5" />
                    <span className="text-[10px] font-black text-warm-sand/40 uppercase tracking-widest">Products</span>
                    <span className="text-sm font-black text-deep-espresso">{seller.productCount || 0} Items</span>
                  </div>
                  <div className="bg-soft-oatmeal/5 flex flex-col items-center justify-center py-4 rounded-3xl border border-soft-oatmeal/20">
                    <LuTrendingUp size={20} className="text-warm-sand mb-1.5" />
                    <span className="text-[10px] font-black text-warm-sand/40 uppercase tracking-widest">Sales</span>
                    <span className="text-sm font-black text-deep-espresso">₹ {(seller.totalSales / 1000).toFixed(1)}k</span>
                  </div>
                </div>

                <div className="space-y-3.5 mb-8">
                   <div className="flex items-center gap-3 text-deep-espresso/60 text-sm">
                     <LuMail size={16} className="text-warm-sand" />
                     {seller.email}
                   </div>
                   <div className="flex items-center gap-3 text-deep-espresso/60 text-sm">
                     <LuPhone size={16} className="text-warm-sand" />
                     {seller.phone || 'Contact not set'}
                   </div>
                   <div className="flex items-center gap-3 text-deep-espresso/60 text-sm">
                     <LuMapPin size={16} className="text-warm-sand flex-shrink-0" />
                     <span className="line-clamp-1">{seller.shopAddress || 'Online Store'}</span>
                   </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 py-4 bg-deep-espresso text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-dusty-cocoa transition-all shadow-lg active:scale-95">
                    <LuShieldCheck size={16} /> Dashboard
                  </button>
                  <button 
                    onClick={() => handleSuspend(seller._id)}
                    className="p-4 bg-white border border-soft-oatmeal text-red-400 rounded-2xl hover:bg-red-50 transition-all active:scale-95" 
                    title="Suspend Seller"
                  >
                    <LuBan size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default ActiveSellers;
