import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiFilter, FiDownload, FiMessageSquare, 
  FiClock, FiCheckCircle, FiAlertCircle, FiUser, 
  FiCalendar, FiArrowRight, FiX, FiCheck
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const statusBtnTheme = {
  pending: 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-100',
  reviewed: 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100',
  implemented: 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-100',
};

const SellerRecommendationManagement = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedRec, setSelectedRec] = useState(null);

  const exportToCSV = async () => {
    if (!recommendations || recommendations.length === 0) {
      toast.error('No requests available to export.');
      return;
    }
    try {
      const XLSX = await import('xlsx');
      const dataToExport = recommendations.map(rec => ({
        'Request ID': `REC-${rec.id.toString().slice(-4)}`,
        'Seller Name': rec.sellerName,
        'Category': (rec.category || '').replace('_', ' ').toUpperCase(),
        'Subject': rec.subject,
        'Description': rec.description,
        'Priority': (rec.priority || '').toUpperCase(),
        'Status': (rec.status || '').toUpperCase(),
        'Created At': new Date(rec.createdAt).toLocaleString()
      }));
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Seller Requests");
      XLSX.writeFile(wb, `Seller_Requests_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`, { bookType: 'csv' });
      toast.success('Seller requests exported successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export seller requests.');
    }
  };

  useEffect(() => {
    const fetchRecommendations = () => {
      const saved = JSON.parse(localStorage.getItem('seller_recommendations') || '[]');
      setRecommendations(saved);
    };
    fetchRecommendations();
    
    // Listen for storage changes (if seller submits in another tab)
    window.addEventListener('storage', fetchRecommendations);
    return () => window.removeEventListener('storage', fetchRecommendations);
  }, []);

  const handleUpdateStatus = (id, newStatus) => {
    const updated = recommendations.map(rec => 
      rec.id === id ? { ...rec, status: newStatus } : rec
    );
    localStorage.setItem('seller_recommendations', JSON.stringify(updated));
    setRecommendations(updated);
    toast.success(`Status updated to ${newStatus}`);
    if (selectedRec?.id === id) {
      setSelectedRec({ ...selectedRec, status: newStatus });
    }
  };

  const filteredRecs = recommendations.filter(rec => {
    const matchesSearch = rec.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          rec.sellerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || rec.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-600';
      case 'reviewed': return 'bg-blue-100 text-blue-600';
      case 'implemented': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tight text-gray-900">
            Seller <span className="text-indigo-600">Recommendations</span>
          </h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
            Analyze and manage feature requests from your sellers
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <FiDownload /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Requests', value: recommendations.length, icon: FiMessageSquare, bg: 'bg-indigo-50', text: 'text-indigo-600' },
          { label: 'Pending Review', value: recommendations.filter(r => r.status === 'pending').length, icon: FiClock, bg: 'bg-amber-50', text: 'text-amber-600' },
          { label: 'High Priority', value: recommendations.filter(r => r.priority === 'high').length, icon: FiAlertCircle, bg: 'bg-red-50', text: 'text-red-600' },
          { label: 'Implemented', value: recommendations.filter(r => r.status === 'implemented').length, icon: FiCheckCircle, bg: 'bg-green-50', text: 'text-green-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.bg} ${stat.text} rounded-2xl flex items-center justify-center`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              <p className={`text-[10px] font-black uppercase tracking-widest ${stat.text}`}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-[28px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by subject or seller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50/50 border border-gray-100 focus:border-indigo-500 focus:bg-white rounded-2xl py-4 pl-14 pr-6 outline-none text-xs font-bold transition-all"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex-1 md:w-48 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-indigo-500 appearance-none"
          >
            <option value="all">All Categories</option>
            <option value="feature_request">Feature Requests</option>
            <option value="ui_improvement">UI Improvements</option>
            <option value="bug_report">Bug Reports</option>
            <option value="other">Other Suggestions</option>
          </select>
          <button className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-gray-400 hover:text-indigo-600 transition-all shadow-sm">
            <FiFilter />
          </button>
        </div>
      </div>

      {/* Table/List View */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Seller Info</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Subject</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Priority</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRecs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <FiMessageSquare className="mx-auto text-gray-100 mb-6" size={64} />
                    <h3 className="text-lg font-black text-gray-900 uppercase italic">No recommendations yet</h3>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2">When sellers suggest features, they'll appear here</p>
                  </td>
                </tr>
              ) : (
                filteredRecs.map((rec, i) => (
                  <tr key={rec.id} className="hover:bg-gray-50/50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                          {rec.sellerName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{rec.sellerName}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">ID: REC-{rec.id.toString().slice(-4)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-gray-700 line-clamp-1 w-64">{rec.subject}</p>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1">{rec.category.replace('_', ' ')}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${getPriorityColor(rec.priority)}`}>
                        <div className={`w-1.5 h-1.5 rounded-full bg-current`}></div>
                        {rec.priority}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(rec.status)}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-gray-400">
                        <FiCalendar size={12} />
                        <span className="text-[10px] font-bold">{new Date(rec.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => setSelectedRec(rec)}
                        className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md group-hover:translate-x-1 inline-flex items-center gap-2"
                      >
                        Details <FiArrowRight />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedRec && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRec(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getStatusColor(selectedRec.status)}`}>
                    <FiMessageSquare size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase italic">Recommendation Details</h3>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Case #{selectedRec.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedRec(null)}
                  className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:text-red-500 transition-all"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-3xl">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Seller</p>
                    <p className="text-sm font-black text-gray-900">{selectedRec.sellerName}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-3xl">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Priority</p>
                    <p className={`text-sm font-black uppercase ${getPriorityColor(selectedRec.priority)}`}>{selectedRec.priority}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Subject</p>
                  <h4 className="text-lg font-black text-gray-900 leading-tight">{selectedRec.subject}</h4>
                </div>

                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Description</p>
                  <div className="bg-indigo-50/50 p-8 rounded-[32px] border border-indigo-50">
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                      {selectedRec.description}
                    </p>
                  </div>
                </div>

                {/* Status Update Actions */}
                <div className="pt-4">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center">Update Status</p>
                   <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'pending', label: 'Pending', icon: FiClock, color: 'amber' },
                        { id: 'reviewed', label: 'Reviewed', icon: FiCheck, color: 'blue' },
                        { id: 'implemented', label: 'Implemented', icon: FiCheckCircle, color: 'green' }
                      ].map((status) => (
                        <button
                          key={status.id}
                          onClick={() => handleUpdateStatus(selectedRec.id, status.id)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                            selectedRec.status === status.id 
                            ? statusBtnTheme[status.id] 
                            : `bg-white text-gray-400 border-gray-100 hover:bg-gray-50`
                          }`}
                        >
                          <status.icon size={20} />
                          <span className="text-[9px] font-black uppercase tracking-widest">{status.label}</span>
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-gray-50 flex justify-end">
                 <button 
                   onClick={() => setSelectedRec(null)}
                   className="px-10 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
                 >
                   Done
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SellerRecommendationManagement;
