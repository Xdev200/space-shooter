// ============================================================
// GAME ENGINE — Core state machine and game loop
// ============================================================

import { GAME, STATES, BULLET, ENEMY, PARTICLE, STORAGE_KEYS } from '../utils/constants.js';
import { Renderer }        from './Renderer.js';
import { InputHandler }    from './InputHandler.js';
import { ObjectPool }      from './ObjectPool.js';
import { Player }          from '../entities/Player.js';
import { Enemy }           from '../entities/Enemy.js';
import { Bullet }          from '../entities/Bullet.js';
import { Particle }        from '../entities/Particle.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { SpawnSystem }     from '../systems/SpawnSystem.js';
import { ScoreSystem }     from '../systems/ScoreSystem.js';
import { AudioSystem }     from '../systems/AudioSystem.js';
import { HUD }             from '../ui/HUD.js';
import { Screens }         from '../ui/Screens.js';
import { db }              from '../storage/LocalDB.js';

export class GameEngine {
  constructor(canvas) {
    this._canvas = canvas;
    this._state = STATES.BOOT;
    this._raf = null;
    this._lastTime = 0;
    this._elapsed = 0;       // ms in current game session
    this._screenCleanup = null;

    // Core systems
    this._renderer  = new Renderer(canvas);
    this._input     = new InputHandler(canvas);
    this._audio     = new AudioSystem();
    this._collision = new CollisionSystem();
    this._spawn     = new SpawnSystem();
    this._score     = new ScoreSystem();
    this._hud       = new HUD();
    this._screens   = new Screens(canvas, this._audio);

    // Entity pools
    this._bullets   = new ObjectPool(() => new Bullet(),   BULLET.POOL_SIZE);
    this._enemies   = new ObjectPool(() => new Enemy(),    ENEMY.POOL_SIZE);
    this._particles = new ObjectPool(() => new Particle(), PARTICLE.POOL_SIZE);

    this._playerName = 'PILOT';

    // Player
    this._player = new Player();

    this._bindResize();
  }

  // ── Lifecycle ────────────────────────────────────────────

  async start() {
    await this._score.init(); // load high scores from DB
    this._setState(STATES.MENU);
    this._loop(performance.now());
  }

  _loop(timestamp) {
    this._raf = requestAnimationFrame((t) => this._loop(t));

    const raw = timestamp - this._lastTime;
    this._lastTime = timestamp;
    const dt = Math.min(raw, GAME.MAX_DELTA); // cap to prevent spiral

    this._update(dt);
    this._render(dt);
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    this._input.destroy();
    this._screenCleanup?.();
  }

  // ── State machine ────────────────────────────────────────

  _setState(newState) {
    const prev = this._state;
    this._state = newState;
    this._screenCleanup?.();
    this._screenCleanup = null;

    switch (newState) {
      case STATES.MENU:
        this._input.setHUDVisibility(false);
        this._screenCleanup = this._screens.showMenu(
          () => this._setState(STATES.NAME_INPUT),
          () => this._setState(STATES.HIGH_SCORES),
        );
        break;

      case STATES.NAME_INPUT:
        this._input.setHUDVisibility(false);
        this._screenCleanup = this._screens.showNameInput((name) => {
          this._playerName = name;
          this._setState(STATES.PLAYING);
        });
        break;

      case STATES.PLAYING:
        this._input.setHUDVisibility(true);
        if (prev !== STATES.PAUSED) {
          this._startGame();
        }
        break;

      case STATES.PAUSED:
        this._input.setHUDVisibility(true);
        this._screenCleanup = this._screens.showPause(
          () => this._setState(STATES.PLAYING),
          () => this._setState(STATES.MENU),
        );
        break;

      case STATES.GAME_OVER:
        this._input.setHUDVisibility(false);
        this._audio.play('gameover');
        const isHigh = this._score.isHighScore(this._score.score);
        this._score.saveScore(this._playerName);
        this._screenCleanup = this._screens.showGameOver(
          this._score.score,
          this._spawn.wave,
          isHigh,
          () => this._setState(STATES.PLAYING),
          () => this._setState(STATES.MENU),
        );
        break;

      case STATES.HIGH_SCORES:
        this._input.setHUDVisibility(false);
        this._screenCleanup = this._screens.showHighScores(
          this._score.getHighScores(),
          () => this._setState(STATES.MENU),
        );
        break;
    }
  }

  _startGame() {
    this._elapsed = 0;
    this._score.reset();
    this._spawn.reset();
    this._bullets.releaseAll();
    this._enemies.releaseAll();
    this._particles.releaseAll();
    this._player = new Player();
    this._audio.resume();
  }

