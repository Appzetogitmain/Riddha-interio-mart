import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Reusable Tejas Mascot Avatar Component
 * 
 * Supports all 12 official Tejas expressions from /tejas-expressions/:
 * - happy: tejas-happy.webp (default idle & calm)
 * - wink: tejas-wink.webp (autonomous blink engine)
 * - sad: tejas-sad.webp (errors, failure, empathy)
 * - excited: tejas-excited.webp (recommendations, orders, wins)
 * - thinking: tejas-thinking.webp (AI generating answer)
 * - surprised: tejas-surprised.webp (message intake, alert)
 * - love: tejas-love.webp (thank you, compliments)
 * - talking: tejas-talking.webp (TTS audio, streaming answer)
 * - confused: tejas-confused.webp (unclear question, clarification)
 * - sleepy: tejas-sleepy.webp (long user inactivity)
 * - okay: tejas-okay.webp (confirmation, acknowledgment)
 * - goodbye: tejas-goodbye.webp (farewell, session close)
 */

export const EXPRESSION_IMAGES = {
  happy: '/tejas-expressions/tejas-happy.webp',
  idle: '/tejas-expressions/tejas-happy.webp',
  wink: '/tejas-expressions/tejas-wink.webp',
  blink: '/tejas-expressions/tejas-wink.webp',
  sad: '/tejas-expressions/tejas-sad.webp',
  apology: '/tejas-expressions/tejas-sad.webp',
  error: '/tejas-expressions/tejas-sad.webp',
  excited: '/tejas-expressions/tejas-excited.webp',
  celebrating: '/tejas-expressions/tejas-excited.webp',
  success: '/tejas-expressions/tejas-excited.webp',
  thinking: '/tejas-expressions/tejas-thinking.webp',
  consulting: '/tejas-expressions/tejas-thinking.webp',
  analyzing: '/tejas-expressions/tejas-thinking.webp',
  surprised: '/tejas-expressions/tejas-surprised.webp',
  love: '/tejas-expressions/tejas-love.webp',
  gratitude: '/tejas-expressions/tejas-love.webp',
  talking: '/tejas-expressions/tejas-talking.webp',
  speaking: '/tejas-expressions/tejas-talking.webp',
  confused: '/tejas-expressions/tejas-confused.webp',
  'oh-no': '/tejas-expressions/tejas-confused.webp',
  sleepy: '/tejas-expressions/tejas-sleepy.webp',
  okay: '/tejas-expressions/tejas-okay.webp',
  assisted: '/tejas-expressions/tejas-okay.webp',
  handover: '/tejas-expressions/tejas-okay.webp',
  support: '/tejas-expressions/tejas-okay.webp',
  goodbye: '/tejas-expressions/tejas-goodbye.webp',
  farewell: '/tejas-expressions/tejas-goodbye.webp',
  listening: '/tejas-expressions/tejas-happy.webp',
};

const FALLBACK_LOGO = '/ask tejas final icon.png';

