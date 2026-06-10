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
import { motion } from 'framer-motion';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

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
             <button className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-seller-primary hover:border-seller-primary/30 transition-all">
                <Filter size={18} />
             </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: 'Total Buyers', value: customers.length, icon: <User size={18} />, color: 'bg-blue-50 text-blue-600' },
             { 
               label: 'Retention Rate', 
               value: customers.length > 0 ? `${Math.round((customers.filter(c => c.totalOrders > 1).length / customers.length) * 100)}%` : '0%', 
               icon: <ArrowUpRight size={18} />, 
               color: 'bg-emerald-50 text-emerald-600' 
             },
             { 
               label: 'Avg LTV', 
               value: customers.length > 0 ? `₹${(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length).toFixed(0).toLocaleString()}` : '₹0', 
               icon: <DollarSign size={18} />, 
               color: 'bg-amber-50 text-amber-600' 
             },
             { 
               label: 'New This Month', 
               value: customers.filter(c => {
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
                                <span className="text-sm font-black text-slate-900">₹{customer.totalSpent.toLocaleString()}</span>
                                <div className="flex items-center gap-1.5">
                                   <span className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-seller-primary" style={{ width: '60%' }}></div>
                                   </span>
                                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Platinum Tier</span>
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
