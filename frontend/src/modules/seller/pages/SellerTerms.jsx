import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiFileText, FiArrowLeft } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import logo from '../../../assets/transparent_logo.png';

const SellerTerms = () => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get('/terms/seller');
        if (data.success && data.data) {
          setContent(data.data.content || '');
        }
      } catch (err) {
        console.error('Failed to fetch seller terms:', err);
        setError('Failed to load seller terms and conditions.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTerms();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#FDF8F8] py-12 md:py-20 flex flex-col items-center px-4"
    >
      <div className="max-w-3xl w-full space-y-8">
        {/* Header Branding */}
        <div className="flex flex-col items-center space-y-4">
          <img src={logo} alt="Riddha Logo" className="h-20 w-auto object-contain" />
          <div className="flex items-center gap-2 text-[#E36666]">
            <FiFileText className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Merchant Partner Agreement</span>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-[#E36666]/5 border border-slate-100 p-6 md:p-12 space-y-6">
          <div className="border-b border-slate-100 pb-6">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-800">
              Seller Terms & Conditions
            </h1>
            <p className="text-slate-400 text-xs mt-2">
              Please read these terms carefully before completing your merchant registration.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-8 h-8 border-4 border-[#E36666] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-center border border-red-100 text-sm font-medium">
              {error}
            </div>
          ) : (
            <div className="text-slate-600 text-sm leading-relaxed font-normal whitespace-pre-wrap">
              {content}
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 flex justify-center">
            <button
              onClick={() => window.close()}
              className="px-6 py-3 bg-[#E36666] text-white rounded-xl font-semibold text-xs uppercase tracking-widest hover:bg-[#c95353] transition-all flex items-center gap-2 shadow-lg shadow-[#E36666]/20"
            >
              <FiArrowLeft /> Close Window
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SellerTerms;
