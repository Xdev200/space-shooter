// ============================================================
// ENEMY — Poolable enemy entity with type system
// ============================================================

import { ENEMY, BULLET, COLORS, GAME } from '../utils/constants.js';
import { uid, randFloat } from '../utils/helpers.js';

export const EnemyType = Object.freeze({
  GRUNT: 'GRUNT',
  SHOOTER: 'SHOOTER',
  TANK: 'TANK',
  BOSS: 'BOSS',
});

const TYPE_CONFIG = {
  [EnemyType.GRUNT]: {
    color: COLORS.ENEMY_GRUNT,
    accentColor: '#ffab40',
    w: 40, h: 36,
    maxHealth: ENEMY.HEALTH.GRUNT,
    points: ENEMY.POINTS.GRUNT,
    shoots: false,
  },
  [EnemyType.SHOOTER]: {
    color: COLORS.ENEMY_SHOOTER,
    accentColor: '#e040fb',
    w: 44, h: 40,
    maxHealth: ENEMY.HEALTH.SHOOTER,
    points: ENEMY.POINTS.SHOOTER,
    shoots: true,
  },
  [EnemyType.TANK]: {
    color: COLORS.ENEMY_TANK,
    accentColor: '#ccff90',
    w: 52, h: 48,
    maxHealth: ENEMY.HEALTH.TANK,
    points: ENEMY.POINTS.TANK,
    shoots: false,
  },
  [EnemyType.BOSS]: {
    color: COLORS.ENEMY_BOSS,
    accentColor: '#ff6e40',
    w: 88, h: 76,
    maxHealth: ENEMY.HEALTH.BOSS,
    points: ENEMY.POINTS.BOSS,
    shoots: true,
  },
};

export class Enemy {
  constructor() {
    this.id = uid();
    this.active = false;
    this.reset();
  }

  // ── Pool lifecycle ───────────────────────────────────────

  /**
   * @param {string} type  — EnemyType enum value
   * @param {number} x
   * @param {number} y
   * @param {number} speed — px/s
   */
  init(type, x, y, speed) {
    const cfg = TYPE_CONFIG[type];
    this.type = type;
    this.x = x;
    this.y = y;
    this.w = cfg.w;
    this.h = cfg.h;
    this.speed = speed;
    this.health = cfg.maxHealth;
    this.maxHealth = cfg.maxHealth;
    this.points = cfg.points;
    this.color = cfg.color;
    this.accentColor = cfg.accentColor;
    this.shoots = cfg.shoots;
    this.active = true;

    // Movement pattern
    this._time = 0;
    this._shootTimer = randFloat(800, 2400); // ms until first shot
    this._wobblePhase = randFloat(0, Math.PI * 2);
    this._wobbleAmp = type === EnemyType.BOSS ? 100 : 40;
    this._wobbleSpeed = type === EnemyType.BOSS ? 1.2 : 2.5;
    this._entryPhase = true;
    this._entryTarget = y + (type === EnemyType.BOSS ? 100 : 60);
    this._damaged = 0; // flash timer ms
  }

  reset() {
    this.x = 0; this.y = 0;
    this.w = 40; this.h = 36;
    this.speed = 80;
    this.health = 1; this.maxHealth = 1;
    this.points = 100;
    this.color = '#fff'; this.accentColor = '#aaa';
    this.type = EnemyType.GRUNT;
    this.shoots = false;
    this.active = false;
    this._time = 0;
    this._shootTimer = 1000;
    this._wobblePhase = 0;
    this._wobbleAmp = 40;
    this._wobbleSpeed = 2;
    this._entryPhase = true;
    this._entryTarget = 100;
    this._damaged = 0;
  }

  // ── Accessors ────────────────────────────────────────────

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  get hitbox() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  // ── Update ───────────────────────────────────────────────

  /**
   * @returns {Object|null} bullet init params if enemy fires this frame
   */
  update(dt, score) {
    const s = dt / 1000;
    this._time += s;
    if (this._damaged > 0) this._damaged -= dt;

    // Entry slide-in phase
    if (this._entryPhase) {
      this.y += this.speed * 1.5 * s;
      if (this.y >= this._entryTarget) {
        this.y = this._entryTarget;
        this._entryPhase = false;
      }
      return null;
    }

    // Sinusoidal wobble (x-axis) + slow drift downward
    this.x += Math.sin(this._time * this._wobbleSpeed + this._wobblePhase) * this._wobbleAmp * s;
    this.y += this.speed * 0.3 * s;

    // Clamp to screen
    this.x = Math.max(0, Math.min(GAME.WIDTH - this.w, this.x));

    // Shoot?
    let shotParams = null;
    if (this.shoots) {
      this._shootTimer -= dt;
      if (this._shootTimer <= 0) {
        const interval = this.type === EnemyType.BOSS ? 600 : 1400;
        this._shootTimer = interval + randFloat(-200, 200);
        shotParams = {
          x: this.cx, y: this.y + this.h,
          vx: 0, vy: BULLET.ENEMY_SPEED,
          owner: 'enemy', damage: this.type === EnemyType.BOSS ? 25 : 15,
        };
      }
    }

    return shotParams;
  }

