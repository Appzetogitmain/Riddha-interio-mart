import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Compass, Image as ImageIcon, Layout, Zap, Camera, PenTool,
  MessageSquare, Clipboard, Folder, Calculator, List, FileText, Truck, Bell, Edit,
  ArrowRight
} from 'lucide-react';

// Registry icon names -> lucide components.
const ICONS = {
  sparkles: Sparkles,
  compass: Compass,
  image: ImageIcon,
  layout: Layout,
  zap: Zap,
  camera: Camera,
  'pen-tool': PenTool,
  'message-square': MessageSquare,
  clipboard: Clipboard,
  folder: Folder,
  calculator: Calculator,
  list: List,
  'file-text': FileText,
  truck: Truck,
  bell: Bell,
  edit: Edit
};

/**
 * Surfaces features the user hasn't tried yet, nearest to their current stage.
 * Drives cross-feature discovery — the core goal of Requirement #17.
 */
const FeatureRecommendation = ({ features = [], title = 'Things you might find useful' }) => {
  if (!features.length) return null;

  return (
    <section>
      <h3 className="text-sm font-bold text-gray-900 mb-3">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {features.map((feature) => {
          const Icon = ICONS[feature.icon] || Sparkles;
          return (
            <Link
              key={feature.id || feature.featureId}
              to={feature.route}
              className="group bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-[#189D91]/30 transition-all flex items-start gap-3"
            >
              <span className="w-9 h-9 rounded-xl bg-[#189D91]/10 text-[#189D91] flex items-center justify-center shrink-0">
                <Icon size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-[13px] font-bold text-gray-900 truncate">{feature.label}</span>
                  <ArrowRight size={12} className="text-gray-300 group-hover:text-[#189D91] transition-colors shrink-0" />
                </span>
                <span className="block text-[11px] text-gray-500 leading-snug mt-0.5">{feature.blurb}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default FeatureRecommendation;
