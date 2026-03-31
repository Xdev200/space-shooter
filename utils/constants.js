// ============================================================
// CONSTANTS — Single source of truth for all game config
// ============================================================

export const GAME = Object.freeze({
  WIDTH: 800,
  HEIGHT: 600,
  TARGET_FPS: 60,
  FRAME_BUDGET: 1000 / 60,
  MAX_DELTA: 50, // cap delta to avoid spiral-of-death on tab focus
});

export const PLAYER = Object.freeze({
  SPEED: 280,           // px/s
  SHOOT_COOLDOWN: 180,  // ms
  MAX_HEALTH: 100,
  START_LIVES: 3,
  INVINCIBILITY_MS: 2000,
  WIDTH: 48,
  HEIGHT: 52,
  HITBOX_SHRINK: 8,     // shrink hitbox for fairness
});

export const BULLET = Object.freeze({
  PLAYER_SPEED: 520,    // px/s
  ENEMY_SPEED: 240,
  WIDTH: 4,
  HEIGHT: 14,
  POOL_SIZE: 80,
});

export const ENEMY = Object.freeze({
  BASE_SPEED: 90,
  SPEED_SCALE: 0.004,   // multiply by score for difficulty
  SHOOT_CHANCE_BASE: 0.0008,
  SHOOT_CHANCE_SCALE: 0.00000015,
  WIDTH: 44,
  HEIGHT: 40,
  POOL_SIZE: 40,
  POINTS: {
    GRUNT: 100,
    SHOOTER: 200,
    TANK: 500,
    BOSS: 2000,
  },
  HEALTH: {
    GRUNT: 1,
    SHOOTER: 2,
    TANK: 5,
    BOSS: 30,
  },
});

export const SPAWN = Object.freeze({
  BASE_INTERVAL: 1800,  // ms between spawns
  MIN_INTERVAL: 400,
  INTERVAL_DECAY: 0.992, // multiply each wave
  WAVE_SIZE_BASE: 1,
  BOSS_EVERY_WAVES: 10,
});

export const PARTICLE = Object.freeze({
  POOL_SIZE: 200,
  EXPLOSION_COUNT: 18,
  TRAIL_COUNT: 3,
});

export const COLORS = Object.freeze({
  BG_TOP: '#01010f',
  BG_BOTTOM: '#050520',
  PLAYER: '#00e5ff',
  PLAYER_ENGINE: '#ff6d00',
  BULLET_PLAYER: '#00e5ff',
  BULLET_ENEMY: '#ff1744',
  ENEMY_GRUNT: '#ff6d00',
  ENEMY_SHOOTER: '#d500f9',
  ENEMY_TANK: '#76ff03',
  ENEMY_BOSS: '#ff1744',
  HUD_TEXT: '#e0e0ff',
  HUD_ACCENT: '#00e5ff',
  STAR_DIM: 'rgba(200,210,255,',
  HEALTH_BAR: '#00e5ff',
  HEALTH_BG: '#1a1a3a',
  DAMAGE: '#ff1744',
  SCORE: '#ffd740',
});

export const STATES = Object.freeze({
  BOOT: 'BOOT',
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  HIGH_SCORES: 'HIGH_SCORES',
});

export const STORAGE_KEYS = Object.freeze({
  HIGH_SCORES: 'voidrift_scores',
  SETTINGS: 'voidrift_settings',
  LAST_GAME: 'voidrift_lastgame',
});

export const SOUNDS = Object.freeze({
  SHOOT: 'shoot',
  EXPLODE: 'explode',
  HIT: 'hit',
  POWERUP: 'powerup',
  BOSS: 'boss',
});
