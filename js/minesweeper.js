class MinesweeperGame {
  constructor() {
    this.app = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;
    this.running = false;
    this.reset();
  }

  reset() {
    this.ROWS = 10;
    this.COLS = 10;
    this.MINES = 15;
    this.grid = null;
    this.score = 0;
    this.highScore = 0;
    this.gameOver = false;
    this.won = false;
    this.started = false;
    this.firstClick = true;
    this.flaggedCount = 0;
    this.revealedCount = 0;
    this.cellSize = 0;
    this.ox = 0;
    this.oy = 0;
    this.flagMode = false;
    this.startTime = 0;
    this.elapsed = 0;
    this.timerInterval = null;
    this.longPressTimer = null;
    this.longPressTriggered = false;
    this._touchStart = null;
  }

  start() {
    this.reset();
    this.canvas = this.app.canvas;
    this.ctx = this.app.ctx;
    this.highScore = this.app.scores.minesweeper;
    this.calcDimensions();
    this.initGrid();
    this.setupInput();
    this.running = true;
    this.render();
  }

  stop() {
    this.running = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.removeInput();
  }

  restart() {
    this.stop();
    this.start();
  }

  startGame() {
    if (this.started) return;
    this.started = true;
    document.getElementById('startMsg').classList.add('hidden');
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      if (!this.gameOver && !this.won) {
        this.elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.render();
      }
    }, 1000);
  }

  calcDimensions() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const size = Math.min(W, H) * 0.92;
    this.cellSize = Math.floor(size / Math.max(this.ROWS, this.COLS));
    const totalW = this.cellSize * this.COLS;
    const totalH = this.cellSize * this.ROWS;
    this.ox = Math.floor((W - totalW) / 2);
    this.oy = Math.floor((H - totalH) / 2);
  }

  initGrid() {
    this.grid = [];
    for (let r = 0; r < this.ROWS; r++) {
      const row = [];
      for (let c = 0; c < this.COLS; c++) {
        row.push({ mine: false, revealed: false, flagged: false, adjacent: 0 });
      }
      this.grid.push(row);
    }
  }

  placeMines(safeR, safeC) {
    let placed = 0;
    while (placed < this.MINES) {
      const r = Math.floor(Math.random() * this.ROWS);
      const c = Math.floor(Math.random() * this.COLS);
      if (this.grid[r][c].mine) continue;
      if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
      this.grid[r][c].mine = true;
      placed++;
    }
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.grid[r][c].mine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < this.ROWS && nc >= 0 && nc < this.COLS && this.grid[nr][nc].mine) count++;
          }
        }
        this.grid[r][c].adjacent = count;
      }
    }
  }

  reveal(r, c) {
    if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) return;
    const cell = this.grid[r][c];
    if (cell.revealed || cell.flagged) return;

    if (this.firstClick) {
      this.firstClick = false;
      this.placeMines(r, c);
      this.startGame();
    }

    cell.revealed = true;
    this.revealedCount++;

    if (cell.mine) {
      this.endGame(false);
      return;
    }

    if (cell.adjacent === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          this.reveal(r + dr, c + dc);
        }
      }
    }

    this.checkWin();
    this.render();
  }

  toggleFlag(r, c) {
    if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) return;
    const cell = this.grid[r][c];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    this.flaggedCount += cell.flagged ? 1 : -1;
    this.render();
  }

  checkWin() {
    if (this.revealedCount >= this.ROWS * this.COLS - this.MINES) {
      this.won = true;
      this.endGame(true);
    }
  }

  endGame(won) {
    this.gameOver = true;
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }

    if (!won) {
      for (let r = 0; r < this.ROWS; r++) {
        for (let c = 0; c < this.COLS; c++) {
          if (this.grid[r][c].mine) this.grid[r][c].revealed = true;
        }
      }
      this.render();
      const isNew = this.app.recordScore('minesweeper', 0);
      setTimeout(() => this.app.showGameOver(0, isNew), 600);
    } else {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      this.score = Math.max(100, Math.floor(10000 / (elapsed + 10)));
      const isNew = this.app.recordScore('minesweeper', this.score);
      setTimeout(() => this.app.showGameOver(this.score, isNew), 400);
    }
  }

  setupInput() {
    this._onKeyDown = (e) => {
      if (this.gameOver) return;
      if (!this.started) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          this.startGame();
        }
        return;
      }
      if (e.code === 'KeyF') {
        e.preventDefault();
        this.flagMode = !this.flagMode;
        this.render();
      }
    };

    this._onClick = (e) => {
      if (this.gameOver) return;
      const pos = this.getCellFromPoint(e.clientX, e.clientY);
      if (!pos) return;
      if (this.flagMode) { this.toggleFlag(pos.r, pos.c); }
      else { this.reveal(pos.r, pos.c); }
    };

    this._onContextMenu = (e) => {
      e.preventDefault();
      if (this.gameOver) return;
      const pos = this.getCellFromPoint(e.clientX, e.clientY);
      if (!pos) return;
      this.toggleFlag(pos.r, pos.c);
    };

    this._onTouchStart = (e) => {
      if (this.gameOver) return;
      if (!this.started) { this.startGame(); return; }
      const touch = e.touches[0];
      this._touchStart = { x: touch.clientX, y: touch.clientY, t: Date.now() };
      this.longPressTriggered = false;
      this.longPressTimer = setTimeout(() => {
        if (!this._touchStart) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = (this._touchStart.x - rect.left) * (this.canvas.width / rect.width);
        const y = (this._touchStart.y - rect.top) * (this.canvas.height / rect.height);
        const c = Math.floor((x - this.ox) / this.cellSize);
        const r = Math.floor((y - this.oy) / this.cellSize);
        if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS) {
          this.toggleFlag(r, c);
        }
        this._touchStart = null;
        this.longPressTriggered = true;
      }, 500);
    };

    this._onTouchEnd = (e) => {
      clearTimeout(this.longPressTimer);
      if (!this._touchStart || this.longPressTriggered) {
        this._touchStart = null;
        this.longPressTriggered = false;
        return;
      }
      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - this._touchStart.x);
      const dy = Math.abs(touch.clientY - this._touchStart.y);
      if (dx < 10 && dy < 10) {
        const pos = this.getCellFromPoint(touch.clientX, touch.clientY);
        if (pos) {
          if (this.flagMode) { this.toggleFlag(pos.r, pos.c); }
          else { this.reveal(pos.r, pos.c); }
        }
      }
      this._touchStart = null;
    };

    this.canvas.addEventListener('click', this._onClick);
    this.canvas.addEventListener('contextmenu', this._onContextMenu);
    this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: true });
    this.canvas.addEventListener('touchend', this._onTouchEnd);
    window.addEventListener('keydown', this._onKeyDown);
  }

  getCellFromPoint(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (clientY - rect.top) * (this.canvas.height / rect.height);
    const c = Math.floor((x - this.ox) / this.cellSize);
    const r = Math.floor((y - this.oy) / this.cellSize);
    if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) return null;
    return { r, c };
  }

  removeInput() {
    this.canvas.removeEventListener('click', this._onClick);
    this.canvas.removeEventListener('contextmenu', this._onContextMenu);
    this.canvas.removeEventListener('touchstart', this._onTouchStart);
    this.canvas.removeEventListener('touchend', this._onTouchEnd);
    window.removeEventListener('keydown', this._onKeyDown);
    clearTimeout(this.longPressTimer);
    this._touchStart = null;
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const cell = this.grid[r][c];
        const x = this.ox + c * this.cellSize;
        const y = this.oy + r * this.cellSize;
        const s = this.cellSize;

        if (cell.revealed) {
          if (cell.mine) {
            ctx.fillStyle = '#e94560';
            ctx.fillRect(x, y, s, s);
            ctx.fillStyle = '#fff';
            ctx.font = `${Math.floor(s * 0.5)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('*', x + s / 2, y + s / 2 + 2);
          } else {
            ctx.fillStyle = '#1a1a3e';
            ctx.fillRect(x, y, s, s);
            if (cell.adjacent > 0) {
              const colors = ['', '#00f0f0', '#00f000', '#f00000', '#0000f0', '#800000', '#008080', '#000000', '#808080'];
              ctx.fillStyle = colors[cell.adjacent] || '#fff';
              ctx.font = `bold ${Math.floor(s * 0.45)}px monospace`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(cell.adjacent, x + s / 2, y + s / 2 + 1);
            }
          }
        } else {
          ctx.fillStyle = '#16213e';
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.fillRect(x, y, s, 2);
          ctx.fillRect(x, y, 2, s);
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(x, y + s - 2, s, 2);
          ctx.fillRect(x + s - 2, y, 2, s);

          if (cell.flagged) {
            ctx.fillStyle = '#e94560';
            ctx.font = `${Math.floor(s * 0.45)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚑', x + s / 2, y + s / 2 + 1);
          }
        }

        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, s, s);
      }
    }

    const remaining = this.MINES - this.flaggedCount;
    ctx.fillStyle = '#aaa';
    ctx.font = `${Math.floor(12 * (W / 600))}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('* ' + remaining, 4, 4);
    ctx.textAlign = 'right';
    ctx.fillText(this.elapsed + 's', W - 4, 4);

    if (this.flagMode) {
      ctx.fillStyle = 'rgba(233, 69, 96, 0.12)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#e94560';
      ctx.font = `bold ${Math.floor(14 * (W / 600))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('⚑ FLAG', W / 2, 4);
    }
  }
}

// Export for Node-based unit tests; harmless in the browser (no `module` global there).
if (typeof module !== "undefined" && module.exports) {
  module.exports = MinesweeperGame;
}
