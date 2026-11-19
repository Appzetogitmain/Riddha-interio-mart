import React, { useState } from "react";
import { Sparkles, Loader2, Lock, Check } from "lucide-react";
import api from "../../../shared/utils/api";

/**
 * Seller-side AI image generator.
 * - Locked until the seller has uploaded at least one product photo.
 * - The source photo is always the seller's first uploaded image (read-only;
 *   the seller cannot pick or upload a different source here).
 * - Generated images are returned through onGenerated(urls).
 */
const SellerAIImageGenerator = ({ sourceImage, remainingSlots = 0, onGenerated }) => {
  const [count, setCount] = useState(3);
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(0);

  const hasSource = typeof sourceImage === "string" && sourceImage.length > 0;
  const noSlots = remainingSlots <= 0;
  const locked = !hasSource;
  const effectiveCount = Math.min(count, Math.max(remainingSlots, 1));

  const handleGenerate = async () => {
    if (locked || noSlots || loading) return;
    setLoading(true);
    setError("");
    setDone(0);
    try {
      const res = await api.post(
        "/products/ai-generate-images",
        {
          image: sourceImage,
          imageCount: effectiveCount,
          customInstructions: instructions.trim(),
        },
        { timeout: 240000 },
      );
      const generated = (res.data?.data?.images || [])
        .map((g) => g.url)
        .filter(Boolean)
        .slice(0, remainingSlots);
      if (!res.data?.success || generated.length === 0) {
        throw new Error("AI could not generate images. Please try again.");
      }
      onGenerated(generated);
      setDone(generated.length);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to generate AI images.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 transition-all ${
        locked ? "bg-slate-50 border-slate-200" : "bg-seller-light/20 border-seller-primary/30"
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            locked ? "bg-slate-200 text-slate-400" : "bg-seller-primary text-white"
          }`}
        >
          {locked ? <Lock size={14} /> : <Sparkles size={14} />}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">AI Images</p>
          <p className="text-[9px] text-slate-400 font-medium">
            {locked
              ? "Upload at least 1 product photo to unlock"
              : "Generated from your uploaded photo"}
          </p>
        </div>
      </div>

      {hasSource && (
        <div className="flex items-center gap-3 bg-white rounded-xl p-2 border border-slate-100">
          <img src={sourceImage} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-100" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-700">Source: your first uploaded photo</p>
            <p className="text-[9px] text-slate-400">Fixed – AI uses this photo to create matching images</p>
          </div>
        </div>
      )}

      <div className={locked ? "opacity-50 pointer-events-none select-none space-y-3" : "space-y-3"}>
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
          <span>Number of images</span>
          <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                disabled={locked}
                onClick={() => setCount(n)}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                  count === n ? "bg-seller-primary text-white" : "text-slate-500"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          disabled={locked}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Optional: e.g. living room, bright daylight"
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-seller-primary"
        />

        <button
          type="button"
          disabled={locked || noSlots || loading}
          onClick={handleGenerate}
          className={`w-full py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            locked || noSlots || loading
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-seller-primary hover:bg-seller-dark text-white shadow-md"
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles size={13} /> Generate AI Images
            </>
          )}
        </button>
      </div>

      {hasSource && noSlots && (
        <p className="text-[9px] font-bold text-amber-600">Image limit reached (10). Remove one to generate more.</p>
      )}
      {error && <p className="text-[10px] font-bold text-red-500">{error}</p>}
      {done > 0 && !error && (
        <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
          <Check size={11} /> {done} AI image{done > 1 ? "s" : ""} added to Showcase
        </p>
      )}
    </div>
  );
};

export default SellerAIImageGenerator;
