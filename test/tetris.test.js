'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { makeGame } = require('./helpers/env');
const TetrisGame = require('../js/tetris.js');

function freshTetris() {
  const { game, app } = makeGame(TetrisGame);
  game.initBoard();
  game.started = true;
  game.gameOver = false;
  return { game, app };
}

function oPiece(x = 4, y = 0) {
  return { type: 'O', shape: [[1, 1], [1, 1]], color: '#f0f000', x, y };
}

test('initBoard: creates an empty ROWS x COLS grid of zeros', () => {
  const { game } = freshTetris();
  assert.equal(game.board.length, game.ROWS);
  assert.equal(game.board[0].length, game.COLS);
  assert.ok(game.board.flat().every(c => c === 0));
});

test('rotate: rotates a T piece 90deg clockwise', () => {
  const { game } = freshTetris();
  const t = [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
  assert.deepEqual(game.rotate(t), [[0, 1, 0], [0, 1, 1], [0, 1, 0]]);
});

test('rotate: an O piece is unchanged by rotation', () => {
  const { game } = freshTetris();
  const o = [[1, 1], [1, 1]];
  assert.deepEqual(game.rotate(o), o);
});

test('collides: false inside an empty board', () => {
  const { game } = freshTetris();
  assert.equal(game.collides(oPiece().shape, 4, 0), false);
});

test('collides: true past the left wall', () => {
  const { game } = freshTetris();
  assert.equal(game.collides(oPiece().shape, -1, 0), true);
});

test('collides: true past the right wall', () => {
  const { game } = freshTetris();
  assert.equal(game.collides(oPiece().shape, game.COLS - 1, 0), true);
});

test('collides: true past the floor', () => {
  const { game } = freshTetris();
  assert.equal(game.collides(oPiece().shape, 4, game.ROWS - 1), true);
});

test('collides: true when overlapping a filled cell', () => {
  const { game } = freshTetris();
  game.board[5][4] = 'I';
  assert.equal(game.collides(oPiece().shape, 4, 4), true);
});

test('moveLeft/moveRight: shift the active piece horizontally', () => {
  const { game } = freshTetris();
  game.piece = oPiece(4, 0);
  game.moveLeft();
  assert.equal(game.piece.x, 3);
  game.moveRight();
  game.moveRight();
  assert.equal(game.piece.x, 5);
});

test('moveLeft: blocked at the wall does not move', () => {
  const { game } = freshTetris();
  game.piece = oPiece(0, 0);
  game.moveLeft();
  assert.equal(game.piece.x, 0);
});

test('moveDown: advances the piece and returns true when possible', () => {
  const { game } = freshTetris();
  game.piece = oPiece(4, 0);
  assert.equal(game.moveDown(), true);
  assert.equal(game.piece.y, 1);
});

test('moveDown: returns false when resting on the floor', () => {
  const { game } = freshTetris();
  game.piece = oPiece(4, game.ROWS - 2);
  assert.equal(game.moveDown(), false);
});

test('clearLines: removes a full row, scores it and increments line count', () => {
  const { game } = freshTetris();
  game.board[game.ROWS - 1] = new Array(game.COLS).fill('I');
  game.clearLines();
  assert.equal(game.lines, 1);
  assert.equal(game.score, 100);
  assert.ok(game.board[game.ROWS - 1].every(c => c === 0));
});

test('clearLines: four simultaneous lines award a tetris (800 * level)', () => {
  const { game } = freshTetris();
  for (let r = game.ROWS - 4; r < game.ROWS; r++) {
    game.board[r] = new Array(game.COLS).fill('I');
  }
  game.clearLines();
  assert.equal(game.lines, 4);
  assert.equal(game.score, 800);
});

test('shuffleBag: returns a permutation of the seven tetrominoes', () => {
  const { game } = freshTetris();
  const bag = game.shuffleBag();
  assert.deepEqual([...bag].sort(), ['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
});

test('getNextPiece: draws from the bag and refills when empty', () => {
  const { game } = freshTetris();
  game.nextBag = ['T'];
  assert.equal(game.getNextPiece(), 'T');
  const refill = game.getNextPiece();
  assert.ok(['I', 'J', 'L', 'O', 'S', 'T', 'Z'].includes(refill));
  assert.equal(game.nextBag.length, 6);
});

test('spawnPiece: places the queued piece near the top-centre', () => {
  const { game } = freshTetris();
  game.nextBag = ['O'];
  game.next = 'T';
  game.spawnPiece();
  assert.equal(game.piece.type, 'T');
  assert.equal(game.piece.y, 0);
  assert.equal(game.gameOver, false);
});

test('spawnPiece: ends the game when the spawn area is blocked', () => {
  const { game, app } = freshTetris();
  game.nextBag = ['O'];
  game.next = 'O';
  for (let c = 0; c < game.COLS; c++) game.board[0][c] = 'I';
  game.spawnPiece();
  assert.equal(game.gameOver, true);
  assert.equal(app.calls.showGameOver.length, 1);
});

test('getGhostY: projects the piece to its resting row', () => {
  const { game } = freshTetris();
  game.piece = oPiece(4, 0);
  assert.equal(game.getGhostY(), game.ROWS - 2);
});

test('hardDrop: locks the piece to the floor and adds drop points', () => {
  const { game } = freshTetris();
  game.nextBag = ['T'];
  game.next = 'I';
  game.piece = oPiece(4, 0);
  game.hardDrop();
  // O piece occupies the bottom two rows in columns 4-5.
  assert.equal(game.board[game.ROWS - 1][4], 'O');
  assert.equal(game.board[game.ROWS - 2][5], 'O');
  assert.ok(game.score > 0);
});
