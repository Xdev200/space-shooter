// ============================================================
// OBJECT POOL — Reusable entity pool to avoid GC pressure
// ============================================================

export class ObjectPool {
  /**
   * @param {Function} factory  — called with no args to create a new instance
   * @param {number}   size     — initial pool capacity
   */
  constructor(factory, size = 64) {
    this._factory = factory;
    this._pool = [];
    this._active = new Set();

    // Pre-allocate
    for (let i = 0; i < size; i++) {
      this._pool.push(factory());
    }
  }

  /**
   * Acquire an object from the pool. Creates a new one if the pool is empty.
   * Calls `obj.init(...args)` before returning.
   */
  acquire(...args) {
    const obj = this._pool.length > 0 ? this._pool.pop() : this._factory();
    obj.active = true;
    if (typeof obj.init === 'function') obj.init(...args);
    this._active.add(obj);
    return obj;
  }

  /**
   * Return an object to the pool.
   */
  release(obj) {
    if (!this._active.has(obj)) return;
    obj.active = false;
    this._active.delete(obj);
    if (typeof obj.reset === 'function') obj.reset();
    this._pool.push(obj);
  }

  /**
   * Iterate active objects. Safe to call `release` inside the callback.
   */
  forEach(cb) {
    for (const obj of [...this._active]) {
      cb(obj);
    }
  }

  /**
   * Array snapshot of active objects (allocates — use sparingly).
   */
  toArray() {
    return [...this._active];
  }

  get activeCount() {
    return this._active.size;
  }

  get poolCount() {
    return this._pool.length;
  }

  /** Release all active objects at once. */
  releaseAll() {
    for (const obj of [...this._active]) {
      this.release(obj);
    }
  }
}
