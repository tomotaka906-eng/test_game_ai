class BreakoutGame extends BaseGame {
  reset() {
    this.paddle = { x: 0, y: 0, w: 80, h: 14 };
    this.ball = { x: 0, y: 0, r: 6, dx: 3, dy: -3 };
    this.bricks = [];
    this.score = 0;
    this.highScore = 0;
    this.lives = 3;
    this.gameOver = false;
    this.started = false;
    this.paused = false;
    this.W = 0; this.H = 0;
    this.brickRows = 6;
    this.brickCols = 8;
    this.brickW = 0; this.brickH = 18;
    this.brickPad = 4;
    this.brickTop = 40;
    this.mouseX = null;
  }

  start() {
    this.reset();
    this.initCanvas();
    this.W = this.canvas.width;
    this.H = this.canvas.height;
    this.paddle.w = Math.min(100, this.W * 0.2);
    this.paddle.x = (this.W - this.paddle.w) / 2;
    this.paddle.y = this.H - 30;
    this.ball.x = this.W / 2;
    this.ball.y = this.paddle.y - this.ball.r;
    this.brickW = (this.W - this.brickPad * (this.brickCols + 1)) / this.brickCols;
    this.initBricks();
    this.setupInput();
    this.startLoop();
  }

  startGame() {
    super.startGame();
    this.launchBall();
  }

  launchBall() {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    const speed = 4;
    this.ball.dx = Math.cos(angle) * speed;
    this.ball.dy = Math.sin(angle) * speed;
  }

  initBricks() {
    this.bricks = [];
    const colors = ['#e94560', '#e94560', '#ff6b6b', '#ffd93d', '#4ecca3', '#4ecca3'];
    for (let r = 0; r < this.brickRows; r++) {
      for (let c = 0; c < this.brickCols; c++) {
        this.bricks.push({
          x: this.brickPad + c * (this.brickW + this.brickPad),
          y: this.brickTop + r * (this.brickH + this.brickPad),
          w: this.brickW, h: this.brickH,
          alive: true,
          color: colors[r]
        });
      }
    }
  }

  setupInput() {
    this._onKeyDown = (e) => {
      if (this.gameOver) return;
      if (!this.started) {
        if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); this.startGame(); return; }
      }
      if (e.code === 'ArrowLeft') { this.mouseX = null; this.paddle.dx = -6; }
      if (e.code === 'ArrowRight') { this.mouseX = null; this.paddle.dx = 6; }
    };
    this._onKeyUp = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') this.paddle.dx = 0;
    };
    this._onMouseMove = (e) => {
      this.mouseX = GameUtils.canvasPoint(this.canvas, e.clientX, e.clientY).x;
    };
    this._onTouch = (e) => {
      e.preventDefault();
      if (this.gameOver) return;
      const touch = e.touches ? e.touches[0] : e;
      if (!this.started) { this.startGame(); return; }
      this.paddle.dx = 0;
      this.mouseX = GameUtils.canvasPoint(this.canvas, touch.clientX, touch.clientY).x;
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('touchstart', this._onTouch);
    this.canvas.addEventListener('touchmove', this._onTouch);
  }

  removeInput() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('touchstart', this._onTouch);
    this.canvas.removeEventListener('touchmove', this._onTouch);
    this.mouseX = null;
  }

  update(dt) {
    if (this.gameOver) return;
    if (this.mouseX !== null) {
      this.paddle.x = this.mouseX - this.paddle.w / 2;
    }
    if (this.paddle.dx) {
      this.paddle.x += this.paddle.dx;
    }
    this.paddle.x = Math.max(0, Math.min(this.W - this.paddle.w, this.paddle.x));

    if (!this.started) {
      this.ball.x = this.paddle.x + this.paddle.w / 2;
      this.ball.y = this.paddle.y - this.ball.r;
      return;
    }

    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    if (this.ball.x - this.ball.r < 0) { this.ball.x = this.ball.r; this.ball.dx *= -1; }
    if (this.ball.x + this.ball.r > this.W) { this.ball.x = this.W - this.ball.r; this.ball.dx *= -1; }
    if (this.ball.y - this.ball.r < 0) { this.ball.y = this.ball.r; this.ball.dy *= -1; }

    if (this.ball.y + this.ball.r > this.paddle.y &&
        this.ball.y + this.ball.r < this.paddle.y + this.paddle.h + 10 &&
        this.ball.x > this.paddle.x && this.ball.x < this.paddle.x + this.paddle.w) {
      const hit = (this.ball.x - this.paddle.x) / this.paddle.w;
      const angle = -Math.PI / 2 + (hit - 0.5) * 1.8;
      const speed = Math.max(4, Math.sqrt(this.ball.dx ** 2 + this.ball.dy ** 2));
      this.ball.dx = Math.cos(angle) * speed;
      this.ball.dy = Math.sin(angle) * speed;
      this.ball.y = this.paddle.y - this.ball.r;
    }

    if (this.ball.y + this.ball.r > this.H) {
      this.lives--;
      if (this.lives <= 0) { this.endGame(); return; }
      this.resetBall();
      return;
    }

    for (const b of this.bricks) {
      if (!b.alive) continue;
      if (GameUtils.rectsOverlap(this.ball.x - this.ball.r, this.ball.y - this.ball.r, this.ball.r * 2, this.ball.r * 2, b.x, b.y, b.w, b.h)) {
        b.alive = false;
        this.score += 10;
        this.app.updateScoreDisplay(this.score);
        const overlapX = Math.min(this.ball.x + this.ball.r - b.x, b.x + b.w - (this.ball.x - this.ball.r));
        const overlapY = Math.min(this.ball.y + this.ball.r - b.y, b.y + b.h - (this.ball.y - this.ball.r));
        if (overlapX < overlapY) this.ball.dx *= -1;
        else this.ball.dy *= -1;
        if (this.bricks.every(b => !b.alive)) {
          this.score += 50;
          this.app.updateScoreDisplay(this.score);
          this.lives++;
          this.initBricks();
          this.resetBall();
        }
        break;
      }
    }
  }

  resetBall() {
    this.started = false;
    this.ball.x = this.paddle.x + this.paddle.w / 2;
    this.ball.y = this.paddle.y - this.ball.r;
    this.ball.dx = 0;
    this.ball.dy = 0;
    document.getElementById('startMsg').classList.remove('hidden');
  }

  endGame() {
    this.finishGame(this.score);
  }

  render() {
    const ctx = this.ctx;
    GameUtils.clearCanvas(ctx, this.W, this.H, '#0a0a1a');

    this.bricks.forEach(b => {
      if (!b.alive) return;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(b.x, b.y, b.w, 3);
    });

    ctx.fillStyle = '#4ecca3';
    ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, 3);

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e94560';
    ctx.font = `bold ${Math.floor(13 * (this.W / 600))}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText('❤️'.repeat(Math.max(0, this.lives)), 8, 22);
    ctx.textAlign = 'right';
    ctx.fillText(`HI ${this.highScore}`, this.W - 8, 22);
  }
}