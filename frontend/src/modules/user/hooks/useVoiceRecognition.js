import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for complete, error-resilient Speech-to-Text (STT) and Text-to-Speech (TTS) voice control.
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

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const isStartingRef = useRef(false);

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
      lower.includes('pro membership')
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
      lower.includes('delivery status')
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
      lower.includes('custom quotation')
    ) {
      return { type: 'CREATE_RFQ', label: 'Create Bulk RFQ', phrase: text, path: '/rfq/new' };
    }

    // 4. Shopping Cart Intent
    if (
      lower.includes('go to cart') ||
      lower.includes('open cart') ||
      lower.includes('view cart') ||
      lower.includes('show cart')
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

  // Initialize Speech Recognition once on mount
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
      recognition.lang = 'en-IN'; // Optimized for English with Indian & global accent

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

  const startListening = useCallback(() => {
    if (!isSupported) {
      toast.error('Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.');
      return;
    }

    // Prevent duplicate start calls
    if (isListeningRef.current || isStartingRef.current) {
      return;
    }

    // Cancel any active TTS speech so bot doesn't hear itself
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } catch (e) {}
    }

    if (recognitionRef.current) {
      try {
        isStartingRef.current = true;
        recognitionRef.current.start();
      } catch (e) {
        isStartingRef.current = false;
        console.warn('Recognition start exception:', e.message);
        // If state was mismatched, reset
        if (e.name === 'InvalidStateError') {
          try {
            recognitionRef.current.abort();
          } catch (err) {}
          isListeningRef.current = false;
          setIsListening(false);
        }
      }
    }
  }, [isSupported]);

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

  /**
   * Speaks out response text using Web Speech Synthesis
   */
  const speak = useCallback((text) => {
    if (!isTtsEnabled || !window.speechSynthesis || !text) return;
    try {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const cleanText = text.replace(/[*#_`~\[\]()]/g, ' ').slice(0, 300); // Clean markdown
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.lang = 'en-IN';

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS playback error:', e.message);
      setIsSpeaking(false);
    }
  }, [isTtsEnabled]);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
      setIsSpeaking(false);
    }
  }, []);

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
