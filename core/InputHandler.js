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
    this._touchJoystick = null;   // { id, startX, startY, curX, curY }
    this._shootTouchIds = new Set();
    this._touchPause = false;

    this._joystickEl = null;
    this._shootBtnEl = null;

    // Handler references for cleanup — must init BEFORE _bindTouch
    this._handlers = {
      touchstart: null,
      touchmove: null,
      touchend: null
    };

    this._bindKeyboard();
    this._bindTouch();

    if (isTouchDevice()) {
      this._buildTouchHUD();
      this.setHUDVisibility(false); // hide until playing
    }
  }

  setHUDVisibility(visible) {
    const display = visible ? 'flex' : 'none';
    if (this._joystickEl) this._joystickEl.style.display = display;
    if (this._shootBtnEl) this._shootBtnEl.style.display = display;
    const pause = document.getElementById('touch-pause');
    if (pause) pause.style.display = display;
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
        display: none; /* Hidden by default */
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
        display: none; align-items: center; justify-content: center;
        font-size: 32px; touch-action: none; user-select: none; z-index: 100;
      }
      #touch-pause {
        position: fixed; top: 20px; right: 20px;
        width: 48px; height: 48px; border-radius: 8px;
        background: rgba(0,229,255,0.15); border: 1px solid rgba(0,229,255,0.4);
        display: none; align-items: center; justify-content: center;
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

    this._handlers.touchstart = (e) => {
      // Allow interaction with DOM inputs/buttons (like the name entry)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('#name-input-overlay')) {
        return;
      }

      // Handle the pause button specifically
      if (e.target.id === 'touch-pause') {
        this.pause = true;
        // The engine clears this.pause after processing, but let's be safe.
        // On keyboard, it stays true while key is down. On touch, we toggle once.
        setTimeout(() => { this.pause = false; }, 50);
        return;
      }

      if (e.cancelable) e.preventDefault();
      for (const t of e.changedTouches) {
        // Left half = joystick, right half = shoot
        if (t.clientX < window.innerWidth / 2) {
          this._touchJoystick = { 
            id: t.identifier, 
            startX: t.clientX, 
            startY: t.clientY, 
            curX: t.clientX, 
            curY: t.clientY 
          };
          // Move the joystick visual to the touch location (optional, but premium feel)
          if (this._joystickEl) {
            this._joystickEl.style.left = `${t.clientX - 50}px`;
            this._joystickEl.style.top = `${t.clientY - 50}px`;
            this._joystickEl.style.bottom = 'auto'; // override fixed bottom
            this._joystickEl.style.opacity = '1';
          }
        } else {
          this._shootTouchIds.add(t.identifier);
        }
      }
    };
    window.addEventListener('touchstart', this._handlers.touchstart, { passive: false });

    this._handlers.touchmove = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('#name-input-overlay')) {
        return;
      }
      if (e.cancelable) e.preventDefault();
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
    };
    window.addEventListener('touchmove', this._handlers.touchmove, { passive: false });

    this._handlers.touchend = (e) => {
      // Allow interaction with DOM inputs/buttons
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('#name-input-overlay')) {
        return;
      }

      // Don't prevent default on the pause button
      if (e.target.id === 'touch-pause') return;

      if (e.cancelable) e.preventDefault();
      for (const t of e.changedTouches) {
        if (this._touchJoystick && t.identifier === this._touchJoystick.id) {
          this._touchJoystick = null;
          this.axis.x = 0;
          this.axis.y = 0;
          if (this._joystickEl) {
            this._joystickEl.style.opacity = '0.4';
            const thumb = this._joystickEl.querySelector('#touch-thumb');
            if (thumb) thumb.style.transform = 'translate(-50%, -50%)';
          }
        } else {
          this._shootTouchIds.delete(t.identifier);
        }
      }
    };
    window.addEventListener('touchend', this._handlers.touchend, { passive: false });
    window.addEventListener('touchcancel', this._handlers.touchend, { passive: false });

    // Pause button handled via e.target.id in touchstart
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

    this.shooting = this._keys.has('Space') || this._keys.has('KeyZ') || this._shootTouchIds.size > 0;

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
    // Cleanup touch listeners
    if (this._handlers.touchstart) window.removeEventListener('touchstart', this._handlers.touchstart);
    if (this._handlers.touchmove) window.removeEventListener('touchmove', this._handlers.touchmove);
    if (this._handlers.touchend) window.removeEventListener('touchend', this._handlers.touchend);

    // Cleanup touch elements
    document.getElementById('touch-joystick')?.remove();
    document.getElementById('touch-shoot')?.remove();
    document.getElementById('touch-pause')?.remove();
  }
}
