class CaveGame extends BaseGame {
  reset() {
    this.player = {
      x: 0, y: 0, w: 36, h: 40,
      vy: 0, grounded: true,
      ducking: false,
      legFrame: 0, legTimer: 0
    };
    this.ceilingY = 0;
    this.groundY = 0;
    this.obstacles = [];
    this.stalactites = [];
    this.particles = [];
    this.speed = 5;
    this.score = 0;
    this.highScore = 0;
    this.gameOver = false;
    this.started = false;
    this.spawnTimer = 0;
    this.minSpawnGap = 75;
    this.frame = 0;
    this.lastSpawnTime = 0;
    this.caveDarkness = 0;
    this.torchX = 0;
  }

  start() {
    this.reset();
    this.initCanvas();
    const H = this.canvas.height;
    this.ceilingY = 30;
    this.groundY = H - 20;
    this.player.x = Math.floor(this.canvas.width * 0.12);
    this.player.y = this.groundY - this.player.h;
    this.torchX = this.player.x;
    this.setupInput();
    this.startLoop();
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
  }

  jump() {
    if (this.player.grounded) {
      this.player.vy = -10 - this.speed * 0.25;
      this.player.grounded = false;
      this.player.ducking = false;
    }
  }

  duck(active) {
    if (this.player.grounded) {
      this.player.ducking = active;
    }
  }

  update(dt, ts) {
    if (this.gameOver || !this.started) return;

    this.frame++;
    this.speed = 5 + Math.floor(this.score / 80) * 0.4;
    if (this.speed > 14) this.speed = 14;

    this.player.vy += 0.6;
    this.player.y += this.player.vy;
    if (this.player.y >= this.groundY - this.player.h) {
      this.player.y = this.groundY - this.player.h;
      this.player.vy = 0;
      this.player.grounded = true;
    }
    if (this.player.y <= this.ceilingY) {
      this.player.y = this.ceilingY;
      this.player.vy = 0;
    }

    if (this.player.grounded && !this.player.ducking) {
      this.player.legTimer++;
      if (this.player.legTimer > 12 - Math.floor(this.speed / 3)) {
        this.player.legTimer = 0;
        this.player.legFrame = this.player.legFrame === 0 ? 1 : 0;
      }
    }

    this.score++;
    this.app.updateScoreDisplay(this.score);
    this.caveDarkness = Math.min(0.6, 0.1 + this.score * 0.0005);

    if (!this.lastSpawnTime) this.lastSpawnTime = ts;
    const spawnDt = ts - this.lastSpawnTime;
    const gapMs = Math.max(700, (this.minSpawnGap - Math.floor(this.speed * 2)) * 16.67);
    if (spawnDt >= gapMs + Math.random() * 800) {
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
      if (this.checkCollision(obs)) {
        this.endGame();
        return;
      }
    }

    this.particles = this.particles.filter(p => {
      p.x -= 0.5;
      p.y -= 0.3;
      p.life--;
      return p.life > 0 && p.x > -10;
    });
    if (this.frame % 3 === 0) {
      this.particles.push({
        x: this.canvas.width,
        y: this.ceilingY + Math.random() * (this.groundY - this.ceilingY),
        life: 40 + Math.random() * 30,
        size: 1 + Math.random() * 2
      });
    }

    this.torchX += (this.player.x - this.torchX) * 0.05;
  }

  spawnObstacle() {
    const W = this.canvas.width;
    const r = Math.random();
    const gy = this.groundY - 10;
    const stalY = this.groundY - 54;
    if (r < 0.5) {
      this.obstacles.push({
        type: 'spike',
        x: W, w: 20, h: 24,
        y: gy - 24
      });
    } else if (r < 0.75) {
      this.obstacles.push({
        type: 'stalactite',
        x: W, w: 24, h: 20,
        y: stalY
      });
    } else {
      this.obstacles.push({
        type: 'spike',
        x: W, w: 20, h: 24,
        y: gy - 24
      });
      this.obstacles.push({
        type: 'stalactite',
        x: W + 40, w: 24, h: 20,
        y: stalY
      });
    }
  }

  checkCollision(obs) {
    const p = this.player;
    const shrink = 4;
    const px = p.x + shrink;
    const py = p.y + shrink + (p.ducking ? 16 : 0);
    const pw = p.w - shrink * 2;
    const ph = p.h - shrink * 2 - (p.ducking ? 16 : 0);
    const ox = obs.x + shrink;
    const oy = obs.y + shrink;
    const ow = obs.w - shrink * 2;
    const oh = obs.h - shrink * 2;
    return GameUtils.rectsOverlap(px, py, pw, ph, ox, oy, ow, oh);
  }

