import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
import api from "../../../shared/utils/api";
import {
  LuSearch,
  LuFilter,
  LuEye,
  LuPackage,
  LuTruck,
  LuClock,
  LuClipboardList,
  LuUser,
  LuChevronRight,
  LuX,
  LuDownload
} from "react-icons/lu";
import { FiCheckCircle, FiXCircle, FiFlag } from "react-icons/fi";
import { toast } from "react-hot-toast";

const initialOrders = [
  {
    _id: "1",
    orderId: "ORD-1001",
    user: { fullName: "Rohan Sharma" },
    seller: { shopName: "Fresh Mart" },
    totalPrice: 15499,
    status: "Pending",
    createdAt: "2024-04-14",
  },
  {
    _id: "2",
    orderId: "ORD-1002",
    user: { fullName: "Priya Patel" },
    seller: { shopName: "Daily Groceries" },
    totalPrice: 2499,
    status: "Processing",
    createdAt: "2024-04-14",
  },
  {
    _id: "3",
    orderId: "ORD-1003",
    user: { fullName: "Amit Gupta" },
    seller: { shopName: "Premium Foods" },
    totalPrice: 8999,
    status: "Processing",
    createdAt: "2024-04-13",
  },
  {
    _id: "4",
    orderId: "ORD-1004",
    user: { fullName: "Sneha Reddy" },
    seller: { shopName: "Fresh Mart" },
    totalPrice: 12500,
    status: "Shipped",
    createdAt: "2024-04-13",
  },
  {
    _id: "5",
    orderId: "ORD-1005",
    user: { fullName: "Vikram Singh" },
    seller: { shopName: "Daily Groceries" },
    totalPrice: 5600,
    status: "Shipped",
    createdAt: "2024-04-12",
  },
  {
    _id: "6",
    orderId: "ORD-1006",
    user: { fullName: "Anjali Verma" },
    seller: { shopName: "Premium Foods" },
    totalPrice: 3200,
    status: "Delivered",
    createdAt: "2024-04-12",
  },
  {
    _id: "7",
    orderId: "ORD-1007",
    user: { fullName: "Suresh Raina" },
    seller: { shopName: "Fresh Mart" },
    totalPrice: 1200,
    status: "Cancelled",
    createdAt: "2024-04-11",
  },
];

const statusIcons = {
  Pending: LuClock,
  Received: LuClipboardList,
  Processed: LuPackage,
  Shipped: FiFlag,
  "Out For Delivery": LuTruck,
  Delivered: FiCheckCircle,
  Cancelled: FiXCircle,
};

