# Contributing to Space Shooter 🌌

First off, thank you for considering contributing to Space Shooter! It's people like you that make open source such a great community.

## 🧠 Philosophy

This project is built on a strict philosophy:
- **Zero Dependencies**: Pure HTML, CSS, and Vanilla JS.
- **Zero Build Steps**: No Webpack, no Babel, no npm install.
- **Offline First**: Fully installable as a PWA, storing state in IndexedDB.
- **Performance**: 60 FPS, garbage-collection friendly via Object Pooling.

If your PR introduces a build process or a 3rd party dependency, it will likely be rejected.

## 🐛 Found a Bug?

Before submitting a bug report, please check existing issues to ensure it hasn't already been reported. When filing a bug, be sure to include:
- Your OS and browser version.
- Steps to reproduce the bug.
- Any relevant errors from the browser console.

## ✨ Proposing a Feature

If you have a feature idea, we'd love to hear it!
- Open an Issue describing your proposal before starting work.
- Keep the project philosophy in mind (Zero dependencies!).

## 🛠️ Pull Request Process

### 1. Fork & Clone
Fork the repository and clone it locally. Please create a new branch for your feature or bugfix.

### 2. Adhere to Code Style
- Stick to ES6+ Vanilla JavaScript.
- Maintain the object pool pattern. Do not recklessly create new objects in `update` or `draw` loops to prevent garbage collection stuttering.
- Validate your code directly in the browser. There is no build pipeline to fix it for you.
- Ensure the game runs beautifully at 60 FPS.

### 3. Commit Guidelines
Write clear, concise commit messages. Start your messages with a descriptive prefix like `feat:`, `fix:`, `docs:`, or `refactor:`.

### 4. Create the PR
Please adhere to the provided **Pull Request Template** when submitting your changes.
- Provide a clear, actionable description.
- Include a screen recording/gif for visual changes (UI, VFX, new enemies).
- Your PR should consist of a single logical change.

We look forward to reviewing your PR! Happy coding. 🚀
