import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiArrowLeft, FiMic, FiTrendingUp, FiClock, FiX, FiCamera } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const SearchBar = ({ className = '', variant = 'standard' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/search');
  };

  const handleAction = (e, type) => {
    e.stopPropagation();
    navigate('/search', { state: { autoStart: type } });
  };

  return (
    <div className={`relative flex-1 ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={handleClick}
        className="relative flex-1 group cursor-pointer"
      >
        {variant === 'standard' ? (
          <>
            <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400 group-focus-within:text-[#189D91] transition-colors" />
            </span>
            <input
              type="text"
              readOnly
              placeholder="Search products or brands..."
              className="w-full pl-12 pr-24 py-2.5 md:py-3 bg-white border border-gray-100 rounded-full focus:outline-none focus:ring-4 focus:ring-[#189D91]/10 focus:border-[#189D91]/20 transition-all duration-500 placeholder:text-gray-400 text-gray-600 text-sm font-medium shadow-sm cursor-pointer"
            />
            <div className="absolute inset-y-0 right-4 flex items-center gap-3">
              <button
                onClick={(e) => handleAction(e, 'voice')}
                className="p-1.5 text-gray-400 hover:text-[#189D91] hover:bg-gray-50 rounded-full transition-all"
              >
                <FiMic className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => handleAction(e, 'image')}
                className="p-1.5 text-gray-400 hover:text-[#189D91] hover:bg-gray-50 rounded-full transition-all"
              >
                <FiCamera className="h-5 w-5" />
              </button>
            </div>
          </>
        ) : variant === 'premium' ? (
          <div className="flex w-full items-center bg-[#F8FAFC] border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md focus-within:bg-white focus-within:border-[#28a399]/30 transition-all duration-300 relative h-11">
            <div className="flex-1 relative flex items-center h-full">
              {/* Mobile Search Icon */}
              <div className="md:hidden pl-4 pr-1">
                <FiSearch className="h-4 w-4 text-gray-400" />
              </div>

              <input
                type="text"
                readOnly
                placeholder="Search products, brands, materials, contractors..."
                className="w-full pl-3 md:pl-5 pr-24 py-2 bg-transparent focus:outline-none text-gray-700 text-[12px] md:text-sm font-medium cursor-pointer placeholder:text-gray-400/80"
              />
              <div className="absolute inset-y-0 right-3 flex items-center gap-2.5">
                <button
                  onClick={(e) => handleAction(e, 'image')}
                  className="p-1.5 text-gray-400 md:text-gray-500 hover:text-[#28a399] transition-colors"
                  title="Search by image"
                >
                  <FiCamera className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                <button
                  onClick={(e) => handleAction(e, 'voice')}
                  className="p-1.5 text-gray-400 md:text-gray-500 hover:text-[#28a399] transition-colors"
                  title="Search by voice"
                >
                  <FiMic className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </div>
            </div>
            <button className="hidden md:flex bg-[#28a399] hover:bg-[#003d33] text-white px-5 h-full transition-colors items-center justify-center rounded-r-xl border-l border-gray-200">
              <FiSearch className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex w-full">
            <input
              type="text"
              readOnly
              placeholder="Search for products or brands"
              className="w-full pl-6 pr-20 py-2.5 bg-white border-l border-t border-b border-gray-200 rounded-l-md focus:outline-none text-gray-700 text-sm font-medium cursor-pointer"
            />
            <div className="absolute inset-y-0 right-14 flex items-center gap-2">
              <button
                onClick={(e) => handleAction(e, 'voice')}
                className="p-1 text-gray-400 hover:text-[#189D91]"
              >
                <FiMic className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => handleAction(e, 'image')}
                className="p-1 text-gray-400 hover:text-[#189D91]"
              >
                <FiCamera className="h-4 w-4" />
              </button>
            </div>
            <button className="bg-white border-r border-t border-b border-gray-200 px-4 py-2.5 rounded-r-md transition-colors hover:bg-gray-50">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SearchBar;

