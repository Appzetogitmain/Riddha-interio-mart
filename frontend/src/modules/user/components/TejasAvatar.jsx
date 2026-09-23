import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TEJAS_ICON = '/ask tejas final icon.png';

/**
 * Animated Tejas Avatar with dynamic facial expressions, gestures, and audio soundwaves.
 *
 * Supported expressions:
 * - 'idle': Gentle breathing bounce, periodic natural blink
 * - 'listening': Glowing acoustic soundwaves, audio visualizer ring
 * - 'thinking': Orbiting neural sparkles, scanning pulse
 * - 'speaking': Radiant speaking wave, happy expression
 * - 'confused' | 'oh-no': "Oh no! 🥺", shrug gesture, floating emoji reaction
 * - 'celebrating' | 'success': Crown & sparkle burst (for Pro upgrade / actions)
 */
const TejasAvatar = ({
  expression = 'idle',
  size = 48,
  className = '',
  showReactionBadge = true,
  onClick
}) => {
  const [blink, setBlink] = useState(false);

  // Periodic natural blinking when in idle or thinking state
  useEffect(() => {
    if (expression !== 'idle' && expression !== 'thinking') return;
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3800);
    return () => clearInterval(interval);
  }, [expression]);

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
        return '🥺';
      case 'celebrating':
      case 'success':
        return '👑';
      default:
        return null;
    }
  };

  const getGestureLabel = () => {
    switch (expression) {
      case 'confused':
      case 'oh-no':
        return 'Oh no!';
      case 'celebrating':
      case 'success':
        return 'Pro Active!';
      case 'listening':
        return 'Listening...';
      default:
        return null;
    }
  };

  const emojiBadge = getExpressionEmoji();
  const gestureLabel = getGestureLabel();

  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`relative select-none flex items-center justify-center ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* ── Acoustic / Aura Wave Rings (Listening & Speaking) ── */}
      {expression === 'listening' && (
        <>
          <motion.div
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: [1, 1.35, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-[#189D91]/30 pointer-events-none"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0.6 }}
            animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.4, delay: 0.25, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-amber-400/25 pointer-events-none"
          />
        </>
      )}

      {expression === 'thinking' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
          className="absolute -inset-1.5 rounded-full border-2 border-dashed border-[#189D91] pointer-events-none"
        />
      )}

      {expression === 'celebrating' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 1 }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.9, 0.1, 0.9] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 opacity-60 blur-sm pointer-events-none"
        />
      )}

      {/* ── Main Mascot Image with Gestures & Breathing ── */}
      <motion.div
        animate={
          expression === 'listening'
            ? { scale: [1, 1.06, 1] }
            : expression === 'thinking'
            ? { rotate: [-2, 2, -2], y: [0, -2, 0] }
            : expression === 'speaking'
            ? { scale: [1, 1.04, 1], y: [0, -1, 0] }
            : expression === 'confused' || expression === 'oh-no'
            ? { rotate: [-6, 6, -3, 0], y: [0, 2, 0] }
            : expression === 'celebrating'
            ? { scale: [1, 1.12, 1], y: [0, -4, 0] }
            : { y: [0, -2.5, 0] }
        }
        transition={{
          repeat: Infinity,
          duration: expression === 'confused' || expression === 'oh-no' ? 2 : 2.5,
          ease: 'easeInOut'
        }}
        className="w-full h-full rounded-full overflow-hidden relative shadow-md bg-white border border-gray-100 flex items-center justify-center"
      >
        <img
          src={TEJAS_ICON}
          alt="Tejas Mascot"
          className={`w-full h-full object-cover transition-all duration-300 ${
            blink ? 'opacity-80 scale-y-95' : 'opacity-100 scale-100'
          }`}
        />

        {/* Confused / Oh-No Shrug Overlay Gradient */}
        {(expression === 'confused' || expression === 'oh-no') && (
          <div className="absolute inset-0 bg-amber-500/15 backdrop-blur-[0.5px] flex items-center justify-center pointer-events-none" />
        )}
      </motion.div>

      {/* ── Floating Reaction Emoji Badge ── */}
      {showReactionBadge && emojiBadge && (
        <AnimatePresence>
          <motion.div
            key={emojiBadge}
            initial={{ scale: 0, opacity: 0, y: 5 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 400 }}
            className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-full shadow-lg border border-white z-20 ${
              expression === 'confused' || expression === 'oh-no'
                ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-300'
                : expression === 'celebrating'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white ring-2 ring-amber-300'
                : expression === 'listening'
                ? 'bg-[#189D91] text-white ring-2 ring-teal-200'
                : 'bg-white text-slate-800'
            }`}
            style={{
              width: Math.max(18, Math.round(size * 0.38)),
              height: Math.max(18, Math.round(size * 0.38)),
              fontSize: Math.max(10, Math.round(size * 0.22))
            }}
          >
            <span>{emojiBadge}</span>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Expressive Gesture Floating Speech Bubble (e.g. "Oh no!") ── */}
      {gestureLabel && size >= 40 && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={`absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider whitespace-nowrap shadow-md z-30 pointer-events-none ${
            expression === 'confused' || expression === 'oh-no'
              ? 'bg-amber-500 text-white'
              : expression === 'celebrating'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950'
              : 'bg-[#189D91] text-white animate-pulse'
          }`}
        >
          {gestureLabel}
        </motion.div>
      )}
    </div>
  );
};

export default React.memo(TejasAvatar);
