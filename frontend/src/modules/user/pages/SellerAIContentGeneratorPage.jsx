import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiEdit3, FiCopy, FiCheck, FiUploadCloud, FiTag, FiFileText,
  FiShare2, FiMail, FiGlobe, FiLayers, FiRefreshCw, FiZap,
  FiBookOpen, FiDollarSign, FiSearch, FiExternalLink, FiSliders
} from 'react-icons/fi';
import { LuSparkles, LuBrain, LuPenTool, LuBoxes, LuTrendingUp } from 'react-icons/lu';
import { contentGeneratorService } from '../services/contentGeneratorService';
import toast from 'react-hot-toast';

const CONTENT_TYPES = [
  { id: 'description', label: 'Product Description', icon: FiFileText, desc: 'Full engaging benefits, features & care instructions' },
  { id: 'title', label: 'Product Titles (4 Variants)', icon: LuPenTool, desc: 'SEO, Marketing, Catchy & Luxury title options' },
  { id: 'meta_description', label: 'SEO Meta Description', icon: FiSearch, desc: '150-160 char Google search snippets' },
  { id: 'hashtags_keywords', label: 'Hashtags & Keywords', icon: FiTag, desc: 'Instagram hashtags & long-tail SEO terms' },
  { id: 'social_post', label: 'Social Media Copy', icon: FiShare2, desc: 'Instagram captions & Facebook posts with emojis' },
  { id: 'email_body', label: 'Email Campaign', icon: FiMail, desc: 'Subject lines & persuasive HTML email copy' },
  { id: 'blog_post', label: 'SEO Blog Article', icon: FiBookOpen, desc: 'Long-form H1/H2 markdown articles' },
  { id: 'ab_test', label: 'A/B Test Copy Variants', icon: FiSliders, desc: 'Variant A vs Variant B with predicted CTRs' }
];

