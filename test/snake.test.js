'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { makeGame } = require('./helpers/env');
const SnakeGame = require('../js/snake.js');

function freshSnake() {
  const { game, app } = makeGame(SnakeGame);
  game.cols = 10;
  game.rows = 10;
  game.snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
  game.dir = { x: 1, y: 0 };
  game.nextDir = { x: 1, y: 0 };
  game.food = { x: 9, y: 9 };
  game.started = true;
  game.gameOver = false;
  game.timer = 0;
  game.speed = 150;
  return { game, app };
}

test('update: ignores ticks until the step interval elapses', () => {
  const { game } = freshSnake();
  game.update(100); // below speed threshold
  assert.deepEqual(game.snake[0], { x: 5, y: 5 });
});

test('update: advances the snake one cell in the current direction', () => {
  const { game } = freshSnake();
  game.update(150);
  assert.deepEqual(game.snake[0], { x: 6, y: 5 });
  assert.equal(game.snake.length, 3, 'tail is dropped when no food eaten');
});

test('update: applies the queued direction change', () => {
  const { game } = freshSnake();
  game.nextDir = { x: 0, y: -1 };
  game.update(150);
  assert.deepEqual(game.snake[0], { x: 5, y: 4 });
});

test('update: eating food grows the snake and increments the score', () => {
  const { game } = freshSnake();
  game.food = { x: 6, y: 5 };
  game.update(150);
  assert.equal(game.score, 1);
  assert.equal(game.snake.length, 4, 'tail retained on growth');
  assert.ok(game.speed < 150, 'speed increases after eating');
});

test('update: running into a wall ends the game', () => {
  const { game, app } = freshSnake();
  game.snake = [{ x: 9, y: 5 }];
  game.update(150);
  assert.equal(game.gameOver, true);
  assert.equal(app.calls.showGameOver.length, 1);
});

test('update: running into itself ends the game', () => {
  const { game } = freshSnake();
  game.snake = [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }];
  game.nextDir = { x: 0, y: 1 };
  game.update(150);
  assert.equal(game.gameOver, true);
});

test('spawnFood: never lands on the snake and stays in bounds', () => {
  const { game } = freshSnake();
  game.cols = 2;
  game.rows = 1;
  game.snake = [{ x: 0, y: 0 }];
  game.spawnFood();
  assert.deepEqual(game.food, { x: 1, y: 0 });
});

test('endGame: records the score and shows the overlay', () => {
  const { game, app } = freshSnake();
  game.score = 7;
  game.endGame();
  assert.equal(game.gameOver, true);
  assert.deepEqual(app.calls.recordScore.at(-1), { game: 'snake', score: 7 });
});
