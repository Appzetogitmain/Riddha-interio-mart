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

export async function playNotificationSound({ volume = 0.18 } = {}) {
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state === 'suspended') {
    try { await ctx.resume(); } catch { return false; }
  }

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(volume, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
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

  // Warm "luxury" chime
  playTone(659.25, 0.0, 0.14, 'sine'); // E5
  playTone(987.77, 0.05, 0.18, 'triangle'); // B5
  playTone(1318.51, 0.12, 0.22, 'sine'); // E6
  playTone(880.0, 0.33, 0.26, 'sine'); // A5

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
