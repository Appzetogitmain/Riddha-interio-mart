import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Tejas Mascot Avatar Component
 * 
 * Uses Tejas's original official logo by default (/ask tejas final icon.png)
 * and supports custom animated GIFs for different emotional expressions:
 * - idle / blink: /tejas_idle.gif or /tejas_blink.gif
 * - happy / celebrating: /tejas_happy.gif
 * - sad / confused / oh-no: /tejas_sad.gif
 * - thinking: /tejas_thinking.gif
 * - speaking / listening: /tejas_speaking.gif
 * 
 * If a specific GIF is not present, it gracefully falls back to the original Tejas logo
 * while maintaining smooth Framer Motion expression dynamics.
 */
const DEFAULT_TEJAS_LOGO = '/ask tejas final icon.png';

const EXPRESSION_GIFS = {
  idle: '/tejas_idle.gif',
  blink: '/tejas_blink.gif',
  happy: '/tejas_happy.gif',
  celebrating: '/tejas_happy.gif',
  success: '/tejas_happy.gif',
  sad: '/tejas_sad.gif',
  confused: '/tejas_sad.gif',
  'oh-no': '/tejas_sad.gif',
  thinking: '/tejas_thinking.gif',
  speaking: '/tejas_speaking.gif',
  listening: '/tejas_listening.gif',
};

const TejasAvatar = ({
  expression = 'idle',
  size = 48,
  className = '',
  showReactionBadge = true,
  onClick,
}) => {
  const [imgSrc, setImgSrc] = useState(EXPRESSION_GIFS[expression] || DEFAULT_TEJAS_LOGO);

  // Update source when expression changes
  useEffect(() => {
    const targetGif = EXPRESSION_GIFS[expression];
    setImgSrc(targetGif || DEFAULT_TEJAS_LOGO);
  }, [expression]);

  // Gracefully fallback to original logo if specific GIF doesn't exist yet
  const handleImageError = () => {
    if (imgSrc !== DEFAULT_TEJAS_LOGO) {
      setImgSrc(DEFAULT_TEJAS_LOGO);
    }
  };

  const getExpressionEmoji = () => {
    switch (expression) {
      case 'listening':
        return '🎙️';
      case 'thinking':
        return '⚡';
      case 'speaking':
        return '💬';
      case 'confused':
      case 'oh-no':
      case 'sad':
        return '🥺';
      case 'happy':
        return '😊';
      case 'celebrating':
      case 'success':
        return '👑';
      default:
        return null;
    }
  };

  const emojiBadge = getExpressionEmoji();

  const isHappy = expression === 'happy' || expression === 'celebrating' || expression === 'success';
  const isThinking = expression === 'thinking';
  const isListening = expression === 'listening';
  const isSpeaking = expression === 'speaking';
  const isConfused = expression === 'confused' || expression === 'oh-no' || expression === 'sad';

  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`relative select-none flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* ── Acoustic Wave Rings (Listening & Speaking) ── */}
      {isListening && (
        <>
          <motion.div
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: [1, 1.35, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-[#189D91]/35 pointer-events-none"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0.6 }}
            animate={{ scale: [1, 1.65, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.4, delay: 0.25, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-amber-400/30 pointer-events-none"
          />
        </>
      )}

      {/* ── Thinking Halo Spin Ring ── */}
      {isThinking && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
          className="absolute -inset-1 rounded-full border-2 border-dashed border-[#189D91] pointer-events-none"
        />
      )}

      {/* ── Celebrating Aura ── */}
      {isHappy && expression === 'celebrating' && (
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0.2, 0.8] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 opacity-60 blur-sm pointer-events-none"
        />
      )}

      {/* ── Main Tejas Mascot Image / GIF with Expression Micro-Animations ── */}
      <motion.div
        animate={
          isHappy
            ? { y: [0, -3, 0], scale: [1, 1.03, 1] }
            : isConfused
            ? { rotate: [-2, 2, -2] }
            : isThinking
            ? { scale: [1, 0.97, 1] }
            : isSpeaking
            ? { y: [0, -2, 0], scale: [1, 1.02, 1] }
            : { y: [0, -1.5, 0] }
        }
        transition={{
          repeat: Infinity,
          duration: isHappy ? 1.6 : isSpeaking ? 0.9 : 3.2,
          ease: 'easeInOut',
        }}
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white shadow-xs p-0.5"
      >
        <img
          src={imgSrc}
          alt={`Tejas - ${expression}`}
          onError={handleImageError}
          className="w-full h-full object-contain rounded-full select-none"
        />
      </motion.div>

      {/* ── Expression Emoji Badge Overlay ── */}
      {showReactionBadge && emojiBadge && size >= 32 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-white border border-stone-200 shadow-sm text-center select-none"
          style={{
            width: Math.max(14, Math.round(size * 0.36)),
            height: Math.max(14, Math.round(size * 0.36)),
            fontSize: Math.max(8, Math.round(size * 0.22)),
          }}
        >
          {emojiBadge}
        </motion.span>
      )}
    </div>
  );
};

export default React.memo(TejasAvatar);