  endGame() {
    this.finishGame(this.score);
  }

  render() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    GameUtils.clearCanvas(ctx, W, H, '#1a0a0a');

    this.drawCaveWalls(ctx, W, H);
    this.drawGround(ctx, W, H);
    this.obstacles.forEach(o => this.drawObstacle(ctx, o));
    this.drawPlayer(ctx);

    this.particles.forEach(p => {
      ctx.fillStyle = `rgba(255, 200, 100, ${p.life / 70})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    this.drawTorchEffect(ctx, W, H);
    this.drawScore(ctx, W);
  }

  drawCaveWalls(ctx, W, H) {
    const cy = this.ceilingY;
    ctx.fillStyle = '#2a1515';
    ctx.fillRect(0, 0, W, cy);
    ctx.fillStyle = '#3a1a1a';
    const offset = this.frame * this.speed * 0.3;
    for (let x = -offset % 30; x < W; x += 30) {
      const h = 5 + Math.sin(x * 0.3) * 3;
      ctx.fillRect(x, cy - h, 2, h);
    }
    ctx.fillRect(0, this.groundY, W, H - this.groundY);
  }

  drawGround(ctx, W, H) {
    const gy = this.groundY;
    ctx.fillStyle = '#2a1515';
    ctx.fillRect(0, gy, W, H - gy);
    ctx.strokeStyle = '#5a2a2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();
    const offset = this.frame * this.speed * 0.5;
    ctx.fillStyle = '#3a1a1a';
    for (let x = -offset % 25; x < W; x += 25) {
      ctx.fillRect(x, gy + 4, 2, 4);
      ctx.fillRect(x + 12, gy + 6, 2, 3);
    }
  }

  drawPlayer(ctx) {
    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);

    if (p.ducking) {
      ctx.fillStyle = '#8b5cf6';
      ctx.fillRect(4, 8, 28, 16);
      ctx.fillRect(2, 10, 6, 12);
      ctx.fillRect(28, 10, 6, 12);
      ctx.fillStyle = '#ffd93d';
      ctx.fillRect(22, 10, 6, 6);
    } else {
      ctx.fillStyle = '#8b5cf6';
      ctx.fillRect(6, 0, 24, 30);
      ctx.fillRect(2, 4, 8, 20);
      ctx.fillRect(26, 4, 8, 20);
      ctx.fillStyle = '#ffd93d';
      ctx.fillRect(20, 6, 10, 8);
      ctx.fillStyle = '#333';
      ctx.fillRect(24, 7, 5, 5);
      ctx.fillStyle = '#8b5cf6';
      const legLen = p.grounded ? 10 : 6;
      if (p.grounded) {
        if (p.legFrame === 0) {
          ctx.fillRect(10, 30, 6, legLen);
          ctx.fillRect(22, 30, 6, legLen);
        } else {
          ctx.fillRect(8, 30, 6, legLen);
          ctx.fillRect(24, 30, 6, legLen + 2);
        }
      } else {
        ctx.fillRect(10, 30, 6, 4);
        ctx.fillRect(22, 30, 6, 8);
      }
    }
    ctx.restore();
  }

  drawObstacle(ctx, obs) {
    if (obs.type === 'spike') {
      ctx.fillStyle = '#d63031';
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y + obs.h);
      ctx.lineTo(obs.x + obs.w / 2, obs.y);
      ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#b71c1c';
      ctx.beginPath();
      ctx.moveTo(obs.x + 3, obs.y + obs.h);
      ctx.lineTo(obs.x + obs.w / 2, obs.y + 4);
      ctx.lineTo(obs.x + obs.w - 3, obs.y + obs.h);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.fillStyle = '#5a3a2a';
      ctx.fillRect(obs.x, obs.y, obs.w, 4);
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(obs.x + 2, obs.y + 6, obs.w - 4, obs.h - 8);
    }
  }

  drawTorchEffect(ctx, W, H) {
    const grad = ctx.createRadialGradient(
      this.torchX + this.player.w / 2, this.player.y + this.player.h / 2, 30,
      this.torchX + this.player.w / 2, this.player.y + this.player.h / 2, W * 0.7
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, `rgba(0,0,0,${this.caveDarkness * 0.5})`);
    grad.addColorStop(1, `rgba(0,0,0,${this.caveDarkness})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  drawScore(ctx, W) {
    GameUtils.drawHiScore(ctx, W, '#ffd93d', this.highScore, this.score);
  }
}
