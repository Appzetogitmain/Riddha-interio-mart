import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiDollarSign, FiMaximize2, FiLayers, FiClock, FiCheckCircle,
  FiZap, FiDownload, FiMail, FiBookmark, FiPlus, FiArrowLeft,
  FiChevronRight, FiPieChart, FiAlertCircle, FiCheck, FiRefreshCw,
  FiTrendingDown, FiShield
} from 'react-icons/fi';
import { LuSparkles, LuCalculator, LuBrain, LuPalette } from 'react-icons/lu';
import { estimatorService } from '../services/estimatorService';
import { useUser } from '../data/UserContext';
import toast from 'react-hot-toast';

const ROOM_TYPES = [
  // Residential
  'Living Room', 'Bedroom', 'Kitchen', 'Dining Room', 'Office', 'Bathroom', 'Other',
  // Commercial
  'Corporate Office', 'Retail / Shopping Center', 'Restaurant / Café', 'Hotel / Hospitality', 'Other Commercial Space'
];

const SCOPE_OPTIONS = [
  { id: 'Furniture Selection', label: 'Furniture Selection', desc: 'Sofa, beds, tables & seating' },
  { id: 'Color Scheme & Painting', label: 'Painting & Color Scheme', desc: 'Premium wall paints & finishes' },
  { id: 'Lighting Design', label: 'Lighting Design', desc: 'Ambient, task & accent fixtures' },
  { id: 'Decor & Accessories', label: 'Decor & Accessories', desc: 'Rug, curtains, artwork & decor' },
  { id: 'Space Layout/Reorganization', label: 'Space Layout Plan', desc: 'Ergonomic floorplan arrangement' },
  { id: 'Flooring', label: 'Flooring & Surfaces', desc: 'Tiles, hardwood, or laminate' },
  { id: 'Wall Treatment (Wallpaper, panels, etc.)', label: 'Wall Treatment', desc: 'Panels, wallpaper & textures' },
  { id: 'Custom Built-ins', label: 'Custom Built-ins', desc: 'Warderobes, cabinets & millwork' }
];

const MATERIAL_TIERS = [
  {
    id: 'economy',
    name: 'Economy Tier',
    tagline: 'Budget Conscious',
    desc: 'Durable local materials, standard finishes & cost-efficient fixtures.',
    badge: 'Lowest Cost',
    color: 'border-slate-300 bg-slate-50 text-slate-800'
  },
  {
    id: 'standard',
    name: 'Standard Tier',
    tagline: 'Balanced & Recommended',
    desc: 'High quality materials, balanced mix of local & imported items.',
    badge: 'Best Value',
    color: 'border-amber-400 bg-amber-50/50 text-amber-900 ring-2 ring-amber-500/20'
  },
  {
    id: 'premium',
    name: 'Premium Tier',
    tagline: 'High-End Luxury',
    desc: 'Imported luxury materials, bespoke joinery & custom designer finishes.',
    badge: 'Luxury Grade',
    color: 'border-purple-400 bg-purple-50/50 text-purple-900'
  }
];

const TIMELINE_OPTIONS = [
  { id: 'asap', label: 'ASAP (1-2 months)', fee: '+15% Rush Fee' },
  { id: 'soon', label: 'Soon (2-4 months)', fee: 'Standard Pricing' },
  { id: 'flexible', label: 'Flexible (4-6 months)', fee: '-10% Discount' },
  { id: 'no-hurry', label: 'No Hurry (6+ months)', fee: '-15% Discount' }
];

const ADDITIONAL_SERVICES = [
  'Professional installation',
  'Furniture disposal',
  '3D rendering',
  'Color consultation',
  'Material sampling',
  'Site visits',
  'Signage & branding',
  'HVAC & ventilation planning',
  'Fire & safety compliance',
  'Commercial kitchen equipment'
];

