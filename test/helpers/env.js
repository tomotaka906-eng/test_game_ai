'use strict';

// Minimal browser-global stubs so the game classes (written for the browser)
// can be exercised under Node's built-in test runner without a full DOM.

function makeElement() {
  return {
    textContent: '',
    value: '',
    style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {},
    removeEventListener() {},
    querySelectorAll() { return []; },
    focus() {},
    blur() {},
  };
}

function installGlobals() {
  if (globalThis.__gameTestGlobalsInstalled) return;
  globalThis.__gameTestGlobalsInstalled = true;

  globalThis.document = {
    getElementById() { return makeElement(); },
    querySelectorAll() { return []; },
    createElement() { return makeElement(); },
  };

  globalThis.window = {
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {},
    location: { href: 'http://localhost/' },
  };

  globalThis.performance = globalThis.performance || { now: () => 0 };
  globalThis.requestAnimationFrame = () => 0;
  globalThis.cancelAnimationFrame = () => {};
  if (typeof globalThis.KeyboardEvent === 'undefined') {
    globalThis.KeyboardEvent = class KeyboardEvent {
      constructor(type, init = {}) { this.type = type; Object.assign(this, init); }
    };
  }
}

installGlobals();

// A no-op 2D canvas context: every accessed property is a callable that also
// returns a gradient-like object, so render() never throws if it is called.
function makeCtx() {
  const gradient = { addColorStop() {} };
  const handler = {
    get(_t, prop) {
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return () => gradient;
      }
      return () => {};
    },
    set() { return true; },
  };
  return new Proxy({}, handler);
}

// Build a mock App plus canvas/ctx. Records recordScore/showGameOver/
// updateScoreDisplay calls so tests can assert on game-over behaviour.
function makeApp(overrides = {}) {
  const calls = { recordScore: [], showGameOver: [], updateScoreDisplay: [] };
  const canvas = {
    width: 400,
    height: 600,
    style: {},
    addEventListener() {},
    removeEventListener() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 400, height: 600 }; },
  };
  const app = {
    canvas,
    ctx: makeCtx(),
    scores: {
      dino: 0, flappy: 0, cave: 0, tetris: 0,
      snake: 0, breakout: 0, game2048: 0, minesweeper: 0,
    },
    calls,
    recordScore(game, score) {
      calls.recordScore.push({ game, score });
      const prev = this.scores[game] || 0;
      if (score > prev) { this.scores[game] = score; return true; }
      return false;
    },
    showGameOver(score, isNew) { calls.showGameOver.push({ score, isNew }); },
    updateScoreDisplay(score) { calls.updateScoreDisplay.push(score); },
    ...overrides,
  };
  return app;
}

// Instantiate a game class and attach a fresh mock app (mirrors App.register).
function makeGame(GameClass, appOverrides) {
  const game = new GameClass();
  const app = makeApp(appOverrides);
  game.app = app;
  return { game, app };
}

module.exports = { installGlobals, makeApp, makeGame, makeCtx };
