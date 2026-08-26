import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowRight, FiArrowLeft, FiCheckCircle, FiHome, FiDollarSign,
  FiClock, FiLayout, FiSliders, FiFileText, FiSave, FiZap
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const QUESTIONS = [
  {
    id: 1,
    title: 'Project Type',
    subtitle: 'What type of design project are you planning?',
    type: 'single-select',
    options: ['Full Renovation', 'Room Refresh', 'Single Item', 'Multi-Room', 'Commercial']
  },
  {
    id: 2,
    title: 'Room Type',
    subtitle: 'Which specific space are we focusing on?',
    type: 'single-select',
    options: [
      'Living Room', 'Bedroom', 'Kitchen', 'Dining Room', 'Office', 'Bathroom', 'Outdoor / Other',
      'Corporate Office', 'Retail / Shopping Center', 'Restaurant / Café', 'Hotel / Hospitality', 'Other Commercial Space'
    ]
  },
  {
    id: 3,
    title: 'Room Dimensions (Optional)',
    subtitle: 'Provide approximate dimensions of the space',
    type: 'text-input',
    placeholder: 'E.g., 15ft x 20ft or 4.5m x 6m'
  },
  {
    id: 4,
    title: 'Scope of Work',
    subtitle: 'Select all design aspects you need help with',
    type: 'multi-select',
    options: [
      'Furniture Selection', 'Color Scheme', 'Lighting Design',
      'Decor & Accessories', 'Floorplan & Layout', 'Flooring',
      'Wall Treatment & Paint', 'Custom Built-ins',
      'Signage & Branding', 'Reception / Front Desk Design',
      'HVAC & Ventilation Planning', 'Fire & Safety Compliance'
    ]
  },
  {
    id: 5,
    title: 'Total Budget (INR)',
    subtitle: 'Slide to select your estimated overall investment',
    type: 'budget-slider',
    min: 50000,
    max: 5000000,
    step: 50000,
    default: 300000
  },
  {
    id: 6,
    title: 'Project Timeline',
    subtitle: 'How urgently do you plan to start and complete execution?',
    type: 'single-select',
    options: [
      'ASAP (1-2 months)', 'Soon (2-4 months)',
      'Flexible (4-6 months)', 'No Time Pressure'
    ]
  },
  {
    id: 7,
    title: 'Preferred Design Style',
    subtitle: 'Which aesthetic best matches your vision?',
    type: 'single-select',
    options: [
      'Modern', 'Traditional', 'Minimalist', 'Industrial',
      'Bohemian', 'Luxury', 'Scandinavian', 'Eclectic', 'Not Sure'
    ]
  },
  {
    id: 8,
    title: 'Must-Have Requirements',
    subtitle: 'Specify key functional priorities, materials, or features',
    type: 'textarea',
    placeholder: 'E.g., pet-friendly fabrics, low maintenance materials, specific storage needs, home office desk space...'
  },
  {
    id: 9,
    title: 'Constraints & Limitations',
    subtitle: 'Select any site or budget constraints',
    type: 'multi-select',
    options: [
      'Pets (Durable Materials Required)',
      'Kids (Child-Safe Practical Design)',
      'Keep Existing Furniture',
      'Rental (Cannot Paint/Drill Walls)',
      'Structural / Layout Limitations',
      'Noise / Acoustic Considerations',
      'Fixed Strict Budget Limit'
    ]
  },
  {
    id: 10,
    title: 'Additional Context (Optional)',
    subtitle: 'Any additional preferences or design notes',
    type: 'textarea',
    placeholder: 'Share any extra thoughts, color dislikes, favorite inspirations or family lifestyle context...'
  }
];

