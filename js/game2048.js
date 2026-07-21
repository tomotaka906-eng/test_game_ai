class Game2048 {
  constructor() {
    this.app = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;
    this.running = false;
    this.reset();
  }

  reset() {
    this.size = 4;
    this.grid = [];
    this.score = 0;
    this.highScore = 0;
    this.gameOver = false;
    this.won = false;
    this.started = false;
    this.hasWon = false;
    this.keepPlaying = false;
    this.cellSize = 0;
    this.ox = 0;
    this.oy = 0;
    this.gap = 8;
    this.animating = false;
  }

  start() {
    this.reset();
    this.canvas = this.app.canvas;
    this.ctx = this.app.ctx;
    this.highScore = this.app.scores.game2048;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const size = Math.min(W, H) * 0.85;
    this.cellSize = Math.floor((size - this.gap * (this.size + 1)) / this.size);
    const totalW = this.cellSize * this.size + this.gap * (this.size + 1);
    this.ox = Math.floor((W - totalW) / 2);
    this.oy = Math.floor((H - totalW) / 2);
    this.newGame();
    this.setupInput();
    this.running = true;
    this.render();
  }

  stop() {
    this.running = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    this.removeInput();
  }

  restart() {
    this.stop();
    this.start();
  }

  startGame() {
    this.started = true;
    document.getElementById('startMsg').classList.add('hidden');
  }

  newGame() {
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    this.score = 0;
    this.hasWon = false;
    this.addRandom();
    this.addRandom();
  }

  addRandom() {
    const empty = [];
    for (let r = 0; r < this.size; r++)
      for (let c = 0; c < this.size; c++)
        if (this.grid[r][c] === 0) empty.push({ r, c });
    if (empty.length === 0) return;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  slide(row) {
    row = row.filter(v => v !== 0);
    for (let i = 0; i < row.length - 1; i++) {
      if (row[i] === row[i + 1]) {
        row[i] *= 2;
        this.score += row[i];
        row.splice(i + 1, 1);
      }
    }
    while (row.length < this.size) row.push(0);
    return row;
  }

  moveLeft() {
    let moved = false;
    for (let r = 0; r < this.size; r++) {
      const before = [...this.grid[r]];
      this.grid[r] = this.slide(this.grid[r]);
      if (before.join() !== this.grid[r].join()) moved = true;
    }
    return moved;
  }

  moveRight() {
    let moved = false;
    for (let r = 0; r < this.size; r++) {
      const before = [...this.grid[r]];
      this.grid[r] = this.slide([...this.grid[r]].reverse()).reverse();
      if (before.join() !== this.grid[r].join()) moved = true;
    }
    return moved;
  }

  moveUp() {
    let moved = false;
    for (let c = 0; c < this.size; c++) {
      const col = this.grid.map(r => r[c]);
      const before = [...col];
      const slid = this.slide(col);
      for (let r = 0; r < this.size; r++) this.grid[r][c] = slid[r];
      if (before.join() !== slid.join()) moved = true;
    }
    return moved;
  }

  moveDown() {
    let moved = false;
    for (let c = 0; c < this.size; c++) {
      const col = this.grid.map(r => r[c]).reverse();
      const before = [...col];
      const slid = this.slide(col);
      for (let r = 0; r < this.size; r++) this.grid[r][c] = slid[this.size - 1 - r];
      if (before.join() !== slid.join()) moved = true;
    }
    return moved;
  }

  canMove() {
    for (let r = 0; r < this.size; r++)
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) return true;
        if (c < this.size - 1 && this.grid[r][c] === this.grid[r][c + 1]) return true;
        if (r < this.size - 1 && this.grid[r][c] === this.grid[r + 1][c]) return true;
      }
    return false;
  }

  setupInput() {
    this._onKeyDown = (e) => {
      if (this.gameOver) return;
      const dirMap = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
        KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down'
      };
      const dir = dirMap[e.code];
      if (!dir) {
        if (e.code === 'Space' || e.code === 'Enter') {
          if (!this.started) { e.preventDefault(); this.startGame(); }
        }
        return;
      }
      e.preventDefault();
      if (!this.started) { this.startGame(); }
      if (this.animating) return;
      if (this.gameOver) return;
      let moved = false;
      switch (dir) {
        case 'left': moved = this.moveLeft(); break;
        case 'right': moved = this.moveRight(); break;
        case 'up': moved = this.moveUp(); break;
        case 'down': moved = this.moveDown(); break;
      }
      if (moved) {
        this.addRandom();
        if (!this.canMove()) { this.endGame(); return; }
        this.checkWin();
      }
      this.render();
    };
    this._onTouchStart = (e) => {
      if (this.gameOver) return;
      const touch = e.touches[0];
      if (!this.started) { this.startGame(); return; }
      this._touchStart = { x: touch.clientX, y: touch.clientY };
    };
    this._onTouchEnd = (e) => {
      if (!this._touchStart || this.gameOver) { this._touchStart = null; return; }
      const touch = e.changedTouches[0];
      const dx = touch.clientX - this._touchStart.x;
      const dy = touch.clientY - this._touchStart.y;
      this._touchStart = null;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      let moved = false;
      if (Math.abs(dx) > Math.abs(dy)) {
        moved = dx > 0 ? this.moveRight() : this.moveLeft();
      } else {
        moved = dy > 0 ? this.moveDown() : this.moveUp();
      }
      if (moved) {
        this.addRandom();
        if (!this.canMove()) { this.endGame(); return; }
        this.checkWin();
      }
      this.render();
    };
    window.addEventListener('keydown', this._onKeyDown);
    this.canvas.addEventListener('touchstart', this._onTouchStart);
    this.canvas.addEventListener('touchend', this._onTouchEnd);
  }

  removeInput() {
    window.removeEventListener('keydown', this._onKeyDown);
    this.canvas.removeEventListener('touchstart', this._onTouchStart);
    this.canvas.removeEventListener('touchend', this._onTouchEnd);
    this._touchStart = null;
  }

  checkWin() {
    if (this.hasWon || this.keepPlaying) return;
    for (let r = 0; r < this.size; r++)
      for (let c = 0; c < this.size; c++)
        if (this.grid[r][c] === 2048) { this.won = true; this.hasWon = true; return; }
  }

  endGame() {
    this.gameOver = true;
    const isNew = this.app.recordScore('game2048', this.score);
    this.app.showGameOver(this.score, isNew);
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, W, H);

    const colors = {
      0: '#1a1a2e', 2: '#eee4da', 4: '#ede0c8',
      8: '#f2b179', 16: '#f59563', 32: '#f67c5f',
      64: '#f65e3b', 128: '#edcf72', 256: '#edcc61',
      512: '#edc850', 1024: '#edc53f', 2048: '#edc22e',
      4096: '#3c3a32', 8192: '#3c3a32'
    };
    const textColors = { 2: '#776e65', 4: '#776e65' };

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.grid[r][c];
        const x = this.ox + this.gap + c * (this.cellSize + this.gap);
        const y = this.oy + this.gap + r * (this.cellSize + this.gap);
        ctx.fillStyle = colors[val] || '#3c3a32';
        ctx.fillRect(x, y, this.cellSize, this.cellSize);
        if (val) {
          ctx.fillStyle = textColors[val] || '#f9f6f2';
          const sz = val < 100 ? 28 : val < 1000 ? 22 : val < 10000 ? 18 : 14;
          ctx.font = `bold ${Math.floor(sz * (this.cellSize / 80))}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(val, x + this.cellSize / 2, y + this.cellSize / 2);
        }
      }
    }

    if (this.won) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffd700';
      ctx.font = `bold ${Math.floor(28 * (W / 600))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎉 2048! 🎉', W / 2, H / 2);
      ctx.fillStyle = '#ccc';
      ctx.font = `${Math.floor(14 * (W / 600))}px sans-serif`;
      ctx.fillText('続けてプレイ', W / 2, H / 2 + 40);
    }
  }
}