// Preload expressions once in browser for instant, flicker-free swaps
if (typeof window !== 'undefined') {
  Object.values(EXPRESSION_IMAGES).forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

const TejasAvatar = ({
  expression = 'happy',
  size = 48,
  className = '',
  showReactionBadge = false,
  shape = 'circle',
  onClick,
}) => {
  // Normalize expression key
  const normalized = (expression || 'happy').toLowerCase();

  // Autonomous Blink System State
  const [isBlinking, setIsBlinking] = useState(false);

  // States where automatic blinking must NOT interrupt
  const isBlinkDisabled = useMemo(() => {
    return [
      'thinking',
      'talking',
      'speaking',
      'sad',
      'excited',
      'celebrating',
      'sleepy',
      'wink',
      'blink',
    ].includes(normalized);
  }, [normalized]);

  // Autonomous blink interval: triggers tejas-wink.webp for ~180ms every 3.5 - 5.5s
  useEffect(() => {
    if (isBlinkDisabled) {
      setIsBlinking(false);
      return;
    }

    let blinkDurationTimer;
    let nextBlinkTimer;

    const scheduleNextBlink = () => {
      const delay = 3500 + Math.random() * 2000; // 3.5s to 5.5s
      nextBlinkTimer = setTimeout(() => {
        setIsBlinking(true);
        blinkDurationTimer = setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 180); // Quick natural eye-wink duration
      }, delay);
    };

    scheduleNextBlink();

    return () => {
      clearTimeout(nextBlinkTimer);
      clearTimeout(blinkDurationTimer);
    };
  }, [isBlinkDisabled, normalized]);

  // Determine current active expression key
  const activeExpressionKey = isBlinking ? 'wink' : normalized;
  const currentImgSrc = EXPRESSION_IMAGES[activeExpressionKey] || EXPRESSION_IMAGES.happy || FALLBACK_LOGO;

  const [imgSrc, setImgSrc] = useState(currentImgSrc);

  useEffect(() => {
    setImgSrc(currentImgSrc);
  }, [currentImgSrc]);

  const handleImageError = () => {
    if (imgSrc !== EXPRESSION_IMAGES.happy) {
      setImgSrc(EXPRESSION_IMAGES.happy);
    } else if (imgSrc !== FALLBACK_LOGO) {
      setImgSrc(FALLBACK_LOGO);
    }
  };

  // Optional emoji badge for reaction indication
  const getReactionEmoji = () => {
    switch (activeExpressionKey) {
      case 'listening':
        return '🎙️';
      case 'thinking':
        return '⚡';
      case 'talking':
      case 'speaking':
        return '💬';
      case 'excited':
      case 'celebrating':
      case 'success':
        return '🎉';
      case 'love':
        return '❤️';
      case 'confused':
      case 'oh-no':
        return '🤔';
      case 'sad':
        return '🥺';
      case 'surprised':
        return '✨';
      case 'sleepy':
        return '💤';
      case 'okay':
        return '👍';
      case 'goodbye':
        return '👋';
      case 'wink':
        return '😉';
      case 'happy':
      case 'idle':
      default:
        return null;
    }
  };

  const emojiBadge = getReactionEmoji();

  // Expression-based animation characteristics
  const isListening = normalized === 'listening';
  const isThinking = normalized === 'thinking';
  const isTalking = normalized === 'talking' || normalized === 'speaking';
  const isExcited = normalized === 'excited' || normalized === 'celebrating' || normalized === 'success';
  const isLove = normalized === 'love';
  const isConfused = normalized === 'confused' || normalized === 'oh-no';
  const isSad = normalized === 'sad';
  const isGoodbye = normalized === 'goodbye';
  const isSleepy = normalized === 'sleepy';
  const isSurprised = normalized === 'surprised';
  const isOkay = normalized === 'okay';

  // Get micro-movement animation for the mascot body
  const getMascotMotion = () => {
    if (isTalking) {
      return {
        animate: { y: [0, -1.8, 0], scale: [1, 1.018, 1] },
        transition: { repeat: Infinity, duration: 0.75, ease: 'easeInOut' },
      };
    }
    if (isExcited) {
      return {
        animate: { y: [0, -3.5, 0], scale: [1, 1.035, 1] },
        transition: { repeat: Infinity, duration: 0.85, ease: 'easeInOut' },
      };
    }
    if (isLove) {
      return {
        animate: { scale: [1, 1.03, 1] },
        transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' },
      };
    }
    if (isConfused) {
      return {
        animate: { rotate: [-2.5, 2.5, -2.5] },
        transition: { repeat: Infinity, duration: 2.4, ease: 'easeInOut' },
      };
    }
    if (isThinking) {
      return {
        animate: { scale: [1, 0.985, 1], y: [0, -1.2, 0] },
        transition: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' },
      };
    }
    if (isSad) {
      return {
        animate: { y: [0, 1.5, 0] },
        transition: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' },
      };
    }
    if (isGoodbye) {
      return {
        animate: { rotate: [-3, 3, -3], y: [0, -1.5, 0] },
        transition: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' },
      };
    }
    if (isSleepy) {
      return {
        animate: { y: [0, -1, 0] },
        transition: { repeat: Infinity, duration: 4.8, ease: 'easeInOut' },
      };
    }
    if (isSurprised) {
      return {
        animate: { scale: [1, 1.025, 1], y: [0, -1, 0] },
        transition: { repeat: Infinity, duration: 1.4, ease: 'easeInOut' },
      };
    }
    if (isOkay) {
      return {
        animate: { y: [0, -2, 0] },
        transition: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' },
      };
    }
    // Default Happy / Idle: calm breathing float
    return {
      animate: { y: [0, -2, 0] },
      transition: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' },
    };
  };

  const mascotMotion = getMascotMotion();

  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`relative select-none flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* ── Acoustic Wave Rings (Voice Listening Mode) ── */}
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

      {/* ── Excited / Celebrating Aura ── */}
      {isExcited && (
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0.2, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 opacity-60 blur-sm pointer-events-none"
        />
      )}

      {/* ── Love Warm Glow Aura ── */}
      {isLove && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.15, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute -inset-1 rounded-full bg-pink-400 opacity-40 blur-sm pointer-events-none"
        />
      )}

      {/* ── Main Mascot Image with Smooth State Transitions ── */}
      <motion.div
        animate={mascotMotion.animate}
        transition={mascotMotion.transition}
        className={`w-full h-full ${
          shape === 'rounded'
            ? 'rounded-2xl'
            : shape === 'none'
              ? 'rounded-none'
              : 'rounded-full'
        } overflow-hidden flex items-center justify-center bg-white shadow-xs p-0.5 border border-teal-100/60`}
      >
        <motion.img
          key={activeExpressionKey}
          src={imgSrc}
          alt={`Tejas ${activeExpressionKey}`}
          onError={handleImageError}
          initial={{ opacity: 0, scale: 0.96, y: 3 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: isBlinking ? 0.12 : 0.28, ease: 'easeOut' }}
          className={`w-full h-full object-contain ${
            shape === 'rounded'
              ? 'rounded-2xl'
              : shape === 'none'
                ? 'rounded-none'
                : 'rounded-full'
          } select-none`}
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
