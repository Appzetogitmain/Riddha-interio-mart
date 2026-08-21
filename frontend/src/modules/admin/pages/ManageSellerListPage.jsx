import React, { useState, useEffect } from "react";
import PageWrapper from "../components/PageWrapper";
import {
  LuSearch,
  LuFilter,
  LuUser,
  LuMail,
  LuPhone,
  LuMapPin,
  LuBriefcase,
  LuCheck,
  LuX,
  LuTrash2,
  LuArrowLeft,
  LuChevronRight,
  LuCircleCheck
} from "react-icons/lu";
import { FiMoreVertical } from "react-icons/fi";
import api from "../../../shared/utils/api";
import { toast } from "react-hot-toast";

const VERIFICATION_OPTIONS = [
  { value: 'unverified', label: 'Unverified' },
  { value: 'verified', label: 'Verified' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'authorized_distributor', label: 'Authorized Distributor' },
  { value: 'dealer', label: 'Dealer' },
  { value: 'wholesaler', label: 'Wholesaler' },
  { value: 'local_supplier', label: 'Local Supplier' },
  { value: 'premium_vendor', label: 'Premium Vendor' },
  { value: 'project_supplier', label: 'Project Supplier' }
];

const SELLERS_PER_PAGE = 10;

const ManageSellerListPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // 📱 Interactive Mobile states matching mock reference
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Live seller portfolio product fetching
  const [sellerProducts, setSellerProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const [activeRes, pendingRes] = await Promise.all([
        api.get('/auth/admin/sellers/active'),
        api.get('/auth/admin/sellers/pending')
      ]);

      // Map backend database status cleanly and sort by registration date (newest first)
      const allSellers = [
        ...activeRes.data.data.map(s => ({ 
          ...s, 
          status: s.status === 'suspended' ? 'Suspended' : 'Active' 
        })),
        ...pendingRes.data.data.map(s => ({ 
          ...s, 
          status: s.status === 'suspended' ? 'Suspended' : (s.status === 'approved' ? 'Active' : 'Pending')
        }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setSellers(allSellers);
    } catch (err) {
      console.error('Failed to fetch sellers:', err);
      toast.error('Failed to load seller data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  // Fetch real seller inventory products when View Details details is opened
  useEffect(() => {
    if (selectedSeller) {
      const fetchSellerProducts = async () => {
        try {
          setLoadingProducts(true);
          const res = await api.get(`/products?seller=${selectedSeller._id}`);
          setSellerProducts(res.data.data || []);
        } catch (err) {
          console.error("Failed to fetch seller products:", err);
          setSellerProducts([]);
        } finally {
          setLoadingProducts(false);
        }
      };
      fetchSellerProducts();
    } else {
      setSellerProducts([]);
    }
  }, [selectedSeller]);

  const handleStatusUpdate = async (id, action) => {
    try {
      if (action === 'approve') {
        await api.put(`/auth/admin/sellers/${id}/approve`);
        toast.success('Seller approved successfully');
      } else if (action === 'suspend') {
        if (!window.confirm('Are you sure you want to suspend this seller account?')) return;
        await api.put(`/auth/admin/sellers/${id}/suspend`);
        toast.success('Seller account suspended successfully');
      } else if (action === 'unsuspend') {
        await api.put(`/auth/admin/sellers/${id}/unsuspend`);
        toast.success('Seller account unsuspended successfully');
      } else if (action === 'delete') {
        if (!window.confirm('Are you sure you want to delete this seller?')) return;
        await api.delete(`/auth/admin/sellers/${id}`);
        toast.success('Seller record removed');
      }
      fetchSellers();
    } catch (err) {
      toast.error(`Failed to ${action} seller`);
    }
    setActiveMenu(null);
  };

  const handleVerificationChange = async (sellerId, verificationStatus) => {
    const prevSellers = sellers;
    // Optimistic update so the dropdown reflects the choice immediately
    setSellers((prev) => prev.map((s) => (s._id === sellerId ? { ...s, verificationStatus } : s)));
    try {
      await api.patch(`/admin/sellers/${sellerId}/verify`, { verificationStatus });
      toast.success('Vendor verification updated');
    } catch (err) {
      setSellers(prevSellers);
      toast.error('Failed to update verification status');
    }
  };

  const filteredSellers = sellers.filter(
    (seller) =>
      seller.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filteredSellers.length / SELLERS_PER_PAGE));
  const paginatedSellers = filteredSellers.slice(
    (currentPage - 1) * SELLERS_PER_PAGE,
    currentPage * SELLERS_PER_PAGE
  );

  // Reset to page 1 whenever the search narrows/widens the result set, so the user
  // never lands on a page that no longer has any rows.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 📱 MOBILE VIEW: User Details (Left Phone View)
  if (selectedUser) {
    return (
      <PageWrapper>
        <div className="w-full max-w-2xl mx-auto bg-[#FAFAFA] min-h-[90vh] md:rounded-3xl md:border md:border-soft-oatmeal md:shadow-md overflow-hidden flex flex-col font-sans relative">
          {/* Simple Premium Header */}
          <div className="bg-white text-deep-espresso px-5 pt-6 pb-6 rounded-b-[24px] border-b border-soft-oatmeal flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSelectedUser(null)} 
                className="p-1.5 hover:bg-soft-oatmeal/50 rounded-lg transition-colors text-deep-espresso"
              >
                <LuArrowLeft size={18} />
              </button>
              <h1 className="text-sm font-black uppercase tracking-wider text-deep-espresso">User Details</h1>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest bg-soft-oatmeal text-warm-sand px-2.5 py-1 rounded-lg border border-soft-oatmeal/50">Admin</span>
          </div>

          <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-32">
            {/* Profile Avatar Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-[#189D91]/20 flex items-center justify-center font-bold text-[#189D91] text-lg overflow-hidden shrink-0">
                {selectedUser.fullName[0]}
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-black text-slate-800 leading-none">{selectedUser.fullName}</h2>
                  <LuCircleCheck className="text-emerald-500 shrink-0" size={15} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">User Analytics</p>
              </div>
            </div>

            {/* Personal Info */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Personal info</h3>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full"></span> Verified
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-wider text-[9px]">Name</span>
                  <span className="text-slate-800">{selectedUser.fullName}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-wider text-[9px]">Address</span>
                  <span className="text-slate-800 truncate max-w-[200px]">{selectedUser.shopAddress || 'Slate Navy'}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-wider text-[9px]">Age</span>
                  <span className="text-slate-800">29</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-wider text-[9px]">Order Limit</span>
                  <span className="text-slate-800">#7987426</span>
                </div>
              </div>
            </div>

            {/* Order History */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight pb-2 border-b border-slate-50">Order History</h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-pink-50 text-[#EC008C] border border-pink-100 flex items-center justify-center font-bold text-xs">📦</span>
                    <div>
                      <p className="text-[11px] font-bold text-slate-800 leading-none">Order ID #4IMS2210</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mt-1">Jan 13, 2026</p>
                    </div>
                  </div>
                  <LuChevronRight size={14} className="text-slate-450" />
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-teal-50 text-[#189D91] border border-teal-100 flex items-center justify-center font-bold text-xs">📦</span>
                    <div>
                      <p className="text-[11px] font-bold text-slate-800 leading-none">Order ID #4IMS4321</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mt-1">May 15, 2026</p>
                    </div>
                  </div>
                  <LuChevronRight size={14} className="text-slate-450" />
                </div>
              </div>
            </div>

            {/* Activity Log Buttons */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => toast.success('Product flow initialized')}
                className="flex-grow py-3 bg-deep-espresso hover:bg-deep-espresso/90 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 text-center"
              >
                Add New Product
              </button>
              <button 
                onClick={() => toast.success('Report access granted')}
                className="flex-grow py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95 text-center"
              >
                View Reports
              </button>
            </div>
          </div>
          
          {/* Bottom navigation tab mockup */}
          <div className="bg-white border-t border-slate-100 px-4 py-3 flex justify-around items-center text-slate-400 shrink-0">
            <div className="flex flex-col items-center gap-0.5 text-[9px] font-black uppercase text-deep-espresso">
              <span>🏠</span>
              <span>Home</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 text-[9px] font-bold uppercase">
              <span>🛍️</span>
              <span>Sellers</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 text-[9px] font-bold uppercase">
              <span>📦</span>
              <span>Products</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 text-[9px] font-bold uppercase">
              <span>👤</span>
              <span>Account</span>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  // 📱 MOBILE VIEW: Seller Details (Right Phone View)
  if (selectedSeller) {
    return (
      <PageWrapper>
        <div className="w-full max-w-2xl mx-auto bg-[#FAFAFA] min-h-[90vh] md:rounded-3xl md:border md:border-soft-oatmeal md:shadow-md overflow-hidden flex flex-col font-sans relative">
          {/* Clean Simple Header */}
          <div className="bg-white text-deep-espresso px-5 pt-7 pb-6 rounded-b-[24px] border-b border-soft-oatmeal relative overflow-hidden shrink-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setSelectedSeller(null)} 
                className="p-1.5 hover:bg-soft-oatmeal/50 rounded-lg transition-colors text-deep-espresso"
              >
                <LuArrowLeft size={20} />
              </button>
              <h1 className="text-base font-bold text-deep-espresso">Seller Details</h1>
              <button 
                onClick={() => setSelectedSeller(null)} 
                className="p-1.5 hover:bg-soft-oatmeal/50 rounded-lg transition-colors text-deep-espresso"
              >
                <LuX size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-deep-espresso/5 border border-soft-oatmeal flex items-center justify-center font-bold text-deep-espresso text-lg overflow-hidden shrink-0">
                {selectedSeller.logo || selectedSeller.avatar || selectedSeller.dp ? (
                  <img 
                    src={selectedSeller.logo || selectedSeller.avatar || selectedSeller.dp} 
                    alt="Seller DP" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  selectedSeller.fullName[0].toUpperCase()
                )}
              </div>
              <div>
                <h2 className="text-base font-black text-deep-espresso leading-none">{selectedSeller.fullName}</h2>
                <p className="text-[10px] text-warm-sand font-black uppercase tracking-widest mt-1">Seller Analytics</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-32">
            {/* OTHER DETAILS BAR */}
            <div className="bg-gradient-to-r from-slate-100 to-slate-200/50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-center gap-1">
              <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">🛡️ Verified Business Partner</span>
            </div>

            {/* Business Info */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Business Info</h3>
              <div className="flex items-center justify-between p-1 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-deep-espresso/5 border border-soft-oatmeal flex items-center justify-center overflow-hidden shrink-0">
                    {selectedSeller.logo || selectedSeller.avatar || selectedSeller.dp ? (
                      <img 
                        src={selectedSeller.logo || selectedSeller.avatar || selectedSeller.dp} 
                        alt="Store Logo" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="font-bold text-sm text-deep-espresso">{selectedSeller.shopName[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 leading-none">Store Name</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{selectedSeller.shopName}</p>
                  </div>
                </div>
                <LuChevronRight className="text-slate-450" size={16} />
              </div>
            </div>

            {/* Seller Contact & Profile Info */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Profile Details</h3>
                <span className={`text-[9px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded-full ${
                  selectedSeller.status === 'Active' 
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-700/10' 
                    : selectedSeller.status === 'Suspended'
                    ? 'text-red-700 bg-red-50 border-red-700/10'
                    : 'text-amber-700 bg-amber-50 border-amber-700/10'
                }`}>
                  {selectedSeller.status}
                </span>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-wider text-[9px]">Owner Name</span>
                  <span className="text-slate-800">{selectedSeller.fullName}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-wider text-[9px]">Email Address</span>
                  <span className="text-slate-800 font-medium select-all">{selectedSeller.email}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-wider text-[9px]">Phone Number</span>
                  <span className="text-slate-800">{selectedSeller.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-wider text-[9px]">Store Address</span>
                  <span className="text-slate-800 truncate max-w-[200px]">{selectedSeller.shopAddress || 'Online Only'}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-455 uppercase tracking-wider text-[9px]">Registered Date</span>
                  <span className="text-slate-800">{new Date(selectedSeller.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Business Type */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Business Type</span>
              <p className="text-sm font-bold text-slate-800 mt-1">Manufacturer & Retailer</p>
            </div>

            {/* Seller Rating */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Seller Rating</span>
                <p className="text-sm font-bold text-slate-800 mt-1">⭐ 4.8 / 5.0 (Superb)</p>
              </div>
              <span className="bg-amber-50 text-amber-700 border border-amber-100/50 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Low Stock
              </span>
            </div>

            {/* Product Inventory */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-50">Product Inventory</h3>
              
              {loadingProducts ? (
                <div className="py-8 text-center text-[10px] font-black uppercase tracking-wider text-warm-sand animate-pulse">
                  Loading Live Portfolio...
                </div>
              ) : sellerProducts.length === 0 ? (
                <div className="py-8 text-center text-xs font-semibold text-slate-400 italic">
                  No active store inventory listed yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {sellerProducts.map((prod) => (
                    <div key={prod._id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                          {prod.images && prod.images[0] ? (
                            <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            '📦'
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-black text-slate-800 leading-none truncate">{prod.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1.5">Price - ₹{(prod.price || 0).toLocaleString('en-IN')}</p>
                          <p className="text-[9px] text-yellow-600 font-bold mt-0.5">Rating: ⭐ {prod.averageRating || '0.0'}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {prod.countInStock <= 5 ? (
                          <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider block mb-1">
                            Low Stock
                          </span>
                        ) : (
                          <span className="bg-green-50 text-green-700 border border-green-100 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider block mb-1">
                            In Stock
                          </span>
                        )}
                        <span className="text-xs font-black text-slate-700 block">{prod.countInStock} available</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom navigation tab mockup */}
          <div className="bg-white border-t border-slate-100 px-4 py-3 flex justify-around items-center text-slate-400 shrink-0">
            <div className="flex flex-col items-center gap-0.5 text-[9px] font-black uppercase text-deep-espresso">
              <span>🏠</span>
              <span>Home</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 text-[9px] font-bold uppercase">
              <span>🛍️</span>
              <span>Sellers</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 text-[9px] font-bold uppercase">
              <span>📦</span>
              <span>Products</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 text-[9px] font-bold uppercase">
              <span>👤</span>
              <span>Account</span>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* 🖥️ DESKTOP VIEW (Large screens) */}
      <div className="hidden lg:block max-w-7xl mx-auto space-y-6 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso">
              Manage Sellers
            </h1>
            <p className="text-warm-sand text-sm md:text-base">
              View and manage all registered sellers in the platform.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="px-4 py-2 bg-white rounded-xl border border-soft-oatmeal shadow-sm flex flex-col">
              <span className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Active</span>
              <span className="text-lg font-bold text-deep-espresso">{sellers.filter(s => s.status === 'Active').length}</span>
            </div>
            <div className="px-4 py-2 bg-white rounded-xl border border-soft-oatmeal shadow-sm flex flex-col">
              <span className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Pending</span>
              <span className="text-lg font-bold text-amber-600">{sellers.filter(s => s.status === 'Pending').length}</span>
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
              placeholder="Search by name, shop, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all text-sm font-bold"
            />
          </div>
          <button className="flex items-center justify-center gap-2 border border-soft-oatmeal text-deep-espresso px-6 py-3 md:py-0 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-soft-oatmeal/20 transition-all">
            <LuFilter size={16} />
            Filters
          </button>
        </div>

        {/* Sellers Table */}
        <div className="bg-white rounded-2xl border border-soft-oatmeal shadow-md overflow-hidden min-h-[400px]">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-24 gap-4">
               <div className="w-12 h-12 border-4 border-warm-sand border-t-deep-espresso rounded-full animate-spin"></div>
               <p className="text-xs font-black uppercase tracking-[0.2em] text-warm-sand">Fetching Seller Records...</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-soft-oatmeal/20 border-b border-soft-oatmeal">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                      Seller & Shop
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                      Contact Info
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                      Location
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                      Products
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                      Total Sales
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                      Sales Volume
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                      Joined Date
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                      Verification
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-soft-oatmeal/50">
                  {filteredSellers.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-20 text-center text-warm-sand font-bold uppercase tracking-widest italic text-sm">
                        No sellers found.
                      </td>
                    </tr>
                  ) : (
                    paginatedSellers.map((seller, idx) => {
                      const isLastRows = paginatedSellers.length > 2 && idx >= paginatedSellers.length - 2;
                      return (
                        <tr
                        key={seller._id}
                        className="hover:bg-soft-oatmeal/5 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-deep-espresso/5 flex items-center justify-center text-deep-espresso border border-soft-oatmeal">
                              <LuUser size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-deep-espresso">
                                {seller.fullName}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] font-black text-warm-sand uppercase tracking-widest mt-0.5">
                                <LuBriefcase size={10} /> {seller.shopName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-deep-espresso/70">
                              <LuMail size={12} className="text-warm-sand" />
                              {seller.email}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-deep-espresso/70">
                              <LuPhone size={12} className="text-warm-sand" />
                              {seller.phone || 'No phone'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-deep-espresso/70">
                            <LuMapPin size={14} className="text-warm-sand flex-shrink-0" />
                            <span className="line-clamp-1">{seller.shopAddress || 'Online Only'}</span>
                          </div>
                        </td>
                        {/* Real-time backend performance metrics */}
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-deep-espresso/80 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg w-max flex items-center justify-center min-w-[32px]">
                            {seller.productCount || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-black text-deep-espresso">
                          ₹{(seller.totalSales || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100/70 border border-slate-200/50 px-2 py-0.5 rounded-full">
                            {seller.orderCount || 0} orders
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-deep-espresso/70 font-black uppercase tracking-tighter">
                          {new Date(seller.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                              seller.status === "Active"
                                ? "text-green-700 bg-green-50 border-green-700/10"
                                : seller.status === "Suspended"
                                ? "text-red-700 bg-red-50 border-red-700/10"
                                : "text-amber-700 bg-amber-50 border-amber-700/10"
                            }`}
                          >
                            {seller.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={seller.verificationStatus || 'unverified'}
                            onChange={(e) => handleVerificationChange(seller._id, e.target.value)}
                            className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-warm-sand/20 cursor-pointer ${
                              (seller.verificationStatus || 'unverified') === 'unverified'
                                ? 'text-slate-500 bg-slate-50 border-slate-200'
                                : 'text-[#189D91] bg-[#189D91]/10 border-[#189D91]/20'
                            }`}
                          >
                            {VERIFICATION_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <button 
                            onClick={() => setActiveMenu(activeMenu === seller._id ? null : seller._id)}
                            className="p-2 text-deep-espresso hover:bg-soft-oatmeal rounded-lg transition-colors"
                          >
                            <FiMoreVertical size={16} />
                          </button>

                          {activeMenu === seller._id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)}></div>
                              <div className={`absolute right-6 w-52 bg-white rounded-2xl shadow-2xl border border-soft-oatmeal py-2 z-20 overflow-hidden animate-in fade-in zoom-in duration-200 ${isLastRows ? 'bottom-12' : 'top-14'}`}>
                                {seller.status === 'Pending' && (
                                  <button 
                                    onClick={() => handleStatusUpdate(seller._id, 'approve')}
                                    className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-3"
                                  >
                                    <LuCheck size={14} /> Approve Store
                                  </button>
                                )}
                                {seller.status === 'Active' && (
                                  <button 
                                    onClick={() => handleStatusUpdate(seller._id, 'suspend')}
                                    className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-3"
                                  >
                                    <LuX size={14} /> Suspend Account
                                  </button>
                                )}
                                {seller.status === 'Suspended' && (
                                  <button 
                                    onClick={() => handleStatusUpdate(seller._id, 'unsuspend')}
                                    className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-650 hover:bg-emerald-50 transition-colors flex items-center gap-3"
                                  >
                                    <LuCheck size={14} /> Reactivate Account
                                  </button>
                                )}
                                <button 
                                  onClick={() => {
                                    setSelectedSeller(seller);
                                    setActiveMenu(null);
                                  }}
                                  className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-deep-espresso hover:bg-soft-oatmeal transition-colors flex items-center gap-3"
                                >
                                  <LuUser size={14} /> View Details
                                </button>
                                <div className="h-px bg-soft-oatmeal my-1 mx-2"></div>
                                <button 
                                  onClick={() => handleStatusUpdate(seller._id, 'delete')}
                                  className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-800 hover:bg-red-50 transition-colors flex items-center gap-3"
                                >
                                  <LuTrash2 size={14} /> Remove Account
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredSellers.length > 0 && (
          <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-soft-oatmeal shadow-sm">
            <p className="text-xs font-bold text-deep-espresso/60">
              Showing {(currentPage - 1) * SELLERS_PER_PAGE + 1}
              –{Math.min(currentPage * SELLERS_PER_PAGE, filteredSellers.length)} of {filteredSellers.length} sellers
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl border border-soft-oatmeal text-xs font-bold text-deep-espresso disabled:opacity-40 disabled:cursor-not-allowed hover:bg-soft-oatmeal/20 transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-xs font-bold text-deep-espresso/40">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                          p === currentPage
                            ? 'bg-[#189D91] text-white shadow-sm'
                            : 'text-deep-espresso/70 hover:bg-soft-oatmeal/20'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl border border-soft-oatmeal text-xs font-bold text-deep-espresso disabled:opacity-40 disabled:cursor-not-allowed hover:bg-soft-oatmeal/20 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 📱 MOBILE VIEW: Seller Management list */}
      <div className="block lg:hidden w-full max-w-2xl mx-auto bg-[#FAFAFA] min-h-[85vh] md:rounded-3xl md:border md:border-soft-oatmeal md:shadow-md overflow-hidden flex flex-col font-sans">
        {/* Simple Premium Header */}
        <div className="bg-white text-deep-espresso px-5 pt-6 pb-6 rounded-b-[24px] border-b border-soft-oatmeal flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-soft-oatmeal/50 rounded-lg transition-colors text-deep-espresso">
              <LuArrowLeft size={18} />
            </button>
            <h1 className="text-sm font-black uppercase tracking-wider text-deep-espresso">Seller Management</h1>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest bg-soft-oatmeal text-warm-sand px-2.5 py-1 rounded-lg border border-soft-oatmeal/50">Admin</span>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-32">
          {/* Search & Filter bar row */}
          <div className="flex gap-2 shrink-0">
            <div className="relative flex-grow">
              <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search and Filter..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white"
              />
            </div>
            <button className="px-3.5 bg-white border border-slate-200 rounded-xl flex items-center gap-1 text-slate-700 text-xs font-bold">
              <LuFilter size={14} className="text-slate-450" /> Filter
            </button>
          </div>

          {/* Seller Cards List */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-20 text-center animate-pulse text-warm-sand font-bold uppercase tracking-widest text-xs">Loading Sellers...</div>
            ) : filteredSellers.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl border border-slate-100 text-center space-y-2">
                <p className="font-bold text-slate-800 text-sm">No Sellers Found</p>
                <p className="text-slate-400 text-xs font-semibold">Try modifying search tags.</p>
              </div>
            ) : (
              paginatedSellers.map((seller) => (
                <div key={seller._id} className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden flex flex-col">
                  {/* Soft oatmeal header */}
                  <div className="bg-soft-oatmeal/35 px-4 py-2 border-b border-soft-oatmeal/70 flex justify-between items-center">
                    <span className="text-[10px] font-black text-deep-espresso uppercase tracking-wider">
                      Seller ID {"4IMS" + seller._id.substring(0,4).toUpperCase()}
                    </span>
                    <span className="bg-soft-oatmeal text-warm-sand text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                      Needs Review
                    </span>
                  </div>

                  {/* Inner Content */}
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Clicking on avatar opens the left phone view "User Details"! */}
                      <button 
                        onClick={() => setSelectedUser(seller)} 
                        className="w-12 h-12 rounded-full bg-slate-100 border-2 border-[#189D91]/20 flex items-center justify-center font-black text-[#189D91] text-sm overflow-hidden shrink-0 hover:scale-105 active:scale-95 transition-transform"
                        title="Click to view User Details"
                      >
                        {seller.fullName[0]}
                      </button>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 leading-none">{seller.shopName}</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Owner: {seller.fullName}</p>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        seller.status === "Active"
                          ? "text-[#189D91] bg-teal-50 border-teal-100"
                          : seller.status === "Suspended"
                          ? "text-red-700 bg-red-50 border-red-100"
                          : "text-amber-700 bg-amber-50 border-amber-100"
                      }`}>
                        {seller.status}
                      </span>
                      <span className="text-xs font-black text-slate-800">₹{(seller.totalSales || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Vendor Verification */}
                  <div className="px-4 pb-3 flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verification</span>
                    <select
                      value={seller.verificationStatus || 'unverified'}
                      onChange={(e) => handleVerificationChange(seller._id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1.5 rounded-lg border focus:outline-none ${
                        (seller.verificationStatus || 'unverified') === 'unverified'
                          ? 'text-slate-500 bg-slate-50 border-slate-200'
                          : 'text-[#189D91] bg-[#189D91]/10 border-[#189D91]/20'
                      }`}
                    >
                      {VERIFICATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Update Status Actions */}
                  <div className="px-4 pb-4 pt-1 flex gap-2">
                    <button 
                      onClick={() => setSelectedSeller(seller)} 
                      className="flex-grow py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-650 transition-colors text-center"
                    >
                      View Details
                    </button>
                    {seller.status === 'Pending' && (
                      <button 
                        onClick={() => handleStatusUpdate(seller._id, 'approve')}
                        className="px-4 py-2.5 bg-[#189D91] hover:bg-[#15887D] text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {seller.status === 'Active' && (
                      <button 
                        onClick={() => handleStatusUpdate(seller._id, 'suspend')}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors animate-in fade-in duration-200"
                      >
                        Suspend
                      </button>
                    )}
                    {seller.status === 'Suspended' && (
                      <button 
                        onClick={() => handleStatusUpdate(seller._id, 'unsuspend')}
                        className="px-4 py-2.5 bg-[#189D91] hover:bg-[#15887D] text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors animate-in fade-in duration-200"
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {!loading && filteredSellers.length > 0 && (
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Bottom navigation tab mockup */}
        <div className="bg-white border-t border-slate-100 px-4 py-3 flex justify-around items-center text-slate-400 shrink-0">
          <div className="flex flex-col items-center gap-0.5 text-[9px] font-black uppercase text-deep-espresso">
            <span>🏠</span>
            <span>Home</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 text-[9px] font-bold uppercase">
            <span>🛍️</span>
            <span>Sellers</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 text-[9px] font-bold uppercase">
            <span>📦</span>
            <span>Products</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 text-[9px] font-bold uppercase">
            <span>👤</span>
            <span>Account</span>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ManageSellerListPage;
