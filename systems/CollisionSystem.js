// ============================================================
// COLLISION SYSTEM — Broad + narrow phase AABB detection
// ============================================================

import { rectsOverlap } from '../utils/helpers.js';

export class CollisionSystem {
  /**
   * Test all player bullets against all enemies.
   * @param {ObjectPool} bullets
   * @param {ObjectPool} enemies
   * @param {ObjectPool} particlePool — for hit sparks
   * @param {ScoreSystem} scoreSystem
   * @param {AudioSystem} audio
   * @returns {number} total enemies killed this frame
   */
  checkBulletsVsEnemies(bullets, enemies, particlePool, scoreSystem, audio) {
    let kills = 0;

    bullets.forEach((bullet) => {
      if (bullet.owner !== 'player') return;

      enemies.forEach((enemy) => {
        if (!rectsOverlap(bullet.hitbox, enemy.hitbox)) return;

        // Hit!
        const killed = enemy.takeDamage(bullet.damage);
        bullets.release(bullet);

        // Spark effect
        this._spawnHitSparks(particlePool, bullet.x + bullet.w / 2, bullet.y, enemy.color);

        if (killed) {
          kills++;
          scoreSystem.addKill(enemy.type, enemy.points);
          audio?.play('explode');
          this._spawnExplosion(particlePool, enemy.cx, enemy.cy, enemy.color, enemy.w);
          enemies.release(enemy);
        } else {
          audio?.play('hit');
        }
      });
    });

    return kills;
  }

  /**
   * Test all enemy bullets (and enemies themselves) against the player.
   * @returns {{ hit: boolean, damage: number }}
   */
  checkEnemiesVsPlayer(bullets, enemies, player, particlePool, audio) {
    if (player.isInvincible) return { hit: false, damage: 0 };

    let totalDamage = 0;

    // Enemy bullets vs player
    bullets.forEach((bullet) => {
      if (bullet.owner !== 'enemy') return;
      if (!rectsOverlap(bullet.hitbox, player.hitbox)) return;

      totalDamage += bullet.damage;
      bullets.release(bullet);
      this._spawnHitSparks(particlePool, player.cx, player.cy, '#00e5ff');
      audio?.play('hit');
    });

    // Enemy body vs player (ram damage)
    enemies.forEach((enemy) => {
      if (!rectsOverlap(enemy.hitbox, player.hitbox)) return;
      totalDamage += 30;
      enemies.release(enemy);
      this._spawnExplosion(particlePool, enemy.cx, enemy.cy, enemy.color, enemy.w);
    });

    if (totalDamage > 0) {
      const died = player.takeDamage(totalDamage);
      audio?.play('hit');
      return { hit: true, damage: totalDamage, died };
    }

    return { hit: false, damage: 0 };
  }

  // ── Visual helpers ───────────────────────────────────────

  _spawnHitSparks(pool, x, y, color) {
    if (!pool) return;
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 100;
      pool.acquire(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color, 220, 2, 'spark'
      );
    }
  }

  _spawnExplosion(pool, x, y, color, size) {
    if (!pool) return;
    const count = Math.min(6 + Math.floor(size / 8), 22);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 40 + Math.random() * 160;
      const life = 300 + Math.random() * 500;
      const r = 2 + Math.random() * 5;
      const shape = Math.random() > 0.5 ? 'spark' : 'circle';
      pool.acquire(
        x + (Math.random() - 0.5) * 10,
        y + (Math.random() - 0.5) * 10,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        i % 3 === 0 ? '#ffffff' : color,
        life, r, shape
      );
    }
  }
}
