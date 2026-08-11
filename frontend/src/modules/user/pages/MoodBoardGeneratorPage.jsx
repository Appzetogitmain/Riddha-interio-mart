import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft, FiShare2, FiDownload, FiTrash2, FiClock,
  FiCheck, FiShoppingCart, FiChevronRight, FiCopy, FiHeart, FiFileText, FiPlus, FiCheckCircle
} from 'react-icons/fi';
import { LuSparkles, LuPalette } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';
import { useCart } from '../data/CartContext';

// Step 1: Style options with visual cards
const styleCards = [
  { id: 'Modern Luxury', label: 'Modern', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&q=80' },
  { id: 'Minimalist Japandi', label: 'Minimalist', image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500&q=80' },
  { id: 'Scandinavian', label: 'Scandinavian', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80' },
  { id: 'Industrial Loft', label: 'Industrial', image: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=500&q=80' },
  { id: 'Indian Heritage', label: 'Boho Chic', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&q=80' }
];

// Step 2 Options
const colorOptions = [
  { name: 'Cream', hex: '#F5F2E9' },
  { name: 'Beige', hex: '#E2D4C3' },
  { name: 'Warm Taupe', hex: '#B8A692' },
  { name: 'Sage Green', hex: '#7A8B7B' },
  { name: 'Charcoal', hex: '#383D3B' },
  { name: 'Dark Oak', hex: '#241E1A' }
];

const roomTypeOptions = [
  { id: 'Living Room', label: 'Living Room' },
  { id: 'Bedroom', label: 'Bedroom' },
  { id: 'Dining Room', label: 'Dining Room' },
  { id: 'Kitchen', label: 'Kitchen' },
  { id: 'Home Office', label: 'Office' },
  { id: 'Bathroom', label: 'Bathroom' }
];

const budgetOptions = ['₹ 1 - 2 Lakhs', '₹ 2 - 5 Lakhs', '₹ 5 - 10 Lakhs', '₹ 10+ Lakhs'];
const roomSizeOptions = ['500 - 800 sq.ft', '800 - 1200 sq.ft', '1200 - 1800 sq.ft', '1800+ sq.ft'];

const MoodBoardGeneratorPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Wizard state: Step 1 (Style), Step 2 (Preferences), Step 3 (AI Generating Loading), Step 4 (Mood Board Display), Step 5 (Saved Success)
  const [currentStep, setCurrentStep] = useState(1);

  // Form selections
  const [selectedStyle, setSelectedStyle] = useState('Modern Luxury');
  const [selectedColors, setSelectedColors] = useState(['Sage Green']);
  const [selectedRoom, setSelectedRoom] = useState('Living Room');
  const [selectedBudget, setSelectedBudget] = useState('₹ 2 - 5 Lakhs');
  const [selectedSize, setSelectedSize] = useState('1200 - 1800 sq.ft');

  // Loading animation items check list
  const [loadingCheckIndex, setLoadingCheckIndex] = useState(0);

  // Output
  const [moodBoard, setMoodBoard] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('riddha_ai_moodboard_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {}
  }, []);

  // Loading animation step timer
  useEffect(() => {
    if (currentStep === 3) {
      setLoadingCheckIndex(0);
      const timer1 = setTimeout(() => setLoadingCheckIndex(1), 1000);
      const timer2 = setTimeout(() => setLoadingCheckIndex(2), 2200);
      const timer3 = setTimeout(() => setLoadingCheckIndex(3), 3500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [currentStep]);

  const toggleColor = (colorName) => {
    if (selectedColors.includes(colorName)) {
      setSelectedColors(selectedColors.filter(c => c !== colorName));
    } else {
      if (selectedColors.length < 5) {
        setSelectedColors([...selectedColors, colorName]);
      } else {
        toast.error('You can select up to 5 colors');
      }
    }
  };

  const handleStartGeneration = async () => {
    setCurrentStep(3); // Show loading step

    try {
      const res = await api.post('/products/ai-mood-board', {
        roomType: selectedRoom,
        style: selectedStyle,
        budget: selectedBudget,
        roomSize: selectedSize,
        preferredColors: selectedColors
      });

      if (res.data && res.data.moodBoard) {
        const board = res.data.moodBoard;
        setMoodBoard(board);

        // Ensure minimum 4s smooth loading transition
        setTimeout(() => {
          setCurrentStep(4); // Show mood board
          toast.success(`Your AI Mood Board is Ready!`);
        }, 4000);

        // Save to history
        const compactBoard = {
          id: board.id,
          title: board.title,
          roomType: board.roomType,
          style: board.style,
          description: board.description,
          bgImage: board.bgImage,
          secondaryImages: board.secondaryImages,
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
        } catch (e) {}
      }
    } catch (err) {
      console.error('Mood board generation error:', err);
      toast.error('Failed to generate mood board. Retrying...');
      setCurrentStep(2);
    }
  };

  const handleSaveBoard = () => {
    setCurrentStep(5); // Show Saved Success step
    toast.success('Mood Board saved successfully!');
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

  const handleCopyHex = (hex) => {
    navigator.clipboard.writeText(hex);
    toast.success(`Copied color code ${hex}!`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: moodBoard?.title || 'AI Mood Board - Riddha',
        text: `Check out my ${selectedStyle} ${selectedRoom} Mood Board created on Riddha Interior Mart!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Mood Board link copied!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24 font-sans">

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (currentStep > 1 && currentStep !== 3) setCurrentStep(currentStep - 1);
              else navigate('/profile');
            }}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
          >
            <FiArrowLeft size={20} className="text-slate-700" />
          </button>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 flex items-center gap-1.5">
              <LuPalette className="text-orange-500" size={18} />
              AI Mood Board Generator
            </h1>
          </div>
        </div>

        {/* Wizard Progress Indicator */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((stepNum) => (
            <div
              key={stepNum}
              className={`h-2 rounded-full transition-all ${
                currentStep === stepNum
                  ? 'w-6 bg-orange-500'
                  : currentStep > stepNum
                  ? 'w-2 bg-orange-300'
                  : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Main Flow Container - Fully Responsive for Mobile & Desktop */}
      <main className="max-w-xl md:max-w-2xl mx-auto px-4 py-6 md:py-10">

        {/* STEP 1: What Style Do You Love? */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 bg-white md:p-8 md:rounded-3xl md:border md:border-slate-100 md:shadow-xl"
          >
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">What style do you love?</h2>
              <p className="text-xs md:text-sm font-medium text-slate-400 mt-1">Select a style for your custom mood board</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {styleCards.map((card, idx) => {
                const isSelected = selectedStyle === card.id;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedStyle(card.id)}
                    className={`relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-md scale-[1.02]'
                        : 'border-slate-100 hover:border-slate-200 hover:scale-[1.01]'
                    }`}
                  >
                    <div className="w-full h-32 relative">
                      <img src={card.image} className="w-full h-full object-cover" alt={card.label} />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-md">
                          <FiCheck size={14} />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 bg-white text-center">
                      <span className="text-xs font-bold text-slate-800">{card.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentStep(2)}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              <span>Next</span>
              <FiChevronRight size={18} />
            </button>
          </motion.div>
        )}

        {/* STEP 2: Tell Us Your Preferences */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 bg-white md:p-8 md:rounded-3xl md:border md:border-slate-100 md:shadow-xl"
          >
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">Tell us your preferences</h2>
              <p className="text-xs md:text-sm font-medium text-slate-400 mt-1">Help us create a mood board you'll love</p>
            </div>

            {/* Preferred Colors */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Preferred Colors <span className="text-slate-400 font-normal">(Select up to 5 colors)</span></label>
              <div className="flex items-center gap-3">
                {colorOptions.map((col) => {
                  const isChecked = selectedColors.includes(col.name);
                  return (
                    <div
                      key={col.name}
                      onClick={() => toggleColor(col.name)}
                      className={`w-9 h-9 rounded-full cursor-pointer transition-transform flex items-center justify-center border border-black/10 shadow-sm relative ${
                        isChecked ? 'scale-110 ring-2 ring-orange-500 ring-offset-2' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    >
                      {isChecked && (
                        <FiCheck className={['#F5F2E9', '#E2D4C3'].includes(col.hex) ? 'text-slate-900' : 'text-white'} size={16} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Room Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Room Type</label>
              <div className="grid grid-cols-3 gap-2">
                {roomTypeOptions.map((rt) => (
                  <button
                    key={rt.id}
                    onClick={() => setSelectedRoom(rt.id)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      selectedRoom === rt.id
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Range */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Budget Range</label>
              <select
                value={selectedBudget}
                onChange={(e) => setSelectedBudget(e.target.value)}
                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-orange-500 shadow-sm"
              >
                {budgetOptions.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Room Size */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Room Size (approx.)</label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-orange-500 shadow-sm"
              >
                {roomSizeOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleStartGeneration}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              <span>Generate Mood Board</span>
              <FiChevronRight size={18} />
            </button>
          </motion.div>
        )}

        {/* STEP 3: AI Loading Progress Screen */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center py-6"
          >
            <div>
              <h2 className="text-lg font-black text-slate-900">AI is generating your personalized mood board...</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">This may take a few seconds</p>
            </div>

            {/* Loading Collage Mock */}
            <div className="relative w-full h-80 rounded-3xl overflow-hidden border border-slate-100 shadow-xl bg-slate-900 p-2 grid grid-cols-3 gap-1.5">
              <div className="col-span-2 h-full rounded-2xl overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80" className="w-full h-full object-cover opacity-80 animate-pulse" alt="Generating" />
              </div>
              <div className="flex flex-col gap-1.5 h-full">
                <div className="h-1/2 rounded-2xl overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&q=80" className="w-full h-full object-cover opacity-80" alt="Detail" />
                </div>
                <div className="h-1/2 rounded-2xl overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80" className="w-full h-full object-cover opacity-80" alt="Detail" />
                </div>
              </div>
            </div>

            {/* Progress checklist animation */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 text-left space-y-3 shadow-sm">
              <div className="flex items-center gap-3">
                <FiCheckCircle className={loadingCheckIndex >= 0 ? "text-emerald-500" : "text-slate-300"} size={20} />
                <span className="text-xs font-bold text-slate-700">Analyzing your preferences</span>
              </div>
              <div className="flex items-center gap-3">
                <FiCheckCircle className={loadingCheckIndex >= 1 ? "text-emerald-500" : "text-slate-300"} size={20} />
                <span className="text-xs font-bold text-slate-700">Matching style & colors</span>
              </div>
              <div className="flex items-center gap-3">
                <FiCheckCircle className={loadingCheckIndex >= 2 ? "text-emerald-500" : "text-slate-300"} size={20} />
                <span className="text-xs font-bold text-slate-700">Selecting catalog products</span>
              </div>
              <div className="flex items-center gap-3">
                <FiCheckCircle className={loadingCheckIndex >= 3 ? "text-emerald-500 animate-spin" : "text-slate-300"} size={20} />
                <span className="text-xs font-bold text-slate-700">Generating AI mood board</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Your AI Generated Mood Board Result Screen */}
        {currentStep === 4 && moodBoard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Title & Metadata Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Your AI Generated Mood Board</h2>
                <p className="text-xs font-bold text-slate-400 mt-0.5">
                  {moodBoard.style} • {moodBoard.roomType} • {moodBoard.budget}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={handleShare} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600">
                  <FiShare2 size={16} />
                </button>
              </div>
            </div>

            {/* AI Mood Board Grid Collage (Multi-Tile Display) */}
            <div className="bg-white rounded-3xl p-3 border border-slate-100 shadow-xl space-y-3">
              <div className="grid grid-cols-3 gap-2 h-72 md:h-80 rounded-2xl overflow-hidden">
                {/* Main Hero AI Image */}
                <div className="col-span-2 h-full relative rounded-xl overflow-hidden">
                  <img src={moodBoard.bgImage} className="w-full h-full object-cover" alt="Main AI Board" />
                </div>
                {/* Secondary Detail Images */}
                <div className="flex flex-col gap-2 h-full">
                  <div className="h-1/2 rounded-xl overflow-hidden">
                    <img src={moodBoard.secondaryImages?.[0] || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&q=80'} className="w-full h-full object-cover" alt="Detail 1" />
                  </div>
                  <div className="h-1/2 rounded-xl overflow-hidden">
                    <img src={moodBoard.secondaryImages?.[1] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80'} className="w-full h-full object-cover" alt="Detail 2" />
                  </div>
                </div>
              </div>

              {/* Color Swatches Grid */}
              <div className="grid grid-cols-5 gap-2">
                {moodBoard.palette?.map((col, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleCopyHex(col.hex)}
                    className="h-14 rounded-xl shadow-inner border border-black/10 cursor-pointer flex flex-col justify-end p-1 hover:scale-105 transition-transform"
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  >
                    <span className="text-[8px] font-bold text-white bg-black/40 backdrop-blur-xs px-1 rounded truncate">
                      {col.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Products in this Mood Board */}
            {moodBoard.products && moodBoard.products.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">
                    Products in this Mood Board ({moodBoard.products.length})
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {moodBoard.products.map((prod) => (
                    <div
                      key={prod._id}
                      onClick={() => navigate(`/products/${prod._id}`)}
                      className="bg-white border border-slate-100 rounded-2xl p-2 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="w-full h-24 bg-slate-50 rounded-xl overflow-hidden mb-1.5">
                        <img src={prod.images?.[0] || 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=300&q=80'} className="w-full h-full object-cover" alt={prod.name} />
                      </div>
                      <h4 className="text-[10px] font-bold text-slate-800 line-clamp-1">{prod.name}</h4>
                      <p className="text-[11px] font-black text-orange-500 mt-0.5">₹{Number(prod.price).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 py-3.5 bg-white border border-orange-500 text-orange-500 font-bold text-xs rounded-2xl hover:bg-orange-50 transition-all"
              >
                Customize
              </button>
              <button
                onClick={handleAddAllToCart}
                className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-2xl transition-all shadow-md shadow-orange-500/20"
              >
                Add All To Cart
              </button>
            </div>

            <button
              onClick={handleSaveBoard}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-orange-500/20 text-center block"
            >
              Save to My Boards
            </button>
          </motion.div>
        )}

        {/* STEP 5: Mood Board Saved Success Screen */}
        {currentStep === 5 && moodBoard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center py-4"
          >
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <FiCheck size={32} />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900">Mood Board Saved!</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">Your mood board has been saved successfully</p>
            </div>

            {/* Preview Collage */}
            <div className="bg-white rounded-3xl p-2.5 border border-slate-100 shadow-md grid grid-cols-3 gap-1.5 h-48 max-w-xs mx-auto overflow-hidden">
              <div className="col-span-2 h-full rounded-xl overflow-hidden">
                <img src={moodBoard.bgImage} className="w-full h-full object-cover" alt="Saved Main" />
              </div>
              <div className="flex flex-col gap-1.5 h-full">
                <div className="h-1/2 rounded-xl overflow-hidden">
                  <img src={moodBoard.secondaryImages?.[0] || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&q=80'} className="w-full h-full object-cover" alt="Saved Detail" />
                </div>
                <div className="h-1/2 rounded-xl overflow-hidden">
                  <img src={moodBoard.secondaryImages?.[1] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80'} className="w-full h-full object-cover" alt="Saved Detail" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleShare}
                className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
              >
                <FiShare2 size={16} />
                <span>Share Mood Board</span>
              </button>

              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = moodBoard.bgImage;
                  a.download = `Riddha_MoodBoard_${moodBoard.style.replace(/\s+/g, '_')}.jpg`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  toast.success('Downloaded Mood Board!');
                }}
                className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
              >
                <FiDownload size={16} />
                <span>Download Board</span>
              </button>

              <button
                onClick={() => setCurrentStep(1)}
                className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
              >
                <FiPlus size={16} />
                <span>Create New Mood Board</span>
              </button>

              <button
                onClick={handleAddAllToCart}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
              >
                <FiShoppingCart size={18} />
                <span>Start Shopping</span>
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default MoodBoardGeneratorPage;
