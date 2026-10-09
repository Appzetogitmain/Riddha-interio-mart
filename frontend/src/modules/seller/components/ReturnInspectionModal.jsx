import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUploadCloud, FiCheckCircle, FiPackage, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const ReturnInspectionModal = ({ isOpen, onClose, returnItem, onConfirm, isSubmitting }) => {
  const [images, setImages] = useState([]);
  const [sellerComment, setSellerComment] = useState('');
  const [uploading, setUploading] = useState(false);

  if (!isOpen || !returnItem) return null;

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 3) {
      toast.error('Maximum 3 inspection photos allowed');
      return;
    }
    setUploading(true);
    toast.loading('Uploading photo...', { id: 'ret-upload' });
    const newImages = [...images];
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
        toast.error('Failed to upload image');
      }
    }
    setImages(newImages);
    setUploading(false);
    toast.success('Photo uploaded', { id: 'ret-upload' });
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      comment: sellerComment.trim(),
      images
    });
  };

  const orderId = returnItem.order?._id
    ? String(returnItem.order._id)
    : (typeof returnItem.order === 'string' ? returnItem.order : '');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 font-sans"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-teal-50/40 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#189D91]/10 text-[#189D91] flex items-center justify-center font-bold">
                <FiPackage size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  Confirm Return Receipt
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Verify package arrival & restock to inventory
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Return Item Summary Card */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center gap-3.5">
              <img
                src={returnItem.product?.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200'}
                alt=""
                className="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800 text-sm truncate">
                  {returnItem.product?.name || 'Returned Product'}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span>Order: #{orderId ? orderId.slice(-6).toUpperCase() : 'N/A'}</span>
                  <span>•</span>
                  <span>Customer: {returnItem.user?.fullName || 'Customer'}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                  <span className="font-semibold text-slate-600">Reason:</span>
                  <span className="text-rose-600 font-medium">{returnItem.reason}</span>
                </div>
              </div>
            </div>

            {/* Restock & Refund Notification */}
            <div className="p-3.5 bg-teal-50/60 border border-teal-200/60 rounded-2xl flex items-start gap-3">
              <FiCheckCircle className="text-[#189D91] shrink-0 mt-0.5" size={16} />
              <div className="text-xs text-slate-700 leading-relaxed">
                <p className="font-bold text-slate-900 mb-0.5">Automated Stock & Settlement</p>
                Confirming receipt will automatically credit the product quantity back into your active stock and finalize customer refund.
              </div>
            </div>

            {/* Inspection / Condition Notes (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Inspection Remarks <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={sellerComment}
                onChange={(e) => setSellerComment(e.target.value)}
                placeholder="e.g. Package inspected, item verified in acceptable return condition."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#189D91]/20 focus:border-[#189D91] transition-all resize-none"
              />
            </div>

            {/* Package Photos (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Package Inspection Photos <span className="text-slate-400 font-normal">(Optional, max 3)</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {images.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={img} alt="proof" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                    >
                      <FiX size={10} />
                    </button>
                  </div>
                ))}
                {images.length < 3 && (
                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-600">
                    <FiUploadCloud size={20} />
                    <span className="text-[9px] font-bold mt-1">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploading}
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || uploading}
                className="px-5 py-2.5 bg-[#189D91] hover:bg-[#14847a] text-white rounded-xl text-xs font-bold shadow-md shadow-[#189D91]/20 transition-all flex items-center gap-2 disabled:opacity-60"
              >
                <FiCheckCircle size={15} />
                {isSubmitting ? 'Processing...' : 'Confirm Receipt & Restock'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReturnInspectionModal;
