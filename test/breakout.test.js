'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { makeGame } = require('./helpers/env');
const BreakoutGame = require('../js/breakout.js');

function freshBreakout() {
  const { game, app } = makeGame(BreakoutGame);
  game.W = 400;
  game.H = 600;
  game.brickW = 40;
  game.paddle = { x: 0, y: 0, w: 80, h: 14 };
  game.ball = { x: 200, y: 300, r: 6, dx: 0, dy: 0 };
  game.bricks = [];
  game.started = true;
  game.gameOver = false;
  return { game, app };
}

test('initBricks: lays out a full brickRows x brickCols wall, all alive', () => {
  const { game } = freshBreakout();
  game.initBricks();
  assert.equal(game.bricks.length, game.brickRows * game.brickCols);
  assert.ok(game.bricks.every(b => b.alive));
});

test('launchBall: launches upward at the fixed speed', () => {
  const { game } = freshBreakout();
  game.launchBall();
  const speed = Math.hypot(game.ball.dx, game.ball.dy);
  assert.ok(Math.abs(speed - 4) < 1e-9);
  assert.ok(game.ball.dy < 0, 'ball travels upward');
});

test('update: reflects the ball off the left wall', () => {
  const { game } = freshBreakout();
  game.ball = { x: 3, y: 100, r: 6, dx: -3, dy: 0 };
  game.update(16);
  assert.equal(game.ball.dx, 3);
  assert.equal(game.ball.x, 6);
});

test('update: reflects the ball off the ceiling', () => {
  const { game } = freshBreakout();
  game.ball = { x: 200, y: 3, r: 6, dx: 0, dy: -3 };
  game.update(16);
  assert.equal(game.ball.dy, 3);
});

test('update: losing the ball past the floor costs a life', () => {
  const { game } = freshBreakout();
  game.lives = 3;
  game.ball = { x: 200, y: 598, r: 6, dx: 0, dy: 3 };
  game.update(16);
  assert.equal(game.lives, 2);
  assert.equal(game.gameOver, false);
});

test('update: losing the last life ends the game', () => {
  const { game, app } = freshBreakout();
  game.lives = 1;
  game.ball = { x: 200, y: 598, r: 6, dx: 0, dy: 3 };
  game.update(16);
  assert.equal(game.gameOver, true);
  assert.equal(app.calls.showGameOver.length, 1);
});

test('update: hitting a brick destroys it and scores 10', () => {
  const { game, app } = freshBreakout();
  game.bricks = [
    { x: 100, y: 100, w: 40, h: 18, alive: true, color: '#fff' },
    { x: 0, y: 300, w: 40, h: 18, alive: true, color: '#fff' },
  ];
  game.ball = { x: 120, y: 105, r: 6, dx: 2, dy: 2 };
  game.update(16);
  assert.equal(game.bricks[0].alive, false);
  assert.equal(game.bricks[1].alive, true);
  assert.equal(game.score, 10);
  assert.ok(app.calls.updateScoreDisplay.includes(10));
});

test('update: clearing every brick awards the completion bonus and a life', () => {
  const { game } = freshBreakout();
  game.lives = 3;
  game.bricks = [{ x: 100, y: 100, w: 40, h: 18, alive: true, color: '#fff' }];
  game.ball = { x: 120, y: 105, r: 6, dx: 2, dy: 2 };
  game.update(16);
  assert.equal(game.score, 60, '10 for the brick + 50 clear bonus');
  assert.equal(game.lives, 4);
});

test('endGame: records the score and shows the overlay', () => {
  const { game, app } = freshBreakout();
  game.score = 42;
  game.endGame();
  assert.equal(game.gameOver, true);
  assert.deepEqual(app.calls.recordScore.at(-1), { game: 'breakout', score: 42 });
});
