<div align="center">

```
██╗   ██╗ ██████╗ ██╗██████╗     ██████╗ ██╗███████╗████████╗
██║   ██║██╔═══██╗██║██╔══██╗    ██╔══██╗██║██╔════╝╚══██╔══╝
██║   ██║██║   ██║██║██║  ██║    ██████╔╝██║█████╗     ██║   
╚██╗ ██╔╝██║   ██║██║██║  ██║    ██╔══██╗██║██╔══╝     ██║   
 ╚████╔╝ ╚██████╔╝██║██████╔╝    ██║  ██║██║██║        ██║   
  ╚═══╝   ╚═════╝ ╚═╝╚═════╝     ╚═╝  ╚═╝╚═╝╚═╝        ╚═╝  
```

### 🌌 *The arcade shooter that lives in your browser and never needs the internet again.* 🌌

[![Made with Vanilla JS](https://img.shields.io/badge/Made%20with-Vanilla%20JS-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-ZERO-00ff88?style=for-the-badge)](.)
[![PWA Ready](https://img.shields.io/badge/PWA-OFFLINE%20READY-6c63ff?style=for-the-badge&logo=googlechrome&logoColor=white)](.)
[![Canvas](https://img.shields.io/badge/HTML5-Canvas-e34f26?style=for-the-badge&logo=html5&logoColor=white)](.)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](.)

---

> **No npm install. No React. No build step. No cloud. Just pure, uncut arcade violence in a single browser tab.**

</div>

---

## ⚡ 30-Second Setup

Pick your weapon of choice and you're in:

```bash
# 🐍 Python (legendary)
cd space-shooter && python3 -m http.server 8080
# → http://localhost:8080

# 🟢 Node.js
cd space-shooter && npx serve .

# 🟦 VS Code
# Right-click index.html → "Open with Live Server"
```

> 🚨 **One rule:** Serve it over HTTP. Opening `file://` directly will break ES modules and IndexedDB. Don't say we didn't warn you.

---

## 🎮 Controls

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   KEYBOARD              MOBILE                  │
│   ─────────             ──────                  │
│   WASD / ↑↓←→  ──→  Left joystick             │
│   Space / Z    ──→  🔴 Fire button             │
│   P / Escape   ──→  ⏸  Pause                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ✨ What Makes This Slap

| Feature | Details |
|---|---|
| 👾 **4 Enemy Types** | Grunt · Shooter · Tank · Boss *(every 10 waves, it gets ugly)* |
| 🌊 **Wave System** | Speed ↑, spawn rate ↑, formations ↑ — relentless by design |
| ♻️ **Object Pooling** | Bullets, enemies, particles reused. Zero garbage collection stutter. |
| 🔊 **Procedural Audio** | No audio files. Every sound — shoot, explode, boss warning — generated live via Web Audio API |
| 🔥 **Score Multiplier** | Chain kills fast enough and watch the combo counter go brrrr |
| 🏆 **Local Leaderboard** | Top 10 scores, persisted in IndexedDB. Your legacy, stored locally. |
| 💥 **Particle Effects** | Sparks. Debris. Engine trails. It looks *good*. |
| 📺 **CRT Scanlines** | Because pixels deserve to breathe. That retro glow is real. |
| 📲 **PWA Installable** | One click. Lives on your home screen. Plays offline. |
| 📐 **Delta-Time Loop** | Frame-rate independent physics. Runs fair on a potato or a beast. |
| 📱 **Fully Responsive** | Touch controls on mobile. Scales to any screen. |

---

## 📁 Project Structure

```
space-shooter/
│
├── 📄 index.html                  # Entry point + all CSS lives here
├── 📄 manifest.json               # PWA manifest — make it installable
├── 📄 sw.js                       # Service Worker for offline magic
│
├── 🧠 core/
│   ├── GameEngine.js              # The brain — state machine + game loop
│   ├── Renderer.js                # Canvas orchestration
│   ├── InputHandler.js            # Keyboard + touch, unified
│   └── ObjectPool.js             # Generic reusable object pool
│
├── 👾 entities/
│   ├── Player.js                  # Your ship
│   ├── Enemy.js                   # Grunt / Shooter / Tank / Boss
│   ├── Bullet.js                  # Poolable projectile
│   └── Particle.js               # Poolable VFX particle
│
├── ⚙️ systems/
│   ├── CollisionSystem.js         # AABB detection — fast and lean
│   ├── SpawnSystem.js             # Wave-based enemy spawning
│   ├── ScoreSystem.js            # Score logic + leaderboard
│   └── AudioSystem.js            # Procedural Web Audio sounds
│
├── 💾 storage/
│   └── LocalDB.js                # IndexedDB wrapper with localStorage fallback
│
├── 🖥️ ui/
│   ├── HUD.js                    # Health · Score · Lives overlay
│   └── Screens.js                # Menu · Pause · Game Over · Leaderboard
│
└── 🛠️ utils/
    ├── constants.js               # All config values in one place
    └── helpers.js                 # Pure utility functions
```

---

## 🏗️ Architecture Deep Dive

### 🔄 Game Loop
`requestAnimationFrame` with a **50ms delta cap** — no spiral-of-death when you alt-tab back in. All physics scaled by `dt / 1000` (seconds) for true frame-rate independence.

### 🧩 State Machine
`GameEngine` owns a `_state` string from the `STATES` enum. Every transition cleanly tears down the previous screen's listeners and wires up the next. No leaks. No surprises.

### ♻️ Object Pool
`ObjectPool<T>` keeps a free list + active `Set`. `acquire()` pops or constructs, calls `init()`, and tracks active objects. `release()` calls `reset()` and returns to the free list. All pools pre-allocated at startup. GC doesn't even get to breathe.

### 💾 Storage Layer
`LocalDB` wraps IndexedDB with a clean `save / get / delete` API. Automatically falls back to `localStorage` in private browsing. Your scores survive.

---

## 🔧 Extend It — Make It Yours

### ➕ Add a New Enemy Type
```
1. Add a key to EnemyType in entities/Enemy.js
2. Add its config to the TYPE_CONFIG map
3. Add a _drawMyType() method, call it in draw()
4. Update SpawnSystem._pickType() to include it at the right difficulty tier
```

### ⚡ Add a Power-Up
```
1. Create entities/PowerUp.js  (poolable — copy Bullet.js structure)
2. Spawn it from SpawnSystem
3. Detect collision in CollisionSystem
4. Apply the effect in GameEngine._updateGame()
```

### 🎵 Add Background Music
```
AudioSystem already has a Web Audio context ready to go.
Add a _playMusic() method with an OscillatorNode or BufferSourceNode loop.
Call it from GameEngine._startGame(). Done.
```

---

## 📲 Install as a PWA

```
Chrome / Edge  →  Click the install icon in the address bar
iOS Safari     →  Share → "Add to Home Screen"
```

After the first load, the service worker caches **everything**. Full offline play. No WiFi. No excuses.

---

<div align="center">

**Built with zero frameworks. Zero dependencies. Infinite arcade energy.**

*Fork it. Break it. Make it yours.*

---

⭐ **Star this if it made you feel something** ⭐

</div>