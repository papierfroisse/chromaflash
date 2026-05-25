/**
 * CHROMAFLASH — UI Engine
 * Sounds (Web Audio API), animations, feedback, settings
 */

// ─── WEB AUDIO ENGINE ────────────────────────────────────────────────────────

let audioCtx = null;

function getAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return null; }
  }
  return audioCtx;
}

function playTone(frequency, duration, type = 'sine', gainVal = 0.15, fadeOut = true) {
  const ctx = getAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(gainVal, ctx.currentTime);
  if (fadeOut) gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playChord(freqs, duration = 0.4) {
  freqs.forEach((f, i) => {
    setTimeout(() => playTone(f, duration, 'sine', 0.1), i * 40);
  });
}

export const Sound = {
  perfect()   { playChord([523, 659, 784, 1047], 0.6); },
  excellent() { playChord([440, 554, 659], 0.5); },
  good()      { playTone(440, 0.3, 'sine', 0.12); },
  ok()        { playTone(330, 0.25, 'sine', 0.1); },
  bad()       { playTone(180, 0.4, 'sawtooth', 0.08); },
  wrong()     { playChord([220, 196], 0.3); },
  tick()      { playTone(800, 0.05, 'square', 0.06, false); },
  levelUp()   { playChord([392, 494, 587, 784], 0.8); },
  loseLife()  { playChord([220, 196, 165], 0.6); },
  gameOver()  { [330, 294, 262, 220].forEach((f,i) => setTimeout(() => playTone(f, 0.3, 'sawtooth', 0.1), i*120)); },
  click()     { playTone(600, 0.06, 'square', 0.05, false); },
  swoosh()    { 
    const ctx = getAudio(); if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(); osc.stop(ctx.currentTime + 0.2);
  },
  reveal() {
    const ctx = getAudio(); if (!ctx) return;
    [0, 0.06, 0.12].forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 300 + i * 80;
      gain.gain.setValueAtTime(0.06, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.3);
    });
  }
};

// ─── SETTINGS MANAGER ────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  swatchBg: 'neutral', // 'neutral' | 'paper' | 'dark'
  difficulty: 'normal', // 'easy' | 'normal' | 'hard'
  sound: true,
};

export function getSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('cf_settings'));
    return { ...DEFAULT_SETTINGS, ...s };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

export function saveSettings(settings) {
  localStorage.setItem('cf_settings', JSON.stringify({ ...getSettings(), ...settings }));
}

export function getSwatchBgColor() {
  const bg = getSettings().swatchBg;
  return bg === 'neutral' ? '#484848' : bg === 'paper' ? '#F0EDE8' : '#111111';
}

// ─── SWATCH BACKGROUND ───────────────────────────────────────────────────────

export function applySwatchBg(el) {
  if (!el) return;
  el.style.background = getSwatchBgColor();
}

// ─── ACCENT COLOR (follows target color) ─────────────────────────────────────