const OrderListPage = ({ specificStatus }) => {
  const { status: urlStatus } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sellerFilter, setSellerFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sellerFilter, paymentFilter, assignmentFilter, activeTab, urlStatus, specificStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/orders');
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryBoys = async () => {
    try {
      const { data } = await api.get('/delivery/available');
      if (data.success) {
        setDeliveryBoys(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch delivery boys:', err);
    }
  };

  const location = useLocation();

  const exportToExcel = async () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders available to export.');
      return;
    }
    try {
      const XLSX = await import('xlsx');
      const dataToExport = filteredOrders.map(order => ({
        'Order ID': order.orderId || (order._id ? `ORD-${order._id.slice(-6).toUpperCase()}` : 'ORD-NEW'),
        'Customer Name': order.user?.fullName || 'Guest User',
        'Seller': order.sellerType === 'Admin' ? 'Riddha Mart' : (order.seller?.shopName || order.seller?.fullName || "Mart Direct"),
        'Total Price (₹)': order.totalPrice || 0,
        'Payment Method': order.paymentMethod || 'Online',
        'Status': order.status || 'Pending',
        'Date': order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Just now'
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orders");
      XLSX.writeFile(wb, `Admin_Orders_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
      toast.success('Orders report exported successfully!');
    } catch (err) {
      console.error('Failed to export orders:', err);
      toast.error('Failed to export orders report.');
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchDeliveryBoys();
    
    // Read search param from URL
    const searchParams = new URLSearchParams(location.search);
    const search = searchParams.get('search');
    if (search) {
      setSearchTerm(search);
    }
  }, [location.search]);

  const handleAssignClick = (order) => {
    setSelectedOrder(order);
    setIsAssignModalOpen(true);
  };

  const assignDeliveryBoy = async (deliveryBoyId) => {
    if (!selectedOrder) return;
    try {
      setAssignLoading(true);
      const { data } = await api.put(`/orders/${selectedOrder._id}/assign-delivery`, { deliveryBoyId });
      if (data.success) {
        setIsAssignModalOpen(false);
        fetchOrders(); // Refresh list to see updated status if needed
        alert('Delivery boy assigned successfully');
      }
    } catch (err) {
      console.error('Failed to assign delivery boy:', err);
      alert(err.response?.data?.error || 'Failed to assign delivery boy');
    } finally {
      setAssignLoading(false);
    }
  };

  // Normalize status for display
  const currentStatus =
    specificStatus ||
    urlStatus
      ?.split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const customerName = order.user?.fullName || "Guest";
      const orderId = order._id || "";
      const sellerName = order.seller?.shopName || order.seller?.fullName || "";
      const orderPayment = (order.paymentMethod || 'Online').toLowerCase();
      const isAssigned = Boolean(order.deliveryBoy) || (order.deliveryStatus && order.deliveryStatus !== 'None');

      const matchesSearch =
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sellerName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeller =
        sellerFilter === 'all' ||
        (sellerFilter === 'direct' && order.sellerType === 'Admin') ||
        (sellerFilter === 'marketplace' && order.sellerType !== 'Admin');

      const matchesPayment =
        paymentFilter === 'all' ||
        (paymentFilter === 'online' && orderPayment.includes('online')) ||
        (paymentFilter === 'cod' && orderPayment.includes('cod')) ||
        (paymentFilter === 'wallet' && orderPayment.includes('wallet'));

      const matchesAssignment =
        assignmentFilter === 'all' ||
        (assignmentFilter === 'assigned' && isAssigned) ||
        (assignmentFilter === 'unassigned' && !isAssigned);

      const matchesTab = 
        activeTab === 'all' || 
        (activeTab === 'direct' && order.sellerType === 'Admin') ||
        (activeTab === 'marketplace' && order.sellerType !== 'Admin');

      if (!matchesTab || !matchesSeller || !matchesPayment || !matchesAssignment) return false;

      // If viewing "All Orders" page or no specific status required
      if (currentStatus?.toLowerCase().includes('all') || !currentStatus) {
        return matchesSearch;
      }

      return matchesSearch && order.status?.toLowerCase() === currentStatus?.toLowerCase();
    });
  }, [searchTerm, currentStatus, activeTab, orders, sellerFilter, paymentFilter, assignmentFilter]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const hasActiveFilters =
    sellerFilter !== 'all' || paymentFilter !== 'all' || assignmentFilter !== 'all' || searchTerm.trim().length > 0;

  const resetFilters = () => {
    setSearchTerm('');
    setSellerFilter('all');
    setPaymentFilter('all');
    setAssignmentFilter('all');
    setIsFilterOpen(false);
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex border-b border-soft-oatmeal overflow-x-auto bg-white p-2 rounded-t-2xl shadow-sm">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'direct', label: 'Riddha Mart (Direct)' },
            { id: 'marketplace', label: 'Marketplace' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id 
                ? 'border-red-800 text-red-800 font-bold' 
                : 'border-transparent text-warm-sand hover:text-deep-espresso hover:bg-soft-oatmeal/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso">
              {currentStatus || "All Orders"}
            </h1>
            <p className="text-warm-sand text-sm md:text-base">
              Manage and track your customer orders.
            </p>
          </div>
        </div>

        <div className="bg-white p-3 md:p-4 rounded-2xl border border-soft-oatmeal shadow-sm flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="relative flex-grow">
            <LuSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by Order ID or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all text-sm"
            />
          </div>
          <button
            onClick={() => setIsFilterOpen(v => !v)}
            className={`flex items-center justify-center gap-2 px-6 py-3 md:py-0 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border ${
              isFilterOpen || hasActiveFilters
                ? 'border-red-800 bg-red-50 text-red-800'
                : 'border-soft-oatmeal text-deep-espresso hover:bg-soft-oatmeal/20'
            }`}
          >
            <LuFilter size={16} />
            Filters {hasActiveFilters ? '(Active)' : ''}
          </button>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center justify-center gap-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 px-5 py-3 md:py-0 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
            >
              <LuX size={16} />
              Reset
            </button>
          )}
          <button
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 bg-red-800 text-white px-6 py-3.5 md:py-0 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-deep-espresso transition-all shadow-md shadow-red-900/20 active:scale-95 cursor-pointer"
          >
            <LuDownload size={16} />
            Export Report
          </button>
        </div>

        {isFilterOpen && (
          <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-md grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Seller Type</label>
              <select
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none cursor-pointer font-medium"
              >
                <option value="all">All Sellers</option>
                <option value="direct">Riddha Mart / Direct</option>
                <option value="marketplace">Marketplace Sellers</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Payment Method</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none cursor-pointer font-medium"
              >
                <option value="all">All Methods</option>
                <option value="online">Online</option>
                <option value="cod">Cash on Delivery</option>
                <option value="wallet">Wallet / Manual</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Delivery Assignment</label>
              <select
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value)}
                className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none cursor-pointer font-medium"
              >
                <option value="all">All Orders</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-soft-oatmeal shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-soft-oatmeal/20 border-b border-soft-oatmeal">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Order Details
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Seller
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">
                    Total Amount
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
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="w-10 h-10 border-4 border-soft-oatmeal border-t-red-800 rounded-full animate-spin mx-auto" />
                      <p className="text-[10px] font-black text-warm-sand mt-3 uppercase tracking-widest">Accessing Pipeline...</p>
                    </td>
                  </tr>
                ) : paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order) => {
                    const StatusIcon = statusIcons[order.status] || LuClipboardList;
                    const orderDisplayId = order.orderId || (order._id ? `ORD-${order._id.slice(-6).toUpperCase()}` : 'ORD-NEW');
                    
                    return (
                      <tr
                        key={order._id || Math.random()}
                        className="hover:bg-soft-oatmeal/5 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-deep-espresso">
                            {orderDisplayId}
                          </p>
                          <p className="text-[10px] text-warm-sand uppercase tracking-wider font-bold">
                            {order.paymentMethod || 'Online'}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-deep-espresso">
                          {order.user?.fullName || "Guest User"}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-deep-espresso">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs">
                              {order.sellerType === 'Admin' ? 'Riddha Mart' : (order.seller?.shopName || order.seller?.fullName || "Mart Direct")}
                            </span>
                            {order.sellerType === 'Admin' && <span className="text-[9px] text-red-800 font-black uppercase tracking-tighter">Admin Fulfilled</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-black text-deep-espresso text-sm">
                          ₹{order.totalPrice?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <StatusIcon size={14} className="text-warm-sand" />
                             <span className="text-[10px] font-bold uppercase tracking-widest text-deep-espresso/70">
                               {order.status || 'Pending'}
                             </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-deep-espresso/70 font-medium">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Just now'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button
                               onClick={() => handleAssignClick(order)}
                               disabled={order.deliveryBoy || order.deliveryStatus !== 'None'}
                               title={order.deliveryBoy ? "Already Assigned" : "Assign Delivery"}
                               className={`p-2 rounded-lg transition-colors ${
                                 order.deliveryBoy || order.deliveryStatus !== 'None'
                                   ? "text-gray-300 cursor-not-allowed"
                                   : "text-blue-600 hover:bg-blue-50"
                               }`}
                             >
                               <LuTruck size={18} />
                             </button>
                             <button
                               onClick={() => order._id && navigate(`/admin/orders/view/${order._id}`)}
                               className="p-2 text-deep-espresso hover:bg-soft-oatmeal rounded-lg transition-colors"
                             >
                               <LuEye size={18} />
                             </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-24 text-center"
                    >
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 bg-soft-oatmeal/20 rounded-full flex items-center justify-center text-warm-sand/30">
                          <LuPackage size={40} />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-display font-bold text-deep-espresso">No Orders Found</h3>
                          <p className="text-sm text-warm-sand max-w-xs mx-auto">There are currently no orders for the "{currentStatus || 'All'}" status in your database.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-soft-oatmeal/5 border-t border-soft-oatmeal/60 flex-wrap gap-4">
              <p className="text-xs text-warm-sand font-semibold uppercase tracking-wider">
                Showing <span className="font-bold text-deep-espresso">{((currentPage - 1) * itemsPerPage) + 1}</span> to{" "}
                <span className="font-bold text-deep-espresso">
                  {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
                </span>{" "}
                of <span className="font-bold text-deep-espresso">{filteredOrders.length}</span> Orders
              </p>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-soft-oatmeal text-xs font-bold text-deep-espresso hover:bg-soft-oatmeal/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wider"
                >
                  Prev
                </button>
                
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        currentPage === pageNumber
                          ? "bg-red-800 text-white shadow-md shadow-red-800/20"
                          : "border border-soft-oatmeal text-deep-espresso hover:bg-soft-oatmeal/20"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-soft-oatmeal text-xs font-bold text-deep-espresso hover:bg-soft-oatmeal/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wider"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-deep-espresso/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl border border-soft-oatmeal overflow-hidden">
            <div className="p-8 border-b border-soft-oatmeal flex justify-between items-center bg-soft-oatmeal/5">
              <div>
                <h3 className="text-2xl font-display font-bold text-deep-espresso">Assign Delivery Partner</h3>
                <p className="text-xs text-warm-sand font-bold uppercase tracking-widest mt-1">Select available personnel for order assignment</p>
              </div>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="p-3 hover:bg-soft-oatmeal/20 rounded-full transition-all"
              >
                <LuX size={24} className="text-warm-sand" />
              </button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto">
              {selectedOrder && (
                <div className="mb-8 p-6 bg-red-800/5 rounded-2xl border border-red-800/10 flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-800/10 rounded-full flex items-center justify-center text-red-800">
                    <LuPackage size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-red-800 uppercase tracking-widest">Selected Order</p>
                    <p className="text-lg font-bold text-deep-espresso">{selectedOrder.orderId || `ORD-${selectedOrder._id?.slice(-6).toUpperCase()}`}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Available Delivery Partners</h4>
                {deliveryBoys.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-soft-oatmeal rounded-2xl">
                    <LuUser size={40} className="mx-auto text-soft-oatmeal mb-3" />
                    <p className="text-sm text-warm-sand font-bold">No available partners found at the moment.</p>
                  </div>
                ) : (
                  deliveryBoys.map(boy => (
                    <button
                      key={boy._id}
                      disabled={assignLoading}
                      onClick={() => assignDeliveryBoy(boy._id)}
                      className="w-full flex items-center justify-between p-5 bg-white border border-soft-oatmeal rounded-2xl hover:border-red-800 hover:shadow-lg hover:shadow-red-800/5 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-soft-oatmeal/20 rounded-xl flex items-center justify-center text-warm-sand group-hover:bg-red-800/10 group-hover:text-red-800 transition-colors">
                          <LuUser size={24} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-deep-espresso">{boy.fullName}</p>
                          <p className="text-[10px] text-warm-sand font-bold uppercase tracking-wider">{boy.vehicleType} • {boy.phone}</p>
                        </div>
                      </div>
                      <LuChevronRight size={20} className="text-soft-oatmeal group-hover:text-red-800 transition-colors group-hover:translate-x-1" />
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="p-8 bg-soft-oatmeal/5 border-t border-soft-oatmeal">
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest text-warm-sand hover:text-deep-espresso transition-colors font-bold"
              >
                Close & Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default OrderListPage;