  /**
   * Apply damage. Returns true if enemy is destroyed.
   */
  takeDamage(amount) {
    this.health -= amount;
    this._damaged = 120; // flash ms
    return this.health <= 0;
  }

  isOffScreen() {
    return this.y > GAME.HEIGHT + 40;
  }

  // ── Render ───────────────────────────────────────────────

  draw(ctx) {
    const damaged = this._damaged > 0;

    ctx.save();
    ctx.translate(this.cx, this.cy);

    if (damaged) {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this._damaged * 0.08);
    }

    ctx.shadowColor = this.color;
    ctx.shadowBlur = 18;

    switch (this.type) {
      case EnemyType.GRUNT:    this._drawGrunt(ctx); break;
      case EnemyType.SHOOTER:  this._drawShooter(ctx); break;
      case EnemyType.TANK:     this._drawTank(ctx); break;
      case EnemyType.BOSS:     this._drawBoss(ctx); break;
    }

    // Health bar (only for multi-health enemies)
    if (this.maxHealth > 1) {
      this._drawHealthBar(ctx);
    }

    ctx.restore();
  }

  _drawHealthBar(ctx) {
    const bw = this.w;
    const bh = 4;
    const bx = -this.w / 2;
    const by = this.h / 2 + 6;
    const pct = Math.max(0, this.health / this.maxHealth);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1a1a3a';
    ctx.fillRect(bx, by, bw, bh);

    const hColor = pct > 0.5 ? this.color : pct > 0.25 ? '#ffd740' : '#ff1744';
    ctx.fillStyle = hColor;
    ctx.fillRect(bx, by, bw * pct, bh);
  }

  _drawGrunt(ctx) {
    const hw = this.w / 2, hh = this.h / 2;
    ctx.fillStyle = '#0a0a14';
    ctx.beginPath();
    ctx.moveTo(0, hh);
    ctx.lineTo(-hw, -hh * 0.3);
    ctx.lineTo(-hw * 0.3, -hh);
    ctx.lineTo(hw * 0.3, -hh);
    ctx.lineTo(hw, -hh * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(0, -hh * 0.3, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  _drawShooter(ctx) {
    const hw = this.w / 2, hh = this.h / 2;
    ctx.fillStyle = '#100a14';
    ctx.beginPath();
    ctx.moveTo(0, hh);
    ctx.lineTo(-hw * 0.8, 0);
    ctx.lineTo(-hw * 0.4, -hh);
    ctx.lineTo(hw * 0.4, -hh);
    ctx.lineTo(hw * 0.8, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cannons
    ctx.fillStyle = this.color;
    ctx.fillRect(-hw * 0.15 - 3, hh * 0.2, 6, hh * 0.6);

    ctx.fillStyle = this.accentColor;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawTank(ctx) {
    const hw = this.w / 2, hh = this.h / 2;

    // Hexagonal hull
    ctx.fillStyle = '#0a140a';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
      const r = Math.min(hw, hh);
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Armour plates
    ctx.strokeStyle = this.accentColor;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const r = (Math.min(hw, hh) * 0.6) * (1 - i * 0.25);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  _drawBoss(ctx) {
    const hw = this.w / 2, hh = this.h / 2;
    const pulse = 0.95 + Math.sin(this._time * 4) * 0.05;

    ctx.scale(pulse, pulse);

    // Body
    ctx.fillStyle = '#140a0a';
    ctx.beginPath();
    ctx.moveTo(0, hh);
    ctx.lineTo(-hw, hh * 0.3);
    ctx.lineTo(-hw * 0.9, -hh * 0.2);
    ctx.lineTo(-hw * 0.5, -hh);
    ctx.lineTo(hw * 0.5, -hh);
    ctx.lineTo(hw * 0.9, -hh * 0.2);
    ctx.lineTo(hw, hh * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner detail
    ctx.strokeStyle = this.accentColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, hh * 0.6);
    ctx.lineTo(-hw * 0.6, hh * 0.2);
    ctx.lineTo(-hw * 0.5, -hh * 0.7);
    ctx.lineTo(hw * 0.5, -hh * 0.7);
    ctx.lineTo(hw * 0.6, hh * 0.2);
    ctx.closePath();
    ctx.stroke();

    // Core cannon
    ctx.fillStyle = this.color;
    ctx.fillRect(-8, hh * 0.5, 16, hh * 0.6);
    ctx.fillRect(-hw * 0.55 - 5, hh * 0.1, 10, hh * 0.4);
    ctx.fillRect(hw * 0.55 - 5, hh * 0.1, 10, hh * 0.4);

    // Eye
    const eyePulse = 0.7 + Math.sin(this._time * 6) * 0.3;
    ctx.fillStyle = `rgba(255,23,68,${eyePulse})`;
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, -hh * 0.3, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, -hh * 0.3, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}
