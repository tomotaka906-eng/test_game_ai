'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { makeGame } = require('./helpers/env');
const FlappyGame = require('../js/flappy.js');

test('flap: applies upward velocity', () => {
  const { game } = makeGame(FlappyGame);
  game.flap();
  assert.equal(game.bird.vy, game.flapStrength);
  assert.ok(game.bird.vy < 0);
});

test('flap: ignored after game over', () => {
  const { game } = makeGame(FlappyGame);
  game.gameOver = true;
  game.bird.vy = 5;
  game.flap();
  assert.equal(game.bird.vy, 5);
});

test('checkCollision: bird striking the top pipe collides', () => {
  const { game } = makeGame(FlappyGame);
  game.groundY = 560;
  game.pipeGap = 140;
  game.bird = { x: 100, y: 0, w: 30, h: 24 };
  assert.equal(game.checkCollision({ x: 100, gapY: 100, w: 48 }), true);
});

test('checkCollision: bird flying through the gap is safe', () => {
  const { game } = makeGame(FlappyGame);
  game.groundY = 560;
  game.pipeGap = 140;
  game.bird = { x: 100, y: 110, w: 30, h: 24 };
  assert.equal(game.checkCollision({ x: 100, gapY: 100, w: 48 }), false);
});

test('spawnPipe: queues a pipe at the right edge with a reachable gap', () => {
  const { game } = makeGame(FlappyGame);
  game.canvas = game.app.canvas;
  game.groundY = 540;
  game.spawnPipe();
  assert.equal(game.pipes.length, 1);
  const p = game.pipes[0];
  assert.equal(p.x, game.canvas.width);
  assert.equal(p.scored, false);
  assert.ok(p.gapY >= 60 && p.gapY <= game.groundY - game.pipeGap - 60);
});

test('endGame: records the score and shows the overlay', () => {
  const { game, app } = makeGame(FlappyGame);
  game.score = 9;
  game.endGame();
  assert.equal(game.gameOver, true);
  assert.deepEqual(app.calls.recordScore.at(-1), { game: 'flappy', score: 9 });
});
