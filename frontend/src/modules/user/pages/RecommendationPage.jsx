import React from 'react';
import { Sparkles, Compass, ShieldCheck } from 'lucide-react';
import RecommendationFeed from '../components/RecommendationFeed';
import BundleRecommendation from '../components/BundleRecommendation';

const RecommendationPage = () => {
  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      {/* Hero Banner */}
      <div className="bg-linear-to-r from-emerald-950 via-gray-900 to-emerald-900 text-white py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold mb-3 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Gemini AI Personalization Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Your Custom Interior Feed</h1>
            <p className="text-sm text-gray-300 mt-2 max-w-2xl">
              AI-generated recommendations calculated from your Quiz design profile, wishlist items, and real-time product browsing.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-white block">Hyper-Personalized Matching</span>
              <span className="text-[11px] text-gray-300">Scored using 50% Collaborative & 50% Gemini AI ranking.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Feed Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <RecommendationFeed />
        
        {/* Room Bundles Section */}
        <div className="mt-12">
          <BundleRecommendation roomType="Living Room" defaultStyle="Modern" />
        </div>
      </div>
    </div>
  );
};

export default RecommendationPage;
