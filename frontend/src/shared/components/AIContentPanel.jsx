import React, { useState, useEffect } from "react";
import { Sparkles, Check, Loader2, RefreshCw, X, Plus } from "lucide-react";
import api from "../utils/api";

const AIContentPanel = ({
  formData,
  onApply,
  onCancel,
  theme = "seller" // "seller" or "admin" to match colors
}) => {
  const isAdmin = theme === "admin";

  const [status, setStatus] = useState("idle"); // idle, generating, success, error
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // Image generation is admin-only.
  const [generateImage, setGenerateImage] = useState(true);
  const [imageCount, setImageCount] = useState(3);
  const [selectedImages, setSelectedImages] = useState(new Set());

  // AI results state
  const [generatedData, setGeneratedData] = useState({
    description: "",
    hsnCode: "",
    sku: "",
    brandName: "",
    seoKeywords: [],
    specifications: {},
    dimensions: {},
    image: null,
    images: []
  });

  const [newKeyword, setNewKeyword] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  const steps = [
    "Analyzing product attributes",
    "Identifying key features",
    "Writing unique description",
    "Optimizing for SEO keywords"
  ];

  const primaryColor = theme === "seller" ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700";
  const textColor = theme === "seller" ? "text-orange-600" : "text-blue-600";
  const ringColor = theme === "seller" ? "focus:ring-orange-500/20" : "focus:ring-blue-500/20";
  const badgeColor = theme === "seller" ? "bg-orange-50 text-orange-700 border-orange-100" : "bg-blue-50 text-blue-700 border-blue-100";

  // Simulate progress when generating
  useEffect(() => {
    let interval;
    if (status === "generating") {
      setProgress(0);
      setCurrentStep(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          const nextVal = prev + Math.floor(Math.random() * 8) + 2;
          const cappedVal = Math.min(nextVal, 99);
          
          // Update current step based on progress threshold
          if (cappedVal > 80) setCurrentStep(3);
          else if (cappedVal > 50) setCurrentStep(2);
          else if (cappedVal > 25) setCurrentStep(1);
          
          return cappedVal;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleGenerate = async () => {
    if (!formData.name) {
      alert("Please enter a Product Name first to help AI write the content.");
      return;
    }
    if (!formData.sku) {
      alert("Please enter a Model Number / SKU first to help AI identify the product.");
      return;
    }
    
    setStatus("generating");
    setErrorMessage("");

    try {
      const response = await api.post("/products/generate-content", {
        name: formData.name,
        category: formData.category,
        subcategory: formData.subcategory,
        subsubcategory: formData.subsubcategory,
        brand: formData.brand,
        material: formData.material,
        color: formData.color,
        dimensions: formData.dimensions,
        thickness: formData.thickness,
        sku: formData.sku,
        generateImage: isAdmin && generateImage,
        imageCount: isAdmin && generateImage ? imageCount : undefined,
        customPrompt: customPrompt
      });

      if (response.data.success) {
        // Capping progress to 100 and transitioning
        setProgress(100);
        setCurrentStep(3);
        
        setTimeout(() => {
          const generated = {
            description: response.data.description || "",
            shortDescription: response.data.short_description || "",
            hsnCode: response.data.hsn_code || "",
            sku: response.data.sku || formData.sku || "",
            brandName: response.data.brand_name || "",
            seoKeywords: response.data.seo_keywords || [],
            specifications: response.data.specifications || {},
            dimensions: response.data.dimensions || {},
            image: response.data.image || null,
            images: response.data.images || (response.data.image ? [response.data.image] : [])
          };
          setGeneratedData(generated);
          setSelectedImages(new Set(generated.images.map((_, i) => i)));
          setStatus("success");

          // Auto-apply everything — description, brand, SKU/HSN, specs, and the
          // (default all-selected) generated images — straight into the real form
          // fields, same as description/brand already do. The checkboxes below
          // stay available so the admin can review what was added and, if an
          // image isn't wanted, remove it via the normal image grid — unchecking
          // here does not silently withhold it before it's even seen.
          console.log("Auto-applying generated AI content to form:", generated);
          onApply(generated);
        }, 600);
      } else {
        throw new Error(response.data.error || "Failed to generate content");
      }
    } catch (err) {
      console.error("AI Generation failed:", err);
      setErrorMessage(err.response?.data?.error || err.message || "Failed to connect to AI Service.");
      setStatus("error");
    }
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !generatedData.seoKeywords.includes(newKeyword.trim())) {
      setGeneratedData(prev => ({
        ...prev,
        seoKeywords: [...prev.seoKeywords, newKeyword.trim()]
      }));
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = (keywordToRemove) => {
    setGeneratedData(prev => ({
      ...prev,
      seoKeywords: prev.seoKeywords.filter(k => k !== keywordToRemove)
    }));
  };

  const toggleImageSelected = (idx) => {
    setSelectedImages(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleSelectAllImages = () => {
    setSelectedImages(prev =>
      prev.size === generatedData.images.length
        ? new Set()
        : new Set(generatedData.images.map((_, i) => i))
    );
  };

  // Admin "Regenerate" doesn't immediately fire the API again — it re-opens the
  // settings step so the admin can fix anything they missed (e.g. tick "Generate
  // Product Images" or change the quantity) before generating again.
  const handleRegenerateClick = () => {
    if (isAdmin) {
      setStatus("idle");
    } else {
      handleGenerate();
    }
  };

  const handleApplyClick = () => {
    const selected = generatedData.images.filter((_, i) => selectedImages.has(i));
    const payload = { ...generatedData, images: selected, image: selected[0] || null };
    console.log("Apply SEO Optimization clicked in AIContentPanel. Content to apply:", payload);
    onApply(payload);
  };

  // Basic SEO calculation
  const calculateSeoScore = () => {
    let score = 50;
    if (generatedData.description.length > 50) score += 15;
    if (generatedData.description.length > 150) score += 5;
    if (generatedData.seoKeywords.length >= 5) score += 15;
    if (generatedData.hsnCode) score += 10;
    if (generatedData.sku) score += 5;
    return Math.min(score, 100);
  };

  if (status === "idle") {
    return (
      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center ${textColor}`}>
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className="text-md font-bold text-slate-800">AI Content Optimizer</h4>
            <p className="text-xs text-slate-400 font-medium">Generate high-converting description, SKU, HSN & SEO keywords</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 text-xs font-semibold text-slate-500 space-y-2 border border-slate-100">
          <p className="uppercase tracking-wider text-[10px] text-slate-400">Context provided to AI:</p>
          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <div><span className="font-bold">Title:</span> {formData.name || "—"}</div>
            <div><span className="font-bold">Model / SKU:</span> {formData.sku || "—"}</div>
            <div><span className="font-bold">Category:</span> {formData.category || "—"}</div>
            <div><span className="font-bold">Subcategory:</span> {formData.subcategory || "—"}</div>
            <div><span className="font-bold">Sub-subcategory:</span> {formData.subsubcategory || "—"}</div>
          </div>
        </div>

        {isAdmin && (
          <div className="space-y-3 px-1">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="generate-image-chk"
                checked={generateImage}
                onChange={(e) => setGenerateImage(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
              />
              <label htmlFor="generate-image-chk" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                Generate Product Images with AI also?
              </label>
            </div>
            {generateImage && (
              <div className="flex items-center gap-2.5 pl-6">
                <label htmlFor="image-count-input" className="text-xs font-bold text-slate-500">
                  Number of images:
                </label>
                <input
                  type="number"
                  id="image-count-input"
                  min={1}
                  max={10}
                  value={imageCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setImageCount(Number.isFinite(val) ? Math.min(Math.max(val, 1), 10) : 1);
                    setGenerateImage(true);
                  }}
                  className={`w-20 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 ${ringColor}`}
                />
                <span className="text-[10px] font-semibold text-slate-400">(max 10)</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2 px-1">
          <label htmlFor="custom-prompt-input" className="text-xs font-bold text-slate-600 block">
            Custom AI Instructions / Prompts (Optional):
          </label>
          <textarea
            id="custom-prompt-input"
            rows="2"
            placeholder="e.g. Specify materials (e.g. Copper wire, Teak wood) or describe desired product image features..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all resize-none placeholder:text-slate-400 text-slate-700 font-sans"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          className={`w-full py-4 rounded-2xl text-white font-bold text-sm shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${primaryColor}`}
        >
          <Sparkles size={16} />
          Generate with AI
        </button>
      </div>
    );
  }

  if (status === "generating") {
    return (
      <div className="bg-white rounded-[2rem] border border-slate-200 p-10 shadow-sm space-y-8 flex flex-col items-center justify-center text-center min-h-[350px]">
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Circular progress background */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-slate-100"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            <circle
              className={`${textColor} transition-all duration-300`}
              strokeWidth="6"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * progress) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
          </svg>
          <span className="absolute text-xl font-black text-slate-800">{progress}%</span>
        </div>

        <div className="space-y-2">
          <h4 className="text-lg font-bold text-slate-800 animate-pulse">Crafting unique content...</h4>
          <p className="text-xs text-slate-500 font-medium">Applying SEO framework to your catalog attributes</p>
        </div>

        <div className="w-full max-w-xs space-y-3">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-3 text-left">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                currentStep > idx
                  ? "bg-emerald-100 text-emerald-600"
                  : currentStep === idx
                    ? `${textColor} bg-slate-50 animate-spin`
                    : "bg-slate-50 text-slate-300"
              }`}>
                {currentStep > idx ? (
                  <Check size={12} className="stroke-[3]" />
                ) : currentStep === idx ? (
                  <Loader2 size={12} />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                )}
              </div>
              <span className={`text-xs font-bold transition-all ${
                currentStep >= idx ? "text-slate-700" : "text-slate-300"
              }`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <X size={24} />
        </div>
        <div className="space-y-2">
          <h4 className="text-md font-bold text-slate-800">Generation Failed</h4>
          <p className="text-xs text-red-500 font-medium max-w-xs mx-auto leading-relaxed">{errorMessage}</p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          className={`w-full py-4 rounded-2xl text-white font-bold text-sm shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${primaryColor}`}
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  const seoScore = calculateSeoScore();

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-md space-y-6">
      {/* Header with SEO optimization score */}
      <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-slate-100 pb-5">
        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-slate-100"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            <circle
              className="text-emerald-500"
              strokeWidth="8"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * seoScore) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-base font-black text-slate-800">{seoScore}</span>
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest -mt-1">SEO</span>
          </div>
        </div>

        <div className="space-y-1 text-center sm:text-left min-w-0">
          <h4 className="text-sm font-bold text-slate-800">SEO Optimized Draft Ready</h4>
          <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
            {["Keyword Usage", "Readability", "Length", "Uniqueness", "Meta Ready"].map((badge, i) => (
              <span key={i} className="text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
                ✓ {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Generated SKU and HSN preview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 min-w-0">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block truncate">Generated SKU</span>
          <p className="text-xs font-bold text-slate-800 mt-0.5 uppercase truncate">{generatedData.sku || "N/A"}</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 min-w-0">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block truncate">Generated HSN</span>
          <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{generatedData.hsnCode || "N/A"}</p>
        </div>
      </div>

      {/* Generated Images Preview — already applied to the product; checkboxes control re-apply */}
      {generatedData.images && generatedData.images.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Generated AI Product Images ({selectedImages.size}/{generatedData.images.length})
            </label>
            <button
              type="button"
              onClick={toggleSelectAllImages}
              className={`text-[10px] font-black uppercase tracking-wider ${textColor} hover:underline cursor-pointer`}
            >
              {selectedImages.size === generatedData.images.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {generatedData.images.map((img, i) => {
              const isSelected = selectedImages.has(i);
              return (
                <div
                  key={i}
                  onClick={() => toggleImageSelected(i)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 shadow-sm cursor-pointer transition-all ${
                    isSelected ? "border-emerald-500" : "border-slate-200 opacity-50"
                  }`}
                >
                  <img src={img} alt={`AI Generated ${i + 1}`} className="w-full h-full object-cover" />
                  <div className={`absolute top-1 right-1 w-4 h-4 rounded flex items-center justify-center border ${
                    isSelected ? "bg-emerald-500 border-emerald-500" : "bg-white/80 border-slate-300"
                  }`}>
                    {isSelected && <Check size={10} className="text-white stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[9px] font-semibold text-slate-400">Added to product media gallery automatically.</p>
        </div>
      )}

      {/* Generated Specifications Preview */}
      {generatedData.specifications && Object.keys(generatedData.specifications).length > 0 && (
        <div className="space-y-2.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Generated Specifications</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-bold text-slate-700">
            {Object.entries(generatedData.specifications).map(([key, val]) => (
              <div key={key} className="flex flex-col min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold truncate">{key}</span>
                <span className="text-slate-800 mt-0.5 break-words font-extrabold leading-snug">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keywords panel */}
      <div className="space-y-2.5">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Primary Keywords</label>
        <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
          {generatedData.seoKeywords.map((kw, i) => (
            <span key={i} className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${badgeColor} max-w-full break-all`}>
              <span className="truncate">{kw}</span>
              <button
                type="button"
                onClick={() => handleRemoveKeyword(kw)}
                className="hover:text-slate-900 cursor-pointer shrink-0 ml-0.5"
              >
                <X size={10} />
              </button>
            </span>
          ))}
          {generatedData.seoKeywords.length === 0 && (
            <span className="text-xs font-semibold text-slate-400 py-1">No keywords added yet</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            placeholder="Add custom keyword..."
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddKeyword();
              }
            }}
            className={`flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:border-transparent ${ringColor}`}
          />
          <button
            type="button"
            onClick={handleAddKeyword}
            className={`p-2 rounded-xl text-white transition-all cursor-pointer shrink-0 ${primaryColor}`}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Short (BOQ-style) description */}
      {generatedData.shortDescription && (
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Short BOQ Line Description</label>
          <p className="text-xs font-semibold text-slate-600 italic bg-slate-50 rounded-2xl p-3 border border-slate-100 leading-relaxed">
            "{generatedData.shortDescription}"
          </p>
        </div>
      )}

      {/* Description preview and editor */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Product Description</label>
        <textarea
          rows={4}
          value={generatedData.description}
          onChange={(e) => setGeneratedData(prev => ({ ...prev, description: e.target.value }))}
          className={`w-full p-3 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:border-transparent ${ringColor}`}
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2.5 w-full pt-1">
        <button
          type="button"
          onClick={handleApplyClick}
          className={`w-full py-3.5 px-4 rounded-2xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${primaryColor}`}
        >
          <Check size={14} />
          Apply SEO Optimization
        </button>
        <button
          type="button"
          onClick={handleRegenerateClick}
          className="w-full py-3 px-4 rounded-2xl border border-slate-200 font-bold text-xs text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw size={13} />
          {isAdmin ? "Regenerate Image" : "Regenerate"}
        </button>
      </div>
    </div>
  );
};

export default AIContentPanel;
