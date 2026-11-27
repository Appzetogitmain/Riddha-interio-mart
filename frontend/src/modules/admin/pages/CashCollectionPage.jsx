import React, { useState, useEffect } from "react";
import PageWrapper from "../components/PageWrapper";
import {
  LuBanknote,
  LuSearch,
  LuFilter,
} from "react-icons/lu";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import api from "../../../shared/utils/api";
import { toast } from "react-hot-toast";

const CashCollectionPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/admin/payments/delivery');
      if (data.success) {
        setCollections(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch cash collections:', err);
      toast.error('Failed to fetch cash collections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const filteredCollections = collections.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "All" || c.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleConfirmDeposit = (id, name) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1 text-left">
        <p className="text-sm font-bold text-gray-800">
          Confirm that cash has been deposited by {name}?
        </p>
        <div className="flex justify-end gap-2 mt-1">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const { data } = await api.put(`/auth/admin/payments/delivery/confirm/${id}`);
                if (data.success) {
                  toast.success("Deposit confirmed successfully!");
                  fetchCollections();
                }
              } catch (err) {
                console.error(err);
                toast.error("Failed to confirm deposit.");
              }
            }}
            className="px-3 py-1 bg-green-700 text-white rounded-lg text-xs font-bold hover:bg-green-800 transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg text-xs font-bold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso">
              Cash Collection
            </h1>
            <p className="text-warm-sand text-sm md:text-base">
              Track COD collections and deposits from delivery boys.
            </p>
          </div>
        </div>

        <div className="bg-white p-3 md:p-4 rounded-2xl border border-soft-oatmeal shadow-sm flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center">
          <div className="relative flex-grow">
            <LuSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by delivery boy name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all text-sm font-bold"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full md:w-auto border border-soft-oatmeal text-deep-espresso px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-white cursor-pointer focus:outline-none hover:bg-soft-oatmeal/20 transition-all"
            >
              <option value="All">All Status</option>
              <option value="In Hand">In Hand</option>
              <option value="Deposited">Deposited</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-soft-oatmeal shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-soft-oatmeal/20 border-b border-soft-oatmeal">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Delivery Partner
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Amount In Hand
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Orders Count
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Last Update
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
                      <td colSpan="6" className="h-16 bg-gray-50/50 px-6"></td>
                    </tr>
                  ))
                ) : filteredCollections.length > 0 ? (
                  filteredCollections.map((c) => (
                    <tr
                      key={c._id}
                      className="hover:bg-soft-oatmeal/5 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-800/10 flex items-center justify-center text-red-800">
                            <LuBanknote size={16} />
                          </div>
                          <p className="font-bold text-deep-espresso text-sm">
                            {c.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-deep-espresso text-sm">
                        ₹{c.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-deep-espresso/60 bg-soft-oatmeal/30 px-2 py-1 rounded border border-soft-oatmeal uppercase tracking-widest">
                          {c.orders} Orders
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {c.status === "Deposited" ? (
                            <FiCheckCircle size={14} className="text-green-600" />
                          ) : (
                            <FiAlertCircle size={14} className="text-amber-600" />
                          )}
                          <span
                            className={`text-[10px] font-bold uppercase tracking-widest ${
                              c.status === "Deposited"
                                ? "text-green-700"
                                : "text-amber-700"
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-deep-espresso/70 font-bold uppercase">
                        {c.date ? new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {c.status === "In Hand" ? (
                          <button 
                            onClick={() => handleConfirmDeposit(c._id, c.name)}
                            className="text-[10px] font-black uppercase tracking-widest text-red-800 hover:text-deep-espresso transition-colors px-3 py-1.5 border border-red-800/20 rounded-lg hover:bg-soft-oatmeal/20"
                          >
                            Confirm Deposit
                          </button>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-green-600 flex items-center justify-end gap-1">
                            <FiCheckCircle size={12} />
                            Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-gray-400 font-bold">
                      No collections found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default CashCollectionPage;
