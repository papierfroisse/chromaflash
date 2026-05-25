/**
 * CHROMAFLASH — Color Engine
 * Full colorimetric engine: conversions RGB ↔ HEX ↔ HSL ↔ CMYK ↔ CIELAB
 * Delta E CIEDE2000 for perceptual color difference
 */

// ─── CONVERSIONS ────────────────────────────────────────────────────────────

export function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}

export function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function rgbToCmyk({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round((1 - r - k) / (1 - k) * 100),
    m: Math.round((1 - g - k) / (1 - k) * 100),
    y: Math.round((1 - b - k) / (1 - k) * 100),
    k: Math.round(k * 100)
  };
}

export function cmykToRgb({ c, m, y, k }) {
  c /= 100; m /= 100; y /= 100; k /= 100;
  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k))
  };
}

export function hslToRgb({ h, s, l }) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

// ─── RGB → XYZ → CIELAB ─────────────────────────────────────────────────────

function linearize(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function rgbToXyz({ r, g, b }) {
  const lr = linearize(r), lg = linearize(g), lb = linearize(b);
  return {
    x: lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375,
    y: lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750,
    z: lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041
  };
}

function xyzToLab({ x, y, z }) {
  // D65 white point
  const xn = 0.95047, yn = 1.00000, zn = 1.08883;
  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const fx = f(x / xn), fy = f(y / yn), fz = f(z / zn);
  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
}

export function rgbToLab(rgb) {
  return xyzToLab(rgbToXyz(rgb));
}

// ─── DELTA E CIEDE2000 ───────────────────────────────────────────────────────
// Reference: Sharma et al. (2005)

export function deltaE00(lab1, lab2) {
  const { L: L1, a: a1, b: b1 } = lab1;
  const { L: L2, a: a2, b: b2 } = lab2;

  const kL = 1, kC = 1, kH = 1;

  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const Cav = (C1 + C2) / 2;
  const C7 = Math.pow(Cav, 7);
  const G = 0.5 * (1 - Math.sqrt(C7 / (C7 + Math.pow(25, 7))));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  let h1p = Math.atan2(b1, a1p) * 180 / Math.PI;
  if (h1p < 0) h1p += 360;
  let h2p = Math.atan2(b2, a2p) * 180 / Math.PI;
  if (h2p < 0) h2p += 360;

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp;
  if (C1p * C2p === 0) dhp = 0;
  else if (Math.abs(h2p - h1p) <= 180) dhp = h2p - h1p;
  else if (h2p - h1p > 180) dhp = h2p - h1p - 360;
  else dhp = h2p - h1p + 360;

  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * Math.PI / 360);

  const Lbarp = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;

  let Hbarp;
  if (C1p * C2p === 0) Hbarp = h1p + h2p;
  else if (Math.abs(h1p - h2p) <= 180) Hbarp = (h1p + h2p) / 2;
  else if (h1p + h2p < 360) Hbarp = (h1p + h2p + 360) / 2;
  else Hbarp = (h1p + h2p - 360) / 2;

  const T = 1
    - 0.17 * Math.cos((Hbarp - 30) * Math.PI / 180)
    + 0.24 * Math.cos(2 * Hbarp * Math.PI / 180)
    + 0.32 * Math.cos((3 * Hbarp + 6) * Math.PI / 180)
    - 0.20 * Math.cos((4 * Hbarp - 63) * Math.PI / 180);

  const SL = 1 + 0.015 * Math.pow(Lbarp - 50, 2) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2));
  const SC = 1 + 0.045 * Cbarp;
  const SH = 1 + 0.015 * Cbarp * T;

  const Cbarp7 = Math.pow(Cbarp, 7);
  const RC = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + Math.pow(25, 7)));
  const dt = 30 * Math.exp(-Math.pow((Hbarp - 275) / 25, 2));
  const RT = -RC * Math.sin(2 * dt * Math.PI / 180);

  return Math.sqrt(
    Math.pow(dLp / (kL * SL), 2) +
    Math.pow(dCp / (kC * SC), 2) +
    Math.pow(dHp / (kH * SH), 2) +
    RT * (dCp / (kC * SC)) * (dHp / (kH * SH))
  );
}

