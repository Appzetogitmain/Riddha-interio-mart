import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft, FiUploadCloud, FiRefreshCw, FiShare2,
  FiDownload, FiTrash2, FiClock, FiCheck, FiChevronRight, FiMaximize2, FiInfo
} from 'react-icons/fi';
import { LuSparkles, LuSofa, LuBed, LuUtensils, LuBath, LuCoffee, LuLaptop } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';

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

const AiRoomVisualizerPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [originalImage, setOriginalImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState('Living Room');
  const [selectedStyle, setSelectedStyle] = useState('Modern Luxury');

  const [isGenerating, setIsGenerating] = useState(false);
  const [visualizerResult, setVisualizerResult] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [history, setHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const sliderRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('riddha_ai_visualizer_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse visualizer history:', err);
      }
    }
  }, []);

  const saveToHistory = (newResult, origImg) => {
    const historyItem = {
      id: newResult.id || `viz_${Date.now()}`,
      roomType: selectedRoom,
      style: selectedStyle,
      originalImage: origImg,
      enhancedImage: newResult.enhancedImageUrl,
      analysis: newResult.analysis,
      createdAt: new Date().toISOString()
    };

    const updated = [historyItem, ...history.filter(h => h.id !== historyItem.id)].slice(0, 5);
    setHistory(updated);
    try {
      localStorage.setItem('riddha_ai_visualizer_history', JSON.stringify(updated));
    } catch (storageErr) {
      console.warn('[LocalStorage Exceeded] Truncating visualizer history:', storageErr.message);
      const minimal = updated.slice(0, 2);
      try {
        localStorage.setItem('riddha_ai_visualizer_history', JSON.stringify(minimal));
      } catch (e) {}
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalImage(event.target.result);
      setVisualizerResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      toast.error('Please upload a room photo first');
      return;
    }

    try {
      setIsGenerating(true);
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('roomType', selectedRoom);
      formData.append('style', selectedStyle);

      const res = await api.post('/products/ai-room-visualize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success && res.data.visualizerResult) {
        setVisualizerResult(res.data.visualizerResult);
        saveToHistory(res.data.visualizerResult, originalImage);
        toast.success('AI Room Redesign Ready!');
      } else {
        toast.error('Failed to visualize room. Please try again.');
      }
    } catch (err) {
      console.error('Visualizer error:', err);
      toast.error('Error processing room visualizer.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Slider Touch/Mouse handlers with window-level drag to fix glitches
  const handleSliderMove = (clientX) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  };

  useEffect(() => {
    const handleWindowMouseMove = (e) => {
      if (isDraggingRef.current) {
        handleSliderMove(e.clientX);
      }
    };

    const handleWindowMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWindowTouchMove = (e) => {
      if (isDraggingRef.current && e.touches && e.touches[0]) {
        handleSliderMove(e.touches[0].clientX);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('touchmove', handleWindowTouchMove);
    window.addEventListener('touchend', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowMouseUp);
    };
  }, []);

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    handleSliderMove(e.clientX);
  };

  const handleTouchStart = (e) => {
    isDraggingRef.current = true;
    if (e.touches && e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `AI Room Redesign - ${selectedRoom}`,
        text: `Check out my room redesign created with Riddha AI Room Visualizer!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleDownload = async () => {
    if (!visualizerResult?.enhancedImageUrl) return;
    try {
      toast.loading('Preparing high-res download...', { id: 'download-toast' });
      const response = await fetch(visualizerResult.enhancedImageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Riddha_AI_Room_${selectedRoom.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success('Downloaded enhanced design!', { id: 'download-toast' });
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback
      window.open(visualizerResult.enhancedImageUrl, '_blank');
      toast.dismiss('download-toast');
    }
  };

  const handleDeleteHistoryItem = (id, e) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('riddha_ai_visualizer_history', JSON.stringify(updated));
    toast.success('Design removed from history');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-800">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#127F75] text-white px-4 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <FiArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-base font-black tracking-tight flex items-center gap-2">
              <LuSparkles className="text-amber-300 animate-pulse" size={18} />
              AI Room Visualizer
            </h1>
            <p className="text-[10px] text-teal-100 font-semibold">Transform & Redesign Your Interior Spaces</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/ai-mood-board')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 rounded-full text-xs font-bold transition-all border border-amber-300/30"
            title="Try AI Mood Board Generator"
          >
            <LuPalette size={14} />
            <span className="hidden sm:inline">Mood Board</span>
          </button>
          {history.length > 0 && (
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-full text-xs font-bold transition-all border border-white/20"
            >
              <FiClock size={14} />
              <span>History ({history.length})</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 py-5 space-y-6">
        
        {/* Step 1: Upload Photo Section */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#127F75]">
              Step 1: Upload Room Photo
            </span>
            {originalImage && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-[#189D91] hover:underline flex items-center gap-1"
              >
                <FiRefreshCw size={12} /> Replace Photo
              </button>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />

          {!originalImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-[#189D91] rounded-3xl p-8 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-teal-50/30 group"
            >
              <div className="w-16 h-16 bg-teal-50 group-hover:bg-[#189D91] text-[#189D91] group-hover:text-white rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors shadow-sm">
                <FiUploadCloud size={28} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Click to Upload Your Room Photo</h3>
              <p className="text-xs text-slate-400 font-medium">Supports JPG, PNG, WEBP up to 10MB</p>
            </div>
          ) : (
            <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-inner group">
              <img src={originalImage} className="w-full h-full object-cover" alt="Original Room" />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Original Room Photo
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Customization Options */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-5">
          {/* Select Room Type */}
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#127F75]">
              Select Room Type
            </span>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {roomTypes.map((rt) => {
                const IconComponent = rt.icon;
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
                    <IconComponent size={20} className={selectedRoom === rt.id ? 'text-white' : 'text-[#189D91]'} />
                    <span className="text-[11px] font-bold truncate w-full">{rt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select Design Style */}
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#127F75]">
              Select Design Style
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {designStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3.5 rounded-2xl text-left transition-all border ${
                    selectedStyle === style.id
                      ? 'bg-[#189D91]/10 border-[#189D91] text-[#127F75] ring-2 ring-[#189D91]/20'
                      : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold">{style.label}</span>
                    {selectedStyle === style.id && (
                      <span className="w-2 h-2 rounded-full bg-[#189D91]" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{style.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!originalImage || isGenerating}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${
              !originalImage || isGenerating
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-[#189D91] to-[#127F75] text-white hover:opacity-95 shadow-[#189D91]/25 active:scale-[0.99]'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>AI Redesigning Room...</span>
              </>
            ) : (
              <>
                <LuSparkles size={18} />
                <span>Generate AI Room Redesign</span>
              </>
            )}
          </button>
        </div>

        {/* Step 3: Interactive Before / After Split Slider & Results */}
        <AnimatePresence>
          {visualizerResult && originalImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-lg space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    AI Transformation: {selectedRoom}
                  </h3>
                  <p className="text-xs font-semibold text-[#189D91]">{selectedStyle} Style</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"
                    title="Share Transformation"
                  >
                    <FiShare2 size={16} />
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"
                    title="Download Enhanced Image"
                  >
                    <FiDownload size={16} />
                  </button>
                </div>
              </div>

              {/* BEFORE / AFTER SPLIT SLIDER COMPONENT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                  <span>← Drag Slider to Compare</span>
                  <span>BEFORE / AFTER</span>
                </div>

                <div
                  ref={sliderRef}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  className="relative w-full h-72 md:h-96 rounded-3xl overflow-hidden cursor-ew-resize select-none border border-slate-200 shadow-md bg-slate-900"
                >
                  {/* AFTER IMAGE (GEMINI 2.5 FLASH IMAGE-TO-IMAGE AI GENERATED REDESIGNED ROOM) */}
                  <div className="absolute inset-0 w-full h-full">
                    <img
                      src={visualizerResult.enhancedImageUrl || originalImage}
                      className="w-full h-full object-cover transition-all duration-300"
                      alt="AI Redesigned Room"
                    />

                    {/* AI Design Hotspot Badges on the Original Room */}
                    <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 pointer-events-none">
                      <span className="w-2 h-2 rounded-full bg-[#189D91] animate-ping" />
                      <span className="text-[10px] font-bold tracking-wide">AI Redesigned: {selectedStyle} {selectedRoom}</span>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 bg-[#189D91]/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider z-10 shadow-sm">
                    AFTER (AI Redesigned Room)
                  </div>

                  {/* BEFORE IMAGE (Unmodified Original Upload) - Top Clipped Layer */}
                  <div
                    className="absolute inset-0 z-20 pointer-events-none"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <img
                      src={originalImage}
                      className="w-full h-full object-cover"
                      alt="Before Original"
                    />
                    <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      BEFORE (Original)
                    </div>
                  </div>

                  {/* SLIDER DRAG BAR & HANDLE */}
                  <div
                    className="absolute inset-y-0 z-30 flex items-center pointer-events-none"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="w-0.5 h-full bg-white shadow-[0_0_12px_rgba(0,0,0,0.8)]" />
                    <div className="absolute -left-4.5 w-9 h-9 bg-white text-[#189D91] rounded-full flex items-center justify-center shadow-2xl border-2 border-[#189D91]">
                      <span className="text-xs font-black">↔</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Architectural Analysis */}
              {visualizerResult.analysis && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center gap-2">
                    <FiInfo className="text-[#189D91]" size={16} />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      AI Interior Highlights & Upgrades
                    </h4>
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                    {visualizerResult.analysis.designHighlights?.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#189D91] mt-1.5 shrink-0" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Matching Catalog Products */}
              {visualizerResult.matchingProducts && visualizerResult.matchingProducts.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#127F75]">
                      Buy Products From This Redesign
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {visualizerResult.matchingProducts.map((prod) => (
                      <div
                        key={prod._id}
                        onClick={() => navigate(`/products/${prod._id}`)}
                        className="bg-white border border-slate-100 hover:border-[#189D91]/30 rounded-2xl p-2.5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="w-full h-28 bg-slate-50 rounded-xl overflow-hidden mb-2">
                          <img
                            src={prod.images?.[0] || 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=300&q=80'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            alt={prod.name}
                          />
                        </div>
                        <h5 className="text-[11px] font-bold text-slate-800 line-clamp-1 leading-tight">{prod.name}</h5>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs font-black text-[#189D91]">₹{Number(prod.price).toLocaleString()}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/products/${prod._id}`);
                            }}
                            className="px-2.5 py-1 bg-[#189D91] hover:bg-[#127F75] text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1"
                          >
                            <span>Buy Item</span>
                            <FiChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={handleGenerate}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <FiRefreshCw size={14} />
                  <span>Regenerate Variety</span>
                </button>
                <button
                  onClick={() => {
                    setVisualizerResult(null);
                    setOriginalImage(null);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-500 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <FiTrash2 size={14} />
                  <span>Clear</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                  <h3 className="text-base font-black text-slate-800">Saved AI Transformations</h3>
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
                  <p className="text-sm font-semibold">No saved transformations yet.</p>
                  <p className="text-xs">Generate a room redesign to save it here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setOriginalImage(item.originalImage);
                        setVisualizerResult({
                          id: item.id,
                          enhancedImageUrl: item.enhancedImage,
                          analysis: item.analysis
                        });
                        setSelectedRoom(item.roomType);
                        setSelectedStyle(item.style);
                        setShowHistoryModal(false);
                      }}
                      className="p-3 bg-slate-50 hover:bg-teal-50/50 rounded-2xl border border-slate-100 transition-all cursor-pointer group relative flex gap-3"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                        <img src={item.enhancedImage} className="w-full h-full object-cover" alt="Saved Design" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{item.roomType}</h4>
                        <span className="text-[10px] font-bold text-[#189D91] bg-white px-2 py-0.5 rounded-md border border-slate-100 inline-block mt-1">
                          {item.style}
                        </span>
                        <p className="text-[9px] text-slate-400 mt-2">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1 items-end shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const a = document.createElement('a');
                            a.href = item.enhancedImage;
                            a.download = `Riddha_AI_Room_${item.roomType.replace(/\s+/g, '_')}.jpg`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            toast.success('Downloaded saved image!');
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#189D91] hover:bg-slate-100 rounded-lg transition-all"
                          title="Download Image"
                        >
                          <FiDownload size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete from history"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
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

export default AiRoomVisualizerPage;
