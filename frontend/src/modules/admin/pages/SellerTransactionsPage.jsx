import React, { useState, useEffect } from "react";
import PageWrapper from "../components/PageWrapper";
import {
  LuSearch,
  LuArrowUpRight,
  LuArrowDownLeft,
  LuEye,
  LuX,
  LuPackage,
  LuPercent,
  LuReceipt
} from "react-icons/lu";
import { FiDownload, FiDollarSign } from "react-icons/fi";
import api from "../../../shared/utils/api";
import { toast } from "react-hot-toast";

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  const cleanPath = path.replace(/\\/g, '/');
  const apiBase = api.defaults.baseURL || `http://${window.location.hostname}:5000/api`;
  const backendBase = apiBase.replace(/\/api$/, '');
  return `${backendBase}/${cleanPath}`;
};

const SellerTransactionsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("All");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/auth/admin/payments/sellers');
        if (data.success) {
          setTransactions(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch seller transactions:', err);
        toast.error('Failed to fetch seller transactions.');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = (t.sellerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.shopName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "All" || t.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const exportToExcel = async () => {
    if (transactions.length === 0) {
      toast.error('No transactions available to export.');
      return;
    }
    const XLSX = await import('xlsx');
    const dataToExport = transactions.map(t => ({
      'Transaction ID': t.id ? `#TXN-${t.id}` : `#TXN-${(t._id || '').substring(0, 6).toUpperCase()}`,
      'Seller Name': t.sellerName,
      'Shop Name': t.shopName,
      'Type': t.type,
      'Seller Payout (₹)': t.amount,
      'Admin Commission (₹)': t.commission,
      'Status': t.status,
      'Date': t.date ? new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Seller Payouts");
    XLSX.writeFile(wb, `Seller_Payouts_${new Date().toLocaleDateString()}.xlsx`);
    toast.success('Report exported successfully!');
  };

  const totalPayout = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalCommission = transactions.reduce((sum, t) => sum + (t.commission || 0), 0);

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6 pb-32">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso">
              Seller Transactions
            </h1>
            <p className="text-warm-sand text-sm md:text-base">
              Monitor payouts and product-wise commission breakdowns for all sellers.
            </p>
          </div>
          <button 
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 bg-red-800 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-deep-espresso transition-all shadow-md shadow-red-900/20 active:scale-95 text-sm"
          >
            <FiDownload size={18} />
            Export Report
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <FiDollarSign size={24} />
            </div>
            <div>
              <p className="text-xs text-warm-sand font-bold uppercase tracking-wider">
                Total Payouts
              </p>
              <h4 className="text-xl font-black text-deep-espresso">
                ₹{totalPayout.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </h4>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <FiDollarSign size={24} />
            </div>
            <div>
              <p className="text-xs text-warm-sand font-bold uppercase tracking-wider">
                Total Commission (10%)
              </p>
              <h4 className="text-xl font-black text-deep-espresso">
                ₹{totalCommission.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </h4>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <FiDollarSign size={24} />
            </div>
            <div>
              <p className="text-xs text-warm-sand font-bold uppercase tracking-wider">
                Transactions
              </p>
              <h4 className="text-xl font-black text-deep-espresso">{transactions.length}</h4>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-3 md:p-4 rounded-2xl border border-soft-oatmeal shadow-sm flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center">
          <div className="relative flex-grow">
            <LuSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by seller or shop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all text-sm font-bold"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full md:w-auto border border-soft-oatmeal text-deep-espresso px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-white cursor-pointer focus:outline-none hover:bg-soft-oatmeal/20 transition-all"
            >
              <option value="All">All Types</option>
              <option value="Payout">Payout</option>
              <option value="Refund">Refund</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-soft-oatmeal shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-soft-oatmeal/20 border-b border-soft-oatmeal">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Transaction ID
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Seller & Shop
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Type
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Date
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-oatmeal/50">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="7" className="h-16 bg-gray-50/50 px-6"></td>
                    </tr>
                  ))
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map((t) => (
                    <tr
                      key={t._id}
                      className="hover:bg-soft-oatmeal/5 transition-colors group"
                    >
                      <td className="px-6 py-4 text-xs font-bold text-deep-espresso/60">
                        {t.id ? `#TXN-${t.id}` : `#TXN-${(t._id || '').substring(0, 6).toUpperCase()}`}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-deep-espresso text-sm">
                            {t.sellerName}
                          </p>
                          <p className="text-[10px] text-warm-sand uppercase tracking-wider font-bold">
                            {t.shopName}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`flex items-center gap-1.5 text-xs font-bold ${t.type === "Payout" ? "text-green-600" : "text-red-600"}`}
                        >
                          {t.type === "Payout" ? (
                            <LuArrowUpRight size={14} />
                          ) : (
                            <LuArrowDownLeft size={14} />
                          )}
                          {t.type}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-deep-espresso text-sm">
                        ₹{(t.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                            t.status === "Completed"
                              ? "text-green-700 bg-green-50 border-green-700/10"
                              : "text-amber-700 bg-amber-50 border-amber-700/10"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-deep-espresso/70 font-bold uppercase">
                        {t.date ? new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* 👁️ VIEW PRODUCT COMMISSION BREAKDOWN BUTTON */}
                        <button
                          type="button"
                          onClick={() => setSelectedTransaction(t)}
                          className="px-3.5 py-1.5 bg-[#189D91] hover:bg-[#15887D] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 justify-center ml-auto"
                          title="View Product Commission Breakdown"
                        >
                          <LuEye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-400 font-bold">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 👁️ PRODUCT COMMISSION BREAKDOWN MODAL */}
        {selectedTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-espresso/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="fixed inset-0" onClick={() => setSelectedTransaction(null)}></div>
            <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="bg-[#189D91] p-6 text-white relative shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedTransaction(null)}
                  className="absolute top-5 right-5 p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                >
                  <LuX size={20} />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 text-white font-black text-lg">
                    <LuReceipt size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold">Product Commission Breakdown</h2>
                    <p className="text-white/80 text-xs font-medium uppercase tracking-widest mt-0.5">
                      Seller: {selectedTransaction.sellerName} ({selectedTransaction.shopName})
                    </p>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Summary Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Gross Product Sales
                    </span>
                    <span className="text-lg font-black text-slate-800 mt-1 block">
                      ₹{((selectedTransaction.amount || 0) + (selectedTransaction.commission || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/60">
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block flex items-center gap-1">
                      <LuPercent size={12} /> Admin Commission (10%)
                    </span>
                    <span className="text-lg font-black text-amber-800 mt-1 block">
                      ₹{(selectedTransaction.commission || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/60">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block">
                      Net Seller Payout (90%)
                    </span>
                    <span className="text-lg font-black text-emerald-800 mt-1 block">
                      ₹{(selectedTransaction.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Product Items Table */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100 flex items-center gap-1.5">
                    <LuPackage size={14} className="text-[#189D91]" /> Itemized Products & Commission Schedule
                  </h3>

                  {(!selectedTransaction.productsBreakdown || selectedTransaction.productsBreakdown.length === 0) ? (
                    <div className="py-8 text-center text-xs font-semibold text-slate-400 italic bg-slate-50 rounded-2xl border border-slate-100">
                      Standard 10% platform commission applied to total sales volume.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Product Name</th>
                            <th className="px-4 py-3 text-center">Qty & Price</th>
                            <th className="px-4 py-3 text-right">Total Sales</th>
                            <th className="px-4 py-3 text-center">Comm. Rate</th>
                            <th className="px-4 py-3 text-right">Admin Comm.</th>
                            <th className="px-4 py-3 text-right">Seller Payout</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-bold">
                          {selectedTransaction.productsBreakdown.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                                    {item.image ? (
                                      <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                      '📦'
                                    )}
                                  </div>
                                  <span className="text-slate-800 font-bold leading-tight">{item.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-slate-600">
                                {item.quantity} x ₹{(item.unitPrice || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-800">
                                ₹{(item.totalSales || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-black">
                                  {item.commissionRate || 10}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-amber-700 font-black">
                                ₹{(item.commissionAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-right text-emerald-700 font-black">
                                ₹{(item.sellerEarnings || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedTransaction(null)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default SellerTransactionsPage;
