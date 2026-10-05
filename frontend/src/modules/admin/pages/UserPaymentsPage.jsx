import React, { useState, useEffect } from "react";
import PageWrapper from "../components/PageWrapper";
import {
  LuSearch,
  LuIndianRupee,
  LuCreditCard,
  LuShoppingBag,
  LuArrowRight,
  LuClock,
} from "react-icons/lu";
import api from "../../../shared/utils/api";
import { useNavigate } from "react-router-dom";

const UserPaymentsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // If searchTerm exists, use the search endpoint, otherwise get all orders
        const endpoint = searchTerm.trim() 
          ? `/auth/admin/orders/search?query=${searchTerm}`
          : '/orders';
          
        const { data: res } = await api.get(endpoint);
        if (res.success) {
          setOrders(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchOrders();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === "Paid") return o.isPaid;
    if (filterStatus === "Unpaid") return !o.isPaid;
    return true;
  });

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso">
              User Payments
            </h1>
            <p className="text-warm-sand text-sm md:text-base">
              Monitor customer order payments and transactional history.
            </p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <LuIndianRupee size={24} />
            </div>
            <div>
              <p className="text-[10px] text-warm-sand font-black uppercase tracking-wider">
                Total Collection
              </p>
              <h4 className="text-xl font-black text-deep-espresso">
                ₹{orders.reduce((sum, o) => sum + (o.isPaid ? o.totalPrice : 0), 0).toLocaleString()}
              </h4>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <LuClock size={24} />
            </div>
            <div>
              <p className="text-[10px] text-warm-sand font-black uppercase tracking-wider">
                Pending COD
              </p>
              <h4 className="text-xl font-black text-deep-espresso">
                ₹{orders.reduce((sum, o) => sum + (!o.isPaid ? o.totalPrice : 0), 0).toLocaleString()}
              </h4>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <LuShoppingBag size={24} />
            </div>
            <div>
              <p className="text-[10px] text-warm-sand font-black uppercase tracking-wider">
                Paid Orders
              </p>
              <h4 className="text-xl font-black text-deep-espresso">
                {orders.filter(o => o.isPaid).length}
              </h4>
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
              placeholder="Search by Order ID or Customer name..."
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
              <option value="All">All Payments</option>
              <option value="Paid">Paid Only</option>
              <option value="Unpaid">Unpaid Only</option>
            </select>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-2xl border border-soft-oatmeal shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-soft-oatmeal/20 border-b border-soft-oatmeal">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Order ID
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Method
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
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-oatmeal/50">
                {loading ? (
                   Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                         <td colSpan="7" className="px-6 py-4 h-16 bg-gray-50/50"></td>
                      </tr>
                   ))
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((o) => (
                    <tr
                      key={o._id}
                      className="hover:bg-soft-oatmeal/5 transition-colors group"
                    >
                      <td className="px-6 py-4 text-xs font-black text-[#240046]">
                        #{o._id.toString().slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-deep-espresso text-sm">
                          {o.user?.fullName || 'Guest'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                           <LuCreditCard size={14} className="text-warm-sand" />
                           {o.paymentMethod}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-deep-espresso text-sm">
                        ₹{o.totalPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                            o.isPaid
                              ? "text-green-700 bg-green-50 border-green-700/10"
                              : "text-amber-700 bg-amber-50 border-amber-700/10"
                          }`}
                        >
                          {o.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-deep-espresso/70 font-bold uppercase">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button 
                           onClick={() => navigate(`/admin/orders/view/${o._id}`)}
                           className="p-2 hover:bg-soft-oatmeal/30 rounded-lg text-warm-sand transition-all hover:scale-110"
                         >
                            <LuArrowRight size={18} />
                         </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-400 font-bold">
                      No payments found.
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

export default UserPaymentsPage;
