'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { makeGame } = require('./helpers/env');
const MinesweeperGame = require('../js/minesweeper.js');

test('initGrid: builds a ROWS x COLS grid of unrevealed empty cells', () => {
  const { game } = makeGame(MinesweeperGame);
  game.initGrid();
  assert.equal(game.grid.length, game.ROWS);
  assert.equal(game.grid[0].length, game.COLS);
  const cell = game.grid[0][0];
  assert.deepEqual(cell, { mine: false, revealed: false, flagged: false, adjacent: 0 });
});

test('placeMines: plants exactly MINES mines and keeps the first-click 3x3 clear', () => {
  const { game } = makeGame(MinesweeperGame);
  game.initGrid();
  const [sr, sc] = [5, 5];
  game.placeMines(sr, sc);

  let mines = 0;
  for (let r = 0; r < game.ROWS; r++) {
    for (let c = 0; c < game.COLS; c++) {
      if (game.grid[r][c].mine) {
        mines++;
        assert.ok(Math.abs(r - sr) > 1 || Math.abs(c - sc) > 1,
          `mine leaked into safe zone at ${r},${c}`);
      }
    }
  }
  assert.equal(mines, game.MINES);
});

test('placeMines: computes adjacency counts correctly', () => {
  const { game } = makeGame(MinesweeperGame);
  game.initGrid();
  game.placeMines(5, 5);
  for (let r = 0; r < game.ROWS; r++) {
    for (let c = 0; c < game.COLS; c++) {
      if (game.grid[r][c].mine) continue;
      let expected = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < game.ROWS && nc >= 0 && nc < game.COLS && game.grid[nr][nc].mine) expected++;
        }
      }
      assert.equal(game.grid[r][c].adjacent, expected);
    }
  }
});

// A hand-built 3x3 board with a single mine at (0,0); no auto-win possible.
function board3x3() {
  const { game, app } = makeGame(MinesweeperGame);
  game.ROWS = 3;
  game.COLS = 3;
  game.MINES = 0; // keep checkWin from firing so we can inspect the flood
  game.initGrid();
  game.firstClick = false;
  game.grid[0][0].mine = true;
  game.grid[0][1].adjacent = 1;
  game.grid[1][0].adjacent = 1;
  game.grid[1][1].adjacent = 1;
  return { game, app };
}

test('reveal: flood-fills the zero region and reveals the numbered border', () => {
  const { game } = board3x3();
  game.reveal(2, 2);
  assert.equal(game.grid[0][0].revealed, false, 'mine stays hidden');
  assert.equal(game.grid[2][2].revealed, true);
  assert.equal(game.grid[0][1].revealed, true, 'numbered border revealed');
  assert.equal(game.revealedCount, 8);
});

test('reveal: does nothing on a flagged cell', () => {
  const { game } = board3x3();
  game.grid[1][1].flagged = true;
  game.reveal(1, 1);
  assert.equal(game.grid[1][1].revealed, false);
  assert.equal(game.revealedCount, 0);
});

test('reveal: hitting a mine ends the game as a loss', () => {
  const { game, app } = board3x3();
  game.reveal(0, 0);
  assert.equal(game.gameOver, true);
  assert.deepEqual(app.calls.recordScore.at(-1), { game: 'minesweeper', score: 0 });
});

test('toggleFlag: toggles flag state and tracks the flagged count', () => {
  const { game } = makeGame(MinesweeperGame);
  game.initGrid();
  game.toggleFlag(2, 2);
  assert.equal(game.grid[2][2].flagged, true);
  assert.equal(game.flaggedCount, 1);
  game.toggleFlag(2, 2);
  assert.equal(game.grid[2][2].flagged, false);
  assert.equal(game.flaggedCount, 0);
});

test('toggleFlag: cannot flag an already-revealed cell', () => {
  const { game } = makeGame(MinesweeperGame);
  game.initGrid();
  game.grid[1][1].revealed = true;
  game.toggleFlag(1, 1);
  assert.equal(game.grid[1][1].flagged, false);
  assert.equal(game.flaggedCount, 0);
});

test('checkWin: wins once every safe cell is revealed', () => {
  const { game, app } = makeGame(MinesweeperGame);
  game.ROWS = 3;
  game.COLS = 3;
  game.MINES = 1;
  game.initGrid();
  game.startTime = Date.now();
  game.revealedCount = game.ROWS * game.COLS - game.MINES; // 8
  game.checkWin();
  assert.equal(game.won, true);
  assert.equal(game.gameOver, true);
  assert.ok(app.calls.recordScore.at(-1).score > 0, 'a positive time-based score is recorded');
});

test('getCellFromPoint: maps canvas coordinates to grid cells', () => {
  const { game } = makeGame(MinesweeperGame);
  game.start();
  const cx = game.ox + 3 * game.cellSize + game.cellSize / 2;
  const cy = game.oy + 2 * game.cellSize + game.cellSize / 2;
  assert.deepEqual(game.getCellFromPoint(cx, cy), { r: 2, c: 3 });
  assert.equal(game.getCellFromPoint(-100, -100), null);
  game.stop();
});
