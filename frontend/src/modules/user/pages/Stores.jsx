import React from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiPhone, FiClock } from 'react-icons/fi';

const storeData = [
  {
    name: 'Riddha Interio — Flagship Store',
    address: '123 Interior Hub, Design Street, Mumbai, MH 400001',
    phone: '+91 98765 43210',
    hours: 'Mon–Sat: 10 AM – 8 PM',
  },
  {
    name: 'Riddha Interio — Pune Showroom',
    address: '45 Décor Avenue, Koregaon Park, Pune, MH 411001',
    phone: '+91 98765 43211',
    hours: 'Mon–Sat: 10 AM – 7 PM',
  },
  {
    name: 'Riddha Interio — Nagpur Gallery',
    address: '78 Home Lane, Dharampeth, Nagpur, MH 440010',
    phone: '+91 98765 43212',
    hours: 'Mon–Sat: 11 AM – 7 PM',
  },
];

const Stores = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="py-16 md:py-24"
    >
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16 space-y-4"
        >
          <div className="flex items-center gap-3 text-warm-sand mb-2">
            <FiMapPin className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold">Locations</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-deep-espresso">
            Our Stores
          </h1>
          <p className="text-deep-espresso/50 text-lg font-light leading-relaxed max-w-2xl">
            Visit us in person to experience our premium tile, paint, and furniture collections. Our design consultants are here to help.
          </p>
        </motion.div>

        {/* Store Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {storeData.map((store, index) => (
            <motion.div
              key={store.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.1 }}
              className="bg-white border border-soft-oatmeal/30 rounded-2xl p-8 space-y-5 hover:shadow-lg hover:border-warm-sand/40 transition-all duration-300"
            >
              <h3 className="text-lg font-display font-bold text-deep-espresso">{store.name}</h3>
              <div className="space-y-3 text-sm text-deep-espresso/60 font-medium">
                <div className="flex items-start gap-3">
                  <FiMapPin className="h-4 w-4 text-warm-sand flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{store.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FiPhone className="h-4 w-4 text-warm-sand flex-shrink-0" />
                  <span>{store.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FiClock className="h-4 w-4 text-warm-sand flex-shrink-0" />
                  <span>{store.hours}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Stores;
