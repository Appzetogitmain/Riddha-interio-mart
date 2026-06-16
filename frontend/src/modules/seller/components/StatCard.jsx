import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const StatCard = ({ icon: Icon, label, value, trend, data, color = 'seller-primary', onClick, linkLabel }) => {
  const isPositive = trend >= 0;

  // Dummy sparkline data if none provided
  const chartData = data || [
    { value: 30 }, { value: 40 }, { value: 35 }, { value: 50 },
    { value: 45 }, { value: 60 }, { value: 55 }, { value: 70 }
  ];

  // Create a safe ID for the gradient by removing spaces and special characters
  const gradientId = `gradient-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all group${onClick ? ' cursor-pointer active:scale-[0.98]' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-seller-light/50 group-hover:text-seller-primary transition-all duration-300">
          <Icon size={18} strokeWidth={2.5} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-tight ${isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">{label}</p>
        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{value}</h3>
      </div>

      <div className="mt-4 h-12 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#10B981' : '#F43F5E'} stopOpacity={0.2}/>
                <stop offset="100%" stopColor={isPositive ? '#10B981' : '#F43F5E'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={isPositive ? '#10B981' : '#F43F5E'} 
              strokeWidth={2.5} 
              fillOpacity={1} 
              fill={`url(#${gradientId})`}
              isAnimationActive={true}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          vs. last month
        </span>
        {onClick && linkLabel ? (
          <span className="flex items-center gap-0.5 text-[9px] font-black text-seller-primary uppercase tracking-widest group-hover:gap-1.5 transition-all">
            {linkLabel} <ArrowRight size={10} />
          </span>
        ) : (
          <div className="w-1 h-1 rounded-full bg-slate-200"></div>
        )}
      </div>
    </motion.div>
  );
};

export default React.memo(StatCard);
