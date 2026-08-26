import React, { useState, useEffect } from 'react';
import { FiDownload, FiSearch, FiTrash2, FiUsers, FiX, FiCheckCircle, FiXCircle, FiSend, FiClock } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';

const ASSIGNMENT_STATUS_STYLE = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200'
};

// Assign sellers to a bulk order (direct product match or category match), review their
// responses, and pick one accepted response to send to the customer as the final offer.
const SellerAssignmentModal = ({ order, onClose, onOrderUpdated }) => {
  const [suggested, setSuggested] = useState([]);
  const [loadingSuggested, setLoadingSuggested] = useState(true);
  const [selectedSellerIds, setSelectedSellerIds] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [sendingOfferId, setSendingOfferId] = useState(null);

  useEffect(() => {
    fetchSuggested();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order._id]);

  const fetchSuggested = async () => {
    try {
      setLoadingSuggested(true);
      const res = await api.get(`/bulk-orders/${order._id}/suggested-sellers`);
      setSuggested(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch suggested sellers:', err);
      toast.error('Failed to load suggested sellers.');
    } finally {
      setLoadingSuggested(false);
    }
  };

  const toggleSeller = (id) => {
    setSelectedSellerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAssign = async () => {
    if (selectedSellerIds.length === 0) return;
    try {
      setAssigning(true);
      const res = await api.post(`/bulk-orders/${order._id}/assign`, { sellerIds: selectedSellerIds });
      toast.success(`Assigned to ${selectedSellerIds.length} seller(s).`);
      onOrderUpdated(res.data.data);
      setSelectedSellerIds([]);
      fetchSuggested();
    } catch (err) {
      console.error('Failed to assign sellers:', err);
      toast.error(err.response?.data?.message || 'Failed to assign sellers.');
    } finally {
      setAssigning(false);
    }
  };

  const handleSendOffer = async (assignmentId) => {
    try {
      setSendingOfferId(assignmentId);
      const res = await api.post(`/bulk-orders/${order._id}/send-offer`, { assignmentId });
      toast.success('Offer emailed to the customer.');
      onOrderUpdated(res.data.data);
    } catch (err) {
      console.error('Failed to send offer:', err);
      toast.error(err.response?.data?.message || 'Failed to send offer.');
    } finally {
      setSendingOfferId(null);
    }
  };

  const assignments = order.assignments || [];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Seller Assignment — {order.name}</h2>
            <p className="text-xs text-gray-400">Assign to matching sellers, review their responses, and send the final offer.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <FiX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Existing assignments & responses */}
          {assignments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Assigned Sellers ({assignments.length})</h3>
              <div className="space-y-2">
                {assignments.map((a) => (
                  <div key={a._id} className="border border-gray-150 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {a.seller?.shopName || a.seller?.fullName || 'Seller'}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate capitalize">
                        {a.seller?.shopName && a.seller?.fullName ? `${a.seller.fullName} · ` : ''}{a.matchType} match
                      </p>
                      {a.status === 'accepted' && (
                        <p className="text-[11px] text-gray-600 mt-1">
                          Qty: <span className="font-bold">{a.availableQuantity}</span> · Rs. <span className="font-bold">{a.unitPrice}</span>/unit · ETA: <span className="font-bold">{a.deliveryEstimate}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold rounded-full px-2.5 py-1 border capitalize flex items-center gap-1 ${ASSIGNMENT_STATUS_STYLE[a.status] || ASSIGNMENT_STATUS_STYLE.pending}`}>
                        {a.status === 'accepted' ? <FiCheckCircle size={11} /> : a.status === 'rejected' ? <FiXCircle size={11} /> : <FiClock size={11} />}
                        {a.status}
                      </span>
                      {a.status === 'accepted' && String(order.finalAssignment) !== String(a._id) && (
                        <button
                          onClick={() => handleSendOffer(a._id)}
                          disabled={sendingOfferId === a._id}
                          className="text-[10px] font-bold bg-[#189D91] text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-[#14847a] disabled:opacity-50"
                        >
                          <FiSend size={11} /> {sendingOfferId === a._id ? 'Sending...' : 'Send Offer'}
                        </button>
                      )}
                      {String(order.finalAssignment) === String(a._id) && (
                        <span className="text-[10px] font-bold text-[#189D91]">Offer Sent ✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested sellers to assign */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Suggested Sellers {order.items.every(i => i.product) ? '(direct product match)' : '(product + category match)'}
            </h3>
            {loadingSuggested ? (
              <p className="text-xs text-gray-400 py-4">Loading suggestions...</p>
            ) : suggested.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">No unassigned matching sellers found. Sellers need to select relevant categories at signup/profile, or already sell the requested products.</p>
            ) : (
              <div className="space-y-2">
                {suggested.map((s) => {
                  const isSelected = selectedSellerIds.includes(s._id);
                  return (
                    <label
                      key={s._id}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-[#189D91] bg-[#189D91]/5' : 'border-gray-150 hover:border-gray-250'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSeller(s._id)} className="accent-[#189D91]" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {s.shopName || s.fullName || 'Seller'}
                          </p>
                          {s.shopName && s.fullName && (
                            <p className="text-[11px] text-gray-500 truncate">{s.fullName}</p>
                          )}
                          <p className="text-[11px] text-gray-400 truncate">
                            {(s.sellingCategories || []).map(c => c.name).join(', ') || 'No categories set'}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0 ${s.matchType === 'product' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                        {s.matchType === 'product' ? 'Product Match' : 'Category Match'}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex justify-end">
          <button
            onClick={handleAssign}
            disabled={selectedSellerIds.length === 0 || assigning}
            className="bg-[#189D91] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#14847a] disabled:opacity-40"
          >
            <FiUsers size={14} /> {assigning ? 'Assigning...' : `Assign ${selectedSellerIds.length || ''} Seller${selectedSellerIds.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

const BulkOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [assigningOrder, setAssigningOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bulk-orders');
      setOrders(res.data.data);
    } catch (err) {
      console.error('Failed to fetch bulk orders:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch bulk orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      await api.put(`/bulk-orders/${id}`, { status: newStatus });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = (id, name) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1 text-left">
        <p className="text-sm font-bold text-gray-800">
          Delete inquiry from "{name}"?
        </p>
        <div className="flex justify-end gap-2 mt-1">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                setDeletingId(id);
                await api.delete(`/bulk-orders/${id}`);
                setOrders(prev => prev.filter(o => o._id !== id));
                toast.success('Bulk order inquiry deleted successfully.');
              } catch (err) {
                console.error('Failed to delete bulk order:', err);
                toast.error(err.response?.data?.message || 'Failed to delete inquiry.');
              } finally {
                setDeletingId(null);
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
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

  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    const dataToExport = orders.map(order => ({
      'Date': new Date(order.createdAt).toLocaleDateString(),
      'Customer Name': order.name,
      'Phone Number': order.phone,
      'Email Address': order.email,
      'Products': order.items.map(i => `${i.name} (Qty: ${i.quantity})`).join(', '),
      'Message': order.message,
      'Status': order.status
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bulk Orders");
    XLSX.writeFile(wb, `Bulk_Orders_${new Date().toLocaleDateString()}.xlsx`);
  };

  const filteredOrders = orders.filter(order =>
    order.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOrderUpdated = (updatedOrder) => {
    setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    setAssigningOrder(updatedOrder);
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bulk Orders</h1>
            <p className="text-sm text-gray-500">Manage all bulk order inquiries from one place.</p>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-200 rounded-lg py-2 pl-10 pr-4 text-sm w-64 focus:outline-none focus:border-purple-500"
                />
             </div>
             <button
               onClick={exportToExcel}
               className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-purple-700 transition-colors"
             >
               <FiDownload /> Export to Excel
             </button>
          </div>
        </div>

        {loading ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 h-10 w-full animate-pulse"></div>
            {[1, 2, 3].map((n) => (
              <div key={n} className="border-b border-gray-100 p-4 space-y-2 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                <div className="h-3 bg-gray-100 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[1100px]">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Phone Number</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Products</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Sellers</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const assignments = order.assignments || [];
                  const acceptedCount = assignments.filter(a => a.status === 'accepted').length;
                  return (
                    <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600 align-top whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 align-top">{order.name}</td>
                      <td className="px-4 py-3 text-gray-600 align-top whitespace-nowrap">{order.phone}</td>
                      <td className="px-4 py-3 text-gray-600 align-top">{order.email}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="max-w-[220px] max-h-[110px] overflow-y-auto pr-1">
                          {order.items.map((item, i) => (
                            <div key={i} className="text-[11px] text-gray-600 leading-tight mb-1">
                              • {item.name} <span className="text-gray-400">({item.quantity})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="text-gray-500 text-xs max-w-[130px] truncate" title={order.message}>
                          {order.message || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <button
                          onClick={() => setAssigningOrder(order)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-[#189D91] hover:underline whitespace-nowrap"
                        >
                          <FiUsers size={13} />
                          {assignments.length === 0 ? 'Assign Seller' : `${assignments.length} assigned${acceptedCount ? `, ${acceptedCount} accepted` : ''}`}
                        </button>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <select
                          value={order.status}
                          disabled={updatingId === order._id}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className={`text-xs font-bold rounded px-2 py-1 outline-none border cursor-pointer ${
                            order.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            order.status === 'Contacted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            order.status === 'Processing' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            order.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Processing">Processing</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center align-top">
                        <button
                          onClick={() => handleDelete(order._id, order.name)}
                          disabled={deletingId === order._id}
                          className="text-red-500 hover:text-red-700 transition-colors p-1 disabled:opacity-50"
                          title="Delete Inquiry"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-lg text-gray-400">
            No inquiries found.
          </div>
        )}
      </div>

      {assigningOrder && (
        <SellerAssignmentModal
          order={assigningOrder}
          onClose={() => setAssigningOrder(null)}
          onOrderUpdated={handleOrderUpdated}
        />
      )}
    </div>
  );
};

export default BulkOrdersPage;
