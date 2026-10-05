import React, { useState } from "react";
import PageWrapper from "../components/PageWrapper";
import {
  LuSearch,
  LuFilter,
  LuArrowUpRight,
  LuArrowDownLeft,
  LuIndianRupee,
  LuPercent,
  LuReceipt
} from "react-icons/lu";
import { FiDownload } from "react-icons/fi";

const transactionsData = [
  {
    id: 1,
    sellerName: "John Doe",
    shopName: "John's Interiors",
    amount: 50000,
    type: "Payout",
    status: "Completed",
    date: "2024-04-01",
  },
  {
    id: 2,
    sellerName: "Jane Smith",
    shopName: "Modern Decor",
    amount: 35000,
    type: "Payout",
    status: "Pending",
    date: "2024-04-05",
  },
  {
    id: 3,
    sellerName: "Rajesh Kumar",
    shopName: "Royal Furniture",
    amount: 15000,
    type: "Adjustment",
    status: "Completed",
    date: "2024-04-08",
  },
  {
    id: 4,
    sellerName: "Alice Wong",
    shopName: "Wong Decor",
    amount: 25000,
    type: "Payout",
    status: "Completed",
    date: "2024-04-12",
  },
];

const SellerTransactionsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState(transactionsData);

  const filteredTransactions = transactions.filter(
    (t) =>
      t.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.shopName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso">
              Seller Transactions
            </h1>
            <p className="text-warm-sand text-sm md:text-base">
              Monitor payouts and financial adjustments for all sellers.
            </p>
          </div>
          <button className="flex items-center justify-center gap-2 bg-red-800 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-deep-espresso transition-all shadow-md shadow-red-900/20 active:scale-95 text-sm">
            <FiDownload size={18} />
            Export Report
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <LuIndianRupee size={24} />
            </div>
            <div>
              <p className="text-xs text-warm-sand font-bold uppercase tracking-wider">
                Total Payouts
              </p>
              <h4 className="text-xl font-black text-deep-espresso">
                ₹1,25,000
              </h4>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <LuPercent size={24} />
            </div>
            <div>
              <p className="text-xs text-warm-sand font-bold uppercase tracking-wider">
                Pending Payouts
              </p>
              <h4 className="text-xl font-black text-deep-espresso">₹35,000</h4>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <LuReceipt size={24} />
            </div>
            <div>
              <p className="text-xs text-warm-sand font-bold uppercase tracking-wider">
                Adjustments
              </p>
              <h4 className="text-xl font-black text-deep-espresso">₹15,000</h4>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-3 md:p-4 rounded-2xl border border-soft-oatmeal shadow-sm flex flex-col md:flex-row gap-3 md:gap-4">
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
              className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all text-sm"
            />
          </div>
          <button className="flex items-center justify-center gap-2 border border-soft-oatmeal text-deep-espresso px-6 py-3 md:py-0 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-soft-oatmeal/20 transition-all">
            <LuFilter size={16} />
            Filters
          </button>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-oatmeal/50">
                {filteredTransactions.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-soft-oatmeal/5 transition-colors group"
                  >
                    <td className="px-6 py-4 text-xs font-bold text-deep-espresso/60">
                      #TXN-00{t.id}
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
                      ₹{t.amount.toLocaleString()}
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
      </div>
    </PageWrapper>
  );
};

export default SellerTransactionsPage;
