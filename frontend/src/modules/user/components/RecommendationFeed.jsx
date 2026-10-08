import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Compass, Flame, ArrowRight, RefreshCw } from 'lucide-react';
import RecommendationCard from './RecommendationCard';
import RecommendationExplanationModal from './RecommendationExplanationModal';
import api from '../../../shared/utils/api';

const RecommendationFeed = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personalized');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const carouselRef = useRef(null);

  useEffect(() => {
    fetchRecommendations();
    fetchTrending();
  }, []);

  // Auto-slide the recommendations carousel
  useEffect(() => {
    if (recommendations.length <= 2) return;
    const timer = setInterval(() => {
      const el = carouselRef.current;
      if (!el) return;
      const card = el.querySelector('[data-rec-card]');
      const amount = card ? card.offsetWidth + 24 : el.clientWidth * 0.8;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: amount, behavior: 'smooth' });
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [recommendations.length]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recommendations/for-user', { params: { limit: 12, type: activeTab } });
      setRecommendations(res.data?.data?.recommendations || []);
    } catch (err) {
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      const res = await api.get('/recommendations/trending', { params: { limit: 6 } });
      setTrending(res.data?.data?.products || []);
    } catch (err) {}
  };

  const handleExplain = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const res = await api.post('/recommendations/regenerate', { context: 'homepage' });
      setRecommendations(res.data?.data?.recommendations || []);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="py-10 md:py-14 border-y my-0"
      style={{
        background: 'linear-gradient(180deg, #FFE8EE 0%, #FFF0F4 50%, #FFDFE8 100%)',
        borderColor: '#FBC4D4',
      }}
    >
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#F43F5E]/10 text-[#BE123C] rounded-full text-xs font-bold border border-[#F43F5E]/20 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" />
              <span className="font-black uppercase tracking-wider text-[10px]">AI Recommendations</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Your Dream Space Our Priority
            </h2>
            <p className="text-sm font-medium text-gray-600 mt-1">
              From modern furniture to unique décor pieces, find everything you need to design a home that reflects your style.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="px-3.5 py-2 bg-white border border-gray-300 hover:border-[#189D91] text-gray-900 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs hover:shadow-md transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#189D91]" />
              <span>Refresh Feed</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-6 border-b border-stone-200">
          {[
            { id: 'personalized', label: 'Picks For You', icon: Sparkles },
            { id: 'style', label: 'Based on Your Style', icon: Compass },
            { id: 'trending', label: 'Trending This Week', icon: Flame },
            { id: 'cross-sell', label: 'Complete the Look', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); fetchRecommendations(); }}
                className={`relative px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all duration-300 active:scale-95 ${
                  isActive
                    ? 'text-white'
                    : 'text-stone-600 hover:text-stone-900 bg-white/70 hover:bg-white border border-stone-200/80'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="recActiveTab"
                    className="absolute inset-0 bg-[#189D91] rounded-xl shadow-md shadow-[#189D91]/25 z-0"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon className={`w-4 h-4 relative z-10 transition-colors ${isActive ? 'text-white' : 'text-stone-400'}`} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Product Cards — single-row auto-sliding carousel */}
        {loading ? (
          <div className="flex gap-6 overflow-x-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse shrink-0 w-[85%] sm:w-[45%] lg:w-[23%]" />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <Compass className="w-12 h-12 text-[#189D91] mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900">No Recommendations Yet</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Start browsing our catalog or take our Designer Quiz to unlock instant AI recommendations!
            </p>
          </div>
        ) : (
          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-2"
          >
            {recommendations.map(item => (
              <div key={item.id || item._id} data-rec-card className="shrink-0 snap-start w-[85%] sm:w-[45%] lg:w-[23%]">
                <RecommendationCard
                  item={item}
                  onExplain={handleExplain}
                />
              </div>
            ))}
          </div>
        )}

        {/* Trending Spotlight Banner */}
        {trending.length > 0 && (
          <div className="mt-12 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#113835] to-[#0A2624] border border-white/10">
            <div className="absolute right-0 top-0 w-96 h-96 bg-[#189D91]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
              <div>
                <span className="px-3 py-1 bg-[#189D91]/20 text-teal-300 rounded-full text-xs font-bold uppercase tracking-wider border border-[#189D91]/30">
                  Spotlight
                </span>
                <h3 className="text-xl md:text-2xl font-bold mt-2 text-white">Popular Design Trends in Riddha Mart</h3>
                <p className="text-xs text-slate-300 mt-1">High-demand items trending in contemporary interior projects.</p>
              </div>
              <Link to="/category/all" className="inline-flex items-center gap-2 text-xs font-bold text-teal-300 hover:text-white transition-colors">
                <span>Explore All Trending</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {trending.slice(0, 6).map(t => {
                const prodId = t.id || t._id;
                return (
                  <Link
                    key={prodId}
                    to={`/products/${prodId}`}
                    className="bg-white/5 backdrop-blur-md p-2.5 rounded-xl border border-white/10 hover:border-[#189D91]/60 hover:bg-white/10 transition-all group cursor-pointer block"
                  >
                    <img src={t.image} alt={t.name} className="w-full h-24 object-cover rounded-lg mb-2 group-hover:scale-105 transition-transform" />
                    <h4 className="text-xs font-semibold text-white truncate group-hover:text-teal-200">{t.name}</h4>
                    <p className="text-xs font-bold text-amber-300 mt-0.5">₹{t.price?.toLocaleString()}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Explanation Modal */}
        <RecommendationExplanationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          item={selectedItem}
        />
      </div>
    </section>
  );
};

export default RecommendationFeed;
