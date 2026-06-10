import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiStar, FiMessageSquare, FiTrash2, FiSearch, FiDownload,
  FiCheckCircle, FiEye, FiEyeOff, FiChevronDown, FiChevronUp,
  FiRefreshCw, FiFlag
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const FeedbackManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/reviews/admin?limit=100');
      if (data.success) setReviews(data.data);
    } catch (err) {
      toast.error('Failed to fetch platform reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1">
        <p className="text-sm font-bold text-gray-800">Delete this review? This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold">Cancel</button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const { data } = await api.delete(`/reviews/${id}`);
                if (data.success) { toast.success('Review deleted'); fetchReviews(); }
              } catch { toast.error('Failed to delete review'); }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
          >Delete</button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  const handleToggleApproval = async (id, currentStatus) => {
    try {
      const { data } = await api.put(`/reviews/${id}/moderation`, { isApproved: !currentStatus });
      if (data.success) {
        toast.success(`Review ${!currentStatus ? 'approved' : 'hidden'}`);
        fetchReviews();
      }
    } catch { toast.error('Failed to update moderation'); }
  };

  const exportToExcel = async () => {
    if (reviews.length === 0) { toast.error('No reviews to export'); return; }
    const XLSX = await import('xlsx');
    const dataToExport = reviews.map(r => ({
      'Review ID': r._id,
      'Product': r.product?.name || 'Unknown',
      'User': r.user?.fullName || 'Guest',
      'Rating': r.rating,
      'Title': r.title || '',
      'Comment': r.review || '',
      'Status': r.isApproved ? 'Approved' : 'Pending',
      'Helpful': r.helpfulCount || 0,
      'Reports': r.reportCount || 0,
      'Date': r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reviews');
    XLSX.writeFile(wb, `Review_Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Exported successfully');
  };

  const filteredReviews = reviews.filter(r => {
    const matchesSearch =
      (r.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.review || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.user?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = filterRating === 'all' || r.rating.toString() === filterRating;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'approved' ? r.isApproved : !r.isApproved);
    return matchesSearch && matchesRating && matchesStatus;
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';
  const mediaCount = reviews.filter(r => r.images?.length > 0).length;
  const approvedCount = reviews.filter(r => r.isApproved).length;

  const StarRow = ({ rating }) => (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <FiStar key={s} size={11} className={s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
      ))}
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tight text-gray-900">
            Product <span className="text-teal-600">Reviews</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">Platform-wide review oversight</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchReviews} className="p-2 bg-white border border-gray-200 text-gray-500 hover:text-teal-600 rounded-xl transition-all shadow-sm">
            <FiRefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all shadow-sm active:scale-95">
            <FiDownload size={13} /> Export
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Reviews', value: reviews.length, icon: FiCheckCircle, bg: 'bg-teal-50', border: 'border-teal-100', icon_bg: 'bg-teal-600', text: 'text-teal-600' },
          { label: 'Platform Avg', value: avgRating, icon: FiStar, bg: 'bg-amber-50', border: 'border-amber-100', icon_bg: 'bg-amber-400', text: 'text-amber-600' },
          { label: 'Approved', value: approvedCount, icon: FiEye, bg: 'bg-emerald-50', border: 'border-emerald-100', icon_bg: 'bg-emerald-500', text: 'text-emerald-600' },
          { label: 'With Media', value: mediaCount, icon: FiMessageSquare, bg: 'bg-blue-50', border: 'border-blue-100', icon_bg: 'bg-blue-500', text: 'text-blue-600' },
        ].map(({ label, value, icon: Icon, bg, border, icon_bg, text }) => (
          <div key={label} className={`${bg} ${border} border px-4 py-3 rounded-2xl flex items-center gap-3`}>
            <div className={`w-8 h-8 ${icon_bg} text-white rounded-xl flex items-center justify-center shrink-0`}>
              <Icon size={15} />
            </div>
            <div>
              <p className="text-lg font-black text-gray-900 leading-none">{loading ? '—' : value}</p>
              <p className={`text-[9px] font-black uppercase tracking-widest ${text}`}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search by product, user or comment..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 focus:border-teal-400 rounded-xl py-2 pl-9 pr-3 text-xs font-medium outline-none transition-all"
          />
        </div>
        <select value={filterRating} onChange={e => setFilterRating(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-teal-400">
          <option value="all">All Ratings</option>
          {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-teal-400">
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-400">Product / User</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-400">Rating</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-400">Comment</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-400 hidden md:table-cell">Date</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-400">Status</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50 animate-pulse">
                  <td className="px-4 py-3"><div className="h-8 bg-gray-100 rounded-lg w-36"></div></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-48"></div></td>
                  <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                  <td className="px-4 py-3"><div className="h-5 bg-gray-100 rounded-full w-16"></div></td>
                  <td className="px-4 py-3"><div className="h-7 bg-gray-100 rounded-lg w-16 ml-auto"></div></td>
                </tr>
              ))
            ) : filteredReviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <FiMessageSquare className="mx-auto text-gray-200 mb-3" size={40} />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No reviews found</p>
                </td>
              </tr>
            ) : (
              filteredReviews.map((review, i) => (
                <React.Fragment key={review._id}>
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${expandedId === review._id ? 'bg-teal-50/20' : ''}`}
                  >
                    {/* Product + User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[8px] font-black text-gray-500 shrink-0">
                          #{review._id.slice(-4).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate max-w-[140px]">
                            {review.product?.name || 'Unknown Product'}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium truncate max-w-[140px]">
                            {review.user?.fullName || 'Guest'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <StarRow rating={review.rating} />
                        <span className="text-[9px] font-bold text-gray-400">{review.rating}/5</span>
                      </div>
                    </td>

                    {/* Comment (truncated) */}
                    <td className="px-4 py-3 max-w-[240px]">
                      <p className="text-xs text-gray-600 italic truncate">
                        "{review.review || '—'}"
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {review.images?.length > 0 && (
                          <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md">
                            {review.images.length} photo{review.images.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {review.reportCount > 0 && (
                          <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <FiFlag size={9} /> {review.reportCount}
                          </span>
                        )}
                        {(review.review?.length > 60 || review.images?.length > 0) && (
                          <button
                            onClick={() => setExpandedId(expandedId === review._id ? null : review._id)}
                            className="text-[9px] font-bold text-teal-600 hover:text-teal-800 flex items-center gap-0.5"
                          >
                            {expandedId === review._id ? <><FiChevronUp size={10} />Less</> : <><FiChevronDown size={10} />More</>}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 hidden md:table-cell whitespace-nowrap">
                      <p className="text-[11px] font-semibold text-gray-600">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        review.isApproved
                          ? 'bg-teal-50 text-teal-600 border-teal-100'
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {review.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => handleToggleApproval(review._id, review.isApproved)}
                          className={`p-1.5 rounded-lg transition-all active:scale-95 ${
                            review.isApproved
                              ? 'bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white'
                              : 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white'
                          }`}
                          title={review.isApproved ? 'Hide Review' : 'Approve Review'}
                        >
                          {review.isApproved ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                        </button>
                        <button
                          onClick={() => handleDelete(review._id)}
                          className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all active:scale-95"
                          title="Delete Review"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>

                  {/* Expanded row */}
                  <AnimatePresence>
                    {expandedId === review._id && (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-teal-50/20"
                      >
                        <td colSpan={6} className="px-4 pb-4">
                          <div className="ml-9 space-y-3">
                            {review.title && (
                              <p className="text-xs font-bold text-gray-700">"{review.title}"</p>
                            )}
                            <p className="text-xs text-gray-600 leading-relaxed bg-white p-3 rounded-xl border border-gray-100 italic">
                              "{review.review}"
                            </p>
                            {review.images?.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {review.images.map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    onClick={() => setLightboxImg(img)}
                                    className="w-14 h-14 rounded-xl object-cover border border-white shadow-sm hover:scale-105 transition-transform cursor-pointer"
                                    alt="Review"
                                  />
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-[10px] text-gray-400 font-semibold">
                              {review.helpfulCount > 0 && <span>👍 {review.helpfulCount} helpful</span>}
                              {review.reportCount > 0 && <span className="text-red-400">🚩 {review.reportCount} reports</span>}
                              <span className="md:hidden">
                                {new Date(review.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>

        {/* Footer count */}
        {!loading && filteredReviews.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Showing {filteredReviews.length} of {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </p>
            {(searchTerm || filterRating !== 'all' || filterStatus !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setFilterRating('all'); setFilterStatus('all'); }}
                className="text-[10px] font-bold text-teal-600 hover:text-teal-800 uppercase tracking-wider"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImg(null)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxImg}
              className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl"
              alt="Review image"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeedbackManagement;
