'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { makeGame } = require('./helpers/env');
const DinoGame = require('../js/dino.js');

function withRandom(value, fn) {
  const orig = Math.random;
  Math.random = () => value;
  try { return fn(); } finally { Math.random = orig; }
}

test('jump: launches only when grounded', () => {
  const { game } = makeGame(DinoGame);
  game.dino.grounded = true;
  game.jump();
  assert.equal(game.dino.vy, -10);
  assert.equal(game.dino.grounded, false);
});

test('jump: ignored while airborne', () => {
  const { game } = makeGame(DinoGame);
  game.dino.grounded = false;
  game.dino.vy = -3;
  game.jump();
  assert.equal(game.dino.vy, -3);
});

test('duck: only ducks while grounded', () => {
  const { game } = makeGame(DinoGame);
  game.dino.grounded = true;
  game.duck(true);
  assert.equal(game.dino.ducking, true);
  game.dino.grounded = false;
  game.duck(true);
  assert.equal(game.dino.ducking, true, 'airborne duck request is ignored, state unchanged');
});

test('checkCollision: detects an overlapping obstacle', () => {
  const { game } = makeGame(DinoGame);
  const dino = { x: 0, y: 0, w: 44, h: 47, ducking: false };
  assert.equal(game.checkCollision(dino, { x: 10, y: 10, w: 20, h: 20 }), true);
});

test('checkCollision: no hit when the obstacle is clear of the dino', () => {
  const { game } = makeGame(DinoGame);
  const dino = { x: 0, y: 0, w: 44, h: 47, ducking: false };
  assert.equal(game.checkCollision(dino, { x: 1000, y: 10, w: 20, h: 20 }), false);
});

test('spawnObstacle: spawns a tall cactus at ground level', () => {
  const { game } = makeGame(DinoGame);
  game.canvas = game.app.canvas;
  game.groundY = 500;
  game.displayScore = 0;
  withRandom(0.9, () => game.spawnObstacle());
  assert.equal(game.obstacles.length, 1);
  assert.equal(game.obstacles[0].type, 'cactus_tall');
  assert.equal(game.obstacles[0].y, 500 - 48);
});

test('update: accrues score and reports it to the app', () => {
  const { game, app } = makeGame(DinoGame);
  game.canvas = game.app.canvas;
  game.groundY = 500;
  game.dino.y = 453;
  game.started = true;
  game.gameOver = false;
  game.update(0);
  assert.ok(Math.abs(game.score - 0.15) < 1e-9);
  assert.equal(game.displayScore, 0);
  assert.deepEqual(app.calls.updateScoreDisplay, [0]);
});

test('endGame: records the display score and shows the overlay', () => {
  const { game, app } = makeGame(DinoGame);
  game.displayScore = 321;
  game.endGame();
  assert.equal(game.gameOver, true);
  assert.deepEqual(app.calls.recordScore.at(-1), { game: 'dino', score: 321 });
});