const SellerAIContentGeneratorPage = () => {
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'library'
  const [selectedType, setSelectedType] = useState('description');
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form Inputs
  const [productName, setProductName] = useState('Nordic Solid Teak Sectional Sofa');
  const [category, setCategory] = useState('Living Room Furniture');
  const [features, setFeatures] = useState('Solid plantation teak frame, Stain-resistant velvet fabric, Modular L-shape');
  const [materials, setMaterials] = useState('Teak Wood, Velvet Upholstery, High-Density Cushioning');
  const [tone, setTone] = useState('luxury');
  const [length, setLength] = useState('medium');
  const [targetAudience, setTargetAudience] = useState('Modern homeowners & villa luxury interiors');

  // Output Generated Content
  const [generatedOutput, setGeneratedOutput] = useState(null);
  const [editableBody, setEditableBody] = useState('');

  // Seller Library
  const [libraryContent, setLibraryContent] = useState([]);

  useEffect(() => {
    if (activeTab === 'library') fetchLibrary();
  }, [activeTab]);

  const fetchLibrary = async () => {
    try {
      const res = await contentGeneratorService.getSellerLibrary().catch(() => null);
      if (res && res.success && res.data) {
        setLibraryContent(res.data.content || []);
      } else {
        setLibraryContent([
          {
            _id: 'lib-1',
            contentType: 'description',
            content: { title: 'Nordic Teak Sofa', body: 'Handcrafted solid teak modular sectional sofa with stain-resistant velvet fabric.' },
            status: 'published',
            createdAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            _id: 'lib-2',
            contentType: 'social_post',
            content: { title: 'Instagram Caption', body: '✨ Elevate your home with our Nordic Teak Collection! Tap link in bio.' },
            status: 'draft',
            createdAt: new Date(Date.now() - 7200000).toISOString()
          }
        ]);
      }
    } catch (e) {}
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setCopied(false);
    try {
      const res = await contentGeneratorService.generateContent({
        name: productName,
        category,
        features: features.split(',').map(f => f.trim()),
        materials,
        targetAudience,
        contentType: selectedType === 'ab_test' ? 'description' : selectedType,
        tone,
        length,
        generateVariants: selectedType === 'ab_test'
      });

      if (res.success && res.data) {
        setGeneratedOutput(res.data);
        setEditableBody(res.data.content?.body || '');
        toast.success('Gemini AI generated content successfully!');
      }
    } catch (e) {
      toast.error('Failed to generate content with Gemini AI.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!editableBody) return;
    navigator.clipboard.writeText(editableBody);
    setCopied(true);
    toast.success('Content copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePublishToProduct = async () => {
    if (!generatedOutput) return;
    setPublishing(true);
    try {
      const res = await contentGeneratorService.publishContent(generatedOutput._id, {
        targetField: selectedType === 'title' ? 'title' : 'description'
      });
      if (res.success) {
        toast.success('1-Click published to product listing!');
        setGeneratedOutput(prev => ({ ...prev, status: 'published' }));
      }
    } catch (e) {
      toast.error('Failed to publish content.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-700/50">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold text-amber-300">
              <LuSparkles className="text-amber-400" />
              <span>Seller AI Content Generator with Gemini</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-black text-white tracking-tight">
              AI Copywriting & Marketing Studio
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Auto-generate high-converting product descriptions, SEO meta titles, hashtags, social media posts, email campaigns, and A/B test variants in seconds.
            </p>
          </div>

          <div className="flex gap-2 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'studio' ? 'bg-amber-500 text-deep-espresso shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              AI Studio Workspace
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'library' ? 'bg-amber-500 text-deep-espresso shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Content Library
            </button>
          </div>
        </div>

        {activeTab === 'studio' && (
          <div className="space-y-6">

            {/* 8 Content Types Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {CONTENT_TYPES.map((type) => {
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-amber-500 text-amber-400 ring-2 ring-amber-500/40 shadow-lg'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <type.icon className={isSelected ? 'text-amber-400 text-lg' : 'text-slate-400 text-lg'} />
                    <div className="mt-2">
                      <div className="font-extrabold text-[11px] leading-snug">{type.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left Column: Product Inputs Form */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 font-display">Product & Tone Input</h3>
                  <p className="text-slate-500">Provide basic product attributes for Gemini AI copywriting.</p>
                </div>

                <form onSubmit={handleGenerate} className="space-y-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Product Title / Name</label>
                    <input
                      type="text"
                      required
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Category</label>
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tone & Brand Voice</label>
                      <select
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold"
                      >
                        <option value="luxury">Luxury & Premium</option>
                        <option value="professional">Professional & Direct</option>
                        <option value="casual">Casual & Conversational</option>
                        <option value="budget">Budget & Value-Focused</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Key Features (Comma separated)</label>
                    <textarea
                      rows="2"
                      value={features}
                      onChange={(e) => setFeatures(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Materials & Craftsmanship</label>
                    <input
                      type="text"
                      value={materials}
                      onChange={(e) => setMaterials(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Customer Audience</label>
                    <input
                      type="text"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={generating}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-deep-espresso font-black text-sm rounded-xl shadow-md inline-flex items-center justify-center gap-2"
                  >
                    <LuSparkles /> {generating ? 'Gemini Generating Content...' : '⚡ Generate Content with Gemini AI'}
                  </button>
                </form>
              </div>

              {/* Right Column: AI Output & Editing Workspace */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 space-y-4 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-amber-400 font-display">Generated Output Workspace</h3>
                      {generatedOutput?.status && (
                        <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/40">
                          {generatedOutput.status}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyToClipboard}
                        disabled={!editableBody}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl font-bold text-[11px] inline-flex items-center gap-1"
                      >
                        <FiCopy /> {copied ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={handlePublishToProduct}
                        disabled={!generatedOutput || publishing}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-deep-espresso rounded-xl font-bold text-[11px] inline-flex items-center gap-1 shadow-sm"
                      >
                        <FiUploadCloud /> {publishing ? 'Publishing...' : '1-Click Publish'}
                      </button>
                    </div>
                  </div>

                  {/* Generated Content Editable Area */}
                  {generatedOutput ? (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Generated Title / Hook
                        </label>
                        <div className="font-extrabold text-white text-sm bg-slate-950 p-3 rounded-xl border border-slate-800">
                          {generatedOutput.content?.title || productName}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Body Content (Editable)
                        </label>
                        <textarea
                          rows="8"
                          value={editableBody}
                          onChange={(e) => setEditableBody(e.target.value)}
                          className="w-full p-3.5 bg-slate-950 text-slate-200 border border-slate-800 rounded-2xl font-mono leading-relaxed focus:outline-none focus:border-amber-500"
                        ></textarea>
                      </div>

                      {/* Hashtags & Keywords Pills */}
                      {(generatedOutput.content?.hashtags?.length > 0 || generatedOutput.content?.keywords?.length > 0) && (
                        <div className="space-y-2 pt-2">
                          <span className="text-[10px] font-bold text-amber-400 uppercase">Hashtags & Keywords</span>
                          <div className="flex flex-wrap gap-1.5">
                            {[...(generatedOutput.content.hashtags || []), ...(generatedOutput.content.keywords || [])].map((tag, idx) => (
                              <span key={idx} className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2.5 py-1 rounded-full border border-slate-700">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* A/B Test Variants Drawer */}
                      {generatedOutput.variants?.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                          <span className="text-[10px] font-bold text-amber-400 uppercase">A/B Test Variants</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {generatedOutput.variants.map((v, idx) => (
                              <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                                <div className="flex justify-between font-bold text-amber-300">
                                  <span>{v.variantId}</span>
                                  <span className="text-[10px] text-emerald-400">{v.predictedCtr}% CTR</span>
                                </div>
                                <p className="text-[11px] text-slate-300 leading-snug">{v.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-slate-400 space-y-3">
                      <LuBrain className="w-12 h-12 text-amber-500/40 mx-auto animate-pulse" />
                      <p className="font-semibold text-xs max-w-xs mx-auto">Fill in product details and click "Generate Content with Gemini AI" to start.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Content Library Tab */}
        {activeTab === 'library' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 font-display">Seller Content Library</h3>
            <div className="space-y-3">
              {libraryContent.map((item) => (
                <div key={item._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{item.content?.title || 'Generated Item'}</span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                        {item.contentType}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs mt-1 max-w-2xl truncate">{item.content?.body}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    item.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SellerAIContentGeneratorPage;
