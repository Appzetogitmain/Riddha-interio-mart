import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUploadCloud, FiVideo } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const ProofUploadModal = ({ isOpen, onClose, onSubmit, isPickup }) => {
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    toast.loading('Uploading images...', { id: 'upload' });
    const newImages = [...images];
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data.success) newImages.push(res.data.url);
      } catch (err) {
        toast.error('Failed to upload image');
      }
    }
    setImages(newImages);
    toast.success('Images uploaded', { id: 'upload' });
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    toast.loading('Uploading video...', { id: 'vid_upload' });
    const formData = new FormData();
    try {
      formData.append('image', file); 
      const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        setVideo(res.data.url);
        toast.success('Video uploaded', { id: 'vid_upload' });
      }
    } catch (err) {
      toast.error('Failed to upload video', { id: 'vid_upload' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      toast.error('At least 1 image is required for proof');
      return;
    }
    setIsSubmitting(true);
    await onSubmit({ images, video });
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{isPickup ? 'Pickup Proof' : 'Delivery Proof'}</h2>
            <button onClick={onClose}><FiX size={24} /></button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2">Upload Images (Max 5)</label>
              <div className="flex flex-wrap gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                    <img src={img} alt="proof" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><FiX size={10}/></button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer">
                    <FiUploadCloud size={20} />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>

            {isPickup && (
              <div>
                <label className="block text-sm font-bold mb-2">Upload Video (Optional, Max 1)</label>
                {video ? (
                  <div className="relative w-full h-32 rounded-lg border bg-black">
                    <video src={video} className="w-full h-full object-contain" controls />
                    <button type="button" onClick={() => setVideo(null)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><FiX size={14}/></button>
                  </div>
                ) : (
                  <label className="w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer">
                    <FiVideo size={24} className="mb-2" />
                    <span className="text-sm">Click to upload video</span>
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                  </label>
                )}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-[#189D91] text-white font-bold rounded-xl disabled:opacity-50">
              {isSubmitting ? 'Submitting...' : 'Submit Proof'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProofUploadModal;