// ─── SCORE CALCULATION ───────────────────────────────────────────────────────

export function computeScore(targetRgb, userRgb, maxPoints = 5000) {
  const targetLab = rgbToLab(targetRgb);
  const userLab = rgbToLab(userRgb);
  const de = deltaE00(targetLab, userLab);
  const score = Math.round(maxPoints * Math.exp(-de / 8));
  return { score: Math.max(0, score), deltaE: de };
}

export function getRank(score, maxPoints = 5000) {
  const pct = score / maxPoints;
  if (pct >= 0.98) return { label: 'PARFAIT', emoji: '💎', class: 'rank-perfect' };
  if (pct >= 0.90) return { label: 'EXCELLENT', emoji: '⭐', class: 'rank-excellent' };
  if (pct >= 0.75) return { label: 'TRÈS BIEN', emoji: '🎨', class: 'rank-great' };
  if (pct >= 0.55) return { label: 'BIEN', emoji: '👍', class: 'rank-good' };
  if (pct >= 0.30) return { label: 'PEUT MIEUX FAIRE', emoji: '😅', class: 'rank-ok' };
  return { label: 'DALTONIEN', emoji: '😵', class: 'rank-bad' };
}

// ─── COLOR GENERATION ────────────────────────────────────────────────────────

// Simple seeded PRNG (Mulberry32) for Daily Challenge
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function getDailyColor(dateString) {
  // dateString format: "YYYY-MM-DD"
  const seed = parseInt(dateString.replace(/-/g, ''), 10);
  const prng = mulberry32(seed);

  // Daily colors are 'hard' difficulty
  const hue = prng() * 360;
  const sat = 15 + prng() * 35;
  const lit = 30 + prng() * 40;
  return hslToRgb({ h: Math.round(hue), s: Math.round(sat), l: Math.round(lit) });
}

export function randomColor(difficulty = 'normal') {
  const r = () => Math.floor(Math.random() * 256);

  switch (difficulty) {
    case 'easy': {
      // Primary/secondary vivid colors
      const vivid = [
        { r: 220, g: 30, b: 30 }, { r: 30, g: 120, b: 220 }, { r: 30, g: 180, b: 60 },
        { r: 240, g: 180, b: 20 }, { r: 180, g: 30, b: 220 }, { r: 20, g: 200, b: 200 },
        { r: 240, g: 100, b: 30 }, { r: 220, g: 30, b: 120 }
      ];
      const base = vivid[Math.floor(Math.random() * vivid.length)];
      const jitter = 20;
      return {
        r: Math.max(0, Math.min(255, base.r + Math.floor((Math.random() - 0.5) * jitter))),
        g: Math.max(0, Math.min(255, base.g + Math.floor((Math.random() - 0.5) * jitter))),
        b: Math.max(0, Math.min(255, base.b + Math.floor((Math.random() - 0.5) * jitter)))
      };
    }
    case 'hard': {
      // Desaturated, earthy, subtle
      const hue = Math.random() * 360;
      const sat = 15 + Math.random() * 35;
      const lit = 30 + Math.random() * 40;
      return hslToRgb({ h: Math.round(hue), s: Math.round(sat), l: Math.round(lit) });
    }
    case 'expert': {
      // Very desaturated mid-tones — nearly grey
      const base = 100 + Math.floor(Math.random() * 80);
      const jitter = 12;
      return {
        r: Math.max(0, Math.min(255, base + Math.floor((Math.random() - 0.5) * jitter))),
        g: Math.max(0, Math.min(255, base + Math.floor((Math.random() - 0.5) * jitter))),
        b: Math.max(0, Math.min(255, base + Math.floor((Math.random() - 0.5) * jitter)))
      };
    }
    default: // normal
      return { r: r(), g: r(), b: r() };
  }
}

