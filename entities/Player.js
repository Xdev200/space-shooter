// ============================================================
// PLAYER — Controlled spaceship entity
// ============================================================

import { PLAYER, BULLET, COLORS, GAME } from '../utils/constants.js';
import { clamp, uid } from '../utils/helpers.js';

export class Player {
  constructor() {
    this.id = uid();

    // Position (top-left of sprite bounding box)
    this.x = GAME.WIDTH / 2 - PLAYER.WIDTH / 2;
    this.y = GAME.HEIGHT - PLAYER.HEIGHT - 40;

    this.w = PLAYER.WIDTH;
    this.h = PLAYER.HEIGHT;

    this.health = PLAYER.MAX_HEALTH;
    this.maxHealth = PLAYER.MAX_HEALTH;
    this.lives = PLAYER.START_LIVES;

    this.shootCooldown = 0;   // ms remaining
    this.invincible = 0;      // ms remaining
    this.active = true;

    // Visual
    this._engineFlicker = 0;
    this._tilt = 0;
    this._shakeX = 0;
    this._shakeY = 0;
    this._shakeTime = 0;
  }

  // ── Accessors ────────────────────────────────────────────

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  /** Inset hitbox for perceived fairness. */
  get hitbox() {
    const s = PLAYER.HITBOX_SHRINK;
    return { x: this.x + s, y: this.y + s, w: this.w - s * 2, h: this.h - s * 2 };
  }

  get isInvincible() { return this.invincible > 0; }

  // ── Update ───────────────────────────────────────────────

  update(dt, input) {
    const s = dt / 1000;

    // Movement
    const newX = this.x + input.axis.x * PLAYER.SPEED * s;
    const newY = this.y + input.axis.y * PLAYER.SPEED * s;

    this.x = clamp(newX, 0, GAME.WIDTH - this.w);
    this.y = clamp(newY, 0, GAME.HEIGHT - this.h);

    // Tilt ship on horizontal movement
    const targetTilt = input.axis.x * 0.35;
    this._tilt += (targetTilt - this._tilt) * Math.min(1, s * 8);

    // Cooldowns
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.invincible > 0) this.invincible -= dt;

    // Shake decay
    if (this._shakeTime > 0) {
      this._shakeTime -= dt;
      const intensity = (this._shakeTime / 300) * 6;
      this._shakeX = (Math.random() - 0.5) * intensity;
      this._shakeY = (Math.random() - 0.5) * intensity;
    } else {
      this._shakeX = 0;
      this._shakeY = 0;
    }

