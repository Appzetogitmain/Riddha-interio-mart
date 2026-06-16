import React from 'react';
import { FiMapPin, FiClock, FiChevronRight, FiTruck } from 'react-icons/fi';
import { motion } from 'framer-motion';

const OrderCard = ({ order, onClick, onAssign }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending": return "text-amber-600 bg-amber-50 border-amber-100";
      case "Processing": return "text-blue-600 bg-blue-50 border-blue-100";
      case "Shipped": return "text-purple-600 bg-purple-50 border-purple-100";
      case "Delivered": return "text-green-600 bg-green-50 border-green-100";
      default: return "text-red-600 bg-red-50 border-red-100";
    }
  };

  const canAssign = order.status === 'Processing' && !order.deliveryBoy;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      {/* Main card row — tappable */}
      <div
        onClick={onClick}
        className="p-4 flex flex-col gap-3 active:bg-slate-50 transition-all cursor-pointer"
      >
        {/* Top row: order ID + status */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
              <FiClock size={15} />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                #{order._id.slice(-8).toUpperCase()}
              </p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                {new Date(order.createdAt).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>
          <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${getStatusStyle(order.status)}`}>
            {order.status}
          </span>
        </div>

        {/* Bottom row: customer + price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-seller-primary/10 text-seller-primary flex items-center justify-center font-black text-[10px]">
              {String(order.shippingAddress?.fullName || 'G').charAt(0)}
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-800 truncate max-w-[130px]">
                {order.shippingAddress?.fullName}
              </p>
              <p className="text-[9px] text-slate-400 flex items-center gap-1 uppercase tracking-tight mt-0.5">
                <FiMapPin size={8} /> {order.shippingAddress?.city}
              </p>
            </div>
          </div>
          <div className="text-right flex items-center gap-1.5">
            <div>
              <p className="text-sm font-black text-slate-900">₹{Number(order.totalPrice).toLocaleString()}</p>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider text-right">{order.paymentMethod}</p>
            </div>
            <FiChevronRight size={14} className="text-slate-300" />
          </div>
        </div>

        {/* Delivery boy assigned row */}
        {order.deliveryBoy && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            <FiTruck size={12} className="text-emerald-600 shrink-0" />
            <p className="text-[10px] font-bold text-emerald-700 truncate">
              {order.deliveryBoy?.fullName || 'Delivery partner assigned'}
            </p>
            <span className="ml-auto text-[9px] font-black text-emerald-600 uppercase tracking-wider shrink-0">
              {order.deliveryStatus || 'Assigned'}
            </span>
          </div>
        )}
      </div>

      {/* Assign button — shown at card bottom if applicable */}
      {canAssign && onAssign && (
        <button
          onClick={(e) => { e.stopPropagation(); onAssign(order); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-seller-primary/5 border-t border-seller-primary/10 text-seller-primary text-[10px] font-black uppercase tracking-widest hover:bg-seller-primary hover:text-white transition-all"
        >
          <FiTruck size={12} />
          Assign Delivery Partner
        </button>
      )}
    </motion.div>
  );
};

export default OrderCard;
