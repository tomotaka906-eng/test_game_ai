class FlappyGame extends BaseGame {
  reset() {
    this.bird = {
      x: 0, y: 0, w: 30, h: 24,
      vy: 0, rotation: 0,
      wingFrame: 0, wingTimer: 0
    };
    this.pipes = [];
    this.score = 0;
    this.highScore = 0;
    this.gameOver = false;
    this.started = false;
    this.pipeTimer = 0;
    this.lastPipeTime = 0;
    this.pipeGap = 140;
    this.pipeWidth = 48;
    this.pipeSpeed = 3;
    this.gravity = 0.4;
    this.flapStrength = -6.5;
    this.groundY = 0;
    this.skyTop = 0;
    this.frame = 0;
    this.scrollX = 0;
  }

  start() {
    this.reset();
    this.initCanvas();
    const H = this.canvas.height;
    const W = this.canvas.width;
    this.groundY = H - 60;
    this.skyTop = 0;
    this.bird.x = Math.floor(W * 0.25);
    this.bird.y = Math.floor(H * 0.35);
    this.setupInput();
    this.startLoop();
  }

  setupInput() {
    this._onKeyDown = (e) => {
      if (this.gameOver) return;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!this.started) {
          this.startGame();
        }
        this.flap();
      }
    };
    this._onTouch = (e) => {
      e.preventDefault();
      if (this.gameOver) return;
      if (!this.started) {
        this.startGame();
      }
      this.flap();
    };
    window.addEventListener('keydown', this._onKeyDown);
    this.canvas.addEventListener('touchstart', this._onTouch);
    this.canvas.addEventListener('click', this._onTouch);
  }

  removeInput() {
    window.removeEventListener('keydown', this._onKeyDown);
    this.canvas.removeEventListener('touchstart', this._onTouch);
    this.canvas.removeEventListener('click', this._onTouch);
  }

  flap() {
    if (this.gameOver) return;
    this.bird.vy = this.flapStrength;
    this.bird.wingFrame = 1;
    setTimeout(() => { this.bird.wingFrame = 0; }, 150);
  }

  update(dt, ts) {
    if (this.gameOver) return;
    this.frame++;

    if (this.started) {
      this.bird.vy += this.gravity;
      this.bird.y += this.bird.vy;
      this.bird.rotation = Math.min(Math.PI * 0.4, Math.max(-Math.PI * 0.3, this.bird.vy * 0.04));

      if (!this.lastPipeTime) this.lastPipeTime = ts;
      const pipeDt = ts - this.lastPipeTime;
      if (pipeDt >= 1500 + Math.random() * 1200) {
        this.lastPipeTime = ts;
        this.spawnPipe();
      }

      for (let i = this.pipes.length - 1; i >= 0; i--) {
        const p = this.pipes[i];
        p.x -= this.pipeSpeed;
        if (p.x + this.pipeWidth < 0) {
          this.pipes.splice(i, 1);
          continue;
        }
        if (!p.scored && p.x + this.pipeWidth < this.bird.x) {
          p.scored = true;
          this.score++;
          this.app.updateScoreDisplay(this.score);
        }
        if (this.checkCollision(p)) {
          this.endGame();
          return;
        }
      }

      if (this.bird.y + this.bird.h >= this.groundY || this.bird.y <= this.skyTop) {
        this.bird.y = Math.min(this.bird.y, this.groundY - this.bird.h);
        this.endGame();
        return;
      }
    } else {
      this.bird.y = Math.floor(this.canvas.height * 0.35) + Math.sin(this.frame * 0.05) * 12;
    }

    this.scrollX -= 0.5;
  }

  spawnPipe() {
    const H = this.canvas.height;
    const W = this.canvas.width;
    const minGapY = 60;
    const maxGapY = this.groundY - this.pipeGap - 60;
    const gapY = minGapY + Math.random() * (maxGapY - minGapY);
    this.pipes.push({
      x: W,
      gapY: gapY,
      w: this.pipeWidth,
      scored: false
    });
  }

  checkCollision(pipe) {
    const b = this.bird;
    const shrink = 4;
    const bx = b.x + shrink;
    const by = b.y + shrink;
    const bw = b.w - shrink * 2;
    const bh = b.h - shrink * 2;

    const topPipeH = pipe.gapY;
    if (GameUtils.rectsOverlap(bx, by, bw, bh, pipe.x, 0, pipe.w, topPipeH)) {
      return true;
    }

    const bottomPipeY = pipe.gapY + this.pipeGap;
    const bottomPipeH = this.groundY - bottomPipeY;
    if (GameUtils.rectsOverlap(bx, by, bw, bh, pipe.x, bottomPipeY, pipe.w, bottomPipeH)) {
      return true;
    }
    return false;
  }

  endGame() {
    this.finishGame(this.score);
  }

  render() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(0.7, '#2d3561');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    this.drawStars(ctx, W, H);
    this.drawGround(ctx, W, H);
    this.pipes.forEach(p => this.drawPipe(ctx, p));
    this.drawBird(ctx);
    this.drawScore(ctx, W);
  }

  drawStars(ctx, W, H) {
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 15; i++) {
      const sx = (i * 137 + this.frame * 0.1) % W;
      const sy = (i * 97 + 20) % (H * 0.5);
      const sr = 1 + (i % 3);
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawGround(ctx, W, H) {
    const gy = this.groundY;
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, gy, W, H - gy);
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();
    const offset = this.scrollX % 30;
    ctx.fillStyle = '#1a1a2e';
    for (let x = offset; x < W; x += 30) {
      ctx.fillRect(x, gy + 2, 2, 6);
    }
  }

  drawPipe(ctx, pipe) {
    const topH = pipe.gapY;
    ctx.fillStyle = '#e94560';
    ctx.fillRect(pipe.x, 0, pipe.w, topH);
    ctx.fillRect(pipe.x - 4, topH - 20, pipe.w + 8, 20);

    const bottomY = pipe.gapY + this.pipeGap;
    ctx.fillRect(pipe.x, bottomY, pipe.w, this.groundY - bottomY);
    ctx.fillRect(pipe.x - 4, bottomY, pipe.w + 8, 20);

    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(pipe.x + 4, 0, pipe.w - 8, topH);
    ctx.fillRect(pipe.x + 4, bottomY, pipe.w - 8, this.groundY - bottomY);
  }

  drawBird(ctx) {
    const b = this.bird;
    ctx.save();
    ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
    ctx.rotate(b.rotation);
    ctx.translate(-b.w / 2, -b.h / 2);

    ctx.fillStyle = '#ffd93d';
    ctx.beginPath();
    ctx.ellipse(b.w / 2, b.h / 2, b.w / 2, b.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(b.w * 0.7, b.h * 0.35, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(b.w * 0.75, b.h * 0.35, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e94560';
    ctx.beginPath();
    ctx.moveTo(b.w, b.h * 0.42);
    ctx.lineTo(b.w + 6, b.h * 0.5);
    ctx.lineTo(b.w, b.h * 0.58);
    ctx.fill();

    if (b.wingFrame === 1) {
      ctx.fillStyle = '#ffb830';
      ctx.beginPath();
      ctx.ellipse(b.w * 0.4, b.h * 0.2, 10, 6, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawScore(ctx, W) {
    GameUtils.drawHiScore(ctx, W, '#ffd93d', this.highScore, this.score);
  }
}
