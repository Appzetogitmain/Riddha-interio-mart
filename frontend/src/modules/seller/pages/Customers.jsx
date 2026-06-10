import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import { 
  User, 
  Mail, 
  Phone, 
  Search, 
  Filter, 
  ChevronRight, 
  ShoppingBag, 
  Calendar,
  DollarSign,
  ArrowUpRight,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import api from '../../../shared/utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('orders-desc');
  const [tierFilter, setTierFilter] = useState('all');
  const [orderFilter, setOrderFilter] = useState('all');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/seller/customers');
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerTier = (spent) => {
    if (spent >= 50000) return { name: 'Platinum Tier', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
    if (spent >= 15000) return { name: 'Gold Tier', color: 'bg-amber-50 text-amber-600 border-amber-100' };
    if (spent >= 5000) return { name: 'Silver Tier', color: 'bg-blue-50 text-blue-600 border-blue-100' };
    return { name: 'Bronze Tier', color: 'bg-slate-50 text-slate-600 border-slate-100' };
  };

  const filteredCustomers = customers
    .filter(c => {
      // 1. Search term filter
      const matchesSearch = 
        (c.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone || '').includes(searchTerm);
      
      if (!matchesSearch) return false;

      // 2. Tier filter
      if (tierFilter !== 'all') {
        const spent = c.totalSpent || 0;
        if (tierFilter === 'platinum' && spent < 50000) return false;
        if (tierFilter === 'gold' && (spent < 15000 || spent >= 50000)) return false;
        if (tierFilter === 'silver' && (spent < 5000 || spent >= 15000)) return false;
        if (tierFilter === 'bronze' && spent >= 5000) return false;
      }

      // 3. Order Count filter
      if (orderFilter !== 'all') {
        const orders = c.totalOrders || 0;
        if (orderFilter === 'high' && orders <= 10) return false;
        if (orderFilter === 'medium' && (orders < 3 || orders > 10)) return false;
        if (orderFilter === 'low' && orders > 2) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'orders-desc') return (b.totalOrders || 0) - (a.totalOrders || 0);
      if (sortBy === 'orders-asc') return (a.totalOrders || 0) - (b.totalOrders || 0);
      if (sortBy === 'spent-desc') return (b.totalSpent || 0) - (a.totalSpent || 0);
      if (sortBy === 'spent-asc') return (a.totalSpent || 0) - (b.totalSpent || 0);
      if (sortBy === 'date-desc') return new Date(b.memberSince || 0) - new Date(a.memberSince || 0);
      if (sortBy === 'date-asc') return new Date(a.memberSince || 0) - new Date(b.memberSince || 0);
      if (sortBy === 'active-desc') return new Date(b.lastOrderDate || 0) - new Date(a.lastOrderDate || 0);
      if (sortBy === 'name-asc') return (a.fullName || '').localeCompare(b.fullName || '');
      if (sortBy === 'name-desc') return (b.fullName || '').localeCompare(a.fullName || '');
      return 0;
    });

  if (loading) {
    return (
      <PageWrapper>
        <div className="py-24 text-center">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-seller-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Sourcing Customer Data...</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4 md:px-0">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Customer Network</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Managing {customers.length} verified buyers</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search network..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-seller-primary/10 transition-all outline-none w-full md:w-64"
                />
             </div>
             <button 
               onClick={() => setShowFilters(!showFilters)}
               className={`p-3.5 border rounded-2xl transition-all relative ${
                 showFilters || tierFilter !== 'all' || orderFilter !== 'all' || sortBy !== 'orders-desc'
                   ? 'bg-seller-primary/10 border-seller-primary text-seller-primary' 
                   : 'bg-white border-slate-200 text-slate-400 hover:text-seller-primary hover:border-seller-primary/30'
               }`}
             >
                <Filter size={18} />
                {(tierFilter !== 'all' || orderFilter !== 'all' || sortBy !== 'orders-desc') && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full" />
                )}
             </button>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-6"
            >
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort By</label>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-seller-primary/10 transition-all cursor-pointer"
                  >
                     <option value="orders-desc">Orders: High to Low</option>
                     <option value="orders-asc">Orders: Low to High</option>
                     <option value="spent-desc">Lifetime Spent: High to Low</option>
                     <option value="spent-asc">Lifetime Spent: Low to High</option>
                     <option value="date-desc">Newest Member</option>
                     <option value="date-asc">Oldest Member</option>
                     <option value="active-desc">Recently Active</option>
                     <option value="name-asc">Name: A to Z</option>
                     <option value="name-desc">Name: Z to A</option>
                  </select>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Tier</label>
                  <select 
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-seller-primary/10 transition-all cursor-pointer"
                  >
                     <option value="all">All Tiers</option>
                     <option value="platinum">Platinum Tier (≥ ₹50,000)</option>
                     <option value="gold">Gold Tier (₹15,000 - ₹50,000)</option>
                     <option value="silver">Silver Tier (₹5,000 - ₹15,000)</option>
                     <option value="bronze">Bronze Tier ({"<"} ₹5,000)</option>
                  </select>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engagement Level</label>
                  <select 
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-seller-primary/10 transition-all cursor-pointer"
                  >
                     <option value="all">All Engagement Levels</option>
                     <option value="high">High Engagement (&gt; 10 orders)</option>
                     <option value="medium">Medium Engagement (3 - 10 orders)</option>
                     <option value="low">Low Engagement (1 - 2 orders)</option>
                  </select>
               </div>

               <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-50">
                  {(tierFilter !== 'all' || orderFilter !== 'all' || sortBy !== 'orders-desc') && (
                    <button 
                      onClick={() => {
                        setTierFilter('all');
                        setOrderFilter('all');
                        setSortBy('orders-desc');
                      }}
                      className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                       Reset Filters
                    </button>
                  )}
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all"
                  >
                     Close Filters
                  </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: 'Total Buyers', value: filteredCustomers.length, icon: <User size={18} />, color: 'bg-blue-50 text-blue-600' },
             { 
               label: 'Retention Rate', 
               value: filteredCustomers.length > 0 ? `${Math.round((filteredCustomers.filter(c => c.totalOrders > 1).length / filteredCustomers.length) * 100)}%` : '0%', 
               icon: <ArrowUpRight size={18} />, 
               color: 'bg-emerald-50 text-emerald-600' 
             },
             { 
               label: 'Avg LTV', 
               value: filteredCustomers.length > 0 ? `₹${(filteredCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / filteredCustomers.length).toFixed(0).toLocaleString()}` : '₹0', 
               icon: <DollarSign size={18} />, 
               color: 'bg-amber-50 text-amber-600' 
             },
             { 
               label: 'New This Month', 
               value: filteredCustomers.filter(c => {
                 if (!c.memberSince) return false;
                 const d = new Date(c.memberSince);
                 const now = new Date();
                 return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
               }).length, 
               icon: <Calendar size={18} />, 
               color: 'bg-rose-50 text-rose-600' 
             },
           ].map((stat, i) => (
             <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                   {stat.icon}
                </div>
                <div>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
                   <h4 className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</h4>
                </div>
             </div>
           ))}
        </div>

        {/* Customer List */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Engagement</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifetime Value</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Activity</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {filteredCustomers.map((customer, idx) => (
                       <motion.tr 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: idx * 0.05 }}
                         key={customer._id} 
                         className="group hover:bg-slate-50/50 transition-colors"
                       >
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-4">
                                <div className="h-11 w-11 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 group-hover:scale-105 transition-transform">
                                   {customer.avatar ? (
                                     <img src={customer.avatar} alt="" className="w-full h-full object-cover" />
                                   ) : (
                                     <User size={20} className="text-slate-300" />
                                   )}
                                </div>
                                <div className="space-y-0.5">
                                   <p className="text-sm font-black text-slate-900 leading-none">{customer.fullName}</p>
                                   <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                      <span className="flex items-center gap-1"><Mail size={10} className="text-seller-primary" /> {customer.email}</span>
                                   </div>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-900 uppercase">
                                   <ShoppingBag size={12} className="text-emerald-500" /> {customer.totalOrders} Orders
                                </span>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Since {new Date(customer.memberSince).toLocaleDateString()}</p>
                             </div>
                          </td>
                           <td className="px-8 py-6">
                              <div className="flex flex-col gap-1">
                                 <span className="text-sm font-black text-slate-900">₹{(customer.totalSpent || 0).toLocaleString()}</span>
                                 <div className="flex items-center gap-1.5">
                                    <span className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                                       <div className="h-full bg-seller-primary" style={{ width: `${Math.min(((customer.totalSpent || 0) / 50000) * 100, 100)}%` }}></div>
                                    </span>
                                    {(() => {
                                      const tier = getCustomerTier(customer.totalSpent || 0);
                                      return (
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${tier.color}`}>
                                          {tier.name}
                                        </span>
                                      );
                                    })()}
                                 </div>
                              </div>
                           </td>
                          <td className="px-8 py-6 text-right">
                             <div className="flex flex-col items-end gap-2">
                                <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-widest group-hover:border-seller-primary/30 group-hover:text-seller-primary transition-all">
                                   Last Active: {new Date(customer.lastOrderDate).toLocaleDateString()}
                                </div>
                                <button className="p-2 text-slate-300 hover:text-seller-primary transition-colors">
                                   <ExternalLink size={16} />
                                </button>
                             </div>
                          </td>
                       </motion.tr>
                    ))}
                 </tbody>
              </table>
           </div>
           {filteredCustomers.length === 0 && (
             <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-200">
                   <User size={32} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No customers matching your search</p>
             </div>
           )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Customers;