const BriefForm = ({ onGenerate, onSaveAnswer, initialAnswers = {}, briefId }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState(() => {
    const map = {};
    if (Array.isArray(initialAnswers)) {
      initialAnswers.forEach(item => {
        map[item.questionId] = item.answer;
      });
    } else if (typeof initialAnswers === 'object') {
      Object.assign(map, initialAnswers);
    }
    return map;
  });

  const question = QUESTIONS[currentStep];

  const handleSelectOption = (value) => {
    setAnswers(prev => {
      const updated = { ...prev, [question.id]: value };
      if (onSaveAnswer && briefId) {
        onSaveAnswer(question.id, value);
      }
      return updated;
    });
  };

  const handleMultiSelectToggle = (value) => {
    setAnswers(prev => {
      const currentList = Array.isArray(prev[question.id]) ? prev[question.id] : [];
      let newList;
      if (currentList.includes(value)) {
        newList = currentList.filter(item => item !== value);
      } else {
        newList = [...currentList, value];
      }
      const updated = { ...prev, [question.id]: newList };
      if (onSaveAnswer && briefId) {
        onSaveAnswer(question.id, newList);
      }
      return updated;
    });
  };

  const handleNext = () => {
    // Basic validation for required questions
    const val = answers[question.id];
    if (question.type === 'single-select' && !val && question.id !== 3 && question.id !== 10) {
      toast.error(`Please select an option for ${question.title}`);
      return;
    }
    if (question.type === 'multi-select' && (!val || val.length === 0) && question.id === 4) {
      toast.error(`Please select at least one scope item`);
      return;
    }

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Submit & trigger generation
      const answersArray = Object.keys(answers).map(qId => ({
        questionId: Number(qId),
        answer: answers[qId]
      }));
      onGenerate(answersArray);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const progressPercentage = Math.round(((currentStep + 1) / QUESTIONS.length) * 100);
  const currentVal = answers[question.id];

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
      {/* Header & Progress Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950 text-white p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-400 rounded-full animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Question {currentStep + 1} of {QUESTIONS.length}
            </span>
          </div>
          <span className="text-xs font-black text-gray-400">{progressPercentage}% Completed</span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold mt-6 tracking-tight text-white">{question.title}</h2>
        <p className="text-sm text-gray-400 mt-1">{question.subtitle}</p>
      </div>

      {/* Form Content */}
      <div className="p-6 sm:p-8 min-h-[320px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full space-y-4"
          >
            {/* 1. Single Select Options */}
            {question.type === 'single-select' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {question.options.map((opt, i) => {
                  const isSelected = currentVal === opt;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className={`p-4 rounded-2xl border text-left font-bold text-sm transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-amber-700 shadow-sm'
                          : 'bg-gray-50 border-gray-100 text-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <FiCheckCircle className="text-amber-600" size={18} />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. Multi Select Options */}
            {question.type === 'multi-select' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {question.options.map((opt, i) => {
                  const isSelected = Array.isArray(currentVal) && currentVal.includes(opt);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleMultiSelectToggle(opt)}
                      className={`p-4 rounded-2xl border text-left font-bold text-sm transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-amber-700 shadow-sm'
                          : 'bg-gray-50 border-gray-100 text-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <FiCheckCircle className="text-amber-600" size={18} />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. Text Input */}
            {question.type === 'text-input' && (
              <div>
                <input
                  type="text"
                  value={currentVal || ''}
                  onChange={(e) => handleSelectOption(e.target.value)}
                  placeholder={question.placeholder}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-slate-800 font-medium text-sm focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>
            )}

            {/* 4. Textarea */}
            {question.type === 'textarea' && (
              <div>
                <textarea
                  rows={5}
                  value={currentVal || ''}
                  onChange={(e) => handleSelectOption(e.target.value)}
                  placeholder={question.placeholder}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-slate-800 font-medium text-sm focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>
            )}

            {/* 5. Budget Slider */}
            {question.type === 'budget-slider' && (
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-6">
                <div className="text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Estimated Total Investment</span>
                  <p className="text-3xl font-black text-amber-600 mt-1">
                    ₹{Number(currentVal || question.default).toLocaleString('en-IN')}
                  </p>
                </div>
                <input
                  type="range"
                  min={question.min}
                  max={question.max}
                  step={question.step}
                  value={currentVal || question.default}
                  onChange={(e) => handleSelectOption(Number(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-xs font-bold text-gray-400">
                  <span>₹50,000 (Starter)</span>
                  <span>₹2,500,000</span>
                  <span>₹5,000,000+ (Luxury)</span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-8 border-t border-gray-100 mt-8">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              currentStep === 0
                ? 'opacity-30 cursor-not-allowed text-gray-400'
                : 'bg-gray-100 hover:bg-gray-200 text-slate-700'
            }`}
          >
            <FiArrowLeft size={14} /> Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-deep-espresso rounded-xl text-xs font-extrabold tracking-wider uppercase flex items-center gap-2.5 shadow-lg shadow-amber-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {currentStep === QUESTIONS.length - 1 ? (
              <>
                <FiZap size={16} /> Generate Brief
              </>
            ) : (
              <>
                Next Question <FiArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BriefForm;
