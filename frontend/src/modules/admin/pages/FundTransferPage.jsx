import React, { useState, useEffect } from "react";
import PageWrapper from "../components/PageWrapper";
import {
  LuWallet,
  LuSearch,
  LuFilter,
  LuArrowUpRight,
  LuPlus,
  LuX,
  LuChevronDown,
  LuCalendar,
  LuIndianRupee
} from "react-icons/lu";

const transfersData = [
  {
    id: 1,
    name: "Suresh Raina",
    amount: 1250,
    date: "2024-04-14",
    status: "Completed",
    type: "Daily Payout",
  },
  {
    id: 2,
    name: "Mahendra Singh",
    amount: 3500,
    date: "2024-04-14",
    status: "Pending",
    type: "Weekly Payout",
  },
  {
    id: 3,
    name: "Virat Kohli",
    amount: 850,
    date: "2024-04-13",
    status: "Completed",
    type: "Incentive",
  },
];

const FundTransferPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [transfers, setTransfers] = useState(transfersData);
  const [showModal, setShowModal] = useState(false);
  const [partners, setPartners] = useState([]);
  
  // Form State
  const [formData, setFormData] = useState({
    partnerName: "",
    amount: "",
    type: "Daily Payout"
  });

  useEffect(() => {
    // Load approved delivery boys for selection
    const savedApproved = JSON.parse(localStorage.getItem('admin_approved_delivery_boys') || '[]');
    // Add existing static mock names for selection variety
    const staticNames = ["Suresh Raina", "Mahendra Singh", "Virat Kohli"];
    const allPartners = [...staticNames, ...savedApproved.map(b => b.name)];
    setPartners([...new Set(allPartners)]);
  }, [showModal]);

  const filteredTransfers = transfers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.type.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.partnerName || !formData.amount) {
      alert("Please fill in all fields.");
      return;
    }

    const newEntry = {
      id: transfers.length + 1,
      name: formData.partnerName,
      amount: parseFloat(formData.amount),
      date: new Date().toISOString().split('T')[0],
      status: "Completed",
      type: formData.type,
    };

    setTransfers([newEntry, ...transfers]);
    setShowModal(false);
    setFormData({ partnerName: "", amount: "", type: "Daily Payout" });
    alert("Fund Transfer Recorded Successfully!");
  };

  return (
    <PageWrapper>
      <div className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso">
              Fund Transfer
            </h1>
            <p className="text-warm-sand text-sm md:text-base">
              Manage earnings and payouts for delivery boys.
            </p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-red-800 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-deep-espresso transition-all shadow-md shadow-red-900/20 active:scale-95 text-sm"
          >
            <LuPlus size={18} />
            New Transfer
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-3 md:p-4 rounded-2xl border border-soft-oatmeal shadow-sm flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="relative flex-grow">
            <LuSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name or transfer type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-800/20 transition-all text-sm"
            />
          </div>
          <button className="flex items-center justify-center gap-2 border border-soft-oatmeal text-deep-espresso px-6 py-3 md:py-0 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-soft-oatmeal/20 transition-all">
            <LuFilter size={16} />
            Filters
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-soft-oatmeal shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-soft-oatmeal/20 border-b border-soft-oatmeal">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Transaction ID
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Delivery Partner
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Type
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-oatmeal/50">
                {filteredTransfers.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-soft-oatmeal/5 transition-colors group"
                  >
                    <td className="px-6 py-4 text-xs font-bold text-deep-espresso/60">
                      #TRF-00{t.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-800/10 flex items-center justify-center text-red-800">
                          <LuWallet size={16} />
                        </div>
                        <p className="font-bold text-deep-espresso text-sm">
                          {t.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-deep-espresso text-sm">
                      ₹{t.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-deep-espresso/60 bg-soft-oatmeal/30 px-2 py-1 rounded border border-soft-oatmeal uppercase tracking-widest">
                        <LuArrowUpRight size={14} className="text-green-600" />
                        {t.type}
                      </div>
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
                    <td className="px-6 py-4 text-xs text-deep-espresso/70 font-medium">
                      {t.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Transfer Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-espresso/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div 
              className="absolute inset-0" 
              onClick={() => setShowModal(false)}
            ></div>
            <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              {/* Modal Header */}
              <div className="bg-red-800 p-6 text-white text-center relative">
                 <button 
                   onClick={() => setShowModal(false)}
                   className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                 >
                   <LuX size={20} />
                 </button>
                 <LuIndianRupee className="mx-auto mb-2 opacity-50" size={32} />
                 <h2 className="text-xl font-display font-bold">New Fund Transfer</h2>
                 <p className="text-white/70 text-xs">Record a payout for a delivery partner</p>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {/* Partner Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Select Delivery Partner</label>
                  <div className="relative">
                    <select 
                      required
                      value={formData.partnerName}
                      onChange={(e) => setFormData({...formData, partnerName: e.target.value})}
                      className="w-full appearance-none bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/20 transition-all cursor-pointer font-bold text-deep-espresso"
                    >
                      <option value="">Select a partner...</option>
                      {partners.map((name, i) => (
                        <option key={i} value={name}>{name}</option>
                      ))}
                    </select>
                    <LuChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-sand pointer-events-none" size={18} />
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Transfer Amount (₹)</label>
                  <div className="relative">
                    <LuIndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand" size={18} />
                    <input 
                      required
                      type="number" 
                      placeholder="0.00" 
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-800/20 transition-all text-sm font-black text-deep-espresso"
                    />
                  </div>
                </div>

                {/* Type Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Transfer Type</label>
                  <div className="flex gap-2">
                    {["Daily Payout", "Weekly Payout", "Incentive"].map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setFormData({...formData, type})}
                        className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${
                          formData.type === type 
                          ? 'bg-red-800 text-white border-red-800' 
                          : 'bg-white text-warm-sand border-soft-oatmeal hover:bg-soft-oatmeal/10'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Action */}
                <button 
                  type="submit"
                  className="w-full bg-red-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-deep-espresso transition-all shadow-lg shadow-red-900/20 mt-4"
                >
                  Confirm Transfer
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default FundTransferPage;
