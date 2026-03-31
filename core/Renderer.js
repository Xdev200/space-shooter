// ============================================================
// RENDERER — Canvas draw orchestrator
// ============================================================

import { GAME, COLORS } from '../utils/constants.js';

export class Renderer {
  constructor(canvas) {
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._stars = this._buildStarField(180);
    this._nebula = this._buildNebula();
  }

  get ctx() { return this._ctx; }

  // ── Frame lifecycle ──────────────────────────────────────

  clear() {
    const ctx = this._ctx;
    ctx.clearRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
  }

  /** Draw the scrolling starfield + nebula background. */
  drawBackground(dt) {
    const ctx = this._ctx;

    // Base gradient
    const grad = ctx.createLinearGradient(0, 0, 0, GAME.HEIGHT);
    grad.addColorStop(0, COLORS.BG_TOP);
    grad.addColorStop(1, COLORS.BG_BOTTOM);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    // Nebula (static, drawn first)
    this._drawNebula(ctx);

    // Scrolling stars
    this._drawStars(ctx, dt);
  }

  /** Draw all active entities from pools. */
  drawEntities(player, bulletPool, enemyPool, particlePool) {
    const ctx = this._ctx;

    // Particles (back layer)
    particlePool.forEach(p => p.draw(ctx));

    // Enemies
    enemyPool.forEach(e => e.draw(ctx));

    // Player bullets
    bulletPool.forEach(b => { if (b.owner === 'player') b.draw(ctx); });

    // Enemy bullets
    bulletPool.forEach(b => { if (b.owner === 'enemy') b.draw(ctx); });

    // Player (topmost)
    if (player.active) player.draw(ctx);
  }

  // ── Star field ───────────────────────────────────────────

  _buildStarField(count) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * GAME.WIDTH,
      y: Math.random() * GAME.HEIGHT,
      z: Math.random(),          // depth: 0 = far, 1 = near
      r: 0,
      speed: 0,
      alpha: 0,
    })).map(s => {
      s.r = 0.4 + s.z * 1.6;
      s.speed = 18 + s.z * 60;
      s.alpha = 0.2 + s.z * 0.7;
      return s;
    });
  }

  _drawStars(ctx, dt) {
    const s = dt / 1000;
    for (const star of this._stars) {
      star.y += star.speed * s;
      if (star.y > GAME.HEIGHT + 2) {
        star.y = -2;
        star.x = Math.random() * GAME.WIDTH;
      }
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();

      // Near stars get a streak
      if (star.z > 0.7) {
        ctx.globalAlpha = star.alpha * 0.3;
        ctx.fillRect(star.x - 0.5, star.y - star.speed * s * 2, 1, star.speed * s * 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  // ── Nebula ───────────────────────────────────────────────

  _buildNebula() {
    return [
      { x: 150, y: 180, rx: 200, ry: 140, color: 'rgba(100,40,180,0.04)' },
      { x: 620, y: 350, rx: 180, ry: 220, color: 'rgba(0,100,180,0.04)' },
      { x: 400, y: 480, rx: 250, ry: 150, color: 'rgba(180,30,80,0.03)' },
    ];
  }

  _drawNebula(ctx) {
    for (const n of this._nebula) {
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.scale(1, n.ry / n.rx);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, n.rx);
      grad.addColorStop(0, n.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, n.rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Utility ──────────────────────────────────────────────

  /** Draw a full-screen vignette for atmosphere. */
  drawVignette() {
    const ctx = this._ctx;
    const grad = ctx.createRadialGradient(
      GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.HEIGHT * 0.3,
      GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.HEIGHT * 0.75
    );
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, 'rgba(0,0,5,0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
  }
}
