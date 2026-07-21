class DinoGame {
  constructor() {
    this.app = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;
    this.running = false;
    this.reset();
  }

  reset() {
    this.dino = {
      x: 0, y: 0, w: 44, h: 48,
      vy: 0, grounded: true,
      ducking: false,
      legFrame: 0, legTimer: 0
    };
    this.groundY = 0;
    this.obstacles = [];
    this.clouds = [];
    this.speed = 6;
    this.score = 0;
    this.highScore = 0;
    this.gameOver = false;
    this.started = false;
    this.spawnTimer = 0;
    this.minSpawnGap = 80;
    this.frame = 0;
    this.lastSpawnTime = 0;
  }

  start() {
    this.reset();
    this.canvas = this.app.canvas;
    this.ctx = this.app.ctx;
    this.highScore = this.app.scores.dino;
    this.groundY = this.canvas.height * 0.75;
    this.dino.x = Math.floor(this.canvas.width * 0.12);
    this.dino.y = this.groundY - this.dino.h;
    this.clouds = [];
    for (let i = 0; i < 3; i++) {
      this.clouds.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height * 0.4,
        w: 40 + Math.random() * 30,
        speed: 0.5 + Math.random() * 0.5
      });
    }
    this.setupInput();
    this.running = true;
    this.loop(0);
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

  setupInput() {
    this._onKeyDown = (e) => {
      if (this.gameOver) return;
      if ((e.code === 'Space' || e.code === 'ArrowUp') && this.started) {
        e.preventDefault();
        this.jump();
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        if (this.started) this.duck(true);
      }
      if ((e.code === 'Space' || e.code === 'ArrowUp') && !this.started) {
        e.preventDefault();
        this.startGame();
      }
    };
    this._onKeyUp = (e) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        this.duck(false);
      }
    };
    this._onTouchStart = (e) => {
      e.preventDefault();
      if (this.gameOver) return;
      if (!this.started) {
        this.startGame();
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const relativeY = touch.clientY - rect.top;
      const h = rect.height;
      if (relativeY > h * 0.6) {
        this.duck(true);
      } else {
        this.jump();
      }
    };
    this._onTouchEnd = (e) => {
      e.preventDefault();
      this.duck(false);
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    this.canvas.addEventListener('touchstart', this._onTouchStart);
    this.canvas.addEventListener('touchend', this._onTouchEnd);
  }

  removeInput() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.canvas.removeEventListener('touchstart', this._onTouchStart);
    this.canvas.removeEventListener('touchend', this._onTouchEnd);
    this._lastTouchY = null;
  }

  startGame() {
    this.started = true;
    document.getElementById('startMsg').classList.add('hidden');
  }

  jump() {
    if (this.dino.grounded) {
      this.dino.vy = -11 - this.speed * 0.3;
      this.dino.grounded = false;
      this.dino.ducking = false;
    }
  }

  duck(active) {
    if (this.dino.grounded) {
      this.dino.ducking = active;
    }
  }

  loop(timestamp) {
    if (!this.running) return;
    this.update(timestamp);
    this.render();
    this.animId = requestAnimationFrame((t) => this.loop(t));
  }

  update(ts) {
    if (this.gameOver || !this.started) return;

    this.frame++;
    this.speed = 6 + Math.floor(this.score / 100) * 0.5;
    if (this.speed > 16) this.speed = 16;

    this.dino.vy += 0.65;
    this.dino.y += this.dino.vy;
    if (this.dino.y >= this.groundY - this.dino.h) {
      this.dino.y = this.groundY - this.dino.h;
      this.dino.vy = 0;
      this.dino.grounded = true;
    }

    if (this.dino.grounded) {
      this.dino.legTimer++;
      if (this.dino.legTimer > 10 - Math.floor(this.speed / 3)) {
        this.dino.legTimer = 0;
        this.dino.legFrame = this.dino.legFrame === 0 ? 1 : 0;
      }
    }

    this.score++;
    this.app.updateScoreDisplay(this.score);

    this.clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x + c.w < 0) {
        c.x = this.canvas.width;
        c.y = Math.random() * this.canvas.height * 0.4;
        c.w = 40 + Math.random() * 30;
      }
    });

    if (!this.lastSpawnTime) this.lastSpawnTime = ts;
    const spawnDt = ts - this.lastSpawnTime;
    const gapMs = Math.max(700, (this.minSpawnGap - Math.floor(this.speed * 2)) * 16.67);
    if (spawnDt >= gapMs + Math.random() * 300) {
      this.lastSpawnTime = ts;
      this.spawnObstacle();
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= this.speed;
      if (obs.x + obs.w < 0) {
        this.obstacles.splice(i, 1);
        continue;
      }
      if (this.checkCollision(this.dino, obs)) {
        this.endGame();
        return;
      }
    }
  }

  spawnObstacle() {
    const r = Math.random();
    let obs;
    if (this.score > 300 && r < 0.25) {
      obs = { type: 'ptera', x: this.canvas.width, w: 40, h: 30 };
      obs.y = this.groundY - 40 - Math.random() * 60;
    } else if (r < 0.4) {
      obs = { type: 'cactus_small', x: this.canvas.width, w: 16, h: 32 };
      obs.y = this.groundY - obs.h;
    } else if (r < 0.7) {
      obs = { type: 'cactus_tall', x: this.canvas.width, w: 18, h: 48 };
      obs.y = this.groundY - obs.h;
    } else {
      obs = { type: 'cactus_group', x: this.canvas.width, w: 36, h: 48 };
      obs.y = this.groundY - obs.h;
    }
    this.obstacles.push(obs);
  }

  checkCollision(dino, obs) {
    const shrink = 4;
    const dx = dino.x + shrink;
    const dy = dino.y + shrink;
    const dw = dino.w - shrink * 2 - (dino.ducking ? 0 : 0);
    const dh = dino.h - shrink * 2 - (dino.ducking ? 16 : 0);
    const ox = obs.x + shrink;
    const oy = obs.y + shrink;
    const ow = obs.w - shrink * 2;
    const oh = obs.h - shrink * 2;
    return dx < ox + ow && dx + dw > ox && dy < oy + oh && dy + dh > oy;
  }

  endGame() {
    this.gameOver = true;
    const isNew = this.app.recordScore('dino', this.score);
    this.app.showGameOver(this.score, isNew);
  }

  render() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#16213e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    this.clouds.forEach(c => {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w * 0.5, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    this.drawGround(ctx, W, H);
    this.drawDino(ctx);
    this.obstacles.forEach(o => this.drawObstacle(ctx, o));
    this.drawScore(ctx, W);
  }

  drawGround(ctx, W, H) {
    const gy = this.groundY;
    ctx.strokeStyle = '#0f3460';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();

    const offset = this.frame * this.speed * 0.5;
    ctx.fillStyle = '#0f3460';
    for (let x = -offset % 40; x < W; x += 40) {
      ctx.fillRect(x, gy + 4, 2, 4);
      ctx.fillRect(x + 20, gy + 6, 2, 3);
    }
  }

  drawDino(ctx) {
    const d = this.dino;
    ctx.save();
    ctx.translate(d.x, d.y);

    if (d.ducking) {
      ctx.fillStyle = '#4ecca3';
      ctx.fillRect(4, 8, 36, 20);
      ctx.fillRect(2, 12, 6, 14);
      ctx.fillRect(36, 12, 6, 14);
      ctx.fillStyle = '#fff';
      ctx.fillRect(28, 10, 6, 6);
      ctx.fillStyle = '#222';
      ctx.fillRect(30, 11, 3, 4);
    } else {
      ctx.fillStyle = '#4ecca3';
      ctx.fillRect(8, 0, 28, 34);
      ctx.fillRect(4, 4, 8, 22);
      ctx.fillRect(32, 4, 10, 22);
      ctx.fillStyle = '#fff';
      ctx.fillRect(28, 4, 8, 8);
      ctx.fillStyle = '#222';
      ctx.fillRect(30, 5, 4, 5);
      ctx.fillStyle = '#4ecca3';
      const legLen = d.grounded ? 10 : 8;
      if (d.grounded) {
        if (d.legFrame === 0) {
          ctx.fillRect(12, 34, 8, legLen);
          ctx.fillRect(28, 34, 8, legLen);
        } else {
          ctx.fillRect(10, 34, 8, legLen);
          ctx.fillRect(30, 34, 8, legLen + 2);
        }
      } else {
        ctx.fillRect(12, 34, 8, 6);
        ctx.fillRect(28, 34, 8, 10);
      }
    }
    ctx.restore();
  }

  drawObstacle(ctx, obs) {
    ctx.fillStyle = '#e94560';
    if (obs.type === 'ptera') {
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h * 0.5);
      ctx.fillRect(obs.x + obs.w * 0.3, obs.y - 6, obs.w * 0.4, 6);
      ctx.fillRect(obs.x + obs.w * 0.3, obs.y + obs.h * 0.5, obs.w * 0.4, 6);
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(obs.x + obs.w * 0.6, obs.y - 3, obs.w * 0.3, 3);
      ctx.fillRect(obs.x + obs.w * 0.6, obs.y + obs.h * 0.5, obs.w * 0.3, 3);
    } else if (obs.type === 'cactus_small') {
      ctx.fillRect(obs.x + 2, obs.y, 12, obs.h);
      ctx.fillRect(obs.x, obs.y + 4, 16, 8);
      ctx.fillRect(obs.x + 2, obs.y + 4, 6, 20);
    } else if (obs.type === 'cactus_tall') {
      ctx.fillRect(obs.x + 3, obs.y, 12, obs.h);
      ctx.fillRect(obs.x, obs.y + 4, 18, 8);
      ctx.fillRect(obs.x + 2, obs.y + 4, 6, 28);
      ctx.fillRect(obs.x + 10, obs.y + 20, 6, 18);
    } else {
      ctx.fillRect(obs.x + 2, obs.y, 10, obs.h);
      ctx.fillRect(obs.x + 14, obs.y + 4, 10, obs.h - 8);
      ctx.fillRect(obs.x + 26, obs.y + 8, 10, obs.h - 12);
      ctx.fillRect(obs.x, obs.y + 4, 36, 8);
    }
  }

  drawScore(ctx, W) {
    ctx.fillStyle = '#e94560';
    ctx.font = `bold ${Math.floor(14 * (this.canvas.width / 600))}px monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(`HI ${this.highScore}`, W - 8, 24);
    ctx.fillText(`${this.score}`, W - 8, 42);
  }
}
