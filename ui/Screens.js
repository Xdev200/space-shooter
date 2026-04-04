// ============================================================
// SCREENS — Menu, Pause, Game Over, High Scores
// ============================================================

import { GAME, COLORS, STATES } from '../utils/constants.js';
import { fmtScore, easeOutCubic } from '../utils/helpers.js';

// Shared draw helpers
const drawGlow = (ctx, text, x, y, font, color, blur = 14) => {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
  ctx.restore();
};

const drawBtn = (ctx, label, x, y, w, h, hovered = false, accent = '#00e5ff') => {
  ctx.save();
  const alpha = hovered ? 0.25 : 0.12;
  ctx.fillStyle = `rgba(0,229,255,${alpha})`;
  ctx.strokeStyle = accent;
  ctx.lineWidth = hovered ? 2 : 1;
  ctx.shadowColor = accent;
  ctx.shadowBlur = hovered ? 18 : 6;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = hovered ? '#ffffff' : accent;
  ctx.font = `${hovered ? 'bold ' : ''}16px "Share Tech Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = hovered ? 12 : 4;
  ctx.fillText(label, x, y);
  ctx.restore();
};

export class Screens {
  constructor(canvas, audio) {
    this._canvas = canvas;
    this._audio = audio;
    this._mouse = { x: 0, y: 0 };
    this._animT = 0;   // running animation time
    this._stars = this._buildStars(120);
    this._lastT = performance.now();

    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this._mouse.x = (e.clientX - r.left) * (GAME.WIDTH / r.width);
      this._mouse.y = (e.clientY - r.top) * (GAME.HEIGHT / r.height);
    });
  }

  // ── MENU ─────────────────────────────────────────────────

  /**
   * @param {Function} onStart
   * @param {Function} onScores
   * @returns {Function} cleanup
   */
  showMenu(onStart, onScores, onSettings) {
    const buttons = [
      { label: 'START GAME',   x: GAME.WIDTH / 2, y: 330, w: 200, h: 44, action: onStart },
      { label: 'HIGH SCORES',  x: GAME.WIDTH / 2, y: 390, w: 200, h: 44, action: onScores },
    ];

    const handler = (e) => {
      const r = this._canvas.getBoundingClientRect();
      const mx = (e.clientX - r.left) * (GAME.WIDTH / r.width);
      const my = (e.clientY - r.top) * (GAME.HEIGHT / r.height);
      for (const btn of buttons) {
        if (Math.abs(mx - btn.x) < btn.w / 2 && Math.abs(my - btn.y) < btn.h / 2) {
          this._audio?.play('menu');
          btn.action?.();
        }
      }
    };
    this._canvas.addEventListener('click', handler);
    this._menuButtons = buttons;
    return () => this._canvas.removeEventListener('click', handler);
  }

  drawMenu(ctx) {
    const now = performance.now();
    const dt = now - this._lastT;
    this._lastT = now;
    this._animT += dt;

    this._drawSpaceBackground(ctx);

    // Title
    const titleY = 170 + Math.sin(this._animT * 0.001) * 6;
    drawGlow(ctx, 'VOID', GAME.WIDTH / 2, titleY, 'bold 72px "Share Tech Mono", monospace', COLORS.PLAYER, 30);
    drawGlow(ctx, 'RIFT', GAME.WIDTH / 2, titleY + 72, 'bold 72px "Share Tech Mono", monospace', '#7c4dff', 30);

    ctx.fillStyle = 'rgba(200,210,255,0.5)';
    ctx.font = '13px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DEFEND THE COSMOS', GAME.WIDTH / 2, titleY + 116);

    // Buttons
    for (const btn of (this._menuButtons || [])) {
      const hovered = Math.abs(this._mouse.x - btn.x) < btn.w / 2 &&
                      Math.abs(this._mouse.y - btn.y) < btn.h / 2;
      drawBtn(ctx, btn.label, btn.x, btn.y, btn.w, btn.h, hovered);
    }

    // Controls hint
    ctx.fillStyle = 'rgba(200,210,255,0.35)';
    ctx.font = '12px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WASD / ARROWS — MOVE     SPACE — FIRE', GAME.WIDTH / 2, GAME.HEIGHT - 28);
    ctx.fillText('P / ESC — PAUSE', GAME.WIDTH / 2, GAME.HEIGHT - 12);
  }

  // ── NAME INPUT ──────────────────────────────────────────

  showNameInput(onConfirm) {
    const overlay = document.createElement('div');
    overlay.id = 'name-input-overlay';
    overlay.innerHTML = `
      <div class="name-input-box">
        <h2>ENTER PILOT NAME</h2>
        <input type="text" id="pilot-name" maxlength="12" placeholder="PILOT NAME" />
        <button id="confirm-name">ENGAGE SYSTEMS</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const style = document.createElement('style');
    style.id = 'name-input-style';
    style.textContent = `
      #name-input-overlay {
        position: fixed; inset: 0;
        background: rgba(1, 1, 15, 0.98);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(15px);
        font-family: "Share Tech Mono", monospace;
      }
      .name-input-box {
        background: rgba(1, 1, 15, 0.95); border: 2px solid #00e5ff;
        padding: 40px; border-radius: 0; text-align: center;
        box-shadow: 0 0 40px rgba(0, 229, 255, 0.25);
        animation: scanlineIn 0.3s ease-out;
        position: relative; overflow: hidden;
      }
      .name-input-box::before {
        content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 2px;
        background: rgba(0, 229, 255, 0.5); box-shadow: 0 0 15px #00e5ff;
        animation: scanlineMove 4s linear infinite;
      }
      @keyframes scanlineMove { 0% { top: 0; } 100% { top: 100%; } }
      @keyframes scanlineIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      
      .name-input-box h2 { color: #00e5ff; margin-bottom: 24px; letter-spacing: 4px; font-size: 22px; text-shadow: 0 0 10px #00e5ff; }
      #pilot-name {
        background: rgba(0, 21, 40, 0.8); border: 1px solid rgba(0, 229, 255, 0.4);
        padding: 14px 20px; color: #fff; font-family: 'Share Tech Mono', monospace;
        font-size: 24px; text-align: center; margin-bottom: 24px; outline: none; width: 280px;
        transition: all 0.3s; text-transform: uppercase; border-radius: 0;
      }
      #pilot-name:focus { border-color: #00e5ff; box-shadow: 0 0 15px rgba(0, 229, 255, 0.4); background: rgba(0, 30, 50, 0.9); }
      #confirm-name {
        display: block; width: 100%; padding: 16px; background: rgba(0, 229, 255, 0.1);
        border: 1px solid #00e5ff; color: #00e5ff; font-family: 'Share Tech Mono', monospace;
        font-size: 18px; cursor: pointer; transition: all 0.2s; letter-spacing: 3px; border-radius: 0;
      }
      #confirm-name:hover { background: #00e5ff; color: #01010f; box-shadow: 0 0 25px #00e5ff; }
    `;
    document.head.appendChild(style);

    const input = overlay.querySelector('#pilot-name');
    const btn = overlay.querySelector('#confirm-name');
    
    // Auto-focus after a delay to ensure it works on all platforms
    setTimeout(() => input.focus(), 100);

    const submit = () => {
      const name = input.value.trim().toUpperCase() || 'PILOT';
      this._audio?.play('menu');
      onConfirm(name);
    };

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      submit();
    });
    input.addEventListener('keydown', (e) => { 
      if (e.key === 'Enter') {
        e.stopPropagation();
        submit(); 
      }
    });

    // Stop all touch/pointer events from bubbling to the canvas/window
    overlay.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    overlay.addEventListener('touchend', (e) => e.stopPropagation(), { passive: true });
    overlay.addEventListener('pointerup', (e) => e.stopPropagation(), { passive: true });

    return () => {
      overlay.remove();
      const s = document.getElementById('name-input-style');
      if (s) s.remove();
    };
  }

  drawNameInput(ctx) {
    this._drawSpaceBackground(ctx);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
  }

  // ── PAUSE ────────────────────────────────────────────────

  showPause(onResume, onQuit) {
    const buttons = [
      { label: 'RESUME',    x: GAME.WIDTH / 2, y: 290, w: 180, h: 44, action: onResume },
      { label: 'MAIN MENU', x: GAME.WIDTH / 2, y: 350, w: 180, h: 44, action: onQuit },
    ];
    const handler = (e) => {
      const r = this._canvas.getBoundingClientRect();
      const mx = (e.clientX - r.left) * (GAME.WIDTH / r.width);
      const my = (e.clientY - r.top) * (GAME.HEIGHT / r.height);
      for (const btn of buttons) {
        if (Math.abs(mx - btn.x) < btn.w / 2 && Math.abs(my - btn.y) < btn.h / 2) {
          this._audio?.play('menu');
          btn.action?.();
        }
      }
    };
    this._canvas.addEventListener('click', handler);
    this._pauseButtons = buttons;
    return () => this._canvas.removeEventListener('click', handler);
  }

  drawPause(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    drawGlow(ctx, 'PAUSED', GAME.WIDTH / 2, 230, 'bold 52px "Share Tech Mono", monospace', COLORS.PLAYER, 20);

    for (const btn of (this._pauseButtons || [])) {
      const hovered = Math.abs(this._mouse.x - btn.x) < btn.w / 2 &&
                      Math.abs(this._mouse.y - btn.y) < btn.h / 2;
      drawBtn(ctx, btn.label, btn.x, btn.y, btn.w, btn.h, hovered);
    }
    ctx.restore();
  }

  // ── GAME OVER ────────────────────────────────────────────

  showGameOver(score, wave, isHigh, onRestart, onMenu) {
    this._goScore = score;
    this._goWave = wave;
    this._goIsHigh = isHigh;
    const buttons = [
      { label: 'PLAY AGAIN',  x: GAME.WIDTH / 2, y: 390, w: 200, h: 44, action: onRestart },
      { label: 'MAIN MENU',   x: GAME.WIDTH / 2, y: 448, w: 200, h: 44, action: onMenu },
    ];
    const handler = (e) => {
      const r = this._canvas.getBoundingClientRect();
      const mx = (e.clientX - r.left) * (GAME.WIDTH / r.width);
      const my = (e.clientY - r.top) * (GAME.HEIGHT / r.height);
      for (const btn of buttons) {
        if (Math.abs(mx - btn.x) < btn.w / 2 && Math.abs(my - btn.y) < btn.h / 2) {
          this._audio?.play('menu');
          btn.action?.();
        }
      }
    };
    this._canvas.addEventListener('click', handler);
    this._goButtons = buttons;
    return () => this._canvas.removeEventListener('click', handler);
  }

  drawGameOver(ctx) {
    this._drawSpaceBackground(ctx);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    drawGlow(ctx, 'GAME OVER', GAME.WIDTH / 2, 200, 'bold 56px "Share Tech Mono", monospace', '#ff1744', 25);

    ctx.fillStyle = COLORS.HUD_TEXT;
    ctx.font = '16px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE   ${fmtScore(this._goScore || 0)}`, GAME.WIDTH / 2, 268);
    ctx.fillText(`WAVE    ${this._goWave || 0}`, GAME.WIDTH / 2, 294);

    if (this._goIsHigh) {
      const pulse = 0.7 + Math.sin(this._animT * 0.006) * 0.3;
      ctx.globalAlpha = pulse;
      drawGlow(ctx, '★ NEW HIGH SCORE ★', GAME.WIDTH / 2, 334, 'bold 18px "Share Tech Mono", monospace', '#ffd740', 16);
      ctx.globalAlpha = 1;
    }

    for (const btn of (this._goButtons || [])) {
      const hovered = Math.abs(this._mouse.x - btn.x) < btn.w / 2 &&
                      Math.abs(this._mouse.y - btn.y) < btn.h / 2;
      const accent = btn.label === 'PLAY AGAIN' ? COLORS.PLAYER : '#888';
      drawBtn(ctx, btn.label, btn.x, btn.y, btn.w, btn.h, hovered, accent);
    }

    ctx.restore();
  }

  // ── HIGH SCORES ──────────────────────────────────────────

  showHighScores(scores, onBack) {
    this._scoresList = scores;
    const btn = { label: '← BACK', x: GAME.WIDTH / 2, y: 540, w: 160, h: 40, action: onBack };
    const handler = (e) => {
      const r = this._canvas.getBoundingClientRect();
      const mx = (e.clientX - r.left) * (GAME.WIDTH / r.width);
      const my = (e.clientY - r.top) * (GAME.HEIGHT / r.height);
      if (Math.abs(mx - btn.x) < btn.w / 2 && Math.abs(my - btn.y) < btn.h / 2) {
        this._audio?.play('menu');
        onBack?.();
      }
    };
    this._canvas.addEventListener('click', handler);
    this._backBtn = btn;
    return () => this._canvas.removeEventListener('click', handler);
  }

  drawHighScores(ctx) {
    this._drawSpaceBackground(ctx);

    drawGlow(ctx, 'HIGH SCORES', GAME.WIDTH / 2, 90, 'bold 40px "Share Tech Mono", monospace', COLORS.PLAYER, 18);

    const scores = this._scoresList || [];
    const rankColors = ['#ffd740', '#c0c0c0', '#cd7f32'];

    scores.slice(0, 8).forEach((entry, i) => {
      const y = 150 + i * 44;
      const isTop = i < 3;

      ctx.save();
      ctx.fillStyle = `rgba(0,229,255,${i < 3 ? 0.08 : 0.04})`;
      ctx.beginPath();
      ctx.roundRect(GAME.WIDTH / 2 - 200, y - 18, 400, 34, 4);
      ctx.fill();

      ctx.font = `${isTop ? 'bold ' : ''}15px "Share Tech Mono", monospace`;
      ctx.textAlign = 'left';
      ctx.fillStyle = rankColors[i] || COLORS.HUD_TEXT;
      ctx.fillText(`#${i + 1}`, GAME.WIDTH / 2 - 186, y + 2);

      ctx.fillStyle = COLORS.HUD_TEXT;
      ctx.fillText(entry.name, GAME.WIDTH / 2 - 140, y + 2);

      ctx.textAlign = 'right';
      ctx.fillStyle = isTop ? rankColors[i] : '#aaa';
      ctx.fillText(fmtScore(entry.score), GAME.WIDTH / 2 + 190, y + 2);

      ctx.fillStyle = '#555';
      ctx.font = '11px "Share Tech Mono", monospace';
      ctx.fillText(entry.date, GAME.WIDTH / 2 + 190, y + 16);

      ctx.restore();
    });

    if (scores.length === 0) {
      ctx.fillStyle = '#555';
      ctx.font = '15px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No scores yet. Play a game!', GAME.WIDTH / 2, 300);
    }

    const btn = this._backBtn;
    if (btn) {
      const hovered = Math.abs(this._mouse.x - btn.x) < btn.w / 2 &&
                      Math.abs(this._mouse.y - btn.y) < btn.h / 2;
      drawBtn(ctx, btn.label, btn.x, btn.y, btn.w, btn.h, hovered);
    }
  }

  // ── Shared background ────────────────────────────────────

  _buildStars(count) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * GAME.WIDTH,
      y: Math.random() * GAME.HEIGHT,
      r: Math.random() * 1.4 + 0.3,
      speed: Math.random() * 18 + 4,
      alpha: Math.random() * 0.6 + 0.2,
    }));
  }

  _drawSpaceBackground(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, GAME.HEIGHT);
    grad.addColorStop(0, COLORS.BG_TOP);
    grad.addColorStop(1, COLORS.BG_BOTTOM);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    const dt = 16; // assume ~60fps
    for (const s of this._stars) {
      s.y += s.speed * (dt / 1000);
      if (s.y > GAME.HEIGHT) { s.y = 0; s.x = Math.random() * GAME.WIDTH; }
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
