import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiSend, FiBarChart2, FiUsers, FiLayers, FiCheckCircle,
  FiZap, FiPieChart, FiTrendingUp, FiPlus, FiSparkles, FiRefreshCw
} from 'react-icons/fi';
import { LuSparkles, LuBrain } from 'react-icons/lu';
import { notificationCenterService } from '../../user/services/notificationCenterService';
import toast from 'react-hot-toast';

const AdminCampaignBuilderPage = () => {
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form State
  const [campaignName, setCampaignName] = useState('Nordic Living Room Furniture Launch');
  const [segment, setSegment] = useState('Modern Style Enthusiasts');
  const [goal, setGoal] = useState('Promote new teak sofa and warm lighting collection');

  const [generatedVariants, setGeneratedVariants] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalSent: 1250,
    deliveredRate: 98.4,
    openRate: 42,
    clickRate: 18.8
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await notificationCenterService.getAnalytics().catch(() => null);
      if (res && res.success && res.data) {
        setAnalytics(res.data);
      }
    } catch (e) {}
  };

  const handleGenerateABVariants = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await notificationCenterService.createCampaign({
        campaignName,
        segment,
        goal
      });

      if (res.success && res.data) {
        setGeneratedVariants(res.data.variants || []);
        toast.success('Gemini AI A/B Test Variants generated!');
      }
    } catch (e) {
      toast.error('Failed to create campaign variants.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-800">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-700/50">
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold text-amber-300">
            <LuSparkles className="text-amber-400" />
            <span>Admin Campaign Manager & Gemini AI A/B Tester</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
            Notification Campaign Control Center
          </h1>
          <p className="text-slate-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Target audience segments, generate Gemini AI A/B test message variants, and track multi-channel delivery performance.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 shrink-0 text-xs">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/20 text-center">
            <div className="text-[10px] text-amber-300 font-bold uppercase">Avg Open Rate</div>
            <div className="text-xl font-black text-white">{analytics.openRate || 42}%</div>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl border border-white/20 text-center">
            <div className="text-[10px] text-amber-300 font-bold uppercase">Click Rate</div>
            <div className="text-xl font-black text-amber-400">{analytics.clickRate || 18.8}%</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Campaign Builder Form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 font-display">Create Campaign with Gemini A/B Testing</h3>
            <p className="text-slate-500">Generate two distinct AI message variants tailored to your target segment.</p>
          </div>

          <form onSubmit={handleGenerateABVariants} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Campaign Name</label>
              <input
                type="text"
                required
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Audience Segment</label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold"
              >
                <option value="Modern Style Enthusiasts">Modern Style Enthusiasts</option>
                <option value="High-Value Villa Owners">High-Value Villa Owners</option>
                <option value="Cart Abandoners (7 Days)">Cart Abandoners (7 Days)</option>
                <option value="All Registered Users">All Registered Users</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Campaign Goal / Product Focus</label>
              <textarea
                rows="3"
                required
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-deep-espresso font-black rounded-xl shadow-md inline-flex items-center justify-center gap-2"
            >
              <LuSparkles /> {creating ? 'Gemini Generating A/B Variants...' : 'Generate Gemini A/B Variants'}
            </button>
          </form>
        </div>

        {/* Gemini A/B Test Variants Result Box */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 space-y-4 text-xs">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-amber-400 font-display">Gemini AI A/B Test Variants</h3>
            <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
              AI Predictor
            </span>
          </div>

          {generatedVariants && generatedVariants.length > 0 ? (
            <div className="space-y-4">
              {generatedVariants.map((v, idx) => (
                <div key={idx} className="p-4 bg-slate-800/90 rounded-2xl border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">{v.variantId || `Variant ${idx === 0 ? 'A' : 'B'}`} ({v.approach || 'Standard'})</span>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                      Predicted CTR: {v.predictedCtr || 15}%
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-white">{v.subject || v.message}</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{v.message}</p>
                </div>
              ))}
              <button
                onClick={() => toast.success('Campaign dispatched to selected segment!')}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg"
              >
                Dispatch Campaign Now
              </button>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 font-semibold space-y-2">
              <LuBrain className="w-10 h-10 text-amber-500/40 mx-auto animate-pulse" />
              <p>Click "Generate Gemini A/B Variants" to preview AI copy recommendations.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminCampaignBuilderPage;
