import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiGrid, FiShoppingBag, FiCompass, FiInfo, FiHeart, FiMaximize } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const QuizResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(location.state?.resultData || null);
  const [loading, setLoading] = useState(!location.state?.resultData);
  const [activeTab, setActiveTab] = useState('suggestions'); // 'suggestions' or 'moodboard'

  useEffect(() => {
    // Scroll to top on load
    window.scrollTo(0, 0);

    const fetchResult = async () => {
      if (result) return;
      
      try {
        setLoading(true);
        // Try getting logged-in user results first
        let response;
        try {
          response = await api.get('/quiz/my-results');
        } catch (e) {
          // If 404 or unauthenticated, check by guest sessionId
          const sessId = localStorage.getItem('quizSessionId');
          if (sessId) {
            response = await api.get(`/quiz/results/${sessId}`);
          }
        }

        if (response && response.data?.success) {
          setResult(response.data.data);
        } else {
          throw new Error('No profile found');
        }
      } catch (err) {
        console.error('Fetch quiz result error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [result]);

  const handleRetakeQuiz = () => {
    navigate('/designer-quiz');
  };

  const getProductImage = (p) =>
    p?.image ||
    p?.images?.[0] ||
    'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&q=80';

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-[#EC008C] border-slate-200 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Retrieving your design profile...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center font-sans px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-md border border-slate-100">
          <span className="text-4xl">🧭</span>
          <h2 className="text-xl font-bold text-slate-800 mt-4">No Style Profile Found</h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            Take our 10-question Designer Quiz to uncover your custom design personality, matching products, and AI suggestions.
          </p>
          <button
            onClick={handleRetakeQuiz}
            className="mt-6 w-full bg-[#189D91] hover:bg-[#127F75] text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-[#189D91]/15 cursor-pointer"
          >
            Start Designer Quiz
          </button>
        </div>
      </div>
    );
  }

  const { designProfile, aiGeneratedContent, recommendations } = result;
  const personality = aiGeneratedContent?.designerPersonality || 'Inspired Creator';
  const narrative = aiGeneratedContent?.profileNarrative || 'You appreciate a thoughtful blend of styles and colors...';
  const suggestions = aiGeneratedContent?.designSuggestions || [];
  
  // Extract specific suggestions
  const styleSuggestion = suggestions[0] || {};
  const budgetSuggestion = suggestions[1] || {};
  const personalitySuggestion = suggestions[2] || {};

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans pb-16">
      {/* Top Banner Background */}
      <div className="bg-gradient-to-r from-[#189D91] via-[#127F75] to-slate-900 text-white pt-12 pb-24 px-4 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-xs uppercase tracking-wider font-bold text-teal-100 hover:text-white transition-colors mb-4 cursor-pointer"
            >
              <FiArrowLeft size={14} /> Back to Catalog
            </button>
            <span className="bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-teal-300">
              AI Design Engine
            </span>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mt-3">
              Your Persona: <span className="text-yellow-300">{personality}</span>
            </h1>
          </div>
          <button
            onClick={handleRetakeQuiz}
            className="bg-white hover:bg-slate-100 text-slate-800 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] transition-all cursor-pointer"
          >
            Retake Quiz
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLUMNS: Profile & Recommendations */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Personality Narrative Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 shadow-md border border-slate-100"
            >
              <h2 className="text-xs uppercase tracking-widest font-extrabold text-[#189D91] mb-3">Your Style Blueprint</h2>
              <p className="text-slate-700 text-base md:text-lg leading-relaxed font-medium">
                "{narrative}"
              </p>
              
              {/* Profile summary tags */}
              <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-100">
                <span className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full font-semibold capitalize">
                  Room: {designProfile.roomType}
                </span>
                <span className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full font-semibold capitalize">
                  Style: {designProfile.primaryStyle}
                </span>
                <span className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full font-semibold">
                  Boldness: {designProfile.boldness}/10
                </span>
                <span className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full font-semibold">
                  Lighting: {designProfile.lighting}
                </span>
              </div>
            </motion.div>

            {/* Toggle tabs for suggestions / moodboard */}
            <div className="flex bg-slate-200/60 p-1.5 rounded-2xl max-w-sm">
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`flex-1 py-2.5 text-center font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  activeTab === 'suggestions' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Design Suggestions
              </button>
              <button
                onClick={() => setActiveTab('moodboard')}
                className={`flex-1 py-2.5 text-center font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  activeTab === 'moodboard' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Mood Board Vibe
              </button>
            </div>

            {/* Conditional Suggestions Tab */}
            {activeTab === 'suggestions' && (
              <div className="space-y-6">
                
                {/* Style Suggestion Card */}
                {styleSuggestion.title && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="p-2.5 rounded-xl bg-teal-50 text-[#189D91]"><FiCompass size={20} /></span>
                      <h3 className="text-xl font-display font-bold text-slate-800">{styleSuggestion.title}</h3>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{styleSuggestion.description}</p>
                    
                    {styleSuggestion.keyElements && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Key Elements to Focus on</p>
                        <ul className="space-y-2">
                          {styleSuggestion.keyElements.map((el, i) => (
                            <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-[#189D91] font-bold mt-0.5">•</span>
                              {el}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Budget Strategy Card */}
                {budgetSuggestion.title && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="p-2.5 rounded-xl bg-pink-50 text-[#EC008C]"><FiShoppingBag size={20} /></span>
                      <h3 className="text-xl font-display font-bold text-slate-800">{budgetSuggestion.title}</h3>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">{budgetSuggestion.description}</p>

                    {budgetSuggestion.budgetAllocation && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                        
                        <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#EC008C] block mb-1">Splurge / Invest</span>
                          <ul className="text-xs text-slate-700 space-y-1">
                            {budgetSuggestion.budgetAllocation.invest?.map((item, i) => (
                              <li key={i}>• {item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#189D91] block mb-1">Moderate Spend</span>
                          <ul className="text-xs text-slate-700 space-y-1">
                            {budgetSuggestion.budgetAllocation.moderate?.map((item, i) => (
                              <li key={i}>• {item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Save / Budget</span>
                          <ul className="text-xs text-slate-700 space-y-1">
                            {budgetSuggestion.budgetAllocation.budget?.map((item, i) => (
                              <li key={i}>• {item}</li>
                            ))}
                          </ul>
                        </div>

                      </div>
                    )}
                  </motion.div>
                )}

                {/* Boldness Suggestion Card */}
                {personalitySuggestion.title && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100"
                  >
                    <h3 className="text-lg font-display font-bold text-slate-800 mb-3">{personalitySuggestion.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">{personalitySuggestion.description}</p>
                    
                    {/* Points list depending on boldness */}
                    <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                      {personalitySuggestion.daringSuggestions?.map((item, i) => (
                        <div key={i} className="flex gap-2.5 items-start text-sm text-slate-700">
                          <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold flex-none mt-0.5">{i+1}</span>
                          <p>{item}</p>
                        </div>
                      ))}
                      {personalitySuggestion.principles?.map((item, i) => (
                        <div key={i} className="flex gap-2.5 items-start text-sm text-slate-700">
                          <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold flex-none mt-0.5">{i+1}</span>
                          <p>{item}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

              </div>
            )}

            {/* Mood Board Tab */}
            {activeTab === 'moodboard' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6"
              >
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-800">Visual Mood Board Concept</h3>
                  <p className="text-slate-500 text-xs mt-1">AI-curated aesthetic direction & styling blueprints</p>
                </div>

                <div className="grid grid-cols-3 gap-2 h-20 rounded-2xl overflow-hidden shadow-inner">
                  {/* Dynamic Color swatch bars derived from profile colors */}
                  <div className="bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 capitalize">{designProfile.colors[0] || 'Neutral'}</div>
                  <div className="bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 capitalize">{designProfile.colors[1] || 'Oak'}</div>
                  <div className="bg-[#189D91]/25 flex items-center justify-center text-xs font-bold text-[#189D91] capitalize">{designProfile.colors[2] || 'Accent'}</div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <p className="text-slate-700 text-sm leading-relaxed italic">
                    "{aiGeneratedContent?.moodBoardNarrative || 'This mood board captures a peaceful yet sophisticated atmosphere...'}"
                  </p>
                </div>

                {aiGeneratedContent?.moodBoardInspiration && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold">Actionable Design Inspiration</h4>
                    <div className="space-y-3">
                      {aiGeneratedContent.moodBoardInspiration.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed">
                          <span className="p-1 rounded bg-[#189D91]/15 text-[#189D91] text-xs font-bold mt-0.5">{idx + 1}</span>
                          <p>{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* RECOMMENDATIONS SECTION */}
            <div className="pt-6">
              <h2 className="text-2xl font-display font-bold text-slate-800 mb-6">AI-Matched Catalog Products</h2>
              
              <div className="space-y-6">
                {recommendations && recommendations.length > 0 ? (
                  recommendations.map((item, idx) => {
                    const product = item.product;
                    if (!product) return null;

                    return (
                      <div
                        key={product._id || idx}
                        className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col md:flex-row gap-6 relative overflow-hidden"
                      >
                        {/* Match score badge */}
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-[#189D91] to-[#127F75] text-white px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-sm flex items-center gap-1 z-10">
                          {item.matchPercentage}% Match
                        </div>

                        {/* Product Image */}
                        <div className="w-full md:w-44 h-44 bg-slate-50 rounded-2xl overflow-hidden flex-none border border-slate-100 relative">
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#189D91] bg-teal-50 px-2 py-0.5 rounded">
                                {product.category?.name || 'Catalog'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {item.recommendationStrength || 'Good Match'}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mt-1.5 line-clamp-1">{product.name}</h3>
                            <p className="text-lg font-extrabold text-slate-900 mt-1">₹{Number(product.price).toLocaleString('en-IN')}</p>
                            
                            {/* Gemini Custom Explanation */}
                            <div className="bg-slate-50 rounded-xl p-4 mt-3 border border-slate-100 flex gap-2">
                              <span className="text-slate-400 mt-0.5 flex-none"><FiInfo size={14} /></span>
                              <p className="text-slate-600 text-xs leading-relaxed">
                                {item.aiExplanation}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 mt-4 md:mt-0 pt-3 md:pt-0">
                            <button
                              onClick={() => navigate(`/products/${product._id}`)}
                              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <FiMaximize size={12} /> View Product
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  // Call cart API helper
                                  await api.post('/cart', { productId: product._id, quantity: 1 });
                                  alert('Added matching item to your cart!');
                                } catch (e) {
                                  navigate(`/products/${product._id}`);
                                }
                              }}
                              className="px-4 py-2.5 bg-[#EC008C] hover:bg-[#d8007e] text-white rounded-xl shadow-md shadow-[#EC008C]/15 flex items-center justify-center transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                              title="Add to Cart"
                            >
                              <FiShoppingBag size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-400 text-sm">No specific product recommendations matched your budget guidelines yet.</p>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Style Details & Challenges */}
          <div className="space-y-6">
            
            {/* AI Advisor Panel */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden border border-slate-700/30">
              {/* Highlight accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#189D91]/20 rounded-full blur-xl pointer-events-none" />
              
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#189D91] mb-1">Design Dilemma Resolved</h3>
              <h4 className="text-lg font-display font-bold leading-tight">Addressing Your Challenge:</h4>
              <p className="text-xs uppercase tracking-wider text-yellow-300 font-bold mt-0.5">"{designProfile.challenge || 'Layout Flow'}"</p>

              <div className="mt-4 space-y-4">
                <div className="flex gap-3 items-start bg-white/5 border border-white/10 p-3.5 rounded-2xl text-xs leading-relaxed text-slate-200">
                  <span className="text-lg">💡</span>
                  <div>
                    <p className="font-bold text-white mb-1">Designer Recommendation:</p>
                    {designProfile.challenge?.toLowerCase().includes('storage') ? (
                      <p>Focus on modular media console units with hidden doors. Avoid open storage to keep visual clutter at a minimum while utilizing vertical height.</p>
                    ) : designProfile.challenge?.toLowerCase().includes('clutter') ? (
                      <p>Implement the 60-30-10 layout rule: 60% neutral surfaces, 30% soft textures, and only 10% accent details. Negative space is your friend.</p>
                    ) : designProfile.challenge?.toLowerCase().includes('color') ? (
                      <p>Anchor the space with a large neutral rug. Select 1 key accent color from your navy palette and repeat it exactly three times in accessories.</p>
                    ) : (
                      <p>Create layout paths that allow at least 30 inches of breathing space between major furniture. Layer light fixtures to eliminate dark shadows.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Room specs / materials swatch cards */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-3.5">Preferred Tactile Materials</h3>
              <div className="grid grid-cols-2 gap-3">
                {designProfile.materials?.map((mat, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/50 flex flex-col justify-center items-center text-center">
                    <span className="text-lg mb-1">{mat.includes('Wood') ? '🪵' : mat.includes('Stone') || mat.includes('Marble') ? '🪨' : mat.includes('Leather') ? '💼' : mat.includes('Metal') ? '🔩' : '✨'}</span>
                    <p className="text-xs font-semibold text-slate-700 leading-none capitalize">{mat}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lighting Guidelines card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-2">Lighting Curation</h3>
              <p className="text-xs text-slate-400 font-medium mb-3">Atmosphere setting: {designProfile.lighting}</p>
              
              <div className="text-xs text-slate-600 leading-relaxed space-y-2">
                <p>💡 **Main Source**: 4000K daylight LED panels to maintain the airy nature of your space.</p>
                <p>💡 **Accent layer**: Diffused 3000K warm strip lighting behind consoles or bookshelves to create soft depth at night.</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default QuizResultsPage;
