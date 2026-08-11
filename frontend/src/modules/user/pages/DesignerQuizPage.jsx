import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiArrowRight, FiCheck } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const QUESTIONS = [
  {
    id: 'q1',
    key: 'roomType',
    title: 'Which room are we designing today?',
    subtitle: 'Every space has its own flow and purpose.',
    options: [
      { value: 'living', label: 'Living Room', desc: 'Gather, relax, and entertain family & friends' },
      { value: 'bedroom', label: 'Bedroom', desc: 'Your personal, peaceful sanctuary to rest' },
      { value: 'kitchen', label: 'Kitchen', desc: 'The culinary heart of the home, utility first' },
      { value: 'dining', label: 'Dining Room', desc: 'Share meals and create lasting memories' },
      { value: 'office', label: 'Home Office', desc: 'Fuel focus, comfort, and productivity' },
      { value: 'outdoor', label: 'Outdoor/Patio', desc: 'Fresh air, outdoor lounging, and greenery' }
    ]
  },
  {
    id: 'q2',
    key: 'primaryStyle',
    title: 'Choose the design style that speaks to you:',
    subtitle: 'This defines the main aesthetic anchor of your room.',
    options: [
      { value: 'Modern', label: 'Modern', desc: 'Clean lines, functional layouts, sleek surfaces' },
      { value: 'Minimalist', label: 'Minimalist', desc: 'Less is more, airy spaces, zero clutter' },
      { value: 'Traditional', label: 'Traditional', desc: 'Timeless detailing, warm heritage furniture' },
      { value: 'Industrial', label: 'Industrial', desc: 'Exposed textures, raw metal accents, brick' },
      { value: 'Scandinavian', label: 'Scandinavian', desc: 'Light natural woods, organic textures, cozy vibes' },
      { value: 'Eclectic', label: 'Eclectic', desc: 'A curated, bold mix of different periods & styles' }
    ]
  },
  {
    id: 'q3',
    key: 'colors',
    title: 'Select your preferred color palette vibe:',
    subtitle: 'Colors set the tone and emotional energy of a room.',
    options: [
      { value: 'Neutral & Warm', label: 'Neutral & Warm', desc: 'Warm cream, beige, soft taupes, sandy tones' },
      { value: 'Cool & Airy', label: 'Cool & Airy', desc: 'Soft blues, muted seafoams, light crisp grays' },
      { value: 'Bold & Vibrant', label: 'Bold & Vibrant', desc: 'Terracotta, rich mustard, deep emerald, accents' },
      { value: 'Dark & Moody', label: 'Dark & Moody', desc: 'Charcoal black, deep indigo, forest green, shadows' },
      { value: 'Earthy & Organic', label: 'Earthy & Organic', desc: 'Sage greens, warm oak, clay, natural stones' }
    ]
  },
  {
    id: 'q4',
    key: 'budget',
    title: 'What is your investment level for this space?',
    subtitle: 'This helps us suggest appropriate brands and pieces.',
    options: [
      { value: '₹50,000 - ₹1,00,000', label: '₹50k - ₹100k', desc: 'Budget-friendly style refresh' },
      { value: '₹1,00,000 - ₹2,50,000', label: '₹100k - ₹250k', desc: 'Standard room makeover' },
      { value: '₹2,50,000 - ₹5,00,000', label: '₹250k - ₹500k', desc: 'Premium custom curation' },
      { value: '₹5,00,000 - ₹10,00,000', label: '₹500k+', desc: 'Complete luxury overhaul' }
    ]
  },
  {
    id: 'q5',
    key: 'lighting',
    title: 'What lighting atmosphere do you want to create?',
    subtitle: 'Lighting shapes how we see textures and shapes.',
    options: [
      { value: 'Bright & Airy', label: 'Bright & Airy', desc: 'Maximizing natural daylight and white light' },
      { value: 'Cozy & Warm', label: 'Cozy & Warm', desc: 'Soft lamps, warm glowing bulbs, candle-lit feels' },
      { value: 'Dramatic & Mood-lit', label: 'Dramatic & Mood-lit', desc: 'High contrast spotlighting and accent fixtures' },
      { value: 'Ambient & Layered', label: 'Ambient & Layered', desc: 'Smart dimmable LEDs, indirect light strips' }
    ]
  },
  {
    id: 'q6',
    key: 'boldness',
    title: 'How daring are you with your design choices?',
    subtitle: 'Are you looking for a quiet retreat or a showstopper?',
    options: [
      { value: 2, label: 'Conservative & Timeless (2/10)', desc: 'Elegant classics, play it safe with resale value' },
      { value: 5, label: 'Balanced & Tasteful (5/10)', desc: 'Clean styling with 1-2 curated statement accents' },
      { value: 8, label: 'Daring & Statement-Making (8/10)', desc: 'Showstopping items, bold patterns, high contrast' }
    ]
  },
  {
    id: 'q7',
    key: 'materials',
    title: 'Which materials are you naturally drawn to?',
    subtitle: 'The tactile experience makes a house a home.',
    options: [
      { value: 'Wood & Rattan', label: 'Wood & Natural Fibers', desc: 'Walnut, oak, woven cane, linen fabrics' },
      { value: 'Velvet & Brass', label: 'Velvet & Warm Metals', desc: 'Plush velvet, brushed gold, polished brass details' },
      { value: 'Leather & Steel', label: 'Leather & Black Metal', desc: 'Distressed leather, industrial iron, steel tubes' },
      { value: 'Linen & Marble', label: 'Linen & Natural Stone', desc: 'Light breathable textiles, polished stone slabs' }
    ]
  },
  {
    id: 'q8',
    key: 'challenge',
    title: 'What is your biggest room layout challenge?',
    subtitle: 'We will generate AI tips specifically to address this.',
    options: [
      { value: 'Lacks storage', label: 'Storage Limitations', desc: 'Too many items, not enough smart shelving/cabinets' },
      { value: 'Feels cluttered', label: 'Cluttered & Small Vibe', desc: 'Difficult to make the room feel spacious and open' },
      { value: 'Hard to coordinate colors', label: 'Color Coordination', desc: 'Hard to tie rugs, walls, and furniture together' },
      { value: 'Too dark/dim', label: 'Poor Lighting', desc: 'Feels gloomy, lacks natural or ambient light flow' }
    ]
  },
  {
    id: 'q9',
    key: 'furniturePriority',
    title: 'Which key item is your top priority to focus on?',
    subtitle: 'This will be the anchor recommendation for your space.',
    options: [
      { value: 'Seating', label: 'Seating (Sofa/Accent Chair)', desc: 'Comfortable spots to lounge or converse' },
      { value: 'Surfaces', label: 'Surfaces (Coffee/Dining Table)', desc: 'Central hubs for eating, staging, or holding items' },
      { value: 'Storage', label: 'Storage (TV Unit/Bookshelf)', desc: 'Smart organization to keep spaces clean' },
      { value: 'Decor', label: 'Accents (Rugs/Lighting)', desc: 'Sensory layers that bring character' }
    ]
  },
  {
    id: 'q10',
    key: 'philosophy',
    title: 'What is the ultimate goal of this design project?',
    subtitle: 'Your driving philosophy behind the investment.',
    options: [
      { value: 'Comfort First', label: 'Functionality & Coziness', desc: 'Utility, absolute comfort, and stress-free maintenance' },
      { value: 'Timeless Quality', label: 'Heritage & Longevity', desc: 'High-quality pieces that stay stylish for decades' },
      { value: 'Creative Expression', label: 'Self-Expression & Style', desc: 'A unique showpiece space that wows every guest' }
    ]
  }
];

