class TetrisGame extends BaseGame {
  reset() {
    this.ROWS = 20;
    this.COLS = 10;
    this.board = [];
    this.piece = null;
    this.next = null;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.highScore = 0;
    this.gameOver = false;
    this.started = false;
    this.dropCounter = 0;
    this.dropInterval = 1000;
    this.lastTime = 0;
    this.cellSize = 0;
    this.bx = 0;
    this.by = 0;
    this.nextPieces = [];
    this.previewCount = 3;
    this.lockDelay = 0;
    this.frame = 0;

    this.TETROMINOES = {
      I: { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#00f0f0' },
      O: { shape: [[1,1],[1,1]], color: '#f0f000' },
      T: { shape: [[0,1,0],[1,1,1],[0,0,0]], color: '#a000f0' },
      S: { shape: [[0,1,1],[1,1,0],[0,0,0]], color: '#00f000' },
      Z: { shape: [[1,1,0],[0,1,1],[0,0,0]], color: '#f00000' },
      J: { shape: [[1,0,0],[1,1,1],[0,0,0]], color: '#0000f0' },
      L: { shape: [[0,0,1],[1,1,1],[0,0,0]], color: '#f0a000' }
    };
    this.nextBag = [];
  }

  start() {
    this.reset();
    this.initCanvas();
    this.calcDimensions();
    this.initBoard();
    this.nextBag = this.shuffleBag();
    this.next = this.getNextPiece();
    this.setupInput();
    this.startLoop();
  }

  startGame() {
    super.startGame();
    this.spawnPiece();
  }

  calcDimensions() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const playW = W * 0.65;
    const playH = H * 0.9;
    this.cellSize = Math.floor(Math.min(playW / this.COLS, playH / this.ROWS));
    const boardW = this.cellSize * this.COLS;
    const boardH = this.cellSize * this.ROWS;
    this.bx = Math.floor((W * 0.65 - boardW) / 2);
    this.by = Math.floor((H - boardH) / 2);
  }

  initBoard() {
    this.board = [];
    for (let r = 0; r < this.ROWS; r++) {
      this.board.push(new Array(this.COLS).fill(0));
    }
  }

  shuffleBag() {
    const pieces = ['I','O','T','S','Z','J','L'];
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    return pieces;
  }

  getNextPiece() {
    if (this.nextBag.length === 0) this.nextBag = this.shuffleBag();
    return this.nextBag.pop();
  }

  spawnPiece() {
    const type = this.next;
    this.next = this.getNextPiece();
    const t = this.TETROMINOES[type];
    const shape = t.shape.map(row => [...row]);
    this.piece = {
      type: type,
      shape: shape,
      color: t.color,
      x: Math.floor((this.COLS - shape[0].length) / 2),
      y: 0
    };
    this.lockDelay = 0;
    this.dropCounter = 0;
    if (this.collides(this.piece.shape, this.piece.x, this.piece.y)) {
      this.endGame();
    }
  }

