// ============================================================
// HELPERS — Pure utility functions
// ============================================================

/**
 * Clamp a value between min and max.
 */
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Linear interpolation.
 */
export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Random float between min (inclusive) and max (exclusive).
 */
export const randFloat = (min, max) => Math.random() * (max - min) + min;

/**
 * Random integer between min (inclusive) and max (inclusive).
 */
export const randInt = (min, max) => Math.floor(randFloat(min, max + 1));

/**
 * Pick a random element from an array.
 */
export const randPick = (arr) => arr[randInt(0, arr.length - 1)];

/**
 * AABB rectangle-to-rectangle overlap check.
 * Each rect: { x, y, w, h }
 */
export const rectsOverlap = (a, b) =>
  a.x < b.x + b.w &&
  a.x + a.w > b.x &&
  a.y < b.y + b.h &&
  a.y + a.h > b.y;

/**
 * Distance between two points.
 */
export const dist = (ax, ay, bx, by) =>
  Math.hypot(bx - ax, by - ay);

/**
 * Format a large score number with comma separators.
 */
export const fmtScore = (n) => n.toLocaleString('en-US');

/**
 * Convert milliseconds to a M:SS string.
 */
export const fmtTime = (ms) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * Ease-out cubic for animations.
 */
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Ease-in-out quad.
 */
export const easeInOutQuad = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

/**
 * Generate a unique ID (simple counter-based).
 */
let _uid = 0;
export const uid = () => ++_uid;

/**
 * Deep-clone a plain object/array (JSON-safe values only).
 */
export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * Detect if device supports touch.
 */
export const isTouchDevice = () =>
  'ontouchstart' in window || navigator.maxTouchPoints > 0;
