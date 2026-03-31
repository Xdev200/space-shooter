// ============================================================
// SPAWN SYSTEM — Wave-based enemy spawning with difficulty scaling
// ============================================================

import { SPAWN, ENEMY, GAME } from '../utils/constants.js';
import { randFloat, randInt, randPick } from '../utils/helpers.js';
import { EnemyType } from '../entities/Enemy.js';

export class SpawnSystem {
  constructor() {
    this.wave = 0;
    this.spawnTimer = SPAWN.BASE_INTERVAL;
    this.currentInterval = SPAWN.BASE_INTERVAL;
    this.bossSpawned = false;
    this._spawnQueue = []; // queued formation entries
  }

  reset() {
    this.wave = 0;
    this.spawnTimer = SPAWN.BASE_INTERVAL;
    this.currentInterval = SPAWN.BASE_INTERVAL;
    this.bossSpawned = false;
    this._spawnQueue = [];
  }

  /**
   * Update spawn timers. Returns an array of spawn descriptors:
   * [{ type, x, y, speed }, ...]
   */
  update(dt, score, enemyPool) {
    const spawns = [];

    // Drain queued formation entries with small delay between ships
    if (this._spawnQueue.length > 0) {
      this._spawnQueue[0].delay -= dt;
      if (this._spawnQueue[0].delay <= 0) {
        spawns.push(this._spawnQueue.shift());
      }
      return spawns;
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return spawns;

    // Next wave
    this.wave++;
    this.currentInterval = Math.max(
      SPAWN.MIN_INTERVAL,
      this.currentInterval * SPAWN.INTERVAL_DECAY
    );
    this.spawnTimer = this.currentInterval;

    // Boss wave?
    const isBossWave = this.wave % SPAWN.BOSS_EVERY_WAVES === 0;

    if (isBossWave) {
      this._queueFormation(this._buildBossWave(score));
    } else {
      this._queueFormation(this._buildWave(score));
    }

    return spawns;
  }

  _queueFormation(entries) {
    this._spawnQueue.push(...entries);
  }

  // ── Wave builders ────────────────────────────────────────

  _buildWave(score) {
    const diff = Math.floor(score / 1000);
    const count = Math.min(1 + Math.floor(this.wave / 3), 6);
    const type = this._pickType(diff);
    const speed = this._calcSpeed(score, type);
    const formation = this._pickFormation(count);
    const delay = 140;

    return formation.map((pos, i) => ({
      type, speed,
      x: pos.x - (this._typeWidth(type) / 2),
      y: pos.y,
      delay: i * delay,
    }));
  }

  _buildBossWave(score) {
    const speed = this._calcSpeed(score, EnemyType.BOSS);
    return [{
      type: EnemyType.BOSS,
      speed,
      x: GAME.WIDTH / 2 - 44,
      y: -80,
      delay: 0,
    }];
  }

  _pickType(difficulty) {
    if (difficulty < 3) return EnemyType.GRUNT;
    if (difficulty < 8) return randPick([EnemyType.GRUNT, EnemyType.GRUNT, EnemyType.SHOOTER]);
    if (difficulty < 15) return randPick([EnemyType.GRUNT, EnemyType.SHOOTER, EnemyType.TANK]);
    return randPick([EnemyType.SHOOTER, EnemyType.TANK, EnemyType.GRUNT]);
  }

  _calcSpeed(score, type) {
    const base = {
      [EnemyType.GRUNT]:   ENEMY.BASE_SPEED,
      [EnemyType.SHOOTER]: ENEMY.BASE_SPEED * 0.8,
      [EnemyType.TANK]:    ENEMY.BASE_SPEED * 0.55,
      [EnemyType.BOSS]:    ENEMY.BASE_SPEED * 0.45,
    }[type] || ENEMY.BASE_SPEED;

    const scale = 1 + score * ENEMY.SPEED_SCALE;
    return base * Math.min(scale, 3); // cap at 3× base
  }

  _typeWidth(type) {
    return {
      [EnemyType.GRUNT]: 40,
      [EnemyType.SHOOTER]: 44,
      [EnemyType.TANK]: 52,
      [EnemyType.BOSS]: 88,
    }[type] || 44;
  }

  _pickFormation(count) {
    const formations = [
      this._lineFormation(count),
      this._vFormation(count),
      this._scatterFormation(count),
    ];
    return randPick(formations);
  }

  _lineFormation(count) {
    const spacing = Math.min((GAME.WIDTH - 80) / count, 100);
    const totalW = spacing * (count - 1);
    const startX = (GAME.WIDTH - totalW) / 2;
    return Array.from({ length: count }, (_, i) => ({
      x: startX + i * spacing,
      y: -50,
    }));
  }

  _vFormation(count) {
    return Array.from({ length: count }, (_, i) => {
      const half = Math.floor(count / 2);
      const offset = i - half;
      return {
        x: GAME.WIDTH / 2 + offset * 70,
        y: -50 - Math.abs(offset) * 30,
      };
    });
  }

  _scatterFormation(count) {
    return Array.from({ length: count }, () => ({
      x: randFloat(60, GAME.WIDTH - 60),
      y: -randFloat(30, 80),
    }));
  }
}
