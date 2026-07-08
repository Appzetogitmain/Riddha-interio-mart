import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUploadCloud, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const ReturnRequestModal = ({ isOpen, onClose, order, orderItem, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    'Defective or Damaged',
    'Wrong Item Delivered',
    'Missing Parts or Accessories',
    'Item does not match description',
    'Changed Mind',
    'Other'
  ];

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      toast.error('You can upload a maximum of 5 images');
      return;
    }

    const newImages = [...images];
    
    // In a real scenario, you'd upload these to Cloudinary right away and store the URLs.
    // For this demonstration, we'll simulate an upload.
    toast.loading('Uploading images...', { id: 'upload' });
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          newImages.push(res.data.url);
        }
      } catch (err) {
        console.error('Upload error', err);
        toast.error('Failed to upload image');
      }
    }
    
    setImages(newImages);
    toast.success('Images uploaded successfully', { id: 'upload' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/returns', {
        orderId: order._id,
        orderItemId: orderItem._id,
        reason,
        description,
        images
      });

      if (res.data.success) {
        toast.success('Return request submitted successfully');
        onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit return request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
        >
          <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-black font-display text-gray-900">Request Return</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <FiX size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="p-4 md:p-6 overflow-y-auto max-h-[70vh]">
            {/* Item Info */}
            <div className="flex gap-4 p-4 bg-gray-50 rounded-xl mb-6 border border-gray-100">
              <img src={orderItem.image} alt={orderItem.name} className="w-16 h-16 object-cover rounded-lg" />
              <div>
                <p className="font-bold text-gray-900 line-clamp-1">{orderItem.name}</p>
                <p className="text-xs text-gray-500 mt-1">Qty: {orderItem.quantity}</p>
                <p className="text-sm font-black text-gray-900 mt-1">₹{orderItem.price.toLocaleString()}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Reason for Return *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#189D91]/20 focus:border-[#189D91] bg-white transition-all"
                  required
                >
                  <option value="" disabled>Select a reason</option>
                  {reasons.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Detailed Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#189D91]/20 focus:border-[#189D91] transition-all resize-none h-24"
                  placeholder="Please describe the issue in detail..."
                  required
                  maxLength={500}
                ></textarea>
                <p className="text-[10px] text-gray-400 text-right mt-1">{description.length}/500</p>
              </div>

              {/* Images */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Upload Images (Max 5)</label>
                
                <div className="flex flex-wrap gap-3 mb-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                      <img src={img} alt="Upload preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 text-[8px]"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                  
                  {images.length < 5 && (
                    <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:text-[#189D91] hover:border-[#189D91] hover:bg-[#189D91]/5 cursor-pointer transition-all">
                      <FiUploadCloud size={20} />
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        className="hidden" 
                        onChange={handleImageUpload}
                        disabled={images.length >= 5}
                      />
                    </label>
                  )}
                </div>
                
                <div className="flex items-start gap-2 bg-blue-50 text-blue-800 p-3 rounded-lg text-[10px] md:text-xs">
                  <FiAlertCircle className="mt-0.5 shrink-0" />
                  <p>Clear images of the product condition help speed up the return approval process.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full text-sm font-bold text-white bg-[#189D91] hover:bg-[#14847a] disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReturnRequestModal;