export function setAccent(hex) {
  document.documentElement.style.setProperty('--accent', hex);
  // Generate glow from hex
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  document.documentElement.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.3)`);
  document.documentElement.style.setProperty('--accent-dim',  `rgba(${r},${g},${b},0.12)`);
}

// ─── CONFETTI ────────────────────────────────────────────────────────────────

export function launchConfetti(count = 40) {
  const colors = ['#FF6B6B','#FFE66D','#6BCB77','#4D96FF','#B388FF','#FF9F1C','#00D4AA'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-particle';
    p.style.cssText = `
      left: ${40 + Math.random() * 20}%;
      top: 40%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      --dx: ${(Math.random() - 0.5) * 300}px;
      --dy: ${-100 - Math.random() * 300}px;
      --duration: ${0.8 + Math.random() * 0.8}s;
      --delay: ${Math.random() * 0.3}s;
      transform: rotate(${Math.random() * 360}deg);
    `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1500);
  }
}

// ─── ANIMATED SCORE COUNTER ──────────────────────────────────────────────────

export function animateCounter(el, from, to, duration = 800) {
  const start = performance.now();
  const diff = to - from;
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
    el.textContent = Math.round(from + diff * ease).toLocaleString();
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = to.toLocaleString();
  }
  requestAnimationFrame(step);
}

// ─── DELTA E COLOR + LABEL ────────────────────────────────────────────────────

export function getDeltaClass(de) {
  if (de < 2)  return 'very-close';
  if (de < 5)  return 'close';
  if (de < 12) return 'medium';
  return 'far';
}

export function getDeltaLabel(de) {
  if (de < 1)  return 'Invisible à l\'œil nu';
  if (de < 2)  return 'Imperceptible';
  if (de < 5)  return 'Très proche';
  if (de < 10) return 'Proche';
  if (de < 20) return 'Visible';
  if (de < 40) return 'Différence nette';
  return 'Très différent';
}

export function getDeltaBarWidth(de) {
  // 0 → 100%, 50+ → 0%
  return Math.max(0, Math.min(100, 100 - (de / 50) * 100));
}

export function getDeltaBarColor(de) {
  if (de < 2)  return '#34D399';
  if (de < 5)  return '#60A5FA';
  if (de < 12) return '#FBBF24';
  return '#F87171';
}

// ─── TIMER RING ───────────────────────────────────────────────────────────────

export function updateTimerRing(fillEl, textEl, secondsLeft, totalSeconds) {
  const CIRCUMFERENCE = 138.23;
  const progress = secondsLeft / totalSeconds;
  const offset = CIRCUMFERENCE * (1 - progress);
  fillEl.style.strokeDashoffset = offset;
  if (textEl) textEl.textContent = secondsLeft;

  // Color changes as time runs out
  if (progress < 0.3) {
    fillEl.style.stroke = '#F87171';
  } else if (progress < 0.6) {
    fillEl.style.stroke = '#FBBF24';
  } else {
    fillEl.style.stroke = 'var(--accent)';
  }
}

// ─── ROUND DOTS ───────────────────────────────────────────────────────────────

export function updateRoundDots(container, current, total) {
  container.innerHTML = '';
  for (let i = 1; i <= total; i++) {
    const dot = document.createElement('div');
    dot.className = 'round-dot' + (i < current ? ' done' : i === current ? ' current' : '');
    container.appendChild(dot);
  }
}

// ─── SHOW FEEDBACK TOAST ─────────────────────────────────────────────────────

export function showToast(message, type = 'info', duration = 2000) {
  const existing = document.querySelector('.cf-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  const colors = { info: '#60A5FA', success: '#34D399', error: '#F87171', warning: '#FBBF24' };
  toast.style.cssText = `
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px);
    background: var(--bg-card); border: 1px solid ${colors[type]}40;
    color: ${colors[type]}; padding: 12px 20px; border-radius: 999px;
    font-size: 0.875rem; font-weight: 600; font-family: 'Space Grotesk', sans-serif;
    z-index: 9999; transition: transform 0.3s, opacity 0.3s;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  `;
  toast.className = 'cf-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─── PLAY SOUND FOR RANK ─────────────────────────────────────────────────────

export function playSoundForScore(score, max) {
  const pct = score / max;
  const s = getSettings();
  if (!s.sound) return;
  if (pct >= 0.98) { Sound.perfect(); launchConfetti(60); }
  else if (pct >= 0.90) { Sound.excellent(); launchConfetti(30); }
  else if (pct >= 0.75) { Sound.good(); }
  else if (pct >= 0.50) { Sound.ok(); }
  else { Sound.bad(); }
}

// ─── SETTINGS PANEL ──────────────────────────────────────────────────────────

export function initSettingsPanel() {
  const overlay = document.getElementById('settings-overlay');
  const btn = document.getElementById('settings-btn');
  if (!overlay || !btn) return;

  btn.addEventListener('click', () => {
    overlay.classList.toggle('open');
    Sound.click();
  });
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });

  // Load current settings
  const s = getSettings();

  // Swatch bg pickers
  document.querySelectorAll('.swatch-option').forEach(opt => {
    const val = opt.dataset.bg;
    if (val === s.swatchBg) opt.classList.add('selected');
    opt.addEventListener('click', () => {
      document.querySelectorAll('.swatch-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      saveSettings({ swatchBg: val });
      // Refresh all swatch bgs on page
      document.querySelectorAll('.swatch-bg').forEach(el => el.style.background = getSwatchBgColor());
      Sound.click();
    });
  });

  // Sound toggle
  const soundToggle = document.getElementById('sound-toggle');
  if (soundToggle) {
    soundToggle.checked = s.sound;
    soundToggle.addEventListener('change', () => {
      saveSettings({ sound: soundToggle.checked });
    });
  }
}

// ─── COPY SHARE TEXT ─────────────────────────────────────────────────────────

export function copyScore(text) {
  navigator.clipboard?.writeText(text).then(() => {
    showToast('Score copié ! 📋', 'success');
  }).catch(() => {
    showToast(text, 'info', 4000);
  });
}
