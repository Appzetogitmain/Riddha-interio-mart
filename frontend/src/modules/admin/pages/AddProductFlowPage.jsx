import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { LuPlus, LuTags, LuArrowLeft, LuSparkles } from 'react-icons/lu';

const AddProductFlowPage = () => {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <div className="w-full space-y-6 py-6 md:py-8 pb-12">
        {/* Navigation / Back Button */}
        <button 
          onClick={() => navigate('/admin/inventory')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold transition-colors group text-xs uppercase tracking-wider"
        >
          <LuArrowLeft className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Inventory
        </button>

        {/* Compact Title & Subtitle */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center justify-center gap-2">
            <LuSparkles className="text-[var(--color-accent-pink)]" size={20} /> Create Listing Flow
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">How would you like to catalog this item?</p>
        </div>

        {/* Compact & Brand Color Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl mx-auto px-2">
          {/* Card 1: Create Fresh Listing */}
          <button 
            onClick={() => navigate('/admin/inventory/add')}
            className="group relative bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:border-[var(--color-primary)] hover:shadow-md transition-all duration-300 flex flex-col items-center text-center space-y-4"
          >
            <div className="w-12 h-12 bg-teal-50 text-[var(--color-primary)] rounded-xl flex items-center justify-center group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all duration-300">
              <LuPlus size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Create Fresh Item</h3>
              <p className="text-slate-400 text-[11px] font-medium leading-relaxed max-w-[220px]">
                Manually record and design a new product identity inside the master listing list.
              </p>
            </div>
            <div className="pt-2">
              <span className="px-4 py-2 bg-teal-50 text-[var(--color-primary)] rounded-lg text-[9px] font-bold uppercase tracking-wider group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all duration-300">
                Start Fresh Listing
              </span>
            </div>
          </button>

          {/* Card 2: Select From Catalog */}
          <Link 
            to="/admin/catalog"
            className="group relative bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:border-[var(--color-accent-pink)] hover:shadow-md transition-all duration-300 flex flex-col items-center text-center space-y-4"
          >
            <div className="w-12 h-12 bg-pink-50 text-[var(--color-accent-pink)] rounded-xl flex items-center justify-center group-hover:bg-[var(--color-accent-pink)] group-hover:text-white transition-all duration-300">
              <LuTags size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Select From Catalog</h3>
              <p className="text-slate-400 text-[11px] font-medium leading-relaxed max-w-[220px]">
                Pick an existing catalog model to immediately append to your live managed shop stock.
              </p>
            </div>
            <div className="pt-2">
              <span className="px-4 py-2 bg-pink-50 text-[var(--color-accent-pink)] rounded-lg text-[9px] font-bold uppercase tracking-wider group-hover:bg-[var(--color-accent-pink)] group-hover:text-white transition-all duration-300">
                Browse Master List
              </span>
            </div>
          </Link>
        </div>

        {/* Compact Admin Tip */}
        <div className="max-w-2xl mx-auto bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3 shadow-none">
            <div className="w-8 h-8 bg-teal-50 text-[var(--color-primary)] rounded-lg flex items-center justify-center shrink-0">
                <LuPlus size={16} />
            </div>
            <div className="space-y-0.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Admin Tip: Fast Track Listing</h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed uppercase">
                  Linking directly from the master catalog skips basic metadata setup, improving listing onboarding throughput by over 40%.
                </p>
            </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default AddProductFlowPage;
