// ============================================================
// SCORE SYSTEM — In-game score tracking + persistent leaderboard
// ============================================================

import { db } from '../storage/LocalDB.js';
import { STORAGE_KEYS } from '../utils/constants.js';
import { fmtScore } from '../utils/helpers.js';

const MAX_SCORES = 10;

export class ScoreSystem {
  constructor() {
    this.score = 0;
    this.multiplier = 1;
    this._combo = 0;
    this._comboTimer = 0;   // ms until combo resets
    this._comboWindow = 1500; // ms
    this._highScores = [];  // loaded async
    this._loaded = false;
    this._popups = [];      // { text, x, y, life }
  }

  async init() {
    const stored = await db.get(STORAGE_KEYS.HIGH_SCORES);
    this._highScores = stored || [];
    this._loaded = true;
  }

  reset() {
    this.score = 0;
    this.multiplier = 1;
    this._combo = 0;
    this._comboTimer = 0;
    this._popups = [];
  }

  // ── Scoring ──────────────────────────────────────────────

  addKill(enemyType, basePoints) {
    this._combo++;
    this._comboTimer = this._comboWindow;
    this.multiplier = Math.min(1 + Math.floor(this._combo / 5) * 0.5, 5);

    const earned = Math.round(basePoints * this.multiplier);
    this.score += earned;

    return earned;
  }

  update(dt) {
    if (this._comboTimer > 0) {
      this._comboTimer -= dt;
      if (this._comboTimer <= 0) {
        this._combo = 0;
        this.multiplier = 1;
      }
    }

    // Decay popups
    this._popups = this._popups.filter(p => {
      p.life -= dt;
      p.y -= dt * 0.04;
      return p.life > 0;
    });
  }

  addScorePopup(text, x, y) {
    this._popups.push({ text, x, y, life: 900 });
  }

  get formattedScore() {
    return fmtScore(this.score);
  }

  // ── Persistence ──────────────────────────────────────────

  async saveScore(playerName = 'PILOT') {
    if (!this._loaded) return;

    const entry = {
      name: playerName.slice(0, 8).toUpperCase(),
      score: this.score,
      date: new Date().toLocaleDateString(),
    };

    this._highScores.push(entry);
    this._highScores.sort((a, b) => b.score - a.score);
    this._highScores = this._highScores.slice(0, MAX_SCORES);

    await db.save(STORAGE_KEYS.HIGH_SCORES, this._highScores);
    return this.getRank(this.score);
  }

  getHighScores() {
    return [...this._highScores];
  }

  getRank(score) {
    return this._highScores.findIndex(e => e.score === score) + 1;
  }

  isHighScore(score) {
    if (this._highScores.length < MAX_SCORES) return true;
    return score > (this._highScores[MAX_SCORES - 1]?.score ?? 0);
  }

  // ── Render popups ────────────────────────────────────────

  drawPopups(ctx) {
    for (const p of this._popups) {
      const alpha = Math.min(1, p.life / 300);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffd740';
      ctx.font = 'bold 14px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    }
  }
}