const CostEstimatorPage = () => {
  const { estimateId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();

  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [currentEstimate, setCurrentEstimate] = useState(null);

  // Form State
  const [dimensionMode, setDimensionMode] = useState('area'); // 'area' | 'length_width'
  const [areaInput, setAreaInput] = useState(400);
  const [lengthInput, setLengthInput] = useState(20);
  const [widthInput, setWidthInput] = useState(20);

  const [roomType, setRoomType] = useState('Living Room');
  const [selectedScope, setSelectedScope] = useState([
    'Furniture Selection', 'Color Scheme & Painting', 'Lighting Design', 'Decor & Accessories'
  ]);
  const [materialTier, setMaterialTier] = useState('standard');
  const [timeline, setTimeline] = useState('soon');
  const [additionalServices, setAdditionalServices] = useState(['Professional installation', '3D rendering']);

  // Modal / Action States
  const [emailInput, setEmailInput] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    if (estimateId) {
      fetchEstimateDetails(estimateId);
    }
  }, [estimateId]);

  const fetchEstimateDetails = async (id) => {
    setLoading(true);
    try {
      const res = await estimatorService.getEstimateById(id);
      if (res.success && res.data) {
        setCurrentEstimate(res.data);
        setRoomType(res.data.roomType || 'Living Room');
        setAreaInput(res.data.area || 400);
        setSelectedScope(res.data.scope || []);
        setMaterialTier(res.data.materialTier || 'standard');
        setTimeline(res.data.timeline || 'soon');
        setAdditionalServices(res.data.additionalServices || []);
      }
    } catch (e) {
      toast.error('Failed to load estimate details.');
    } finally {
      setLoading(false);
    }
  };

  const handleScopeToggle = (scopeId) => {
    if (selectedScope.includes(scopeId)) {
      setSelectedScope(selectedScope.filter(s => s !== scopeId));
    } else {
      setSelectedScope([...selectedScope, scopeId]);
    }
  };

  const handleServiceToggle = (service) => {
    if (additionalServices.includes(service)) {
      setAdditionalServices(additionalServices.filter(s => s !== service));
    } else {
      setAdditionalServices([...additionalServices, service]);
    }
  };

  const handleCalculateEstimate = async (e) => {
    if (e) e.preventDefault();

    const computedArea = dimensionMode === 'area'
      ? Number(areaInput)
      : Number(lengthInput) * Number(widthInput);

    if (!computedArea || computedArea <= 0) {
      toast.error('Please enter a valid room area.');
      return;
    }

    setCalculating(true);
    try {
      toast.loading('Calculating costs & AI analysis...', { id: 'estimator-toast' });
      const res = await estimatorService.createEstimate({
        estimateName: `${roomType} (${computedArea} sq ft) Estimate`,
        roomType,
        area: computedArea,
        dimensions: {
          length: Number(lengthInput) || 20,
          width: Number(widthInput) || 20,
          unit: 'ft'
        },
        scope: selectedScope,
        materialTier,
        timeline,
        additionalServices
      });

      if (res.success && res.data) {
        toast.success('Cost estimate calculated successfully!', { id: 'estimator-toast' });
        setCurrentEstimate(res.data);
        // Smooth scroll to results
        setTimeout(() => {
          const el = document.getElementById('estimate-results-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    } catch (e) {
      toast.error('Calculation failed. Please try again.', { id: 'estimator-toast' });
    } finally {
      setCalculating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!currentEstimate) return;
    try {
      setDownloadingPdf(true);
      toast.loading('Preparing PDF estimate...', { id: 'pdf-toast' });
      await estimatorService.downloadEstimatePDF(currentEstimate._id, currentEstimate.estimateName);
      toast.success('PDF report downloaded!', { id: 'pdf-toast' });
    } catch (e) {
      toast.error('Failed to download PDF.', { id: 'pdf-toast' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleEmailClient = async (e) => {
    e.preventDefault();
    if (!currentEstimate || !emailInput.trim()) {
      toast.error('Please enter a valid recipient email.');
      return;
    }
    try {
      setSendingEmail(true);
      const res = await estimatorService.emailEstimate(currentEstimate._id, emailInput.trim());
      if (res.success) {
        toast.success(`Estimate emailed to ${emailInput.trim()}!`);
        setEmailInput('');
      }
    } catch (e) {
      toast.error('Failed to send email estimate.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!currentEstimate) return;
    try {
      setSavingTemplate(true);
      const res = await estimatorService.saveAsTemplate(currentEstimate._id, `Template: ${roomType}`);
      if (res.success) {
        toast.success('Saved as estimate template!');
      }
    } catch (e) {
      toast.error('Failed to save template.');
    } finally {
      setSavingTemplate(false);
    }
  };

  const computedArea = dimensionMode === 'area'
    ? Number(areaInput)
    : Number(lengthInput) * Number(widthInput);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Hero Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-700/50">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold text-amber-300">
              <LuSparkles className="text-amber-400" />
              <span>AI Cost Estimator Studio</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-black text-white tracking-tight">Interior Cost Estimator</h1>
            <p className="text-slate-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Calculate instant itemized cost breakdowns by room area, design scope, and material quality tiers with AI budget recommendations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setAreaInput(400);
                setSelectedScope(['Furniture Selection', 'Color Scheme & Painting', 'Lighting Design']);
                setMaterialTier('standard');
                setCurrentEstimate(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm transition-all border border-white/20 inline-flex items-center gap-2"
            >
              <FiRefreshCw /> Reset Form
            </button>
          </div>
        </div>

        {/* FEATURE 1: COST ESTIMATION FORM */}
        <form onSubmit={handleCalculateEstimate} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-lg">
              1
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">Configure Project Specifications</h2>
              <p className="text-xs text-slate-500">Provide room dimensions, design scope, material quality tier & timeline requirements.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* 1.1 Room Dimensions & Room Type */}
            <div className="space-y-6">
              {/* Room Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">1. Select Room Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ROOM_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRoomType(type)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${roomType === type
                        ? 'bg-amber-500 text-deep-espresso border-amber-500 font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimensions Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">2. Room Dimensions</label>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setDimensionMode('area')}
                      className={`px-2.5 py-1 rounded-md transition-all ${dimensionMode === 'area' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                    >
                      Total Area (sq ft)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDimensionMode('length_width')}
                      className={`px-2.5 py-1 rounded-md transition-all ${dimensionMode === 'length_width' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                    >
                      Length × Width
                    </button>
                  </div>
                </div>

                {dimensionMode === 'area' ? (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <input
                        type="number"
                        min="50"
                        max="10000"
                        value={areaInput}
                        onChange={(e) => setAreaInput(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                      <span className="absolute right-4 top-3 text-xs font-bold text-slate-400">sq ft</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Calculated for {areaInput} sq ft space (Approx: {Math.round(areaInput / 10.764)} sq meters)</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Length (ft)</label>
                      <input
                        type="number"
                        min="5"
                        value={lengthInput}
                        onChange={(e) => setLengthInput(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Width (ft)</label>
                      <input
                        type="number"
                        min="5"
                        value={widthInput}
                        onChange={(e) => setWidthInput(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 1.4 Material Quality Tier */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">3. Material Quality Tier</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {MATERIAL_TIERS.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setMaterialTier(t.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${materialTier === t.id
                        ? 'border-amber-500 bg-amber-50/70 shadow-md ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                        }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs text-slate-900">{t.name}</span>
                        {materialTier === t.id && <span className="text-amber-600 font-bold text-xs">✓</span>}
                      </div>
                      <p className="text-[10px] text-amber-800 font-medium mb-1">{t.tagline}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">{t.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 1.3 Design Scope & Additional Options */}
            <div className="space-y-6">
              {/* Scope Multi-Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">4. Design Scope (Multi-Select)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SCOPE_OPTIONS.map(item => {
                    const isSelected = selectedScope.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleScopeToggle(item.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${isSelected
                          ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100 text-slate-700'
                          }`}
                      >
                        <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center text-[10px] font-bold ${isSelected ? 'bg-amber-500 border-amber-500 text-deep-espresso' : 'bg-white border-slate-300'
                          }`}>
                          {isSelected && '✓'}
                        </div>
                        <div>
                          <div className="text-xs font-bold">{item.label}</div>
                          <div className="text-[10px] text-slate-500">{item.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 1.5 Timeline Urgency */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">5. Timeline Urgency</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TIMELINE_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTimeline(opt.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${timeline === opt.id
                        ? 'bg-deep-espresso text-white border-deep-espresso shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                      <div className="text-xs font-bold">{opt.label.split(' ')[0]}</div>
                      <div className={`text-[10px] mt-0.5 ${timeline === opt.id ? 'text-amber-300 font-semibold' : 'text-slate-500'}`}>{opt.fee}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 1.6 Additional Services Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">6. Additional Services</label>
                <div className="flex flex-wrap gap-2">
                  {ADDITIONAL_SERVICES.map(service => {
                    const isChecked = additionalServices.includes(service);
                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => handleServiceToggle(service)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${isChecked
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                      >
                        {isChecked ? `✓ ${service}` : `+ ${service}`}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Submit Calculation Button */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={calculating}
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-black text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
            >
              <LuCalculator className="text-lg" />
              <span>{calculating ? 'Calculating Cost & AI Analysis...' : 'Calculate Cost & AI Analysis'}</span>
            </button>
          </div>
        </form>

        {/* WORKSPACE RESULTS DISPLAY */}
        {currentEstimate && (
          <div id="estimate-results-section" className="space-y-8">

            {/* FEATURE 4.1: ESTIMATE SUMMARY VIEW */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 uppercase mb-1">
                    <FiCheckCircle /> <span>Estimate Calculated Successfully</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">{currentEstimate.estimateName}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Room: <span className="font-semibold text-slate-700">{currentEstimate.roomType}</span> ({currentEstimate.area} sq ft) | Tier: <span className="font-semibold text-slate-700">{currentEstimate.materialTier.toUpperCase()}</span> | Timeline: <span className="font-semibold text-slate-700">{currentEstimate.timeline.toUpperCase()}</span>
                  </p>
                </div>

                {/* Grand Total Hero Box */}
                <div className="bg-gradient-to-br from-slate-900 to-amber-950 p-6 rounded-2xl text-white min-w-[240px] space-y-1 shadow-xl border border-slate-800">
                  <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider">Estimated Grand Total</span>
                  <div className="text-3xl sm:text-4xl font-black text-amber-400">
                    Rs. {(currentEstimate.costBreakdown?.grandTotal || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-300">
                    Rs. {currentEstimate.costBreakdown?.costPerSqFt || 0} / sq ft (Includes 10% contingency)
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPdf}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5"
                  >
                    <FiDownload /> {downloadingPdf ? 'Preparing PDF...' : 'Download PDF Report'}
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    disabled={savingTemplate}
                    className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5"
                  >
                    <FiBookmark className="text-amber-600" /> {savingTemplate ? 'Saving...' : 'Save as Template'}
                  </button>
                </div>

                {/* Email Direct Input */}
                <form onSubmit={handleEmailClient} className="flex items-center space-x-2 w-full sm:w-auto">
                  <input
                    type="email"
                    required
                    placeholder="Client email address..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs flex-1 sm:w-64 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    <FiMail /> {sendingEmail ? 'Sending...' : 'Email Client'}
                  </button>
                </form>
              </div>
            </div>

            {/* FEATURE 4.4: 3-TIER SIDE-BY-SIDE COMPARISON */}
            {currentEstimate.aiAnalysis?.tierComparison && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">3-Tier Side-by-Side Quality Comparison</h3>
                  <p className="text-xs text-slate-500">Compare Economy, Standard, and Premium material tier cost projections for your space.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Economy Tier */}
                  <div className={`p-6 rounded-2xl border space-y-4 ${currentEstimate.materialTier === 'economy' ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20' : 'bg-slate-50/60 border-slate-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-base">Economy Tier</span>
                      <span className="text-xs bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-semibold">Budget</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      Rs. {(currentEstimate.aiAnalysis.tierComparison.economy || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-slate-500">Basic materials, locally sourced standard finishes.</p>
                  </div>

                  {/* Standard Tier */}
                  <div className={`p-6 rounded-2xl border space-y-4 ${currentEstimate.materialTier === 'standard' ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20' : 'bg-slate-50/60 border-slate-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-900 text-base">Standard Tier</span>
                      <span className="text-xs bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full font-bold">Recommended</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-800">
                      Rs. {(currentEstimate.aiAnalysis.tierComparison.standard || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-amber-900">Balanced high-grade materials and premium hardware.</p>
                  </div>

                  {/* Premium Tier */}
                  <div className={`p-6 rounded-2xl border space-y-4 ${currentEstimate.materialTier === 'premium' ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20' : 'bg-slate-50/60 border-slate-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-purple-900 text-base">Premium Tier</span>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-bold">Luxury</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      Rs. {(currentEstimate.aiAnalysis.tierComparison.premium || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-purple-900">Imported luxury fixtures and custom bespoke joinery.</p>
                  </div>
                </div>
              </div>
            )}

            {/* FEATURE 4.2: DETAILED CATEGORY BREAKDOWN TABLE */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900 font-display">Itemized Cost Breakdown Table</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 text-slate-900 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="px-4 py-3 rounded-l-xl">Cost Category</th>
                      <th className="px-4 py-3">Description / Calculation Basis</th>
                      <th className="px-4 py-3 text-right rounded-r-xl">Estimated Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentEstimate.costBreakdown?.furniture > 0 && (
                      <tr>
                        <td className="px-4 py-3.5 font-bold text-slate-900">Furniture & Built-ins</td>
                        <td className="px-4 py-3.5 text-slate-500">Living/Bed seating, modular wardrobes, and custom millwork</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-slate-900">Rs. {currentEstimate.costBreakdown.furniture.toLocaleString()}</td>
                      </tr>
                    )}
                    {currentEstimate.costBreakdown?.flooring > 0 && (
                      <tr>
                        <td className="px-4 py-3.5 font-bold text-slate-900">Flooring & Surfaces</td>
                        <td className="px-4 py-3.5 text-slate-500">Ceramic, vitrified tiles, or wooden flooring materials</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-slate-900">Rs. {currentEstimate.costBreakdown.flooring.toLocaleString()}</td>
                      </tr>
                    )}
                    {currentEstimate.costBreakdown?.lighting > 0 && (
                      <tr>
                        <td className="px-4 py-3.5 font-bold text-slate-900">Lighting & Fixtures</td>
                        <td className="px-4 py-3.5 text-slate-500">Ambient, task, chandeliers, and decorative wall fixtures</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-slate-900">Rs. {currentEstimate.costBreakdown.lighting.toLocaleString()}</td>
                      </tr>
                    )}
                    {currentEstimate.costBreakdown?.decor > 0 && (
                      <tr>
                        <td className="px-4 py-3.5 font-bold text-slate-900">Decor & Soft Furnishings</td>
                        <td className="px-4 py-3.5 text-slate-500">Rugs, drapes, cushions, artwork, and accent accessories</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-slate-900">Rs. {currentEstimate.costBreakdown.decor.toLocaleString()}</td>
                      </tr>
                    )}
                    {currentEstimate.costBreakdown?.paint > 0 && (
                      <tr>
                        <td className="px-4 py-3.5 font-bold text-slate-900">Paint & Wall Treatment</td>
                        <td className="px-4 py-3.5 text-slate-500">Wall texture, wallpaper, and premium acrylic emulsion paint</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-slate-900">Rs. {currentEstimate.costBreakdown.paint.toLocaleString()}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="px-4 py-3.5 font-bold text-slate-900">Labor & Installation</td>
                      <td className="px-4 py-3.5 text-slate-500">Contractor fees, carpentry, electrical layout, and fitting labor</td>
                      <td className="px-4 py-3.5 text-right font-semibold text-slate-900">Rs. {(currentEstimate.costBreakdown?.labor || 0).toLocaleString()}</td>
                    </tr>
                    {currentEstimate.costBreakdown?.additionalServices > 0 && (
                      <tr>
                        <td className="px-4 py-3.5 font-bold text-slate-900">Additional Services</td>
                        <td className="px-4 py-3.5 text-slate-500">{currentEstimate.additionalServices?.join(', ')}</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-slate-900">Rs. {currentEstimate.costBreakdown.additionalServices.toLocaleString()}</td>
                      </tr>
                    )}
                    <tr className="bg-slate-50/80 font-bold text-slate-900">
                      <td colSpan="2" className="px-4 py-3.5">Subtotal</td>
                      <td className="px-4 py-3.5 text-right">Rs. {(currentEstimate.costBreakdown?.subtotal || 0).toLocaleString()}</td>
                    </tr>
                    {currentEstimate.costBreakdown?.timelineAdjustment !== 0 && (
                      <tr className="text-amber-800">
                        <td colSpan="2" className="px-4 py-3.5">Timeline Adjustment ({currentEstimate.timeline})</td>
                        <td className="px-4 py-3.5 text-right">Rs. {(currentEstimate.costBreakdown?.timelineAdjustment || 0).toLocaleString()}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan="2" className="px-4 py-3.5 text-slate-600">Contingency Reserve (10%)</td>
                      <td className="px-4 py-3.5 text-right text-slate-700">Rs. {(currentEstimate.costBreakdown?.contingency || 0).toLocaleString()}</td>
                    </tr>
                    <tr className="bg-emerald-50 text-emerald-900 text-sm font-bold">
                      <td colSpan="2" className="px-4 py-4 rounded-l-xl">Grand Total Project Estimate</td>
                      <td className="px-4 py-4 text-right rounded-r-xl">Rs. {(currentEstimate.costBreakdown?.grandTotal || 0).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* FEATURE 3: AI ANALYSIS & OPTIMIZATIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Cost Allocation Narrative */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 text-amber-700 font-bold text-base font-display">
                  <LuBrain className="text-amber-600 text-xl" />
                  <span>AI Budget Analysis</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {currentEstimate.aiAnalysis?.costBreakdownAnalysis || 'Cost allocation is well balanced across primary categories.'}
                </p>
              </div>

              {/* Optimization Suggestions */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 text-emerald-700 font-bold text-base font-display">
                  <FiTrendingDown className="text-emerald-600 text-xl" />
                  <span>AI Cost Optimizations</span>
                </div>
                <div className="space-y-3">
                  {currentEstimate.aiAnalysis?.optimizationSuggestions?.map((opt, i) => (
                    <div key={i} className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <p className="font-semibold text-emerald-900">{opt.suggestion}</p>
                        <span className="text-[10px] text-emerald-700 font-medium uppercase">Impact: {opt.impact || 'low'}</span>
                      </div>
                      <span className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-full text-[11px] shrink-0">
                        Save Rs. {(opt.savings || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default CostEstimatorPage;
