'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { makeGame } = require('./helpers/env');
const Game2048 = require('../js/game2048.js');

function newGame() {
  const g = new Game2048();
  g.grid = Array.from({ length: g.size }, () => Array(g.size).fill(0));
  g.score = 0;
  return g;
}

test('slide: merges an equal adjacent pair and accumulates score', () => {
  const g = newGame();
  assert.deepEqual(g.slide([2, 2, 0, 0]), [4, 0, 0, 0]);
  assert.equal(g.score, 4);
});

test('slide: merges two independent pairs into two tiles', () => {
  const g = newGame();
  assert.deepEqual(g.slide([2, 2, 2, 2]), [4, 4, 0, 0]);
  assert.equal(g.score, 8);
});

test('slide: compacts gaps before merging', () => {
  const g = newGame();
  assert.deepEqual(g.slide([2, 0, 0, 2]), [4, 0, 0, 0]);
});

test('slide: only leftmost pair merges, higher tile untouched', () => {
  const g = newGame();
  assert.deepEqual(g.slide([4, 4, 8, 0]), [8, 8, 0, 0]);
  assert.equal(g.score, 8);
});

test('slide: unequal neighbours do not merge', () => {
  const g = newGame();
  assert.deepEqual(g.slide([2, 4, 2, 4]), [2, 4, 2, 4]);
  assert.equal(g.score, 0);
});

test('moveLeft: slides all rows left and reports movement', () => {
  const g = newGame();
  g.grid = [
    [0, 2, 0, 2],
    [0, 0, 0, 0],
    [4, 4, 0, 0],
    [2, 0, 0, 0],
  ];
  assert.equal(g.moveLeft(), true);
  assert.deepEqual(g.grid[0], [4, 0, 0, 0]);
  assert.deepEqual(g.grid[2], [8, 0, 0, 0]);
});

test('moveLeft: returns false when nothing changes', () => {
  const g = newGame();
  g.grid = [
    [2, 4, 8, 16],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  assert.equal(g.moveLeft(), false);
});

test('moveRight: pushes tiles to the right edge', () => {
  const g = newGame();
  g.grid = [
    [2, 2, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  assert.equal(g.moveRight(), true);
  assert.deepEqual(g.grid[0], [0, 0, 0, 4]);
});

test('moveUp: merges within columns', () => {
  const g = newGame();
  g.grid = [
    [2, 0, 0, 0],
    [2, 0, 0, 0],
    [4, 0, 0, 0],
    [4, 0, 0, 0],
  ];
  assert.equal(g.moveUp(), true);
  assert.deepEqual(g.grid.map(r => r[0]), [4, 8, 0, 0]);
});

test('moveDown: merges towards the bottom of columns', () => {
  const g = newGame();
  g.grid = [
    [2, 0, 0, 0],
    [2, 0, 0, 0],
    [4, 0, 0, 0],
    [4, 0, 0, 0],
  ];
  assert.equal(g.moveDown(), true);
  assert.deepEqual(g.grid.map(r => r[0]), [0, 0, 4, 8]);
});

test('canMove: true when an empty cell exists', () => {
  const g = newGame();
  g.grid[0][0] = 2;
  assert.equal(g.canMove(), true);
});

test('canMove: true when a merge is still possible on a full board', () => {
  const g = newGame();
  g.grid = [
    [2, 2, 4, 8],
    [4, 8, 16, 32],
    [2, 4, 8, 16],
    [4, 8, 16, 32],
  ];
  assert.equal(g.canMove(), true);
});

test('canMove: false when the board is full with no adjacent equals', () => {
  const g = newGame();
  g.grid = [
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2],
  ];
  assert.equal(g.canMove(), false);
});

test('checkWin: flags a win when a 2048 tile is present', () => {
  const g = newGame();
  g.grid[1][1] = 2048;
  g.checkWin();
  assert.equal(g.won, true);
  assert.equal(g.hasWon, true);
});

test('checkWin: no win below 2048', () => {
  const g = newGame();
  g.grid[1][1] = 1024;
  g.checkWin();
  assert.equal(g.won, false);
});

test('newGame: starts with a 4x4 grid and exactly two seeded tiles', () => {
  const g = new Game2048();
  g.newGame();
  assert.equal(g.grid.length, 4);
  assert.equal(g.grid[0].length, 4);
  const seeded = g.grid.flat().filter(v => v !== 0);
  assert.equal(seeded.length, 2);
  assert.ok(seeded.every(v => v === 2 || v === 4));
});

test('endGame: records score and triggers game-over overlay', () => {
  const { game, app } = makeGame(Game2048);
  game.score = 123;
  game.endGame();
  assert.equal(game.gameOver, true);
  assert.deepEqual(app.calls.recordScore.at(-1), { game: 'game2048', score: 123 });
  assert.equal(app.calls.showGameOver.length, 1);
});
