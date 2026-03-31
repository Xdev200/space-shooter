// ============================================================
// BULLET — Poolable projectile entity
// ============================================================

import { BULLET, COLORS } from '../utils/constants.js';
import { uid } from '../utils/helpers.js';

export class Bullet {
  constructor() {
    this.id = uid();
    this.active = false;
    this.reset();
  }

  // ── Pool lifecycle ───────────────────────────────────────

  /**
   * @param {number} x         — centre X
   * @param {number} y         — centre Y
   * @param {number} vx        — velocity X px/s
   * @param {number} vy        — velocity Y px/s
   * @param {'player'|'enemy'} owner
   * @param {number} damage
   */
  init(x, y, vx, vy, owner = 'player', damage = 1) {
    this.x = x - BULLET.WIDTH / 2;
    this.y = y - BULLET.HEIGHT / 2;
    this.vx = vx;
    this.vy = vy;
    this.owner = owner;
    this.damage = damage;
    this.w = BULLET.WIDTH;
    this.h = BULLET.HEIGHT;
    this.age = 0;
    this.active = true;
  }

  reset() {
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.owner = 'player';
    this.damage = 1;
    this.w = BULLET.WIDTH;
    this.h = BULLET.HEIGHT;
    this.age = 0;
  }

  // ── Update ───────────────────────────────────────────────

  update(dt) {
    const s = dt / 1000;
    this.x += this.vx * s;
    this.y += this.vy * s;
    this.age += dt;
  }

  // ── Hitbox ───────────────────────────────────────────────

  get hitbox() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  // ── Render ───────────────────────────────────────────────

  draw(ctx) {
    const isPlayer = this.owner === 'player';
    const color = isPlayer ? COLORS.BULLET_PLAYER : COLORS.BULLET_ENEMY;
    const cx = this.x + this.w / 2;

    ctx.save();

    if (isPlayer) {
      // Glowing core
      const grad = ctx.createLinearGradient(cx, this.y, cx, this.y + this.h);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
    } else {
      // Enemy bullet: pulsing red pill
      const grad = ctx.createLinearGradient(cx, this.y + this.h, cx, this.y);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
    }

    const r = this.w / 2;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.w, this.h, r);
    ctx.fill();

    ctx.restore();
  }
}
