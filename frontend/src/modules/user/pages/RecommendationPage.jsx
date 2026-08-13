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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/30 text-emerald-200 rounded-full text-xs font-extrabold mb-3 backdrop-blur-md border border-emerald-400/40">
              <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>Gemini AI Personalization Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Your Custom Interior Feed</h1>
            <p className="text-sm font-medium text-gray-200 mt-2 max-w-2xl leading-relaxed">
              AI-generated recommendations calculated from your Quiz design profile, wishlist items, and real-time product browsing.
            </p>
          </div>

          <div className="flex items-center gap-3.5 bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg">
            <ShieldCheck className="w-8 h-8 text-emerald-300 shrink-0" />
            <div>
              <span className="text-xs font-black text-white block uppercase tracking-wider">Hyper-Personalized Matching</span>
              <span className="text-xs text-gray-200 font-medium">Scored using 50% Collaborative & 50% Gemini AI ranking.</span>
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