const LOADING_STEPS = [
  'Analyzing your room selections...',
  'Determining your designer personality label...',
  'Running personalization matching algorithms...',
  'Consulting Gemini AI for custom styling guidelines...',
  'Generating your personal budget allocation strategy...',
  'Assembling your custom digital mood board...'
];

const DesignerQuizPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(-1); // -1 is intro screen
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  // Auto-rotate loading text
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const selectOption = (questionKey, optionValue) => {
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: optionValue
    }));
    // Auto-advance after 300ms delay for smooth feel
    setTimeout(() => {
      if (currentStep < QUESTIONS.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    }, 250);
  };

  const handleBack = () => {
    if (currentStep > -1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setLoadingStepIndex(0);
    try {
      // Create session id if it doesn't exist
      let sessId = localStorage.getItem('quizSessionId');
      if (!sessId) {
        sessId = 'sess_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('quizSessionId', sessId);
      }

      // Structure answers in terms of q1, q2... for backend controller
      const formattedAnswers = {};
      QUESTIONS.forEach((q, idx) => {
        formattedAnswers[`q${idx + 1}`] = answers[q.key];
      });

      const response = await api.post(`/quiz/${sessId}/complete`, {
        answers: formattedAnswers
      });

      if (response.data?.success) {
        navigate('/designer-quiz/results', { state: { resultData: response.data.data } });
      } else {
        throw new Error(response.data?.error || 'Failed to generate quiz profile');
      }
    } catch (error) {
      console.error('Quiz submit error:', error);
      alert('There was a problem generating your AI design profile. Please try again.');
      setLoading(false);
    }
  };

  const progressPercentage = Math.round(((currentStep + 1) / QUESTIONS.length) * 100);

  // 1. Intro Screen
  if (currentStep === -1) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center font-sans px-4 py-8 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col md:flex-row h-auto md:min-h-[550px]"
        >
          {/* Visual Left Panel */}
          <div className="w-full md:w-1/2 relative bg-slate-800 overflow-hidden h-64 md:h-auto">
            <img
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1000"
              alt="Luxury Living Space"
              className="w-full h-full object-cover brightness-[0.85]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent flex flex-col justify-end p-8 text-white">
              <span className="text-xs uppercase tracking-widest text-[#189D91] font-bold mb-2">Riddha Interio Mart</span>
              <h2 className="text-2xl md:text-3xl font-display font-bold leading-tight">AI Designer Quiz</h2>
              <p className="text-sm text-slate-200 mt-2 font-medium">Discover your exact design personality and receive custom suggestions and catalog recommendations in under 3 minutes.</p>
            </div>
          </div>

          {/* Form Content Right Panel */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-between">
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-slate-800 leading-tight">
                Unlock Your Custom Design Blueprint
              </h1>
              <p className="text-slate-500 mt-4 leading-relaxed text-sm md:text-base">
                Welcome! Answer 10 brief visual questions about your lifestyle, budget, and aesthetic choices. Our Gemini-powered AI engine will analyze your answers to build:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 font-medium">
                <li className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-[#189D91]/15 text-[#189D91] flex items-center justify-center text-xs">✓</span>
                  A personalized Style Personality profile
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-[#189D91]/15 text-[#189D91] flex items-center justify-center text-xs">✓</span>
                  Tailored design suggestions & budget layout
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-[#189D91]/15 text-[#189D91] flex items-center justify-center text-xs">✓</span>
                  Curated product list with AI compatibility ratings
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setCurrentStep(0)}
                className="w-full bg-[#EC008C] hover:bg-[#d8007e] text-white py-4 rounded-2xl font-bold uppercase tracking-wider shadow-lg shadow-[#EC008C]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                Start Free Quiz <FiArrowRight />
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full text-center text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-wider transition-colors py-2 cursor-pointer"
              >
                Back to Home
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. Loading State during submit
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center font-sans px-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100 flex flex-col items-center py-12">
          {/* Animated Spinner Icon */}
          <div className="relative h-20 w-20 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-[#EC008C] border-r-[#189D91] animate-spin"></div>
            <span className="text-xl">✨</span>
          </div>

          <h2 className="text-xl md:text-2xl font-display font-bold text-slate-800">Generating Your Style Profile</h2>
          <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mt-2">Powered by Gemini 3.5 Flash</p>
          
          {/* Dynamic Loading Steps Carousel */}
          <div className="h-10 mt-6 overflow-hidden flex items-center justify-center w-full">
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingStepIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="text-slate-600 font-medium text-sm text-center px-4"
              >
                {LOADING_STEPS[loadingStepIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Micro animated progress bar */}
          <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden mt-6">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#189D91] to-[#EC008C] rounded-full"
              animate={{
                width: ["10%", "95%"],
              }}
              transition={{
                duration: 9,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = QUESTIONS[currentStep];
  const selectedValue = answers[currentQuestion.key];

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-between font-sans px-4 py-6 md:py-10">
      {/* Header bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 md:mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-slate-500 hover:text-slate-800 transition-colors p-2 bg-white rounded-xl shadow-sm border border-slate-100 cursor-pointer"
        >
          <FiArrowLeft size={14} /> Back
        </button>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest bg-white border border-slate-100 px-3.5 py-1.5 rounded-full shadow-sm">
          Question {currentStep + 1} of {QUESTIONS.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-4xl bg-slate-200 h-1.5 rounded-full mb-6 md:mb-10 overflow-hidden shadow-inner">
        <motion.div
          className="bg-gradient-to-r from-[#189D91] to-[#EC008C] h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Main Question Display */}
      <div className="w-full max-w-4xl flex-1 flex flex-col justify-center mb-6 md:mb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full"
          >
            {/* Titles */}
            <div className="text-center md:text-left mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3.5xl font-display font-bold text-slate-800 tracking-tight leading-tight">
                {currentQuestion.title}
              </h2>
              <p className="text-sm md:text-base text-slate-500 mt-2 font-medium">
                {currentQuestion.subtitle}
              </p>
            </div>

            {/* Options grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((opt) => {
                const isSelected = selectedValue === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => selectOption(currentQuestion.key, opt.value)}
                    className={`text-left p-5 md:p-6 rounded-2xl border transition-all flex justify-between items-start cursor-pointer h-full ${
                      isSelected
                        ? 'bg-[#189D91]/10 border-[#189D91] shadow-md shadow-[#189D91]/5 text-slate-900'
                        : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm text-slate-700'
                    }`}
                  >
                    <div className="flex-1 pr-4">
                      <p className="font-display font-bold text-base md:text-lg leading-snug">{opt.label}</p>
                      <p className={`text-xs md:text-sm mt-1 leading-relaxed ${isSelected ? 'text-slate-600 font-medium' : 'text-slate-400 font-normal'}`}>{opt.desc}</p>
                    </div>
                    {isSelected && (
                      <span className="h-6 w-6 rounded-full bg-[#189D91] text-white flex items-center justify-center shadow-md animate-scale-up">
                        <FiCheck size={14} />
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer bar */}
      <div className="w-full max-w-4xl flex items-center justify-between border-t border-slate-200/60 pt-6">
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
          Step {currentStep + 1}
        </span>
        
        {currentStep === QUESTIONS.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={selectedValue === undefined}
            className={`px-8 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedValue !== undefined
                ? 'bg-[#EC008C] hover:bg-[#d8007e] text-white shadow-[#EC008C]/20 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            Finish & Generate <FiCheck />
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={selectedValue === undefined}
            className={`px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer ${
              selectedValue !== undefined
                ? 'bg-slate-800 hover:bg-slate-900 text-white hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            Next <FiArrowRight />
          </button>
        )}
      </div>
    </div>
  );
};

export default DesignerQuizPage;
