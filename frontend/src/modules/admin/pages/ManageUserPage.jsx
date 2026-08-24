import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import { useNavigate } from 'react-router-dom';
import { 
  LuSearch, 
  LuFilter, 
  LuUser, 
  LuMail, 
  LuPhone, 
  LuBuilding2, 
  LuClipboardCheck, 
  LuShoppingBag, 
  LuShieldCheck, 
  LuShieldAlert, 
  LuX 
} from 'react-icons/lu';
import { FiMoreVertical } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';

const ManageUserPage = ({ type }) => {
  const [currentTab, setCurrentTab] = useState(type || 'customer');
  
  useEffect(() => {
    setCurrentTab(type || 'customer');
  }, [type]);

  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);

  // Pagination (backend already supports page/limit — see adminController.getUsers)
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Dynamic Slide-over Details Drawer
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Collapsible Filters
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'blocked'
  const [orderFilter, setOrderFilter] = useState('all'); // 'all', 'has_orders', 'no_orders'

  const navigate = useNavigate();

  const fetchUsers = async (pageToFetch = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/auth/admin/users`, { params: { userType: currentTab, page: pageToFetch, limit: PAGE_SIZE } });
      setUsers(res.data.data);
      setPage(res.data.page || pageToFetch);
      setTotalPages(res.data.totalPages || 1);
      setTotalResults(res.data.totalResults ?? res.data.data?.length ?? 0);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    fetchUsers(nextPage);
  };

  useEffect(() => {
    fetchUsers(1);
    // Reset filters and selection when type changes
    setSelectedUserDetail(null);
    setStatusFilter('all');
    setOrderFilter('all');
  }, [currentTab]);

  // Load real-time order history for selected customer/enterpriser
  useEffect(() => {
    if (selectedUserDetail) {
      const fetchUserOrders = async () => {
        try {
          setLoadingOrders(true);
          const res = await api.get(`/orders?user=${selectedUserDetail._id}`);
          setUserOrders(res.data.data || []);
        } catch (err) {
          console.error('Failed to load user orders:', err);
          setUserOrders([]);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchUserOrders();
    } else {
      setUserOrders([]);
    }
  }, [selectedUserDetail]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
    try {
      await api.delete(`/auth/admin/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      if (selectedUserDetail?._id === id) {
        setSelectedUserDetail(null);
      }
      toast.success('User account removed successfully');
      setActiveMenu(null);
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete user account');
    }
  };

  const toggleBlock = async (user) => {
    try {
      const nextBlockedState = !user.isBlocked;
      await api.put(`/auth/admin/users/${user._id}`, { isBlocked: nextBlockedState });
      
      const updatedList = users.map(u => u._id === user._id ? { ...u, isBlocked: nextBlockedState } : u);
      setUsers(updatedList);
      
      if (selectedUserDetail?._id === user._id) {
        setSelectedUserDetail({ ...selectedUserDetail, isBlocked: nextBlockedState });
      }
      
      toast.success(nextBlockedState ? 'User blocked successfully' : 'User unblocked successfully');
      setActiveMenu(null);
    } catch (err) {
      console.error('Block toggle failed:', err);
      toast.error('Failed to toggle block status');
    }
  };

  // Complex multi-dimensional search & filtering logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm));

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && !user.isBlocked) ||
      (statusFilter === 'blocked' && user.isBlocked);

    const matchesOrders = 
      orderFilter === 'all' ||
      (orderFilter === 'has_orders' && (user.totalOrders || 0) > 0) ||
      (orderFilter === 'no_orders' && (user.totalOrders || 0) === 0);

    return matchesSearch && matchesStatus && matchesOrders;
  });

  return (
    <PageWrapper>
      {/* 🖥️ DESKTOP VIEW (Large screens) */}
      <div className="hidden lg:block max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso capitalize">
              Customer Management
            </h1>
            <p className="text-warm-sand text-sm md:text-base">
              Manage your registered retail customers and business partners.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="px-4 py-2 bg-white rounded-xl border border-soft-oatmeal shadow-sm flex flex-col">
              <span className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Total Accounts</span>
              <span className="text-lg font-bold text-deep-espresso">{totalResults}</span>
            </div>
            <div className="px-4 py-2 bg-white rounded-xl border border-soft-oatmeal shadow-sm flex flex-col">
              <span className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Active (this page)</span>
              <span className="text-lg font-bold text-deep-espresso">{users.filter(u => !u.isBlocked).length}</span>
            </div>
            <div className="px-4 py-2 bg-white rounded-xl border border-soft-oatmeal shadow-sm flex flex-col">
              <span className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Blocked (this page)</span>
              <span className="text-lg font-bold text-red-600">{users.filter(u => u.isBlocked).length}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-soft-oatmeal">
          <button
            onClick={() => setCurrentTab('customer')}
            className={`px-6 py-3 font-bold uppercase tracking-widest text-xs border-b-2 transition-all ${currentTab === 'customer' ? 'border-deep-espresso text-deep-espresso' : 'border-transparent text-warm-sand hover:text-deep-espresso'}`}
          >
            Individual Customers
          </button>
          <button
            onClick={() => setCurrentTab('enterpriser')}
            className={`px-6 py-3 font-bold uppercase tracking-widest text-xs border-b-2 transition-all ${currentTab === 'enterpriser' ? 'border-deep-espresso text-deep-espresso' : 'border-transparent text-warm-sand hover:text-deep-espresso'}`}
          >
            Enterprise Users
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-3 md:p-4 rounded-2xl border border-soft-oatmeal shadow-sm flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="relative flex-grow">
            <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email, or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all text-sm font-bold"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 border px-6 py-3 md:py-0 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              showFilters ? 'bg-deep-espresso text-white border-deep-espresso' : 'border-soft-oatmeal text-deep-espresso hover:bg-soft-oatmeal/20'
            }`}
          >
            <LuFilter size={16} />
            Filters
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="bg-white p-5 rounded-2xl border border-soft-oatmeal shadow-md animate-in slide-in-from-top-4 duration-300 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest block">Account Status</label>
              <div className="flex gap-2">
                {['all', 'active', 'blocked'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
                      statusFilter === status
                        ? 'bg-deep-espresso text-white border-deep-espresso shadow-sm'
                        : 'bg-white text-deep-espresso border-soft-oatmeal hover:bg-soft-oatmeal/10'
                    }`}
                  >
                    {status === 'all' ? 'All Accounts' : status === 'active' ? 'Active Only' : 'Blocked Only'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest block">Order Volume</label>
              <div className="flex gap-2">
                {['all', 'has_orders', 'no_orders'].map((ord) => (
                  <button
                    key={ord}
                    onClick={() => setOrderFilter(ord)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
                      orderFilter === ord
                        ? 'bg-deep-espresso text-white border-deep-espresso shadow-sm'
                        : 'bg-white text-deep-espresso border-soft-oatmeal hover:bg-soft-oatmeal/10'
                    }`}
                  >
                    {ord === 'all' ? 'All' : ord === 'has_orders' ? 'Has Orders' : 'No Purchase History'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Table View */}
        <div className="bg-white rounded-3xl border border-soft-oatmeal shadow-md min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-warm-sand border-t-deep-espresso rounded-full animate-spin"></div>
              <p className="text-xs font-black text-warm-sand uppercase tracking-widest">Fetching Accounts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-16 h-16 bg-soft-oatmeal/30 rounded-3xl flex items-center justify-center text-warm-sand mb-4">
                <LuUser size={32} />
              </div>
              <h3 className="text-xl font-bold text-deep-espresso">No {currentTab === 'customer' ? 'Customers' : 'Enterprise Users'} Found</h3>
              <p className="text-warm-sand text-sm mt-1">Try adjusting search criteria or toggling filters.</p>
            </div>
          ) : (
            <div className="overflow-x-visible">
              <table className="w-full text-left border-collapse">
                <thead className="bg-soft-oatmeal/20 border-b border-soft-oatmeal">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-warm-sand uppercase tracking-widest">Account Details</th>
                    {currentTab === 'enterpriser' && (
                      <th className="px-6 py-5 text-[10px] font-black text-warm-sand uppercase tracking-widest">Business Info</th>
                    )}
                    <th className="px-6 py-5 text-[10px] font-black text-warm-sand uppercase tracking-widest">Contact</th>
                    <th className="px-6 py-5 text-[10px] font-black text-warm-sand uppercase tracking-widest">Orders</th>
                    <th className="px-6 py-5 text-[10px] font-black text-warm-sand uppercase tracking-widest">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-warm-sand uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-soft-oatmeal/50">
                  {filteredUsers.map((user, index) => (
                    <tr key={user._id} className="hover:bg-soft-oatmeal/5 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setSelectedUserDetail(user)}
                            className={`w-12 h-12 rounded-2xl ${user.isBlocked ? 'bg-red-100 text-red-750' : currentTab === 'enterpriser' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} flex items-center justify-center font-bold text-lg hover:scale-105 transition-transform active:scale-95`}
                          >
                            {user.fullName[0].toUpperCase()}
                          </button>
                          <div>
                            <p 
                              onClick={() => setSelectedUserDetail(user)}
                              className="font-bold text-deep-espresso leading-tight cursor-pointer hover:underline"
                            >
                              {user.fullName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                               <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${currentTab === 'enterpriser' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {currentTab === 'customer' ? 'Individual' : 'Enterprise'}
                               </span>
                               <span className="text-[9px] text-warm-sand font-medium">#{user._id.slice(-6).toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      {currentTab === 'enterpriser' && (
                        <td className="px-6 py-5">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm font-bold text-deep-espresso">
                              <LuBuilding2 size={14} className="text-warm-sand" />
                              {user.businessDetails?.shopName || 'N/A'}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                              <LuClipboardCheck size={12} />
                              GST: {user.businessDetails?.gstNumber || 'PENDING'}
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-5">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-deep-espresso/70">
                            <LuMail size={14} className="text-warm-sand" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-xs font-bold text-deep-espresso/70">
                              <LuPhone size={14} className="text-warm-sand" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-soft-oatmeal/20 rounded-lg flex items-center justify-center text-warm-sand">
                               <LuShoppingBag size={14} />
                            </div>
                            <span className="text-sm font-bold text-deep-espresso">{user.totalOrders || 0}</span>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         {user.isBlocked ? (
                           <span className="flex items-center gap-1.5 text-[10px] font-black text-red-650 bg-red-50 border border-red-200/50 px-2 py-0.5 rounded-full w-max">
                              <LuShieldAlert size={12} /> Blocked
                           </span>
                         ) : (
                           <span className="flex items-center gap-1.5 text-[10px] font-black text-green-700 bg-green-50 border border-green-200/50 px-2 py-0.5 rounded-full w-max">
                              <LuShieldCheck size={12} /> Active
                           </span>
                         )}
                         <p className="text-[9px] text-warm-sand mt-0.5">
                           Since {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                         </p>
                      </td>
                      <td className="px-6 py-5 text-right relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === user._id ? null : user._id)}
                          className="p-2.5 text-warm-sand hover:text-deep-espresso hover:bg-soft-oatmeal rounded-xl transition-all"
                        >
                          <FiMoreVertical size={18} />
                        </button>
 
                        {activeMenu === user._id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)}></div>
                            <div className={`absolute right-6 ${index >= filteredUsers.length - 2 && filteredUsers.length > 2 ? 'bottom-full mb-2 origin-bottom' : 'top-16 origin-top'} w-48 bg-white rounded-2xl shadow-2xl border border-soft-oatmeal py-2 z-20 overflow-hidden animate-in fade-in zoom-in duration-200 text-left`}>
                              <button 
                                onClick={() => setSelectedUserDetail(user)}
                                className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-deep-espresso hover:bg-soft-oatmeal transition-colors flex items-center gap-3"
                              >
                                View Details
                              </button>
                              <button 
                                onClick={() => navigate(`/admin/orders/all?search=${user.fullName}`)}
                                className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-deep-espresso hover:bg-soft-oatmeal transition-colors flex items-center gap-3"
                              >
                                View Orders
                              </button>
                              <button 
                                onClick={() => toggleBlock(user)}
                                className={`w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest ${user.isBlocked ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'} transition-colors flex items-center gap-3`}
                              >
                                {user.isBlocked ? 'Unblock User' : 'Block User'}
                              </button>
                              <div className="h-px bg-soft-oatmeal my-1 mx-2"></div>
                              <button 
                                onClick={() => handleDelete(user._id)}
                                className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-red-650 hover:bg-red-50 transition-colors flex items-center gap-3"
                              >
                                Delete Account
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && totalResults > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-soft-oatmeal">
              <span className="text-xs font-bold text-warm-sand">
                Page {page} of {totalPages} &middot; {totalResults} total {currentTab === 'customer' ? 'customers' : 'enterprise users'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-soft-oatmeal text-xs font-bold text-deep-espresso disabled:opacity-40 disabled:cursor-not-allowed hover:bg-soft-oatmeal/20 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-soft-oatmeal text-xs font-bold text-deep-espresso disabled:opacity-40 disabled:cursor-not-allowed hover:bg-soft-oatmeal/20 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 📱 MOBILE VIEW: Customer Directory */}
      <div className="block lg:hidden w-full max-w-2xl mx-auto bg-[#FAFAFA] min-h-[85vh] md:rounded-3xl md:border md:border-soft-oatmeal md:shadow-md overflow-hidden flex flex-col font-sans">
        {/* Mobile Header */}
        <div className="bg-white text-deep-espresso px-5 pt-6 pb-4 border-b border-soft-oatmeal flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black uppercase tracking-wider text-deep-espresso">
              Customer Management
            </h1>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest bg-soft-oatmeal text-warm-sand px-2.5 py-1 rounded-lg border border-soft-oatmeal/50">Admin</span>
        </div>
        
        {/* Mobile Tabs */}
        <div className="flex bg-white border-b border-soft-oatmeal rounded-b-[24px]">
          <button
            onClick={() => setCurrentTab('customer')}
            className={`flex-1 py-3 font-bold uppercase tracking-widest text-[10px] border-b-2 transition-all ${currentTab === 'customer' ? 'border-deep-espresso text-deep-espresso' : 'border-transparent text-warm-sand'}`}
          >
            Individual
          </button>
          <button
            onClick={() => setCurrentTab('enterpriser')}
            className={`flex-1 py-3 font-bold uppercase tracking-widest text-[10px] border-b-2 transition-all ${currentTab === 'enterpriser' ? 'border-deep-espresso text-deep-espresso' : 'border-transparent text-warm-sand'}`}
          >
            Enterprise
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search by name, email or phone..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3.5 rounded-xl border flex items-center gap-1 text-xs font-bold transition-all ${
                showFilters ? 'bg-deep-espresso text-white border-deep-espresso shadow-md' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <LuFilter size={14} /> Filters
            </button>
          </div>

          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-inner space-y-3 animate-in slide-in-from-top duration-200">
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Status</span>
                <div className="flex gap-1.5">
                  {['all', 'active', 'blocked'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                        statusFilter === status ? 'bg-deep-espresso text-white border-deep-espresso' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Orders</span>
                <div className="flex gap-1.5">
                  {['all', 'has_orders', 'no_orders'].map((ord) => (
                    <button
                      key={ord}
                      onClick={() => setOrderFilter(ord)}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                        orderFilter === ord ? 'bg-deep-espresso text-white border-deep-espresso' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {ord === 'all' ? 'all' : ord === 'has_orders' ? 'purchased' : 'inactive'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Directory Feed */}
        <div className="p-4 space-y-4 flex-grow overflow-y-auto pb-20">
          {loading ? (
            <div className="py-20 text-center animate-pulse text-warm-sand font-bold uppercase tracking-widest text-xs">Fetching Accounts...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-100 text-center space-y-2">
              <p className="font-bold text-slate-800 text-sm">No Accounts Found</p>
              <p className="text-slate-400 text-xs font-semibold">Try adjusting search or status criteria.</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user._id} className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-soft-oatmeal/30 px-4 py-2 border-b border-soft-oatmeal flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    ID #{user._id.slice(-6).toUpperCase()}
                  </span>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    user.isBlocked ? 'text-red-700 bg-red-50 border-red-100' : 'text-emerald-700 bg-emerald-50 border-emerald-100'
                  }`}>
                    {user.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </div>

                <div className="p-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedUserDetail(user)}
                      className={`w-11 h-11 rounded-xl ${user.isBlocked ? 'bg-red-100 text-red-750' : currentTab === 'enterpriser' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} flex items-center justify-center font-bold text-sm shrink-0`}
                    >
                      {user.fullName[0].toUpperCase()}
                    </button>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 leading-none">{user.fullName}</h4>
                      <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase tracking-wider truncate max-w-[170px]">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-1.5">
                    <LuShoppingBag size={12} className="text-slate-400" />
                    <span className="text-xs font-black text-slate-800">{user.totalOrders || 0} orders</span>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-1 flex gap-2">
                  <button 
                    onClick={() => setSelectedUserDetail(user)}
                    className="flex-grow py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-650 transition-colors text-center"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => toggleBlock(user)}
                    className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-colors ${
                      user.isBlocked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {user.isBlocked ? 'Activate' : 'Block'}
                  </button>
                </div>
              </div>
            ))
          )}
          {!loading && totalResults > 0 && (
            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="flex-1 py-2.5 rounded-xl border border-soft-oatmeal text-[9px] font-black uppercase tracking-widest text-deep-espresso disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-[9px] font-black text-warm-sand uppercase tracking-widest shrink-0">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="flex-1 py-2.5 rounded-xl border border-soft-oatmeal text-[9px] font-black uppercase tracking-widest text-deep-espresso disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Slide-over User Details Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div className="absolute inset-0 bg-deep-espresso/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" onClick={() => setSelectedUserDetail(null)}></div>
          
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-soft-oatmeal flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-deep-espresso uppercase tracking-wide">Account Portfolio</h2>
                <p className="text-[10px] font-black text-warm-sand uppercase tracking-widest mt-0.5">ID: #{selectedUserDetail._id.toUpperCase()}</p>
              </div>
              <button 
                onClick={() => setSelectedUserDetail(null)}
                className="p-2 hover:bg-soft-oatmeal/50 text-deep-espresso rounded-xl transition-colors"
              >
                <LuX size={20} />
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile Card Summary */}
              <div className="flex items-center gap-4 bg-soft-oatmeal/10 p-4 rounded-2xl border border-soft-oatmeal/50">
                <div className={`w-14 h-14 rounded-2xl ${selectedUserDetail.isBlocked ? 'bg-red-100 text-red-750' : currentTab === 'enterpriser' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} flex items-center justify-center font-bold text-xl`}>
                  {selectedUserDetail.fullName[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-deep-espresso text-base leading-none">{selectedUserDetail.fullName}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                      selectedUserDetail.isBlocked
                        ? 'text-red-750 bg-red-50 border-red-200'
                        : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    }`}>
                      {selectedUserDetail.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      {currentTab === 'customer' ? 'Customer' : 'Enterprise'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Details List */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-warm-sand uppercase tracking-widest pb-1 border-b border-soft-oatmeal">Contact Profile Info</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-warm-sand uppercase tracking-wider text-[9px]">Email Address</span>
                    <span className="text-deep-espresso select-all">{selectedUserDetail.email}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-warm-sand uppercase tracking-wider text-[9px]">Phone Number</span>
                    <span className="text-deep-espresso">{selectedUserDetail.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-warm-sand uppercase tracking-wider text-[9px]">Joined Date</span>
                    <span className="text-deep-espresso">
                      {new Date(selectedUserDetail.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {currentTab === 'enterpriser' && (
                    <>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-warm-sand uppercase tracking-wider text-[9px]">Store Name</span>
                        <span className="text-deep-espresso">{selectedUserDetail.businessDetails?.shopName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-warm-sand uppercase tracking-wider text-[9px]">GST Number</span>
                        <span className="text-deep-espresso font-mono">{selectedUserDetail.businessDetails?.gstNumber || 'PENDING'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Customer Orders Timeline List */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-warm-sand uppercase tracking-widest pb-1 border-b border-soft-oatmeal">Fulfillment Purchases Log</h4>
                
                {loadingOrders ? (
                  <div className="py-8 text-center text-xs font-black uppercase tracking-widest text-warm-sand animate-pulse">
                    Retrieving Transaction Logs...
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="py-8 text-center text-xs font-semibold text-slate-400 italic">
                    No matching purchases found for this client.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {userOrders.map((ord) => (
                      <div key={ord._id} className="p-3 bg-slate-50 border border-slate-100 hover:bg-slate-100/50 rounded-xl transition-colors flex justify-between items-center">
                        <div>
                          <p className="text-xs font-black text-slate-800 leading-none">Order #{ord._id.slice(-8).toUpperCase()}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase tracking-wider">
                            {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-800 block">₹{(ord.totalPrice || 0).toLocaleString('en-IN')}</span>
                          <span className={`inline-block text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-1 border ${
                            ord.status === 'Delivered'
                              ? 'text-green-700 bg-green-50 border-green-200'
                              : ord.status === 'Cancelled'
                              ? 'text-red-700 bg-red-50 border-red-200'
                              : 'text-amber-700 bg-amber-50 border-amber-200'
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Sticky Footer Actions */}
            <div className="p-6 border-t border-soft-oatmeal bg-slate-50 flex gap-3">
              <button
                onClick={() => toggleBlock(selectedUserDetail)}
                className={`flex-grow py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center border transition-all ${
                  selectedUserDetail.isBlocked
                    ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                    : 'bg-amber-600 border-amber-600 text-white hover:bg-amber-700 shadow-md'
                }`}
              >
                {selectedUserDetail.isBlocked ? 'Activate Account' : 'Block Account'}
              </button>
              <button
                onClick={() => handleDelete(selectedUserDetail._id)}
                className="px-5 py-3 bg-red-100 hover:bg-red-200 border border-red-200 text-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors text-center"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default ManageUserPage;