  // ── Update ───────────────────────────────────────────────

  _update(dt) {
    this._input.update();

    switch (this._state) {
      case STATES.PLAYING: this._updateGame(dt); break;
    }

    // Pause toggle (any state that makes sense)
    if ((this._state === STATES.PLAYING || this._state === STATES.PAUSED) && this._input.pause) {
      if (this._state === STATES.PLAYING) this._setState(STATES.PAUSED);
      else this._setState(STATES.PLAYING);
    }
  }

  _updateGame(dt) {
    this._elapsed += dt;

    // ── Player update
    this._player.update(dt, this._input);

    // ── Shooting
    if (this._input.shooting) {
      const shots = this._player.tryShoot();
      if (shots) {
        this._audio.play('shoot');
        for (const s of shots) {
          this._bullets.acquire(s.x, s.y, s.vx, s.vy, s.owner, s.damage);
        }
      }
    }

    // ── Bullet update + out-of-bounds culling
    this._bullets.forEach((b) => {
      b.update(dt);
      if (b.y + b.h < -20 || b.y > GAME.HEIGHT + 20 || b.x < -20 || b.x > GAME.WIDTH + 20) {
        this._bullets.release(b);
      }
    });

    // ── Enemy spawning
    const newSpawns = this._spawn.update(dt, this._score.score, this._enemies);
    for (const sp of newSpawns) {
      this._enemies.acquire(sp.type, sp.x, sp.y, sp.speed);
      if (sp.type === 'BOSS') {
        this._hud.triggerBossWarning();
        this._audio.play('boss');
      }
    }

    // ── Enemy update
    this._enemies.forEach((enemy) => {
      const shot = enemy.update(dt, this._score.score);
      if (shot) {
        this._bullets.acquire(shot.x, shot.y, shot.vx, shot.vy, shot.owner, shot.damage);
      }
      if (enemy.isOffScreen()) {
        this._enemies.release(enemy);
      }
    });

    // ── Particle update
    this._particles.forEach((p) => {
      p.update(dt);
      if (!p.alive) this._particles.release(p);
    });

    // ── Collisions: player bullets → enemies
    this._collision.checkBulletsVsEnemies(
      this._bullets, this._enemies, this._particles, this._score, this._audio
    );

    // ── Collisions: enemy stuff → player
    const { hit, damage, died } = this._collision.checkEnemiesVsPlayer(
      this._bullets, this._enemies, this._player, this._particles, this._audio
    );

    if (died) {
      this._player.lives--;
      if (this._player.lives <= 0) {
        this._setState(STATES.GAME_OVER);
        return;
      }
      // Spawn death explosion
      this._spawnPlayerExplosion();
      this._player.respawn();
    }

    // ── Score & HUD update
    this._score.update(dt);
    this._hud.update(dt);
  }

  _spawnPlayerExplosion() {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 200;
      this._particles.acquire(
        this._player.cx, this._player.cy,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#00e5ff' : '#ff6d00',
        400 + Math.random() * 600,
        2 + Math.random() * 5,
        Math.random() > 0.4 ? 'spark' : 'circle'
      );
    }
  }

  // ── Render ───────────────────────────────────────────────

  _render(dt) {
    const ctx = this._renderer.ctx;

    switch (this._state) {
      case STATES.PLAYING:
      case STATES.PAUSED:
        this._renderer.drawBackground(dt);
        this._renderer.drawEntities(this._player, this._bullets, this._enemies, this._particles);
        this._renderer.drawVignette();
        this._hud.draw(ctx, this._player, this._score, this._spawn.wave, this._elapsed);
        if (this._state === STATES.PAUSED) {
          this._screens.drawPause(ctx);
        }
        break;

      case STATES.MENU:
        this._screens.drawMenu(ctx);
        break;

      case STATES.NAME_INPUT:
        this._screens.drawNameInput(ctx);
        break;

      case STATES.GAME_OVER:
        this._screens.drawGameOver(ctx);
        break;

      case STATES.HIGH_SCORES:
        this._screens.drawHighScores(ctx);
        break;
    }
  }

  // ── Responsive canvas ────────────────────────────────────

  _bindResize() {
    const resize = () => {
      const canvas = this._canvas;
      const container = canvas.parentElement;
      if (!container) return;

      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const scale = Math.min(cw / GAME.WIDTH, ch / GAME.HEIGHT);

      canvas.style.width  = `${GAME.WIDTH * scale}px`;
      canvas.style.height = `${GAME.HEIGHT * scale}px`;
    };

    window.addEventListener('resize', resize);
    resize();
  }
}
