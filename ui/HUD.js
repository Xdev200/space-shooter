// ============================================================
// HUD — In-game heads-up display
// ============================================================

import { COLORS, GAME, PLAYER } from '../utils/constants.js';
import { fmtScore, fmtTime, lerp } from '../utils/helpers.js';

export class HUD {
  constructor() {
    this._bossWarning = 0; // countdown ms for boss flash
    this._bossWarningMax = 2200;
  }

  triggerBossWarning() {
    this._bossWarning = this._bossWarningMax;
  }

  update(dt) {
    if (this._bossWarning > 0) this._bossWarning -= dt;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Player} player
   * @param {ScoreSystem} score
   * @param {number} wave
   * @param {number} elapsedMs
   */
  draw(ctx, player, score, wave, elapsedMs) {
    ctx.save();

    this._drawTopBar(ctx, score, wave, elapsedMs);
    this._drawHealthBar(ctx, player);
    this._drawLives(ctx, player);

    if (score.multiplier > 1) {
      this._drawMultiplier(ctx, score.multiplier);
    }

    if (this._bossWarning > 0) {
      this._drawBossWarning(ctx);
    }

    score.drawPopups(ctx);

    ctx.restore();
  }

  _drawTopBar(ctx, score, wave, elapsed) {
    // Background strip
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, GAME.WIDTH, 44);

    ctx.fillStyle = COLORS.HUD_ACCENT;
    ctx.font = 'bold 20px "Share Tech Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(score.formattedScore, 14, 29);

    ctx.fillStyle = COLORS.HUD_TEXT;
    ctx.font = '13px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${wave}`, GAME.WIDTH / 2, 28);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#888';
    ctx.fillText(fmtTime(elapsed), GAME.WIDTH - 14, 28);
  }

  _drawHealthBar(ctx, player) {
    const BAR_W = 160;
    const BAR_H = 12;
    const x = 14;
    const y = GAME.HEIGHT - 36;

    // Label
    ctx.fillStyle = COLORS.HUD_TEXT;
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('HULL', x, y - 4);

    // Track
    ctx.fillStyle = COLORS.HEALTH_BG;
    ctx.beginPath();
    ctx.roundRect(x, y, BAR_W, BAR_H, 3);
    ctx.fill();

    // Fill
    const pct = Math.max(0, player.health / player.maxHealth);
    const barColor = pct > 0.5 ? COLORS.HEALTH_BAR : pct > 0.25 ? '#ffd740' : '#ff1744';
    ctx.fillStyle = barColor;
    ctx.shadowColor = barColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(x, y, BAR_W * pct, BAR_H, 3);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Segments
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const sx = x + (BAR_W / 4) * i;
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx, y + BAR_H);
      ctx.stroke();
    }
  }

  _drawLives(ctx, player) {
    const x = GAME.WIDTH - 14;
    const y = GAME.HEIGHT - 30;
    ctx.fillStyle = COLORS.HUD_TEXT;
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('SHIPS', x, y - 6);

    for (let i = 0; i < player.lives; i++) {
      const lx = x - i * 22;
      this._drawMiniShip(ctx, lx - 8, y + 4);
    }
  }

  _drawMiniShip(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = COLORS.PLAYER;
    ctx.shadowColor = COLORS.PLAYER;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(7, 6);
    ctx.lineTo(-7, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _drawMultiplier(ctx, mult) {
    const pulse = 0.85 + Math.sin(Date.now() * 0.008) * 0.15;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffd740';
    ctx.font = `bold 15px "Share Tech Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffd740';
    ctx.shadowBlur = 12;
    ctx.fillText(`×${mult.toFixed(1)} COMBO`, GAME.WIDTH / 2, GAME.HEIGHT - 14);
    ctx.restore();
  }

  _drawBossWarning(ctx) {
    const blink = Math.floor(this._bossWarning / 200) % 2 === 0;
    if (!blink) return;

    ctx.save();
    ctx.globalAlpha = Math.min(1, this._bossWarning / 600);
    ctx.fillStyle = '#ff1744';
    ctx.font = 'bold 28px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 20;
    ctx.fillText('⚠ BOSS INCOMING ⚠', GAME.WIDTH / 2, GAME.HEIGHT / 2 - 30);
    ctx.restore();
  }
}
