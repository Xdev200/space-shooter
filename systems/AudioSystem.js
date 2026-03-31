// ============================================================
// AUDIO SYSTEM — Procedural sounds via Web Audio API
// No external assets required.
// ============================================================

export class AudioSystem {
  constructor() {
    this._ctx = null;
    this._enabled = true;
    this._masterGain = null;
    this._init();
  }

  _init() {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = 0.35;
      this._masterGain.connect(this._ctx.destination);
    } catch {
      console.warn('[AudioSystem] Web Audio API unavailable.');
    }
  }

  /** Resume context after user gesture. */
  resume() {
    if (this._ctx?.state === 'suspended') {
      this._ctx.resume();
    }
  }

  setEnabled(enabled) {
    this._enabled = enabled;
    if (this._masterGain) {
      this._masterGain.gain.value = enabled ? 0.35 : 0;
    }
  }

  /**
   * Play a named sound effect.
   * @param {'shoot'|'explode'|'hit'|'powerup'|'boss'|'menu'} name
   */
  play(name) {
    if (!this._ctx || !this._enabled) return;
    this.resume();

    try {
      switch (name) {
        case 'shoot':   this._shoot(); break;
        case 'explode': this._explode(); break;
        case 'hit':     this._hit(); break;
        case 'powerup': this._powerup(); break;
        case 'boss':    this._bossAlert(); break;
        case 'menu':    this._menuClick(); break;
        case 'gameover': this._gameOver(); break;
      }
    } catch (err) {
      console.warn('[AudioSystem] play error:', err);
    }
  }

  // ── Sound recipes ────────────────────────────────────────

  _shoot() {
    const t = this._ctx.currentTime;
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.connect(gain); gain.connect(this._masterGain);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.start(t); osc.stop(t + 0.1);
  }

  _explode() {
    const t = this._ctx.currentTime;
    const bufferSize = this._ctx.sampleRate * 0.4;
    const buffer = this._ctx.createBuffer(1, bufferSize, this._ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = this._ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this._ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(60, t + 0.4);

    const gain = this._ctx.createGain();
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    source.connect(filter); filter.connect(gain); gain.connect(this._masterGain);
    source.start(t);
  }

  _hit() {
    const t = this._ctx.currentTime;
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.connect(gain); gain.connect(this._masterGain);

    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.06);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.start(t); osc.stop(t + 0.08);
  }

  _powerup() {
    const t = this._ctx.currentTime;
    [440, 550, 660, 880].forEach((freq, i) => {
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.connect(gain); gain.connect(this._masterGain);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = t + i * 0.08;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
      osc.start(start); osc.stop(start + 0.14);
    });
  }

  _bossAlert() {
    const t = this._ctx.currentTime;
    [110, 88].forEach((freq, i) => {
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.connect(gain); gain.connect(this._masterGain);
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const start = t + i * 0.25;
      gain.gain.setValueAtTime(0.5, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      osc.start(start); osc.stop(start + 0.24);
    });
  }

  _menuClick() {
    const t = this._ctx.currentTime;
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.connect(gain); gain.connect(this._masterGain);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, t);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.start(t); osc.stop(t + 0.11);
  }

  _gameOver() {
    const t = this._ctx.currentTime;
    [440, 330, 220, 110].forEach((freq, i) => {
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.connect(gain); gain.connect(this._masterGain);
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const start = t + i * 0.18;
      gain.gain.setValueAtTime(0.4, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
      osc.start(start); osc.stop(start + 0.2);
    });
  }
}
