import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

/**
 * Custom hook for complete, error-resilient Speech-to-Text (STT) and authentic Indian English Text-to-Speech (TTS).
 */
export const useVoiceRecognition = ({
  onTranscriptChange,
  onFinalTranscript,
  onVoiceCommand
} = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [activeIndianVoice, setActiveIndianVoice] = useState(null);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const isStartingRef = useRef(false);
  const indianVoiceRef = useRef(null);
  const currentAudioRef = useRef(null);

  // Store latest callback references in ref to prevent useEffect teardowns on re-renders
  const callbacksRef = useRef({
    onTranscriptChange,
    onFinalTranscript,
    onVoiceCommand
  });

  useEffect(() => {
    callbacksRef.current = {
      onTranscriptChange,
      onFinalTranscript,
      onVoiceCommand
    };
  }, [onTranscriptChange, onFinalTranscript, onVoiceCommand]);

  /**
   * Intelligently discovers and locks onto authentic Indian English browser voices
   * Prioritizes high-fidelity Neural/Online Indian voices (Neerja, Prabhat, Google English India, Rishi)
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const findIndianVoice = () => {
      const voices = window.speechSynthesis.getVoices() || [];
      if (!voices.length) return null;

      // 1. High-Fidelity Online Neural Indian voices (e.g. Microsoft Neerja/Prabhat Online Natural, Google English India, Apple Rishi)
      const neuralIndianVoice = voices.find(v => {
        const name = (v.name || '').toLowerCase();
        const lang = (v.lang || '').toLowerCase();
        const isIndian = lang.includes('en-in') || lang.includes('hi') || name.includes('india') || name.includes('indian');
        const isNeural = name.includes('natural') || name.includes('online') || name.includes('google') || name.includes('neural');
        return isIndian && isNeural;
      });
      if (neuralIndianVoice) return neuralIndianVoice;

      // 2. High-priority general Indian English & Hindi voices (Neerja, Prabhat, Rishi, Veena, Swara, Madhur, Ravi, Heera)
      const generalIndianVoice = voices.find(v => {
        const name = (v.name || '').toLowerCase();
        const lang = (v.lang || '').toLowerCase();
        return (
          lang === 'en-in' ||
          lang.startsWith('en-in') ||
          lang.includes('hi-in') ||
          name.includes('india') ||
          name.includes('indian') ||
          name.includes('neerja') ||
          name.includes('prabhat') ||
          name.includes('rishi') ||
          name.includes('veena') ||
          name.includes('ravi') ||
          name.includes('heera') ||
          name.includes('swara') ||
          name.includes('madhur')
        );
      });
      if (generalIndianVoice) return generalIndianVoice;

      // 3. Any en-IN language code match
      const enInVoice = voices.find(v => (v.lang || '').toLowerCase().startsWith('en-in'));
      if (enInVoice) return enInVoice;

      // 4. Modern natural voice (strictly avoiding robotic legacy SAPI Desktop voices like Microsoft David Desktop)
      return voices.find(v => {
        const name = (v.name || '').toLowerCase();
        return (
          (name.includes('natural') || name.includes('online') || name.includes('google')) &&
          !name.includes('desktop')
        );
      }) || voices.find(v => !v.name?.toLowerCase().includes('desktop') && v.lang?.startsWith('en')) || null;
    };

    const updateVoices = () => {
      const detected = findIndianVoice();
      if (detected) {
        indianVoiceRef.current = detected;
        setActiveIndianVoice(detected);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  /**
   * Intelligently parses spoken phrases into high-priority actionable commands
   */
  const parseVoiceCommand = useCallback((text) => {
    if (!text) return null;
    const lower = text.toLowerCase().trim();

    // 1. B2B / Pro Upgrade Intent
    if (
      lower.includes('upgrade to pro') ||
      lower.includes('b2b upgrade') ||
      lower.includes('upgrade b2b') ||
      lower.includes('b2b pro') ||
      lower.includes('pro plan') ||
      lower.includes('pro upgrade') ||
      lower.includes('ai pro') ||
      lower.includes('upgrade membership') ||
      lower.includes('upgrade plan') ||
      lower.includes('pro membership') ||
      lower.includes('pro upgrade karo') ||
      lower.includes('membership upgrade karo') ||
      lower.includes('upgrade karo')
    ) {
      return { type: 'UPGRADE_PRO', label: 'B2B Upgrade to Pro', phrase: text };
    }

    // 2. Track Orders Intent
    if (
      lower.includes('track my order') ||
      lower.includes('track order') ||
      lower.includes('where is my order') ||
      lower.includes('order status') ||
      lower.includes('track delivery') ||
      lower.includes('gps track') ||
      lower.includes('delivery status') ||
      lower.includes('mera order track karo') ||
      lower.includes('order track karo') ||
      lower.includes('order kahan hai') ||
      lower.includes('delivery status batao') ||
      lower.includes('order tracking')
    ) {
      return { type: 'TRACK_ORDER', label: 'Live GPS Tracking', phrase: text, path: '/orders/track' };
    }

    // 3. Request for Quotation (RFQ) Intent
    if (
      lower.includes('create rfq') ||
      lower.includes('request quote') ||
      lower.includes('request quotation') ||
      lower.includes('bulk quote') ||
      lower.includes('bulk rfq') ||
      lower.includes('custom quotation') ||
      lower.includes('quotation banao') ||
      lower.includes('naya rfq banao') ||
      lower.includes('quote banao') ||
      lower.includes('bulk quote chahiye')
    ) {
      return { type: 'CREATE_RFQ', label: 'Create Bulk RFQ', phrase: text, path: '/rfq/new' };
    }

    // 4. Shopping Cart Intent
    if (
      lower.includes('go to cart') ||
      lower.includes('open cart') ||
      lower.includes('view cart') ||
      lower.includes('show cart') ||
      lower.includes('cart dikhao') ||
      lower.includes('cart kholo') ||
      lower.includes('trolley dikhao')
    ) {
      return { type: 'NAVIGATE', label: 'Shopping Cart', phrase: text, path: '/cart' };
    }

    // 5. Cost Estimator Intent
    if (lower.includes('cost estimator') || lower.includes('calculate cost') || lower.includes('estimate budget')) {
      return { type: 'NAVIGATE', label: 'AI Cost Estimator', phrase: text, path: '/cost-estimator' };
    }

    // 6. BOQ Generator Intent
    if (lower.includes('boq generator') || lower.includes('bill of quantities') || lower.includes('boq')) {
      return { type: 'NAVIGATE', label: 'BOQ Generator', phrase: text, path: '/boq-generator' };
    }

    // 7. Design Persona / Quiz Intent
    if (lower.includes('design quiz') || lower.includes('style persona') || lower.includes('style quiz')) {
      return { type: 'NAVIGATE', label: 'Design Persona Quiz', phrase: text, path: '/designer-quiz' };
    }

    // 8. Room Visualizer Intent
    if (lower.includes('room visualizer') || lower.includes('visualize room') || lower.includes('3d visualizer')) {
      return { type: 'NAVIGATE', label: 'AI Room Visualizer', phrase: text, path: '/ai-room-visualizer' };
    }

    // 9. Seller Dashboard Intents
    if (lower.includes('low stock') || lower.includes('stock alert') || lower.includes('check inventory')) {
      return { type: 'SELLER_STOCK', label: 'Check Inventory', phrase: text };
    }

    if (lower.includes('seller revenue') || lower.includes('store orders') || lower.includes('seller orders')) {
      return { type: 'SELLER_ORDERS', label: 'Seller Orders', phrase: text };
    }

    // 10. Admin Dashboard Intents
    if (lower.includes('pending sellers') || lower.includes('approve seller') || lower.includes('admin revenue')) {
      return { type: 'ADMIN_ACTION', label: 'Admin Action', phrase: text };
    }

    return null;
  }, []);

  // Initialize Speech Recognition (STT) once on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    let recognition;
    try {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Optimized for English with Indian accent

      recognition.onstart = () => {
        isStartingRef.current = false;
        isListeningRef.current = true;
        setIsListening(true);
        setTranscript('');
        setInterimTranscript('');
      };

      recognition.onresult = (event) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript || '';
          if (result.isFinal) {
            currentFinal += text;
          } else {
            currentInterim += text;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
          callbacksRef.current.onTranscriptChange?.(currentInterim);
        }

        if (currentFinal) {
          const cleanedText = currentFinal.trim();
          setTranscript(cleanedText);
          setInterimTranscript('');
          callbacksRef.current.onTranscriptChange?.(cleanedText);

          // Check for direct voice action commands
          const command = parseVoiceCommand(cleanedText);
          if (command) {
            callbacksRef.current.onVoiceCommand?.(command, cleanedText);
          } else {
            callbacksRef.current.onFinalTranscript?.(cleanedText);
          }
        }
      };

      recognition.onerror = (event) => {
        isStartingRef.current = false;
        isListeningRef.current = false;
        setIsListening(false);

        // Ignore harmless aborts or no-speech timeouts
        if (event.error === 'aborted' || event.error === 'no-speech') {
          return;
        }

        console.warn('[Tejas Voice] Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          toast.error('Microphone permission denied. Please allow microphone access in your browser.');
        } else if (event.error === 'network') {
          toast.error('Voice network connectivity error. Please check your internet connection.');
        }
      };

      recognition.onend = () => {
        isStartingRef.current = false;
        isListeningRef.current = false;
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('SpeechRecognition initialization error:', e);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, [parseVoiceCommand]);

  /**
   * Stop any actively playing speech
   */
  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) {}
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setIsSpeaking(false);
  }, []);

  /**
   * Enhanced Browser Synthesis Fallback (Prioritizes genuine Indian voices & excludes robotic SAPI Desktop voices)
   */
  const playBrowserSynthesis = useCallback((rawText) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      // Prepare text for natural Indian pronunciation
      let cleanText = (rawText || '')
        .replace(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi, '$1 rupees')
        .replace(/Rs\.?\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi, '$1 rupees')
        .replace(/₹/g, ' rupees ')
        .replace(/\bB2B\b/gi, 'B to B')
        .replace(/\bB2C\b/gi, 'B to C')
        .replace(/\bRFQ\b/gi, 'R F Q')
        .replace(/\bCOD\b/gi, 'Cash on Delivery')
        .replace(/\bsq\.?\s*ft\.?\b/gi, 'square feet')
        .replace(/\bBHK\b/gi, 'B H K')
        .replace(/\bVastu\b/gi, 'Vaastu')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-IN';
      utterance.rate = 0.96; // Relaxed, natural Indian conversational pacing
      utterance.pitch = 1.02; // Friendly, warm Indian inflection

      const voices = window.speechSynthesis.getVoices() || [];

      // 1. Search for genuine Indian English & Hindi voices (prioritizing Neural / Online voices)
      const indianVoice = indianVoiceRef.current || activeIndianVoice || voices.find(v => {
        const name = (v.name || '').toLowerCase();
        const lang = (v.lang || '').toLowerCase();
        const isIndian = lang.includes('en-in') || lang.includes('hi-in') || name.includes('india') || name.includes('indian');
        const isNeural = name.includes('natural') || name.includes('online') || name.includes('google');
        return isIndian && isNeural;
      }) || voices.find(v => {
        const name = (v.name || '').toLowerCase();
        const lang = (v.lang || '').toLowerCase();
        return (
          lang === 'en-in' ||
          lang.startsWith('en-in') ||
          lang.includes('hi-in') ||
          name.includes('india') ||
          name.includes('indian') ||
          name.includes('neerja') ||
          name.includes('prabhat') ||
          name.includes('rishi') ||
          name.includes('veena') ||
          name.includes('ravi') ||
          name.includes('heera') ||
          name.includes('swara') ||
          name.includes('madhur')
        );
      });

      if (indianVoice) {
        utterance.voice = indianVoice;
      } else {
        // 2. Fallback to modern natural voice (strictly avoiding robotic SAPI Desktop voices like Microsoft David Desktop)
        const modernVoice = voices.find(v => {
          const name = (v.name || '').toLowerCase();
          return (
            (name.includes('natural') || name.includes('online') || name.includes('google') || name.includes('neural')) &&
            !name.includes('desktop')
          );
        }) || voices.find(v => !v.name?.toLowerCase().includes('desktop') && v.lang?.startsWith('en'));

        if (modernVoice) {
          utterance.voice = modernVoice;
        }
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.warn('[Tejas Voice] Browser speech error:', e);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[Tejas Voice] Browser synthesis exception:', err.message);
      setIsSpeaking(false);
    }
  }, [activeIndianVoice]);

  /**
   * Speaks out response text with natural human voice (Authentic Indian Neural TTS primary, Indian browser secondary)
   */
  const speak = useCallback(async (text) => {
    if (!isTtsEnabled || !text || typeof text !== 'string') return;

    try {
      stopSpeaking();

      // Clean markdown, code, URLs, and emojis for natural human speech
      let cleanText = text
        .replace(/https?:\/\/\S+/g, '')
        .replace(/[*#_`~\[\]()|{}>]/g, ' ')
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
        .replace(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi, '$1 rupees')
        .replace(/Rs\.?\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi, '$1 rupees')
        .replace(/₹/g, ' rupees ')
        .replace(/\bB2B\b/gi, 'B to B')
        .replace(/\bRFQ\b/gi, 'R F Q')
        .replace(/\bCOD\b/gi, 'Cash on Delivery')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) return;

      // Keep a concise slice (max 380 chars) for responsive, natural interactive spoken audio
      const textToSpeak = cleanText.slice(0, 380);

      // ── Tier 1: Authentic Native Indian Neural Voice via Backend TTS (/assistant/tts) ──
      try {
        const res = await api.post('/assistant/tts', {
          text: textToSpeak,
          lang: 'en-IN'
        }, {
          responseType: 'blob',
          timeout: 6500
        });

        // Ensure we got valid audio bytes (not a JSON error blob)
        if (res.data && res.data.size > 250) {
          const audioUrl = URL.createObjectURL(res.data);
          const audio = new Audio(audioUrl);
          currentAudioRef.current = audio;

          audio.onplay = () => setIsSpeaking(true);
          audio.onended = () => {
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
            currentAudioRef.current = null;
          };
          audio.onerror = () => {
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
            currentAudioRef.current = null;
            playBrowserSynthesis(textToSpeak);
          };

          await audio.play();
          return;
        }
      } catch (neuralErr) {
        // Silently fall back to natural browser synthesis with Indian voice
      }

      // ── Tier 2: Enhanced Browser Synthesis Fallback (Indian English en-IN) ──
      playBrowserSynthesis(textToSpeak);

    } catch (e) {
      console.warn('[Tejas Voice] Speak error:', e.message);
      setIsSpeaking(false);
    }
  }, [isTtsEnabled, stopSpeaking, playBrowserSynthesis]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      toast.error('Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.');
      return;
    }

    if (isListeningRef.current || isStartingRef.current) {
      return;
    }

    // Cancel any active TTS speech so bot doesn't hear itself
    stopSpeaking();

    if (recognitionRef.current) {
      try {
        isStartingRef.current = true;
        recognitionRef.current.start();
      } catch (e) {
        isStartingRef.current = false;
        console.warn('Recognition start exception:', e.message);
        if (e.name === 'InvalidStateError') {
          try {
            recognitionRef.current.abort();
          } catch (err) {}
          isListeningRef.current = false;
          setIsListening(false);
        }
      }
    }
  }, [isSupported, stopSpeaking]);

  const stopListening = useCallback(() => {
    isStartingRef.current = false;
    if (recognitionRef.current && (isListeningRef.current || isListening)) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        try {
          recognitionRef.current.abort();
        } catch (err) {}
      }
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, [isListening]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  return {
    isListening,
    isSpeaking,
    transcript,
    interimTranscript,
    isSupported,
    isTtsEnabled,
    setIsTtsEnabled,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    parseVoiceCommand
  };
};
