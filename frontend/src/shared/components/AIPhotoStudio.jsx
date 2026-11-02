import React, { useState, useRef } from "react";
import { Sparkles, Loader2, CheckCircle2, Image as ImageIcon, Camera, RefreshCw, X, Layers, Check } from "lucide-react";
import api from "../utils/api";

const AIPhotoStudio = ({ onApply, theme = "admin" }) => {
  const [photo, setPhoto] = useState(null); // { file, previewUrl }
  const [status, setStatus] = useState("idle"); // "idle" | "scanning" | "success" | "error"
  const [statusStep, setStatusStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [imageCount, setImageCount] = useState(3);
  const [customInstructions, setCustomInstructions] = useState("");
  const [resultData, setResultData] = useState(null);
  const [selectedGenerated, setSelectedGenerated] = useState(new Set());
  const [previewSrc, setPreviewSrc] = useState(null);

  const fileInputRef = useRef(null);

  const steps = [
    "Analyzing photo with GPT-4o Vision...",
    "Extracting material, finish, dimensions & HSN...",
    "Generating respective perspective & room photos...",
    "Finalizing catalog details & images..."
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhoto({
        file,
        previewUrl: reader.result
      });
      setStatus("idle");
      setResultData(null);
      setErrorMessage("");
    };
    reader.readAsDataURL(file);
  };

  const handleScanAndGenerate = async () => {
    if (!photo || !photo.previewUrl) {
      alert("Please select or upload 1 product photo first.");
      return;
    }

    setStatus("scanning");
    setStatusStep(0);
    setErrorMessage("");

    // Animate progress steps
    const stepTimer1 = setTimeout(() => setStatusStep(1), 2200);
    const stepTimer2 = setTimeout(() => setStatusStep(2), 5000);

    try {
      const response = await api.post("/products/ai-scan-photo", {
        image: photo.previewUrl,
        generateMatchingImages: true,
        imageCount: parseInt(imageCount, 10) || 3,
        customInstructions: customInstructions.trim()
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setStatusStep(3);

      if (response.data && response.data.success && response.data.data) {
        const { details, generatedImages } = response.data.data;
        const resObj = {
          details: details || {},
          generatedImages: generatedImages || [],
          originalImage: photo.previewUrl
        };

        setResultData(resObj);
        setSelectedGenerated(new Set((generatedImages || []).map((_, i) => i)));
        setStatus("success");

        // Immediately notify parent with all details & photos
        if (onApply) {
          onApply({
            details: resObj.details,
            generatedImages: (resObj.generatedImages || []).map(g => g.url),
            originalImage: photo.previewUrl
          });
        }
      } else {
        throw new Error(response.data?.error || "Failed to analyze photo");
      }
    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      console.error("[AIPhotoStudio Error]:", err);
      setErrorMessage(err.response?.data?.error || err.message || "Failed to connect to AI Photo Studio.");
      setStatus("error");
    }
  };

  const toggleSelectGenerated = (idx) => {
    setSelectedGenerated(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleReapply = () => {
    if (!resultData || !onApply) return;
    const chosenImages = (resultData.generatedImages || [])
      .filter((_, idx) => selectedGenerated.has(idx))
      .map(g => g.url);

    onApply({
      details: resultData.details,
      generatedImages: chosenImages,
      originalImage: photo?.previewUrl
    });
  };

  const primaryBtnClass = "bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 hover:from-teal-800 hover:to-emerald-900 text-white";

  return (
    <div className="w-full bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white rounded-2xl p-4 border border-emerald-200/90 shadow-sm space-y-3.5 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-emerald-100/80 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs flex-shrink-0">
            <Sparkles size={14} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-black tracking-wide uppercase text-slate-800 leading-tight">
              AI Photo Studio
            </h3>
            <p className="text-[9px] text-slate-500 font-medium leading-tight">
              1 photo generates details + matching multi-angle photos
            </p>
          </div>
        </div>
        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 flex-shrink-0">
          Auto Studio
        </span>
      </div>

      {/* Photo Slot (Full Width, Compact & Sleek) */}
      <div className="w-full">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          hidden
        />

        {!photo ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white/90 hover:bg-emerald-50/30 rounded-xl p-3.5 flex items-center gap-3 cursor-pointer transition-all hover:shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-emerald-100">
              <Camera size={18} />
            </div>
            <div className="text-left min-w-0 flex-1">
              <div className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                Upload 1 Original Photo
              </div>
              <div className="text-[9px] text-slate-400 truncate">
                Tile, furniture, fixture, decor (JPG, PNG)
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center gap-2.5 p-2 bg-emerald-50/80 border border-emerald-300 rounded-xl">
            <img
              src={photo.previewUrl}
              alt="Source preview"
              className="w-12 h-12 rounded-lg object-cover border border-emerald-400 flex-shrink-0 shadow-xs"
            />
            <div className="min-w-0 flex-1 text-left">
              <div className="text-[10px] font-bold text-emerald-900 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                Original Photo Ready
              </div>
              <div className="text-[9px] text-emerald-700 truncate">Ready for multi-angle studio generation</div>
            </div>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-0.5 bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 rounded-md text-[9px] font-bold shadow-xs cursor-pointer"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhoto(null);
                  setStatus("idle");
                  setResultData(null);
                }}
                className="text-[9px] text-red-500 hover:text-red-700 font-bold"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="w-full bg-white/95 rounded-xl p-3 border border-emerald-100 space-y-2.5 shadow-xs">
        {/* Count Selector */}
        <div className="flex items-center justify-between gap-1 text-[10px] font-semibold text-slate-700">
          <span className="flex items-center gap-1 truncate text-slate-600 font-bold">
            <Layers size={12} className="text-emerald-600 flex-shrink-0" />
            Matching Photos:
          </span>
          <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60">
            {[1, 2, 3, 10].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setImageCount(num)}
                className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                  imageCount === num
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Perspective Badges */}
        <div className="grid grid-cols-3 gap-1 text-[8.5px] text-slate-600 font-medium">
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-md py-1 px-0.5 text-center truncate">
            🛋️ Room View
          </div>
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-md py-1 px-0.5 text-center truncate">
            🔍 Close-Up
          </div>
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-md py-1 px-0.5 text-center truncate">
            📐 Angle View
          </div>
        </div>

        {/* Custom instructions */}
        <div>
          <input
            type="text"
            placeholder="Instructions (e.g. Living room, high gloss)..."
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[9.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        disabled={!photo || status === "scanning"}
        onClick={handleScanAndGenerate}
        className={`w-full py-2.5 px-3 rounded-xl font-bold text-[11px] flex items-center justify-center gap-2 shadow-xs transition-all ${
          !photo || status === "scanning"
            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
            : `${primaryBtnClass} hover:shadow-md cursor-pointer active:scale-[0.99]`
        }`}
      >
        {status === "scanning" ? (
          <>
            <Loader2 size={13} className="animate-spin text-white flex-shrink-0" />
            <span className="truncate">{steps[statusStep] || "Processing..."}</span>
          </>
        ) : (
          <>
            <Sparkles size={13} className="flex-shrink-0" />
            <span className="truncate">Scan Photo & Auto-Generate Details + Photos</span>
          </>
        )}
      </button>

      {/* Scanning Step Banner */}
      {status === "scanning" && (
        <div className="bg-white rounded-xl p-3 border border-emerald-200 shadow-xs space-y-2 animate-pulse">
          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-900">
            <span className="flex items-center gap-1.5">
              <Loader2 size={11} className="animate-spin text-emerald-600" />
              AI Studio Active
            </span>
            <span className="text-[9px] text-emerald-700">Step {statusStep + 1}/4</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-700"
              style={{ width: `${((statusStep + 1) / 4) * 100}%` }}
            />
          </div>
          <p className="text-[9.5px] text-slate-600 font-medium italic text-center truncate">
            "{steps[statusStep]}"
          </p>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-[10px] flex items-center justify-between">
          <span className="truncate">{errorMessage}</span>
          <button
            type="button"
            onClick={handleScanAndGenerate}
            className="text-[9px] font-bold underline ml-2 flex-shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Success Results Showcase */}
      {status === "success" && resultData && (
        <div className="bg-white rounded-xl p-3 border border-emerald-200 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <div className="flex items-center gap-1 text-emerald-700 text-[10px] font-bold">
              <CheckCircle2 size={13} />
              <span>Details & Photos Applied!</span>
            </div>
          </div>

          {/* Quick Extracted Summary Chips */}
          <div className="flex flex-wrap gap-1 text-[9px]">
            {resultData.details.name && (
              <span className="px-1.5 py-0.5 bg-slate-100 rounded font-bold text-slate-800 truncate max-w-full">
                📦 {resultData.details.name}
              </span>
            )}
            {resultData.details.category && (
              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded font-semibold truncate">
                🏷️ {resultData.details.category}
              </span>
            )}
            {resultData.details.material && (
              <span className="px-1.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-100 rounded font-semibold truncate">
                🧱 {resultData.details.material}
              </span>
            )}
            {resultData.details.dimensions && (
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-100 rounded font-semibold truncate">
                📏 {resultData.details.dimensions}
              </span>
            )}
          </div>

          {/* Generated Perspectives Gallery */}
          {resultData.generatedImages && resultData.generatedImages.length > 0 && (
            <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                <span>Matching Photos ({resultData.generatedImages.length})</span>
                <button
                  type="button"
                  onClick={handleReapply}
                  className="text-[9px] text-emerald-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={9} /> Sync
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {resultData.generatedImages.map((imgItem, idx) => {
                  const isChecked = selectedGenerated.has(idx);
                  return (
                    <div
                      key={idx}
                      className={`relative aspect-square rounded-lg overflow-hidden border transition-all ${
                        isChecked ? "border-emerald-600 shadow-xs" : "border-slate-200 opacity-60"
                      }`}
                    >
                      <img
                        src={imgItem.url}
                        alt={`Perspective ${idx + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setPreviewSrc(imgItem.url)}
                      />
                      <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-xs text-[7px] font-bold text-white px-1 py-0.5 rounded truncate max-w-[80%]">
                        {imgItem.perspective || `${idx + 1}`}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSelectGenerated(idx)}
                        className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-white transition-all cursor-pointer ${
                          isChecked ? "bg-emerald-600" : "bg-slate-400"
                        }`}
                      >
                        {isChecked ? <Check size={10} /> : <X size={10} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewSrc(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setPreviewSrc(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
            <img src={previewSrc} alt="Preview" className="max-h-[80vh] w-auto rounded-xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPhotoStudio;
