// ============================================================
// LOCAL DB — IndexedDB with localStorage fallback
// ============================================================

const DB_NAME = 'VoidRiftDB';
const DB_VERSION = 1;
const STORE_NAME = 'gamedata';

class LocalDB {
  constructor() {
    this._db = null;
    this._ready = false;
    this._useLocalStorage = false;
    this._initPromise = this._init();
  }

  // ── Initialise ───────────────────────────────────────────

  async _init() {
    if (!window.indexedDB) {
      console.warn('[LocalDB] IndexedDB unavailable — falling back to localStorage');
      this._useLocalStorage = true;
      this._ready = true;
      return;
    }

    try {
      this._db = await this._openDB();
      this._ready = true;
    } catch (err) {
      console.warn('[LocalDB] IndexedDB failed, falling back to localStorage:', err);
      this._useLocalStorage = true;
      this._ready = true;
    }
  }

  _openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
      req.onblocked = () => reject(new Error('IndexedDB blocked'));
    });
  }

  /** Wait until the DB is ready before performing operations. */
  async ready() {
    await this._initPromise;
    return this;
  }

  // ── Public API ───────────────────────────────────────────

  /**
   * Persist a value under `key`. Value is JSON-serialised.
   */
  async save(key, value) {
    await this._initPromise;

    if (this._useLocalStorage) {
      return this._lsSave(key, value);
    }

    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ key, value: JSON.stringify(value) });
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => {
        console.error('[LocalDB] save error:', e.target.error);
        reject(e.target.error);
      };
    });
  }

  /**
   * Retrieve the value stored under `key`.
   * Returns `null` if not found.
   */
  async get(key) {
    await this._initPromise;

    if (this._useLocalStorage) {
      return this._lsGet(key);
    }

    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = (e) => {
        const result = e.target.result;
        try {
          resolve(result ? JSON.parse(result.value) : null);
        } catch {
          resolve(null);
        }
      };
      req.onerror = (e) => {
        console.error('[LocalDB] get error:', e.target.error);
        reject(e.target.error);
      };
    });
  }

  /**
   * Delete the record at `key`.
   */
  async delete(key) {
    await this._initPromise;

    if (this._useLocalStorage) {
      return this._lsDelete(key);
    }

    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   * Return all stored key–value pairs as a plain object.
   */
  async getAll() {
    await this._initPromise;

    if (this._useLocalStorage) {
      return this._lsGetAll();
    }

    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = (e) => {
        const map = {};
        for (const row of e.target.result) {
          try { map[row.key] = JSON.parse(row.value); } catch { map[row.key] = null; }
        }
        resolve(map);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // ── localStorage fallback ────────────────────────────────

  _lsSave(key, value) {
    try {
      localStorage.setItem(`vr_${key}`, JSON.stringify(value));
      return Promise.resolve(true);
    } catch (err) {
      console.error('[LocalDB:ls] save error:', err);
      return Promise.reject(err);
    }
  }

  _lsGet(key) {
    try {
      const raw = localStorage.getItem(`vr_${key}`);
      return Promise.resolve(raw ? JSON.parse(raw) : null);
    } catch {
      return Promise.resolve(null);
    }
  }

  _lsDelete(key) {
    localStorage.removeItem(`vr_${key}`);
    return Promise.resolve(true);
  }

  _lsGetAll() {
    const map = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith('vr_')) {
        try { map[k.slice(3)] = JSON.parse(localStorage.getItem(k)); } catch { /* skip */ }
      }
    }
    return Promise.resolve(map);
  }
}

// Export a singleton.
export const db = new LocalDB();
export default LocalDB;
