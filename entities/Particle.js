// ============================================================
// PARTICLE — Poolable visual effect particle
// ============================================================

import { lerp } from '../utils/helpers.js';

export class Particle {
  constructor() {
    this.active = false;
    this.reset();
  }

  // ── Pool lifecycle ───────────────────────────────────────

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} vx    px/s
   * @param {number} vy    px/s
   * @param {string} color CSS color string
   * @param {number} life  lifetime in ms
   * @param {number} size  radius in px
   * @param {'circle'|'spark'} shape
   */
  init(x, y, vx, vy, color, life, size = 4, shape = 'circle') {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color;
    this.maxLife = life;
    this.life = life;
    this.size = size;
    this.shape = shape;
    this.active = true;
    this.gravity = shape === 'spark' ? 80 : 0; // px/s²
  }

  reset() {
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.color = '#fff';
    this.life = 0; this.maxLife = 1;
    this.size = 4;
    this.shape = 'circle';
    this.gravity = 0;
  }

  // ── Update ───────────────────────────────────────────────

  update(dt) {
    const s = dt / 1000;
    this.vy += this.gravity * s;
    this.x += this.vx * s;
    this.y += this.vy * s;
    this.life -= dt;
    // Gentle drag
    this.vx *= 0.98;
    this.vy *= 0.98;
  }

  get alive() { return this.life > 0; }

  get progress() { return 1 - this.life / this.maxLife; } // 0→1

  // ── Render ───────────────────────────────────────────────

  draw(ctx) {
    const t = this.progress;
    const alpha = t < 0.2
      ? lerp(0, 1, t / 0.2)       // fade in
      : lerp(1, 0, (t - 0.2) / 0.8); // fade out
    const radius = this.size * (1 - t * 0.6);

    ctx.save();
    ctx.globalAlpha = alpha;

    if (this.shape === 'spark') {
      const len = Math.max(2, Math.hypot(this.vx, this.vy) * 0.012);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = radius;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const nx = this.vx / (Math.hypot(this.vx, this.vy) || 1);
      const ny = this.vy / (Math.hypot(this.vx, this.vy) || 1);
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - nx * len, this.y - ny * len);
      ctx.stroke();
    } else {
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = radius * 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
