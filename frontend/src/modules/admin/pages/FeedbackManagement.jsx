import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiStar, 
  FiMessageSquare, 
  FiTrash2, 
  FiSearch, 
  FiFilter, 
  FiDownload, 
  FiCheckCircle, 
  FiEye, 
  FiEyeOff 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const FeedbackManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/reviews/admin?limit=100');
      if (data.success) {
        setReviews(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      toast.error('Failed to fetch platform reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1 text-left">
        <p className="text-sm font-bold text-gray-800">
          Are you sure you want to delete this review? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2 mt-1">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const { data } = await api.delete(`/reviews/${id}`);
                if (data.success) {
                  toast.success("Review deleted successfully");
                  fetchReviews();
                }
              } catch (err) {
                console.error(err);
                toast.error("Failed to delete review");
              }
            }}
            className="px-3 py-1 bg-red-800 text-white rounded-lg text-xs font-bold hover:bg-red-900 transition-colors"
          >
            Delete
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

  const handleToggleApproval = async (id, currentStatus) => {
    try {
      const { data } = await api.put(`/reviews/${id}/moderation`, {
        isApproved: !currentStatus
      });
      if (data.success) {
        toast.success(`Review ${!currentStatus ? 'approved' : 'hidden'} successfully`);
        fetchReviews();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update review moderation');
    }
  };

  const exportToExcel = async () => {
    if (reviews.length === 0) {
      toast.error('No reviews available to export.');
      return;
    }
    const XLSX = await import('xlsx');
    const dataToExport = reviews.map(r => ({
      'Review ID': r._id,
      'Product Name': r.product?.name || 'Unknown Product',
      'User Name': r.user?.fullName || 'Guest',
      'Rating': r.rating,
      'Title': r.title || '',
      'Review Text': r.review || '',
      'Status': r.isApproved ? 'Approved' : 'Hidden',
      'Helpful Votes': r.helpfulCount || 0,
      'Report Count': r.reportCount || 0,
      'Date': r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Product Reviews");
    XLSX.writeFile(wb, `Review_Logs_${new Date().toLocaleDateString()}.xlsx`);
    toast.success('Logs exported successfully!');
  };

  const filteredReviews = reviews.filter(r => {
    const productName = r.product?.name || '';
    const comment = r.review || '';
    const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = filterRating === 'all' || r.rating.toString() === filterRating;
    return matchesSearch && matchesRating;
  });

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tight text-gray-900">
            Product <span className="text-teal-600">Reviews</span>
          </h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Platform-wide review oversight</p>
        </div>
        <button 
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all shadow-lg active:scale-95"
        >
          <FiDownload /> Export Logs
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product or comment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 focus:border-teal-500 focus:bg-white rounded-xl py-3 pl-12 pr-4 outline-none text-xs font-bold transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-teal-500"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-teal-50/50 border border-teal-100 p-6 rounded-[32px] flex items-center gap-5">
            <div className="w-12 h-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-100">
               <FiCheckCircle size={24} />
            </div>
            <div>
               <p className="text-2xl font-black text-gray-900">{reviews.length}</p>
               <p className="text-[10px] font-black uppercase tracking-widest text-teal-600">Total Reviews</p>
            </div>
         </div>
         <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-[32px] flex items-center gap-5">
            <div className="w-12 h-12 bg-amber-400 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100">
               <FiStar size={24} />
            </div>
            <div>
               <p className="text-2xl font-black text-gray-900">
                 {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}
               </p>
               <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Platform Avg</p>
            </div>
         </div>
         <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[32px] flex items-center gap-5">
            <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
               <FiMessageSquare size={24} />
            </div>
            <div>
               <p className="text-2xl font-black text-gray-900">{reviews.filter(r => r.images?.length > 0).length}</p>
               <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Media Reviews</p>
            </div>
         </div>
      </div>

      {/* Review Cards */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 animate-pulse">
              <div className="flex-1 space-y-4">
                <div className="h-6 bg-gray-100 rounded w-1/3"></div>
                <div className="h-12 bg-gray-50 rounded"></div>
              </div>
              <div className="md:w-40 h-16 bg-gray-100 rounded"></div>
            </div>
          ))
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white py-24 rounded-[40px] border border-dashed border-gray-200 text-center">
            <FiMessageSquare className="mx-auto text-gray-100 mb-6" size={64} />
            <h3 className="text-lg font-black text-gray-900 uppercase italic">No reviews found</h3>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          filteredReviews.map((review, i) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-all group"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100 font-black text-xs">
                      #{review._id.slice(-4).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900 uppercase tracking-tight">
                        {review.product?.name || 'Unknown Product'}
                      </h4>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                        User: {review.user?.fullName || 'Guest'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <FiStar key={s} size={12} className={`${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600 font-medium leading-relaxed bg-gray-50 p-4 rounded-2xl italic border border-gray-50 group-hover:bg-teal-50/30 group-hover:border-teal-50 transition-all">
                  "{review.review}"
                </p>
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    {review.images.map((img, idx) => (
                      <img key={idx} src={img} className="w-16 h-16 rounded-xl object-cover border border-white shadow-sm hover:scale-105 transition-transform cursor-pointer" alt="Review" />
                    ))}
                  </div>
                )}
              </div>
              <div className="md:w-40 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-6 flex md:flex-col justify-between items-center md:items-end">
                <div className="text-right">
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Submitted On</p>
                  <p className="text-[11px] font-bold text-gray-700">
                    {new Date(review.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                  <button
                    onClick={() => handleToggleApproval(review._id, review.isApproved)}
                    className={`p-3 rounded-2xl transition-all shadow-sm active:scale-95 ${
                      review.isApproved 
                        ? 'bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white' 
                        : 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white'
                    }`}
                    title={review.isApproved ? "Hide Review" : "Approve Review"}
                  >
                    {review.isApproved ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                  </button>

                  <button 
                    onClick={() => handleDelete(review._id)}
                    className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95"
                    title="Delete Review"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedbackManagement;
