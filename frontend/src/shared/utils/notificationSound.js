let audioCtx = null;
let primed = false;

function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function primeNotificationAudio() {
  const ctx = getAudioContext();
  if (!ctx) return false;
  primed = true;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return true;
}

// Unlock AudioContext on first user gesture so socket-triggered sounds work.
// Must call ctx.resume() synchronously inside the event handler.
function setupAutoPrime() {
  const unlock = () => {
    if (primed) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => { primed = true; }).catch(() => {});
    } else {
      primed = true;
    }
    document.removeEventListener('click',      unlock, true);
    document.removeEventListener('touchstart', unlock, true);
    document.removeEventListener('keydown',    unlock, true);
  };
  document.addEventListener('click',      unlock, true);
  document.addEventListener('touchstart', unlock, true);
  document.addEventListener('keydown',    unlock, true);
}

if (typeof document !== 'undefined') {
  setupAutoPrime();
}

export async function playNotificationSound({ volume = 0.6 } = {}) {
  if (!isSoundEnabled()) return false;
  
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state === 'suspended') {
    try { await ctx.resume(); } catch { return false; }
  }

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(volume, now + 0.05);
  
  // Total ring duration: 2.0 seconds
  master.gain.setValueAtTime(volume, now + 1.9);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
  master.connect(ctx.destination);

  // Classic telephone ring (440 + 480 Hz) modulated by 20 Hz
  const playRingTone = (start, dur) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.value = 440;
    osc2.frequency.value = 480;

    lfo.type = 'square';
    lfo.frequency.value = 20; // 20 Hz "trill"
    lfoGain.gain.value = 0.5;
    
    lfo.connect(lfoGain);
    
    const ringGain = ctx.createGain();
    ringGain.gain.setValueAtTime(0, now + start);
    ringGain.gain.linearRampToValueAtTime(1.0, now + start + 0.05);
    ringGain.gain.setValueAtTime(1.0, now + start + dur - 0.05);
    ringGain.gain.linearRampToValueAtTime(0, now + start + dur);

    lfoGain.connect(ringGain.gain);
    
    osc1.connect(ringGain);
    osc2.connect(ringGain);
    ringGain.connect(master);
    
    osc1.start(now + start);
    osc2.start(now + start);
    lfo.start(now + start);
    
    osc1.stop(now + start + dur);
    osc2.stop(now + start + dur);
    lfo.stop(now + start + dur);
  };

  // Three loud bursts
  playRingTone(0.0, 0.5);
  playRingTone(0.7, 0.5);
  playRingTone(1.4, 0.5);

  return true;
}

export async function playSellerBatchSound(action = 'approved', { volume = 0.15 } = {}) {
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state === 'suspended') {
    try { await ctx.resume(); } catch { return false; }
  }

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(volume, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
  master.connect(ctx.destination);

  const playTone = (freq, start, dur, type = 'sine') => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + start);
    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.9, now + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now + start);
    osc.stop(now + start + dur);
  };

  if (action === 'approved') {
    // Ascending C-major arpeggio — bright, celebratory
    playTone(523.25, 0.00, 0.16, 'sine');     // C5
    playTone(659.25, 0.13, 0.16, 'sine');     // E5
    playTone(783.99, 0.26, 0.16, 'sine');     // G5
    playTone(1046.5, 0.39, 0.32, 'triangle'); // C6 — ring out
  } else {
    // Soft descending two-note tap — informative, not harsh
    playTone(493.88, 0.00, 0.22, 'sine'); // B4
    playTone(369.99, 0.20, 0.32, 'sine'); // F#4
  }

  return true;
}

// Punchy double-tap alert used for new bulk order inquiries
export async function playBulkOrderSound({ volume = 0.16 } = {}) {
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state === 'suspended') {
    try { await ctx.resume(); } catch { return false; }
  }

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(volume, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
  master.connect(ctx.destination);

  const playTone = (freq, start, dur, type = 'sine') => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + start);
    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.9, now + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now + start);
    osc.stop(now + start + dur);
  };

  // Two-tap "ding-ding" — distinct from single chime or arpeggio
  playTone(880.0,  0.00, 0.18, 'sine');     // A5 first tap
  playTone(1108.7, 0.04, 0.12, 'triangle'); // C#6 harmonic
  playTone(880.0,  0.28, 0.18, 'sine');     // A5 second tap
  playTone(1108.7, 0.32, 0.12, 'triangle'); // C#6 harmonic

  return true;
}

export function isSoundEnabled() {
  const raw = localStorage.getItem('app_notification_sound');
  return raw == null ? true : raw === 'true';
}

export function setSoundEnabled(enabled) {
  localStorage.setItem('app_notification_sound', String(!!enabled));
}
