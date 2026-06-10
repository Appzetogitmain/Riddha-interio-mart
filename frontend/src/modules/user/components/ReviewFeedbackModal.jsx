import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiStar, FiCamera, FiSend, FiLoader, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const ReviewFeedbackModal = ({ isOpen, onClose, orderId, product, initialData = null, onStatusChange }) => {
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(initialData?.review || initialData?.comment || '');
  const [images, setImages] = useState(initialData?.images || []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    try {
      const { data } = await api.post('/upload/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data.success) {
        setImages([...images, ...data.images]);
        toast.success('Images uploaded successfully');
      }
    } catch (err) {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error('Please select a star rating');
    if (!comment.trim()) return toast.error('Please write a short review');

    setSubmitting(true);
    
    try {
      const payload = {
        rating,
        review: comment,
        title: 'Product Review',
        images
      };

      if (initialData) {
        const idToUpdate = initialData._id || initialData.id;
        await api.put(`/reviews/${idToUpdate}`, payload);
        toast.success('Review updated!');
      } else {
        await api.post(`/products/${product?.product}/reviews`, payload);
        toast.success('Thank you for your feedback!');
      }
      
      onStatusChange();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white rounded-[32px] w-full max-w-[500px] overflow-hidden shadow-2xl flex flex-col relative"
          >
            <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-gray-50 text-gray-400 hover:text-red-500 z-50 transition-all">
              <FiX size={18} />
            </button>

            <div className="bg-[#189D91] p-8 text-white">
              <h2 className="text-xl font-black uppercase italic tracking-tight">
                {initialData ? 'Edit your' : 'Share your'} <span className="text-white/60">Experience</span>
              </h2>
              <p className="text-white/60 text-[9px] font-black uppercase tracking-widest mt-1">Help others make premium choices</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
              {/* Product Mini Info */}
              {product && (
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <img src={product.image} className="w-12 h-12 rounded-lg object-cover shadow-sm" alt={product.name} />
                  <p className="text-xs font-black text-gray-800 uppercase tracking-tight truncate">{product.name}</p>
                </div>
              )}

              {/* Star Rating */}
              <div className="text-center space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rate your purchase</label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="transition-all duration-200 transform hover:scale-125"
                    >
                      <FiStar
                        size={32}
                        className={`${
                          star <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Your Review</label>
                <textarea
                  required
                  rows="4"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the quality? Did it meet your expectations?"
                  className="w-full bg-gray-50 border border-gray-100 focus:border-[#189D91] focus:bg-white rounded-2xl py-4 px-5 outline-none text-xs font-bold transition-all resize-none placeholder:text-gray-300"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Product Photos (Optional)</label>
                <div className="flex flex-wrap gap-3">
                  {images.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden group shadow-sm">
                      <img src={url} className="w-full h-full object-cover" alt="Review" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-100 hover:border-[#189D91] hover:bg-teal-50 flex flex-col items-center justify-center text-gray-300 hover:text-[#189D91] transition-all"
                  >
                    {uploading ? <FiLoader className="animate-spin" /> : <FiCamera size={20} />}
                  </button>
                  <input type="file" multiple ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="absolute opacity-0 w-0 h-0 pointer-events-none" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] py-4 bg-[#189D91] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#14847a] transition-all shadow-lg shadow-[#189D91]/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <FiLoader className="animate-spin" /> : <><FiSend /> {initialData ? 'Update Review' : 'Submit Review'}</>}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReviewFeedbackModal;
