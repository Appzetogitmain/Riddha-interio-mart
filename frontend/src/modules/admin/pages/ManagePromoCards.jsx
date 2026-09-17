import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiSave, FiX, FiCheck } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';
import { uploadImage } from '../../../shared/utils/upload';

const ManagePromoCards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    _id: null,
    title: '',
    items: '',
    btnText: 'Join Now',
    bg: 'bg-[#F4F9F8]',
    textColor: 'text-[#28a399]',
    btnColor: 'text-[#28a399]',
    img: '',
    link: '#',
    isActive: true
  });
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const res = await api.get('/promo-cards');
      if (res.data.success) {
        setCards(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch promo cards');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (card = null) => {
    if (card) {
      setFormData({
        _id: card._id,
        title: card.title,
        items: card.items.join(', '),
        btnText: card.btnText,
        bg: card.bg,
        textColor: card.textColor,
        btnColor: card.btnColor,
        img: card.img,
        link: card.link,
        isActive: card.isActive
      });
    } else {
      setFormData({
        _id: null,
        title: '',
        items: '',
        btnText: 'Join Now',
        bg: 'bg-[#F4F9F8]',
        textColor: 'text-[#28a399]',
        btnColor: 'text-[#28a399]',
        img: '',
        link: '#',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setUploading(true);
      const url = await uploadImage(file);
      if (url) {
        setFormData(prev => ({ ...prev, img: url }));
        toast.success('Image uploaded successfully');
      }
    } catch (err) {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.img) {
      return toast.error('Title and Image are required');
    }

    try {
      setUploading(true);
      const payload = {
        ...formData,
        items: formData.items.split(',').map(i => i.trim()).filter(Boolean)
      };

      if (formData._id) {
        await api.put(`/promo-cards/${formData._id}`, payload);
        toast.success('Card updated successfully');
      } else {
        await api.post('/promo-cards', payload);
        toast.success('Card created successfully');
      }
      setIsModalOpen(false);
      fetchCards();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save card');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this card?')) return;
    try {
      await api.delete(`/promo-cards/${id}`);
      toast.success('Card deleted successfully');
      fetchCards();
    } catch (err) {
      toast.error('Failed to delete card');
    }
  };

  const toggleStatus = async (card) => {
    try {
      await api.put(`/promo-cards/${card._id}`, { isActive: !card.isActive });
      fetchCards();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Manage Promo Cards</h1>
          <p className="text-sm text-gray-500 mt-1">Professional Benefits cards displayed below the main banner.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
        >
          <FiPlus /> Add New Card
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => (
            <div key={card._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              {/* Preview Area */}
              <div className={`${card.bg} p-4 h-[180px] flex items-center justify-between relative`}>
                <div className="z-10 w-[55%]">
                  <h3 className={`text-lg font-black leading-tight ${card.textColor}`}>{card.title}</h3>
                  <ul className="mt-2 space-y-1">
                    {card.items.map((item, i) => (
                      <li key={i} className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                        <span className={`w-1 h-1 rounded-full ${card.textColor} opacity-50`} /> {item}
                      </li>
                    ))}
                  </ul>
                  <div className={`mt-4 px-3 py-1.5 bg-white text-xs font-bold rounded-lg w-fit shadow-sm ${card.btnColor}`}>
                    {card.btnText} →
                  </div>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-[45%] flex items-end justify-end pointer-events-none p-2">
                  <img src={card.img} alt={card.title} className="w-full h-full object-contain object-bottom" />
                </div>
              </div>
              
              {/* Actions Area */}
              <div className="p-4 bg-white flex items-center justify-between border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleStatus(card)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${card.isActive ? 'bg-teal-500' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${card.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <span className="text-xs font-semibold text-gray-500">{card.isActive ? 'Active' : 'Hidden'}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(card)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><FiEdit2 size={16} /></button>
                  <button onClick={() => handleDelete(card._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
          {cards.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              No promo cards found. Click "Add New Card" to create one.
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-lg font-black text-slate-800">{formData._id ? 'Edit Card' : 'Add New Card'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><FiX /></button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <form id="promoForm" onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5 col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-gray-700">Title</label>
                      <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 transition-colors" placeholder="e.g. Contractor Benefits" />
                    </div>
                    <div className="space-y-1.5 col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-gray-700">Button Text</label>
                      <input type="text" required value={formData.btnText} onChange={e => setFormData({...formData, btnText: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 transition-colors" placeholder="e.g. Join Now" />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Bullet Items (comma separated)</label>
                    <input type="text" value={formData.items} onChange={e => setFormData({...formData, items: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 transition-colors" placeholder="e.g. Special Pricing, Bulk Deals" />
                  </div>

                  <div className="grid grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Background Tailwind Class</label>
                      <input type="text" value={formData.bg} onChange={e => setFormData({...formData, bg: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Text Color Class</label>
                      <input type="text" value={formData.textColor} onChange={e => setFormData({...formData, textColor: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Button Text Color</label>
                      <input type="text" value={formData.btnColor} onChange={e => setFormData({...formData, btnColor: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Button Link</label>
                    <input type="text" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 transition-colors" placeholder="/contractor-registration" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">Image Asset</label>
                    <div className="flex gap-4 items-start">
                      {formData.img ? (
                        <div className="relative w-32 h-32 rounded-xl border border-gray-200 overflow-hidden group bg-gray-50 p-2">
                          <img src={formData.img} alt="preview" className="w-full h-full object-contain" />
                          <button type="button" onClick={() => setFormData({...formData, img: ''})} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">Remove</button>
                        </div>
                      ) : (
                        <div onClick={() => fileInputRef.current?.click()} className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-200 hover:border-teal-400 bg-gray-50 flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-teal-500 transition-colors">
                          <FiImage size={24} className="mb-2" />
                          <span className="text-[10px] font-bold">Upload Image</span>
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                        <div className="text-xs text-gray-500">Upload a transparent PNG, WEBP, or a GIF/Lottie animation frame.</div>
                        <input type="text" value={formData.img} onChange={e => setFormData({...formData, img: e.target.value})} placeholder="Or paste image URL here" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500" />
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" form="promoForm" disabled={uploading} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white transition-colors flex items-center gap-2 disabled:opacity-50">
                  {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave />}
                  {formData._id ? 'Update Card' : 'Create Card'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManagePromoCards;
