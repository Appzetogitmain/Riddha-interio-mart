import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiThumbsUp, FiCheckCircle, FiEdit2, FiTrash2, FiMoreVertical } from 'react-icons/fi';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import api from '../../../shared/utils/api';
import { useUser } from '../data/UserContext';
import Button from '../../../shared/components/Button';

const ReviewSection = ({ productId, averageRating = 0, totalReviews = 0 }) => {
  const { user } = useUser();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  const fetchReviews = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${productId}/reviews?page=${pageNum}&limit=5`);
      if (res.data.success) {
        if (pageNum === 1) {
          setReviews(res.data.data);
        } else {
          setReviews(prev => [...prev, ...res.data.data]);
        }
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  const handleLoadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchReviews(nextPage);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await api.delete(`/reviews/${reviewId}`);
      setReviews(prev => prev.filter(r => r._id !== reviewId));
      // In a real app, you might want to refetch product details to update average rating
    } catch (err) {
      alert('Failed to delete review');
    }
  };

  const hasUserReviewed = user && reviews.some(r => r.user?._id === user?._id || r.user === user?._id);

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl border border-soft-oatmeal/20 shadow-sm overflow-hidden p-6 md:p-8">
      {/* Header & Summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-soft-oatmeal/10">
        <div>
          <h2 className="text-2xl font-black text-deep-espresso tracking-tight mb-2 flex items-center gap-2">
            <FiMessageSquare className="text-warm-sand" /> Customer Reviews
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-4xl font-black text-deep-espresso">{averageRating.toFixed(1)}</span>
              <div className="flex flex-col">
                <StarRating rating={averageRating} size={16} />
                <span className="text-xs text-gray-500 font-bold mt-1">Based on {totalReviews} reviews</span>
              </div>
            </div>
          </div>
        </div>

        {user && !hasUserReviewed ? (
          <Button 
            onClick={() => { setEditingReview(null); setShowForm(true); }}
            className="rounded-xl px-6 py-3 font-bold text-sm tracking-widest uppercase bg-[#189D91] hover:bg-[#15877c]"
          >
            Write a Review
          </Button>
        ) : !user ? (
          <p className="text-sm text-gray-500 font-medium">Please login to write a review.</p>
        ) : null}
      </div>

      {/* Reviews List */}
      <div className="py-6 space-y-6">
        {reviews.length === 0 && !loading ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <FiMessageSquare size={24} />
            </div>
            <h3 className="text-gray-900 font-bold mb-1">No reviews yet</h3>
            <p className="text-gray-500 text-sm">Be the first to review this product.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="border-b border-soft-oatmeal/10 last:border-0 pb-6 last:pb-0">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#189D91]/10 rounded-full flex items-center justify-center text-[#189D91] font-black text-sm uppercase">
                    {(review.user?.fullName || review.reviewerName || 'U').charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-deep-espresso">{review.user?.fullName || review.reviewerName || 'Customer'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating rating={review.rating} size={12} />
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Menu */}
                {user && (user.role === 'admin' || user._id === (review.user?._id || review.user)) && (
                  <div className="flex items-center gap-2">
                    {(user._id === (review.user?._id || review.user)) && (
                       <button onClick={() => { setEditingReview(review); setShowForm(true); }} className="p-2 text-gray-400 hover:text-[#189D91] transition-colors"><FiEdit2 size={14} /></button>
                    )}
                    <button onClick={() => handleDelete(review._id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><FiTrash2 size={14} /></button>
                  </div>
                )}
              </div>

              {review.verifiedPurchase && (
                <div className="flex items-center gap-1 text-[10px] font-black text-[#189D91] uppercase tracking-widest mb-2">
                  <FiCheckCircle size={12} /> Verified Purchase
                </div>
              )}

              {review.title && <h4 className="font-bold text-gray-900 text-sm mb-1">{review.title}</h4>}
              <p className="text-gray-600 text-sm leading-relaxed">{review.review}</p>

              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mt-4">
                  {review.images.map((img, idx) => (
                    <img key={idx} src={img} alt="Review" className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity" />
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 border-2 border-gray-200 border-t-[#189D91] rounded-full animate-spin"></div>
          </div>
        )}

        {page < totalPages && !loading && (
          <div className="text-center pt-4">
            <button 
              onClick={handleLoadMore}
              className="text-xs font-black text-[#189D91] uppercase tracking-[0.2em] hover:text-[#15877c] transition-colors"
            >
              Load More Reviews
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <ReviewForm 
            productId={productId} 
            initialData={editingReview}
            onClose={() => setShowForm(false)} 
            onSuccess={() => {
              setShowForm(false);
              setPage(1);
              fetchReviews(1); // Refresh reviews
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewSection;