    // Engine flicker
    this._engineFlicker = (this._engineFlicker + dt * 0.025) % (Math.PI * 2);
  }

  /**
   * Attempt to fire. Returns bullet init params or null if on cooldown.
   */
  tryShoot() {
    if (this.shootCooldown > 0) return null;
    this.shootCooldown = PLAYER.SHOOT_COOLDOWN;

    // Triple shot at higher scores can be added via upgrades
    return [
      { x: this.cx, y: this.y + 8, vx: 0, vy: -BULLET.PLAYER_SPEED, owner: 'player', damage: 1 },
    ];
  }

  /**
   * Apply damage. Returns true if player died.
   */
  takeDamage(amount) {
    if (this.isInvincible) return false;
    this.health -= amount;
    this.invincible = PLAYER.INVINCIBILITY_MS;
    this._shakeTime = 300;
    if (this.health <= 0) {
      this.health = 0;
      return true; // dead
    }
    return false;
  }

  /** Reset after death (new life). */
  respawn() {
    this.health = this.maxHealth;
    this.x = GAME.WIDTH / 2 - this.w / 2;
    this.y = GAME.HEIGHT - this.h - 40;
    this.invincible = PLAYER.INVINCIBILITY_MS;
    this.shootCooldown = 0;
  }

  // ── Render ───────────────────────────────────────────────

  draw(ctx) {
    // Invincibility blink
    if (this.isInvincible && Math.floor(this.invincible / 80) % 2 === 0) return;

    const dx = this.x + this._shakeX;
    const dy = this.y + this._shakeY;
    const cx = dx + this.w / 2;
    const cy = dy + this.h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this._tilt);

    // Engine glow
    const engineFlame = 14 + Math.sin(this._engineFlicker) * 6;
    const engineGrad = ctx.createRadialGradient(0, this.h / 2, 0, 0, this.h / 2, engineFlame);
    engineGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
    engineGrad.addColorStop(0.3, COLORS.PLAYER_ENGINE);
    engineGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = engineGrad;
    ctx.beginPath();
    ctx.arc(0, this.h / 2, engineFlame, 0, Math.PI * 2);
    ctx.fill();

    // Left engine
    const leftEng = 8 + Math.sin(this._engineFlicker + 1) * 4;
    const leftGrad = ctx.createRadialGradient(-12, this.h / 2 - 4, 0, -12, this.h / 2 - 4, leftEng);
    leftGrad.addColorStop(0, 'rgba(255,255,255,0.7)');
    leftGrad.addColorStop(0.4, COLORS.PLAYER_ENGINE);
    leftGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = leftGrad;
    ctx.beginPath();
    ctx.arc(-12, this.h / 2 - 4, leftEng, 0, Math.PI * 2);
    ctx.fill();

    // Right engine
    const rightEng = 8 + Math.sin(this._engineFlicker + 2) * 4;
    const rightGrad = ctx.createRadialGradient(12, this.h / 2 - 4, 0, 12, this.h / 2 - 4, rightEng);
    rightGrad.addColorStop(0, 'rgba(255,255,255,0.7)');
    rightGrad.addColorStop(0.4, COLORS.PLAYER_ENGINE);
    rightGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = rightGrad;
    ctx.beginPath();
    ctx.arc(12, this.h / 2 - 4, rightEng, 0, Math.PI * 2);
    ctx.fill();

    // Ship silhouette
    ctx.shadowColor = COLORS.PLAYER;
    ctx.shadowBlur = 16;

    const hw = this.w / 2;
    const hh = this.h / 2;

    // Main body
    ctx.fillStyle = '#0a1a2a';
    ctx.beginPath();
    ctx.moveTo(0, -hh);           // nose
    ctx.lineTo(hw * 0.5, -hh * 0.1);
    ctx.lineTo(hw * 0.8, hh * 0.5);
    ctx.lineTo(hw * 0.4, hh * 0.8);
    ctx.lineTo(-hw * 0.4, hh * 0.8);
    ctx.lineTo(-hw * 0.8, hh * 0.5);
    ctx.lineTo(-hw * 0.5, -hh * 0.1);
    ctx.closePath();
    ctx.fill();

    // Wing left
    ctx.fillStyle = '#0d2035';
    ctx.beginPath();
    ctx.moveTo(-hw * 0.3, hh * 0.1);
    ctx.lineTo(-hw, hh * 0.9);
    ctx.lineTo(-hw * 0.7, hh);
    ctx.lineTo(-hw * 0.4, hh * 0.6);
    ctx.closePath();
    ctx.fill();

    // Wing right
    ctx.beginPath();
    ctx.moveTo(hw * 0.3, hh * 0.1);
    ctx.lineTo(hw, hh * 0.9);
    ctx.lineTo(hw * 0.7, hh);
    ctx.lineTo(hw * 0.4, hh * 0.6);
    ctx.closePath();
    ctx.fill();

    // Cockpit glow
    const cockpitGrad = ctx.createRadialGradient(0, -hh * 0.3, 0, 0, -hh * 0.3, 10);
    cockpitGrad.addColorStop(0, 'rgba(0,229,255,0.9)');
    cockpitGrad.addColorStop(0.5, 'rgba(0,229,255,0.3)');
    cockpitGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = cockpitGrad;
    ctx.beginPath();
    ctx.arc(0, -hh * 0.3, 10, 0, Math.PI * 2);
    ctx.fill();

    // Hull accent lines
    ctx.strokeStyle = COLORS.PLAYER;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, -hh * 0.8);
    ctx.lineTo(hw * 0.35, hh * 0.4);
    ctx.moveTo(0, -hh * 0.8);
    ctx.lineTo(-hw * 0.35, hh * 0.4);
    ctx.stroke();

    ctx.restore();
  }
}
