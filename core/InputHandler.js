// ============================================================
// INPUT HANDLER — Keyboard + Touch + Gamepad
// ============================================================

import { isTouchDevice } from '../utils/helpers.js';

export class InputHandler {
  constructor(canvas) {
    this._canvas = canvas;
    this._keys = new Set();
    this._prevKeys = new Set();

    // Virtual axis: [-1, 1] for each direction
    this.axis = { x: 0, y: 0 };
    this.shooting = false;
    this.pause = false;

    // Touch state
    this._touches = {};
    this._touchJoystick = null;   // { id, startX, startY, curX, curY }
    this._touchShoot = false;
    this._touchPause = false;

    this._bindKeyboard();
    this._bindTouch();

    this._joystickEl = null;
    this._shootBtnEl = null;
    if (isTouchDevice()) this._buildTouchHUD();
  }

  // ── Keyboard ─────────────────────────────────────────────

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      this._keys.add(e.code);
      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.pause = true;
      }
      // Prevent page scroll on arrow/space
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this._keys.delete(e.code);
      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.pause = false;
      }
    });
  }

  // ── Touch HUD ────────────────────────────────────────────

  _buildTouchHUD() {
    // Left joystick
    const joystick = document.createElement('div');
    joystick.id = 'touch-joystick';
    joystick.innerHTML = '<div id="touch-thumb"></div>';
    document.body.appendChild(joystick);
    this._joystickEl = joystick;

    // Shoot button (right side)
    const shootBtn = document.createElement('div');
    shootBtn.id = 'touch-shoot';
    shootBtn.textContent = '🔥';
    document.body.appendChild(shootBtn);
    this._shootBtnEl = shootBtn;

    // Pause button
    const pauseBtn = document.createElement('div');
    pauseBtn.id = 'touch-pause';
    pauseBtn.textContent = '⏸';
    document.body.appendChild(pauseBtn);

    this._injectTouchCSS();
  }

  _injectTouchCSS() {
    const style = document.createElement('style');
    style.textContent = `
      #touch-joystick {
        position: fixed; bottom: 80px; left: 60px;
        width: 100px; height: 100px; border-radius: 50%;
        background: rgba(0,229,255,0.12); border: 2px solid rgba(0,229,255,0.4);
        touch-action: none; user-select: none; z-index: 100;
      }
      #touch-thumb {
        position: absolute; top: 50%; left: 50%;
        width: 44px; height: 44px; border-radius: 50%;
        background: rgba(0,229,255,0.5); border: 2px solid #00e5ff;
        transform: translate(-50%,-50%);
        transition: transform 0.05s;
        pointer-events: none;
      }
      #touch-shoot {
        position: fixed; bottom: 90px; right: 60px;
        width: 80px; height: 80px; border-radius: 50%;
        background: rgba(255,23,68,0.25); border: 2px solid rgba(255,23,68,0.6);
        display: flex; align-items: center; justify-content: center;
        font-size: 32px; touch-action: none; user-select: none; z-index: 100;
      }
      #touch-pause {
        position: fixed; top: 20px; right: 20px;
        width: 48px; height: 48px; border-radius: 8px;
        background: rgba(0,229,255,0.15); border: 1px solid rgba(0,229,255,0.4);
        display: flex; align-items: center; justify-content: center;
        font-size: 22px; touch-action: none; user-select: none; z-index: 100;
        color: #00e5ff;
      }
    `;
    document.head.appendChild(style);
  }

  _bindTouch() {
    const canvas = this._canvas;

    const getJoystickDelta = (startX, startY, curX, curY, radius = 50) => {
      let dx = curX - startX;
      let dy = curY - startY;
      const len = Math.hypot(dx, dy);
      if (len > radius) {
        dx = (dx / len) * radius;
        dy = (dy / len) * radius;
      }
      return { dx, dy, nx: dx / radius, ny: dy / radius };
    };

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        // Left half = joystick, right half = shoot
        if (t.clientX < window.innerWidth / 2) {
          this._touchJoystick = { id: t.identifier, startX: t.clientX, startY: t.clientY, curX: t.clientX, curY: t.clientY };
        } else {
          this._touchShoot = true;
        }
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (this._touchJoystick && t.identifier === this._touchJoystick.id) {
          this._touchJoystick.curX = t.clientX;
          this._touchJoystick.curY = t.clientY;
          const { nx, ny, dx, dy } = getJoystickDelta(
            this._touchJoystick.startX, this._touchJoystick.startY,
            t.clientX, t.clientY
          );
          this.axis.x = nx;
          this.axis.y = ny;
          // Update thumb visual
          if (this._joystickEl) {
            const thumb = this._joystickEl.querySelector('#touch-thumb');
            if (thumb) thumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
          }
        }
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (this._touchJoystick && t.identifier === this._touchJoystick.id) {
          this._touchJoystick = null;
          this.axis.x = 0;
          this.axis.y = 0;
          if (this._joystickEl) {
            const thumb = this._joystickEl.querySelector('#touch-thumb');
            if (thumb) thumb.style.transform = 'translate(-50%, -50%)';
          }
        } else {
          this._touchShoot = false;
        }
      }
    }, { passive: false });

    // Pause button
    document.addEventListener('touchstart', (e) => {
      if (e.target.id === 'touch-pause') {
        this.pause = true;
        setTimeout(() => { this.pause = false; }, 100);
      }
    });
  }

  // ── Update (called once per frame) ───────────────────────

  update() {
    // Build axis from keyboard
    let kx = 0, ky = 0;
    if (this._keys.has('ArrowLeft')  || this._keys.has('KeyA')) kx -= 1;
    if (this._keys.has('ArrowRight') || this._keys.has('KeyD')) kx += 1;
    if (this._keys.has('ArrowUp')    || this._keys.has('KeyW')) ky -= 1;
    if (this._keys.has('ArrowDown')  || this._keys.has('KeyS')) ky += 1;

    // Touch overrides if active
    if (this._touchJoystick) {
      this.axis.x = this.axis.x; // already updated in touchmove
      this.axis.y = this.axis.y;
    } else {
      // Normalise keyboard diagonal
      const klen = Math.hypot(kx, ky) || 1;
      this.axis.x = kx === 0 && ky === 0 ? 0 : kx / klen;
      this.axis.y = kx === 0 && ky === 0 ? 0 : ky / klen;
    }

    this.shooting = this._keys.has('Space') || this._keys.has('KeyZ') || this._touchShoot;

    // Copy prev
    this._prevKeys = new Set(this._keys);
  }

  /**
   * True only on the frame a key was first pressed.
   */
  justPressed(code) {
    return this._keys.has(code) && !this._prevKeys.has(code);
  }

  destroy() {
    // Cleanup touch elements
    document.getElementById('touch-joystick')?.remove();
    document.getElementById('touch-shoot')?.remove();
    document.getElementById('touch-pause')?.remove();
  }
}