  collides(shape, px, py) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const bx = px + c;
        const by = py + r;
        if (bx < 0 || bx >= this.COLS || by >= this.ROWS) return true;
        if (by >= 0 && this.board[by][bx]) return true;
      }
    }
    return false;
  }

  rotate(shape) {
    const n = shape.length;
    const rotated = [];
    for (let r = 0; r < n; r++) {
      rotated.push([]);
      for (let c = 0; c < n; c++) {
        rotated[r].push(shape[n - 1 - c][r]);
      }
    }
    return rotated;
  }

  moveLeft() {
    if (this.gameOver || !this.started || !this.piece) return;
    if (!this.collides(this.piece.shape, this.piece.x - 1, this.piece.y)) {
      this.piece.x--;
      this.lockDelay = 0;
    }
  }

  moveRight() {
    if (this.gameOver || !this.started || !this.piece) return;
    if (!this.collides(this.piece.shape, this.piece.x + 1, this.piece.y)) {
      this.piece.x++;
      this.lockDelay = 0;
    }
  }

  moveDown() {
    if (this.gameOver || !this.started || !this.piece) return;
    if (!this.collides(this.piece.shape, this.piece.x, this.piece.y + 1)) {
      this.piece.y++;
      this.dropCounter = 0;
      return true;
    }
    return false;
  }

  hardDrop() {
    if (this.gameOver || !this.started || !this.piece) return;
    let dist = 0;
    while (!this.collides(this.piece.shape, this.piece.x, this.piece.y + 1)) {
      this.piece.y++;
      dist++;
    }
    this.score += dist * 2;
    this.lock();
  }

  rotatePiece() {
    if (this.gameOver || !this.started || !this.piece) return;
    const rotated = this.rotate(this.piece.shape);
    let kickX = 0;
    if (!this.collides(rotated, this.piece.x, this.piece.y)) {
      this.piece.shape = rotated;
      this.lockDelay = 0;
      return;
    }
    if (!this.collides(rotated, this.piece.x - 1, this.piece.y)) {
      this.piece.shape = rotated;
      this.piece.x--;
      this.lockDelay = 0;
      return;
    }
    if (!this.collides(rotated, this.piece.x + 1, this.piece.y)) {
      this.piece.shape = rotated;
      this.piece.x++;
      this.lockDelay = 0;
      return;
    }
    if (!this.collides(rotated, this.piece.x, this.piece.y - 1)) {
      this.piece.shape = rotated;
      this.piece.y--;
      this.lockDelay = 0;
      return;
    }
  }

  lock() {
    if (!this.piece) return;
    const shape = this.piece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const bx = this.piece.x + c;
        const by = this.piece.y + r;
        if (by < 0) { this.endGame(); return; }
        this.board[by][bx] = this.piece.type;
      }
    }
    this.piece = null;
    this.clearLines();
    this.spawnPiece();
  }

  clearLines() {
    let cleared = 0;
    for (let r = this.ROWS - 1; r >= 0; r--) {
      if (this.board[r].every(c => c !== 0)) {
        this.board.splice(r, 1);
        this.board.unshift(new Array(this.COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared > 0) {
      this.lines += cleared;
      const pts = [0, 100, 300, 500, 800];
      this.score += (pts[cleared] || 800) * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 80);
    }
  }

  getGhostY() {
    if (!this.piece) return 0;
    let gy = this.piece.y;
    while (!this.collides(this.piece.shape, this.piece.x, gy + 1)) gy++;
    return gy;
  }

  setupInput() {
    this._onKeyDown = (e) => {
      if (this.gameOver) return;
      if (!this.started) {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
          e.preventDefault();
          this.startGame();
        }
        return;
      }
      switch (e.code) {
        case 'ArrowLeft':  e.preventDefault(); this.moveLeft(); break;
        case 'ArrowRight': e.preventDefault(); this.moveRight(); break;
        case 'ArrowDown':  e.preventDefault(); this.moveDown(); break;
        case 'ArrowUp':    e.preventDefault(); this.rotatePiece(); break;
        case 'Space':      e.preventDefault(); this.hardDrop(); break;
      }
    };
    this._onTouchStart = (e) => {
      e.preventDefault();
      if (this.gameOver) return;
      const touch = e.touches[0];
      if (!this.started) { this.startGame(); return; }
      this._touchStart = { x: touch.clientX, y: touch.clientY, t: Date.now() };
    };
    this._onTouchEnd = (e) => {
      e.preventDefault();
      if (!this._touchStart || this.gameOver) { this._touchStart = null; return; }
      const touch = e.changedTouches[0];
      const dx = touch.clientX - this._touchStart.x;
      const dy = touch.clientY - this._touchStart.y;
      const dt = Date.now() - this._touchStart.t;
      this._touchStart = null;
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 300) {
        this.rotatePiece();
      } else if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 20) this.moveRight();
        else if (dx < -20) this.moveLeft();
      } else {
        if (dy > 20) this.hardDrop();
      }
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

  update(dt) {
    if (this.gameOver || !this.started || !this.piece) return;
    this.frame++;

    // 落下処理
    this.dropCounter += dt;
    if (this.dropCounter >= this.dropInterval) {
      this.moveDown();
      this.dropCounter = 0;
    }

    // 接地時のロック遅延処理 (500ms猶予)
    if (this.collides(this.piece.shape, this.piece.x, this.piece.y + 1)) {
      this.lockDelay += dt;
      if (this.lockDelay >= 500) {
        this.lock();
      }
    } else {
      this.lockDelay = 0;
    }
  }

  endGame() {
    this.finishGame(this.score);
  }

  render() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    GameUtils.clearCanvas(ctx, W, H, '#0a0a1a');

    this.drawBoard(ctx);
    this.drawGhost(ctx);
    if (this.piece && this.started) this.drawPiece(ctx, this.piece);
    this.drawSidePanel(ctx, W, H);
    this.drawScore(ctx, W);
  }

  drawBoard(ctx) {
    const bw = this.cellSize * this.COLS;
    const bh = this.cellSize * this.ROWS;
    ctx.fillStyle = '#111128';
    ctx.fillRect(this.bx, this.by, bw, bh);
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.bx, this.by, bw, bh);

    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.board[r][c]) {
          const t = this.TETROMINOES[this.board[r][c]];
          this.drawCell(ctx, this.bx + c * this.cellSize, this.by + r * this.cellSize, t.color);
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.03)';
          ctx.fillRect(this.bx + c * this.cellSize + 1, this.by + r * this.cellSize + 1, this.cellSize - 2, this.cellSize - 2);
        }
      }
    }
  }

  drawCell(ctx, x, y, color, alpha) {
    const pad = 1;
    const s = this.cellSize - pad * 2;
    ctx.globalAlpha = alpha || 1;
    ctx.fillStyle = color;
    ctx.fillRect(x + pad, y + pad, s, s);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(x + pad, y + pad, s, 4);
    ctx.fillRect(x + pad, y + pad, 4, s);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x + pad, y + s - pad - 4, s, 4);
    ctx.fillRect(x + s - pad - 4, y + pad, 4, s);
    ctx.globalAlpha = 1;
  }

  drawPiece(ctx, piece) {
    const shape = piece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          this.drawCell(ctx,
            this.bx + (piece.x + c) * this.cellSize,
            this.by + (piece.y + r) * this.cellSize,
            piece.color
          );
        }
      }
    }
  }

  drawGhost(ctx) {
    if (!this.piece) return;
    const gy = this.getGhostY();
    if (gy === this.piece.y) return;
    const shape = this.piece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.strokeStyle = this.piece.color;
          ctx.lineWidth = 1;
          const x = this.bx + (this.piece.x + c) * this.cellSize + 1;
          const y = this.by + (gy + r) * this.cellSize + 1;
          const s = this.cellSize - 2;
          ctx.fillRect(x, y, s, s);
          ctx.strokeRect(x, y, s, s);
        }
      }
    }
  }

  drawSidePanel(ctx, W, H) {
    const px = W * 0.72;
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.floor(14 * (W / 600))}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText('NEXT', px, this.by + 20);

    if (this.next) {
      const t = this.TETROMINOES[this.next];
      const shape = t.shape;
      const previewSize = this.cellSize * 0.6;
      const ox = px + 10;
      const oy = this.by + 40;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            ctx.fillStyle = t.color;
            ctx.fillRect(ox + c * previewSize, oy + r * previewSize, previewSize - 2, previewSize - 2);
          }
        }
      }
    }

    ctx.fillStyle = '#555';
    ctx.font = `${Math.floor(12 * (W / 600))}px monospace`;
    ctx.fillText(`LEVEL ${this.level}`, px, this.by + 180);
    ctx.fillText(`${this.lines} LINES`, px, this.by + 200);
  }

  drawScore(ctx, W) {
    GameUtils.drawHiScore(ctx, W, '#e94560', this.highScore, this.score);
  }
}
