import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiFileText } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const Terms = () => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get('/terms/user');
        if (data.success && data.data) {
          setContent(data.data.content || '');
        }
      } catch (err) {
        console.error('Failed to fetch user terms:', err);
        setError('Failed to load terms and conditions.');
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
      className="py-16 md:py-24 bg-soft-oatmeal/5 min-h-screen"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12 space-y-4"
        >
          <div className="flex items-center gap-3 text-warm-sand mb-2">
            <FiFileText className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold">Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-deep-espresso">
            Terms & Conditions
          </h1>
          <p className="text-deep-espresso/50 text-base font-light leading-relaxed">
            Please review the Terms & Conditions governing our services.
          </p>
        </motion.div>

        {/* Content */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white border border-soft-oatmeal/30 rounded-[32px] p-8 md:p-12 shadow-xl shadow-soft-oatmeal/10"
          >
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="w-8 h-8 border-4 border-dusty-cocoa border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center border border-red-100 text-sm font-medium">
                {error}
              </div>
            ) : (
              <div className="text-deep-espresso/80 text-sm md:text-base font-medium leading-relaxed whitespace-pre-wrap">
                {content}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Terms;
