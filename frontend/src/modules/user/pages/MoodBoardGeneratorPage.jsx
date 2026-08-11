import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft, FiRefreshCw, FiShare2,
  FiDownload, FiTrash2, FiClock, FiCheck, FiShoppingCart, FiChevronRight, FiCopy
} from 'react-icons/fi';
import { LuSparkles, LuSofa, LuBed, LuUtensils, LuBath, LuCoffee, LuLaptop, LuPalette } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';
import { useCart } from '../data/CartContext';

const roomTypes = [
  { id: 'Living Room', label: 'Living Room', icon: LuSofa },
  { id: 'Bedroom', label: 'Bedroom', icon: LuBed },
  { id: 'Kitchen', label: 'Modular Kitchen', icon: LuUtensils },
  { id: 'Bathroom', label: 'Bathroom', icon: LuBath },
  { id: 'Dining Room', label: 'Dining Room', icon: LuCoffee },
  { id: 'Home Office', label: 'Home Office', icon: LuLaptop }
];

const designStyles = [
  { id: 'Modern Luxury', label: 'Modern Luxury', desc: 'Sleek marble, warm LED lighting & rich tones' },
  { id: 'Scandinavian', label: 'Scandinavian', desc: 'Minimalist wood, light palette & cozy fabrics' },
  { id: 'Minimalist Japandi', label: 'Minimalist Japandi', desc: 'Zen balance of Japanese & Nordic aesthetics' },
  { id: 'Industrial Loft', label: 'Industrial Loft', desc: 'Exposed brick, metallic accents & raw wood' },
  { id: 'Indian Heritage', label: 'Indian Heritage', desc: 'Carved woods, vibrant accents & royal brass' }
];

const MoodBoardGeneratorPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const boardCanvasRef = useRef(null);

  const [selectedRoom, setSelectedRoom] = useState('Living Room');
  const [selectedStyle, setSelectedStyle] = useState('Modern Luxury');
  const [isGenerating, setIsGenerating] = useState(false);
  const [moodBoard, setMoodBoard] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('riddha_ai_moodboard_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load history:', e);
    }
  }, []);

  // Do not auto-generate on page mount; wait for user to click button

  const handleGenerateBoard = async () => {
    try {
      setIsGenerating(true);
      const res = await api.post('/products/ai-mood-board', {
        roomType: selectedRoom,
        style: selectedStyle
      });

      if (res.data && res.data.moodBoard) {
        const board = res.data.moodBoard;
        setMoodBoard(board);
        toast.success(`Generated ${selectedStyle} ${selectedRoom} Mood Board!`);

        // Save compact lightweight item to history to prevent QuotaExceededError
        const compactBoard = {
          id: board.id,
          title: board.title,
          roomType: board.roomType,
          style: board.style,
          description: board.description,
          bgImage: board.bgImage,
          palette: board.palette,
          createdAt: board.createdAt,
          products: (board.products || []).map(p => ({
            _id: p._id,
            name: p.name,
            price: p.price,
            images: p.images ? [p.images[0]] : []
          }))
        };

        const updatedHistory = [compactBoard, ...history.filter(h => h.id !== board.id)].slice(0, 8);
        setHistory(updatedHistory);
        try {
          localStorage.setItem('riddha_ai_moodboard_history', JSON.stringify(updatedHistory));
        } catch (storageErr) {
          console.warn('[LocalStorage Exceeded] Truncating history array:', storageErr.message);
          const minimalHistory = updatedHistory.slice(0, 3);
          localStorage.setItem('riddha_ai_moodboard_history', JSON.stringify(minimalHistory));
        }
      }
    } catch (err) {
      console.error('Mood board error:', err);
      toast.error('Failed to generate mood board. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyHex = (hex) => {
    navigator.clipboard.writeText(hex);
    toast.success(`Copied color code ${hex}!`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: moodBoard?.title || 'AI Mood Board - Riddha',
        text: `Check out this ${selectedStyle} ${selectedRoom} Mood Board created on Riddha Interior Mart!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Board link copied to clipboard!');
    }
  };

  const handleAddAllToCart = () => {
    if (!moodBoard?.products || moodBoard.products.length === 0) return;
    let count = 0;
    moodBoard.products.forEach((prod) => {
      addToCart(prod, 1);
      count++;
    });
    toast.success(`Added ${count} items from Mood Board to Cart! 🛒`);
    navigate('/cart');
  };

  const handleDeleteHistoryItem = (id, e) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('riddha_ai_moodboard_history', JSON.stringify(updated));
    toast.success('Removed board from history');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#127F75] text-white px-4 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-black tracking-tight flex items-center gap-2">
              <LuPalette className="text-amber-300 animate-pulse" size={18} />
              AI Mood Board Generator
            </h1>
            <p className="text-[10px] text-teal-100 font-semibold">Style Collages & Product Groupings</p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-full text-xs font-bold transition-all border border-white/20"
          >
            <FiClock size={14} />
            <span>Saved ({history.length})</span>
          </button>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-5 space-y-6">

        {/* Customization Options */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-5">
          {/* Select Room Type */}
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#127F75]">
              Step 1: Select Room Type
            </span>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {roomTypes.map((rt) => {
                const IconComp = rt.icon;
                return (
                  <button
                    key={rt.id}
                    onClick={() => setSelectedRoom(rt.id)}
                    className={`p-2.5 rounded-2xl text-center transition-all border flex flex-col items-center gap-1.5 ${
                      selectedRoom === rt.id
                        ? 'bg-[#189D91] text-white border-[#189D91] shadow-md shadow-[#189D91]/20'
                        : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <IconComp size={20} className={selectedRoom === rt.id ? 'text-white' : 'text-[#189D91]'} />
                    <span className="text-[11px] font-bold truncate w-full">{rt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select Design Style */}
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#127F75]">
              Step 2: Select Aesthetic Style
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {designStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 rounded-2xl text-left transition-all border ${
                    selectedStyle === style.id
                      ? 'bg-[#189D91]/10 border-[#189D91] text-[#127F75] ring-2 ring-[#189D91]/20'
                      : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{style.label}</span>
                    {selectedStyle === style.id && <FiCheck className="text-[#189D91]" size={16} />}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">{style.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Action Button */}
          <button
            onClick={handleGenerateBoard}
            disabled={isGenerating}
            className="w-full py-4 bg-gradient-to-r from-[#189D91] to-[#127F75] hover:opacity-95 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-[#189D91]/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <FiRefreshCw className="animate-spin" size={18} />
                <span>Curating AI Mood Board...</span>
              </>
            ) : (
              <>
                <LuSparkles size={18} />
                <span>Generate {selectedStyle} Mood Board</span>
              </>
            )}
          </button>
        </div>

        {/* Generated Mood Board Canvas */}
        {!moodBoard && !isGenerating && (
          <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm text-center space-y-3">
            <div className="w-16 h-16 bg-teal-50 text-[#189D91] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <LuPalette size={32} />
            </div>
            <h3 className="text-base font-black text-slate-800">Customize & Create Your Mood Board</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
              Select your room type and design style above, then tap "Generate Mood Board" to create your customized AI interior concept.
            </p>
          </div>
        )}

        {moodBoard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl space-y-6"
            ref={boardCanvasRef}
          >
            {/* Board Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#189D91] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                  {moodBoard.style} • {moodBoard.roomType}
                </span>
                <h2 className="text-xl font-black text-slate-800 mt-2">{moodBoard.title}</h2>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{moodBoard.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"
                  title="Share Mood Board"
                >
                  <FiShare2 size={16} />
                </button>
              </div>
            </div>

            {/* Section 1: Prominent Big AI Generated Mood Board Concept Image */}
            {moodBoard.bgImage && (
              <div className="relative w-full h-96 md:h-[480px] rounded-3xl overflow-hidden border border-slate-200 shadow-xl group bg-slate-900">
                <img
                  src={moodBoard.bgImage}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt="AI Generated Mood Board"
                />
                <div className="absolute top-4 right-4 bg-[#189D91]/90 backdrop-blur-md text-white text-[10px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-md border border-white/20 flex items-center gap-1.5">
                  <LuSparkles size={12} className="text-amber-300 animate-pulse" />
                  <span>AI Generated Interior Concept</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-300">
                    Aesthetic Inspiration • {moodBoard.style}
                  </span>
                  <h3 className="text-2xl font-black mt-1 leading-tight">{moodBoard.title}</h3>
                  <p className="text-xs text-slate-200 mt-1 max-w-xl font-medium leading-relaxed">{moodBoard.description}</p>
                </div>
              </div>
            )}

            {/* Section 2: Color & Texture Swatches */}
            <div className="space-y-2 pt-2">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#127F75]">
                Color Palette & Material Swatches
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {moodBoard.palette?.map((color, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleCopyHex(color.hex)}
                    className="p-3 bg-slate-50 hover:bg-teal-50/40 rounded-2xl border border-slate-100 transition-all cursor-pointer group flex items-center gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded-xl shadow-md border border-black/10 shrink-0 group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{color.name}</p>
                      <p className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1">
                        {color.hex} <FiCopy size={10} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Curated Store Catalog Products */}
            {moodBoard.products && moodBoard.products.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#127F75]">
                    Curated Catalog Products for this Board
                  </h4>
                  <span className="text-xs font-bold text-slate-400">
                    {moodBoard.products.length} Matching Items
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {moodBoard.products.map((prod) => (
                    <div
                      key={prod._id}
                      onClick={() => navigate(`/products/${prod._id}`)}
                      className="bg-white border border-slate-100 hover:border-[#189D91]/30 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="w-full h-32 bg-slate-50 rounded-xl overflow-hidden mb-2">
                        <img
                          src={prod.images?.[0] || 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=300&q=80'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          alt={prod.name}
                        />
                      </div>
                      <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{prod.name}</h5>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs font-black text-[#189D91]">₹{Number(prod.price).toLocaleString()}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(prod, 1);
                            toast.success(`Added ${prod.name} to cart!`);
                          }}
                          className="p-1.5 bg-[#189D91] hover:bg-[#127F75] text-white rounded-lg transition-colors"
                          title="Add to Cart"
                        >
                          <FiShoppingCart size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 4: 1-Click Buy Whole Board Toolbar */}
            <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center gap-3">
              <button
                onClick={handleAddAllToCart}
                className="w-full md:flex-1 py-3.5 bg-[#189D91] hover:bg-[#127F75] text-white font-black text-xs rounded-2xl transition-all shadow-md shadow-[#189D91]/20 flex items-center justify-center gap-2"
              >
                <FiShoppingCart size={16} />
                <span>Buy Whole Board (Add All {moodBoard.products?.length} Items to Cart)</span>
              </button>
              <button
                onClick={handleGenerateBoard}
                className="w-full md:w-auto px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <FiRefreshCw size={14} />
                <span>Regenerate Variety</span>
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* History Drawer Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex justify-end"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-5 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FiClock className="text-[#189D91]" size={18} />
                  <h3 className="text-base font-black text-slate-800">Saved Mood Boards</h3>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 uppercase"
                >
                  Close
                </button>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <p className="text-sm font-semibold">No saved mood boards yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setMoodBoard(item);
                        setSelectedRoom(item.roomType);
                        setSelectedStyle(item.style);
                        setShowHistoryModal(false);
                      }}
                      className="p-3 bg-slate-50 hover:bg-teal-50/50 rounded-2xl border border-slate-100 transition-all cursor-pointer group flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                        <span className="text-[10px] font-bold text-[#189D91] bg-white px-2 py-0.5 rounded-md border border-slate-100 inline-block mt-1">
                          {item.style} • {item.roomType}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                        className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                        title="Delete from history"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoodBoardGeneratorPage;