// ─── CSS COLOR NAMES ─────────────────────────────────────────────────────────

const CSS_COLORS = [
  ['red', [255,0,0]], ['lime', [0,255,0]], ['blue', [0,0,255]],
  ['yellow', [255,255,0]], ['cyan', [0,255,255]], ['magenta', [255,0,255]],
  ['white', [255,255,255]], ['black', [0,0,0]], ['gray', [128,128,128]],
  ['orange', [255,165,0]], ['purple', [128,0,128]], ['pink', [255,192,203]],
  ['brown', [165,42,42]], ['coral', [255,127,80]], ['crimson', [220,20,60]],
  ['tomato', [255,99,71]], ['salmon', [250,128,114]], ['gold', [255,215,0]],
  ['khaki', [240,230,140]], ['olive', [128,128,0]], ['teal', [0,128,128]],
  ['navy', [0,0,128]], ['maroon', [128,0,0]], ['silver', [192,192,192]],
  ['indigo', [75,0,130]], ['violet', [238,130,238]], ['orchid', [218,112,214]],
  ['plum', [221,160,221]], ['lavender', [230,230,250]], ['ivory', [255,255,240]],
  ['beige', [245,245,220]], ['turquoise', [64,224,208]], ['aquamarine', [127,255,212]],
  ['chartreuse', [127,255,0]], ['peru', [205,133,63]], ['sienna', [160,82,45]],
  ['chocolate', [210,105,30]], ['tan', [210,180,140]], ['wheat', [245,222,179]],
  ['linen', [250,240,230]], ['azure', [240,255,255]], ['mint', [62,180,137]],
  ['rose', [255,0,127]], ['amber', [255,191,0]], ['emerald', [0,201,87]],
  ['scarlet', [255,36,0]], ['cobalt', [0,71,171]], ['umber', [99,81,71]],
  ['ecru', [194,178,128]], ['fuchsia', [255,0,255]], ['jade', [0,168,107]],
  ['mauve', [224,176,255]], ['ochre', [204,119,34]], ['puce', [204,136,153]],
  ['taupe', [72,60,50]], ['vermillion', [227,66,52]], ['magenta', [255,0,255]],
];

export function findClosestColorName(rgb) {
  let best = null, bestDist = Infinity;
  const lab = rgbToLab(rgb);
  for (const [name, [r, g, b]] of CSS_COLORS) {
    const cLab = rgbToLab({ r, g, b });
    const de = deltaE00(lab, cLab);
    if (de < bestDist) { bestDist = de; best = name; }
  }
  return best;
}

export function getColorCandidates(rgb, count = 4) {
  const lab = rgbToLab(rgb);
  const scored = CSS_COLORS.map(([name, [r, g, b]]) => ({
    name, de: deltaE00(lab, rgbToLab({ r, g, b }))
  })).sort((a, b) => a.de - b.de);

  const correct = scored[0];
  // Pick distractors: not too close, not too far
  const distractors = scored.slice(1, 20)
    .sort(() => Math.random() - 0.5)
    .slice(0, count - 1);

  const choices = [correct, ...distractors].sort(() => Math.random() - 0.5);
  return { choices: choices.map(c => c.name), correct: correct.name };
}

// ─── COLOR STRING PARSING ────────────────────────────────────────────────────

export function parseColorInput(input) {
  input = input.trim();
  // HEX
  if (/^#?[0-9a-fA-F]{3,6}$/.test(input)) {
    if (!input.startsWith('#')) input = '#' + input;
    if (input.length === 4) input = '#' + input[1] + input[1] + input[2] + input[2] + input[3] + input[3];
    return hexToRgb(input);
  }
  // CSS Name
  const low = input.toLowerCase();
  for (const [name, [r, g, b]] of CSS_COLORS) {
    if (name === low) return { r, g, b };
  }
  return null;
}

export { CSS_COLORS };
