import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';
import api from '../../../shared/utils/api';

const WhatsAppFloat = ({ number, message = "Hi Riddha Interio, I'm interested in placing a bulk order." }) => {
  const [whatsappNum, setWhatsappNum] = useState(number || "9111661100");

  useEffect(() => {
    if (number) {
      setWhatsappNum(number);
      return;
    }
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data?.success && res.data?.data?.whatsappNumber) {
          setWhatsappNum(res.data.data.whatsappNumber);
        }
      } catch (err) {
        console.error("Failed to fetch settings for WhatsApp float:", err);
      }
    };
    fetchSettings();
  }, [number]);

  const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(message)}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-20 md:bottom-6 right-6 z-[9999] flex items-center justify-center w-13 h-13 md:w-15 md:h-15 bg-[#25D366] text-white rounded-full shadow-2xl hover:shadow-[#25D366]/50 transition-shadow duration-300 group print:hidden"
      aria-label="Contact on WhatsApp"
    >
      <div className="absolute -left-36 md:-left-44 top-1/2 -translate-y-1/2 bg-white text-gray-900 text-xs md:text-sm font-bold py-2 px-4 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap border border-gray-100">
        Bulk Order? Chat with us!
        <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-white rotate-45 border-t border-r border-gray-100"></div>
      </div>
      
      <motion.div
        animate={{ 
          scale: [1, 1.25, 1],
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
        className="absolute inset-0 bg-[#25D366] rounded-full opacity-25"
      />
      
      <FaWhatsapp className="text-3xl md:text-4xl relative z-10" />
    </motion.a>
  );
};

export default WhatsAppFloat;
