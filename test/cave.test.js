'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { makeGame } = require('./helpers/env');
const CaveGame = require('../js/cave.js');

function withRandom(value, fn) {
  const orig = Math.random;
  Math.random = () => value;
  try { return fn(); } finally { Math.random = orig; }
}

test('jump: launches from the ground with speed-scaled velocity', () => {
  const { game } = makeGame(CaveGame);
  game.player.grounded = true;
  game.speed = 5;
  game.jump();
  assert.equal(game.player.vy, -10 - 5 * 0.25);
  assert.equal(game.player.grounded, false);
});

test('jump: ignored while airborne', () => {
  const { game } = makeGame(CaveGame);
  game.player.grounded = false;
  game.player.vy = -2;
  game.jump();
  assert.equal(game.player.vy, -2);
});

test('duck: only ducks while grounded', () => {
  const { game } = makeGame(CaveGame);
  game.player.grounded = true;
  game.duck(true);
  assert.equal(game.player.ducking, true);
});

test('checkCollision: detects an overlapping obstacle', () => {
  const { game } = makeGame(CaveGame);
  game.player = { x: 0, y: 0, w: 36, h: 40, ducking: false };
  assert.equal(game.checkCollision({ x: 10, y: 10, w: 20, h: 20 }), true);
});

test('checkCollision: clear obstacle does not collide', () => {
  const { game } = makeGame(CaveGame);
  game.player = { x: 0, y: 0, w: 36, h: 40, ducking: false };
  assert.equal(game.checkCollision({ x: 1000, y: 10, w: 20, h: 20 }), false);
});

test('spawnObstacle: low random value spawns a ground spike', () => {
  const { game } = makeGame(CaveGame);
  game.canvas = game.app.canvas;
  game.groundY = 500;
  withRandom(0.1, () => game.spawnObstacle());
  assert.equal(game.obstacles.length, 1);
  assert.equal(game.obstacles[0].type, 'spike');
  assert.equal(game.obstacles[0].y, (500 - 10) - 24);
});

test('spawnObstacle: high random value spawns spike + stalactite pair', () => {
  const { game } = makeGame(CaveGame);
  game.canvas = game.app.canvas;
  game.groundY = 500;
  withRandom(0.9, () => game.spawnObstacle());
  assert.equal(game.obstacles.length, 2);
  const types = game.obstacles.map(o => o.type).sort();
  assert.deepEqual(types, ['spike', 'stalactite']);
});

test('endGame: records the score and shows the overlay', () => {
  const { game, app } = makeGame(CaveGame);
  game.score = 55;
  game.endGame();
  assert.equal(game.gameOver, true);
  assert.deepEqual(app.calls.recordScore.at(-1), { game: 'cave', score: 55 });
});
