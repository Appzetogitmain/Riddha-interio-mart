import React, { useEffect } from "react";
import { X } from "lucide-react";

const ImagePreviewModal = ({ src, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Close preview"
      >
        <X size={20} />
      </button>
      <img
        src={src}
        alt="Preview"
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
      />
    </div>
  );
};

export default ImagePreviewModal;
