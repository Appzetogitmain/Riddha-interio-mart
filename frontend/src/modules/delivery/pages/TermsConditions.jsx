import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import { LuScale, LuShield, LuShieldCheck, LuBookOpen, LuFileText, LuArrowLeft } from 'react-icons/lu';
import api from '../../../shared/utils/api';
import logo from '../../../assets/transparent_logo.png';

const TermsConditions = () => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get('/terms/delivery');
        if (data.success && data.data) {
          setContent(data.data.content || '');
        }
      } catch (err) {
        console.error('Failed to fetch delivery terms:', err);
        setError('Failed to load delivery partner terms and conditions.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTerms();
  }, []);

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-8 px-4 md:px-6 py-8 md:py-12 pb-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Riddha Logo" className="h-14 w-auto object-contain hidden md:block" />
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-deep-espresso flex items-center gap-3">
                <LuScale className="text-[#2A458A]" /> Terms & Conditions
              </h1>
              <p className="text-slate-500 mt-2 text-sm">
                Review the legal guidelines, payout frameworks, and code of conduct for Riddha Delivery partners.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Terms Content (Left 2 columns) */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-10 shadow-sm">
              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="w-8 h-8 border-4 border-[#2A458A] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center border border-red-100 text-sm font-medium">
                  {error}
                </div>
              ) : (
                <div className="text-slate-600 text-sm leading-relaxed font-normal whitespace-pre-wrap">
                  {content}
                </div>
              )}
            </div>
          </div>

          {/* Legal Quick Cards (Right 1 column) */}
          <div className="space-y-6">
            {/* Quick Agreement Notice */}
            <div className="bg-gradient-to-br from-[#2A458A] to-[#1e3264] rounded-3xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <LuShield size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Agreement Consent</h4>
                  <p className="text-[10px] text-white/70">Updated Active</p>
                </div>
              </div>
              <p className="text-xs text-white/80 leading-relaxed font-normal">
                By logging in and performing active delivery dispatches, you legally consent to the latest platform policies, dynamic incentive structures, and safety codes outlined herein.
              </p>
              <div className="w-full h-px bg-white/10 my-4" />
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-white/70">Legal Consent Status:</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[9px]">Active</span>
              </div>
            </div>

            {/* Platform Help Center */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6">
              <h4 className="font-bold text-slate-800 text-sm mb-4">Support & Clarifications</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                    <LuBookOpen size={16} />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">Need Clarification?</h5>
                    <p className="text-[11px] text-slate-500 font-normal mt-0.5">Please check our Help Center for detailed FAQs or submit an inquiry to our support desk.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                    <LuFileText size={16} />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">Printable Version</h5>
                    <p className="text-[11px] text-slate-500 font-normal mt-0.5">Partners can request signed legal copies from local regional offices.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Close button for signup flow */}
            <div className="flex justify-center">
              <button
                onClick={() => window.close()}
                className="w-full py-3.5 bg-slate-800 text-white rounded-2xl font-semibold text-xs uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <LuArrowLeft /> Close Window
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default TermsConditions;
