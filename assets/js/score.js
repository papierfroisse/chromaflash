/**
 * CHROMAFLASH — Score & Progression System
 */

import { computeScore, getRank } from './color.js';

// ─── LOCAL STORAGE PERSISTENCE ───────────────────────────────────────────────

const STORAGE_KEY = 'chromaflash_data';

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch { return {}; }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── SESSION STATE ────────────────────────────────────────────────────────────

export class GameSession {
  constructor(mode, maxRounds = 5, maxPointsPerRound = 5000) {
    this.mode = mode;
    this.maxRounds = maxRounds;
    this.maxPointsPerRound = maxPointsPerRound;
    this.rounds = [];
    this.streak = 0;
    this.bestStreak = 0;
    this.startTime = Date.now();
  }

  get currentRound() { return this.rounds.length + 1; }
  get totalScore() { return this.rounds.reduce((s, r) => s + r.score, 0); }
  get maxPossible() { return this.rounds.length * this.maxPointsPerRound; }
  get isComplete() { return this.rounds.length >= this.maxRounds; }

  addRound(targetRgb, userRgb) {
    const { score, deltaE } = computeScore(targetRgb, userRgb, this.maxPointsPerRound);
    const rank = getRank(score, this.maxPointsPerRound);
    const isGood = score / this.maxPointsPerRound >= 0.80;

    if (isGood) {
      this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
    } else {
      this.streak = 0;
    }

    const round = { targetRgb, userRgb, score, deltaE, rank, streak: this.streak };
    this.rounds.push(round);
    return round;
  }

  getStreakMultiplier() {
    if (this.streak >= 5) return 1.5;
    if (this.streak >= 3) return 1.25;
    return 1.0;
  }

  getFinalSummary() {
    const total = this.totalScore;
    const maxTotal = this.maxRounds * this.maxPointsPerRound;
    const pct = total / maxTotal;
    const duration = Math.round((Date.now() - this.startTime) / 1000);

    let globalRank;
    if (pct >= 0.95) globalRank = { label: 'MAÎTRE COLORISTE', emoji: '🏆', class: 'rank-perfect' };
    else if (pct >= 0.85) globalRank = { label: 'GRAPHISTE EXPERT', emoji: '💎', class: 'rank-excellent' };
    else if (pct >= 0.70) globalRank = { label: 'GRAPHISTE SENIOR', emoji: '⭐', class: 'rank-great' };
    else if (pct >= 0.50) globalRank = { label: 'GRAPHISTE JR.', emoji: '🎨', class: 'rank-good' };
    else if (pct >= 0.30) globalRank = { label: 'STAGIAIRE', emoji: '📐', class: 'rank-ok' };
    else globalRank = { label: 'DALTONIEN CERTIFIÉ', emoji: '😵', class: 'rank-bad' };

    return { total, maxTotal, pct, duration, globalRank, rounds: this.rounds, bestStreak: this.bestStreak };
  }

  save() {
    const data = loadData();
    const summary = this.getFinalSummary();
    if (!data.records) data.records = {};
    if (!data.records[this.mode] || summary.total > data.records[this.mode].best) {
      data.records[this.mode] = { best: summary.total, rank: summary.globalRank.label, date: new Date().toISOString() };
    }
    if (!data.history) data.history = [];
    data.history.unshift({ mode: this.mode, total: summary.total, maxTotal: summary.maxTotal, rank: summary.globalRank.label, date: new Date().toISOString() });
    if (data.history.length > 20) data.history = data.history.slice(0, 20);
    saveData(data);
    return data;
  }
}

// ─── SURVIVAL MODE STATE ─────────────────────────────────────────────────────

export class SurvivalSession {
  constructor() {
    this.lives = 3;
    this.round = 0;
    this.score = 0;
    this.level = 1;
    this.streak = 0;
    this.alive = true;
    this.startTime = Date.now();
  }

  // Difficulty scaling: tighter tolerance as level increases
  getThreshold() {
    // ΔE threshold below which you PASS (starts at 20, goes to 2)
    return Math.max(2, 22 - this.level * 1.8);
  }

  getDifficulty() {
    if (this.level <= 3) return 'easy';
    if (this.level <= 7) return 'normal';
    if (this.level <= 12) return 'hard';
    return 'expert';
  }

  addRound(targetRgb, userRgb) {
    this.round++;
    const { score, deltaE } = computeScore(targetRgb, userRgb, 5000);
    this.score += score;

    const threshold = this.getThreshold();
    const passed = deltaE <= threshold;

    if (passed) {
      this.streak++;
      if (this.streak % 3 === 0) this.level++;
    } else {
      this.lives--;
      this.streak = 0;
      if (this.lives <= 0) this.alive = false;
    }

    return { score, deltaE, passed, threshold, rank: getRank(score), livesLeft: this.lives };
  }

  getBestScore() {
    const data = loadData();
    return data?.records?.survival?.best || 0;
  }

  save() {
    const data = loadData();
    if (!data.records) data.records = {};
    if (!data.records.survival || this.score > data.records.survival.best) {
      data.records.survival = { best: this.score, level: this.level, date: new Date().toISOString() };
    }
    saveData(data);
  }
}

export function getGlobalStats() {
  return loadData();
}
