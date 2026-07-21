class DinoGame extends BaseGame {
  reset() {
    this.dino = {
      x: 0, y: 0, w: 44, h: 47,
      vy: 0, grounded: true,
      ducking: false,
      legFrame: 0, legTimer: 0
    };
    this.groundY = 0;
    this.obstacles = [];
    this.clouds = [];
    this.speed = 5;
    this.score = 0;
    this.displayScore = 0;
    this.highScore = 0;
    this.gameOver = false;
    this.started = false;
    this.spawnTimer = 0;
    this.frame = 0;
    this.lastSpawnTime = 0;
    this.totalFrames = 0;
    this.minObstacleDistance = 0;
    this.groundOffset = 0;
    this.nightMode = false;
    this.nightTimer = 0;
    this.nextNightScore = 700;
    this.flashTimer = 0;
    this.flashActive = false;
  }

  start() {
    this.reset();
    this.initCanvas();
    this.groundY = Math.floor(this.canvas.height * 0.75);
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
    if (this.dino.grounded) {
      this.dino.vy = -10;
      this.dino.grounded = false;
      this.dino.ducking = false;
    }
  }

  duck(active) {
    if (this.dino.grounded) {
      this.dino.ducking = active;
    }
  }

  update(dt, ts) {
    if (this.gameOver || !this.started) return;

    this.totalFrames++;

    // 速度: フレームごとに +0.001、最大 13.0 (仕様準拠)
    this.speed = Math.min(13, 5 + this.totalFrames * 0.001);

    // 重力 0.6、ジャンプ初速 -10 (仕様準拠)
    this.dino.vy += 0.6;
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

    // スコア: 1フレームごとに +0.15、表示は整数 (仕様準拠)
    this.score += 0.15;
    this.displayScore = Math.floor(this.score);
    this.app.updateScoreDisplay(this.displayScore);

    // 100点ごとにフラッシュ演出 (仕様準拠)
    if (this.displayScore > 0 && this.displayScore % 100 === 0 && !this.flashActive) {
      this.flashActive = true;
      this.flashTimer = 10;
    }
    if (this.flashTimer > 0) {
      this.flashTimer--;
    } else {
      this.flashActive = false;
    }

    // 昼夜逆転 (仕様準拠: 700, 1400, 2100...)
    if (this.displayScore >= this.nextNightScore) {
      this.nightMode = !this.nightMode;
      this.nextNightScore += 700;
    }

    // 地面スクロール
    this.groundOffset = (this.groundOffset + this.speed) % 40;

    // 雲
    this.clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x + c.w < 0) {
        c.x = this.canvas.width;
        c.y = Math.random() * this.canvas.height * 0.4;
        c.w = 40 + Math.random() * 30;
      }
    });

    // 障害物スポーン間隔: speed * 30 + ランダムマージン (仕様準拠)
    if (!this.lastSpawnTime) this.lastSpawnTime = ts;
    const spawnDt = ts - this.lastSpawnTime;
    const minGap = this.speed * 30 + 60 + Math.random() * 40;
    if (spawnDt >= minGap * 3) {
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
    const duckingHitboxH = 26;
    const standingHitboxH = 47;
    let obs;

    // プテラノドン: スコア400以上で出現 (仕様準拠)
    if (this.displayScore > 400 && r < 0.3) {
      const alt = Math.random();
      // 高: 頭上通過 (しゃがみ不要)
      // 中: しゃがみ必要
      // 低: ジャンプ必要
      let y;
      if (alt < 0.33) {
        y = this.groundY - 140; // 高: 頭上
      } else if (alt < 0.66) {
        y = this.groundY - standingHitboxH - 25; // 中: しゃがみ必要
      } else {
        y = this.groundY - 80; // 低: ジャンプ必要
      }
      obs = { type: 'ptera', x: this.canvas.width, w: 42, h: 30, y: y };
    } else if (r < 0.5) {
      // 小サボテン
      const count = Math.random() < 0.5 ? 1 : 2;
      obs = { type: 'cactus_small', x: this.canvas.width, w: 16 * count + 10, h: 32, y: this.groundY - 32 };
    } else {
      // 大サボテン
      const count = Math.random() < 0.5 ? 1 : 2;
      obs = { type: 'cactus_tall', x: this.canvas.width, w: 18 * count + 12, h: 48, y: this.groundY - 48 };
    }
    this.obstacles.push(obs);
  }

  checkCollision(dino, obs) {
    // 当たり判定を内側に縮小 (仕様準拠: 理不尽な相打ち防止)
    const shrink = 4;
    const dw = dino.w - shrink * 2;
    const dh = (dino.ducking ? 26 : 47) - shrink * 2;
    const dx = dino.x + shrink;
    const dy = dino.y + shrink + (dino.ducking ? (47 - 26) : 0);
    const ox = obs.x + shrink;
    const oy = obs.y + shrink;
    const ow = obs.w - shrink * 2;
    const oh = obs.h - shrink * 2;
    return GameUtils.rectsOverlap(dx, dy, dw, dh, ox, oy, ow, oh);
  }

  endGame() {
    this.finishGame(this.displayScore);
  }

  render() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    const bgColor = this.nightMode ? '#0a0a1a' : '#1a1a2e';
    const groundColor = this.nightMode ? '#111128' : '#16213e';
    const accentColor = this.nightMode ? '#555' : '#0f3460';
    const textColor = this.nightMode ? '#888' : '#e94560';

    GameUtils.clearCanvas(ctx, W, H, bgColor);

    // フラッシュ演出 (100点ごと)
    if (this.flashActive) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(0, 0, W, H);
    }

    this.clouds.forEach(c => {
      ctx.fillStyle = this.nightMode ? 'rgba(200,200,200,0.06)' : 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w * 0.5, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    this.drawGround(ctx, W, H, groundColor, accentColor);
    this.drawDino(ctx);
    this.obstacles.forEach(o => this.drawObstacle(ctx, o));
    this.drawScore(ctx, W, textColor);
  }

  drawGround(ctx, W, H, groundColor, accentColor) {
    const gy = this.groundY;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();

    ctx.fillStyle = accentColor;
    for (let x = -this.groundOffset; x < W; x += 40) {
      ctx.fillRect(x, gy + 4, 2, 4);
      ctx.fillRect(x + 20, gy + 6, 2, 3);
    }
  }

  drawDino(ctx) {
    const d = this.dino;
    const bodyColor = this.nightMode ? '#a0a0a0' : '#4ecca3';
    ctx.save();
    ctx.translate(d.x, d.y);

    if (d.ducking) {
      ctx.fillStyle = bodyColor;
      ctx.fillRect(4, 8, 36, 20);
      ctx.fillRect(2, 12, 6, 14);
      ctx.fillRect(36, 12, 6, 14);
      ctx.fillStyle = '#fff';
      ctx.fillRect(28, 10, 6, 6);
      ctx.fillStyle = '#222';
      ctx.fillRect(30, 11, 3, 4);
    } else {
      ctx.fillStyle = bodyColor;
      ctx.fillRect(8, 0, 28, 34);
      ctx.fillRect(4, 4, 8, 22);
      ctx.fillRect(32, 4, 10, 22);
      ctx.fillStyle = '#fff';
      ctx.fillRect(28, 4, 8, 8);
      ctx.fillStyle = '#222';
      ctx.fillRect(30, 5, 4, 5);
      ctx.fillStyle = bodyColor;
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
    const color = this.nightMode ? '#cc4444' : '#e94560';
    ctx.fillStyle = color;
    if (obs.type === 'ptera') {
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h * 0.5);
      ctx.fillRect(obs.x + obs.w * 0.3, obs.y - 6, obs.w * 0.4, 6);
      ctx.fillRect(obs.x + obs.w * 0.3, obs.y + obs.h * 0.5, obs.w * 0.4, 6);
      ctx.fillStyle = this.nightMode ? '#888' : '#ff6b6b';
      ctx.fillRect(obs.x + obs.w * 0.6, obs.y - 3, obs.w * 0.3, 3);
      ctx.fillRect(obs.x + obs.w * 0.6, obs.y + obs.h * 0.5, obs.w * 0.3, 3);
    } else if (obs.type === 'cactus_small') {
      ctx.fillRect(obs.x + 2, obs.y, 12, obs.h);
      ctx.fillRect(obs.x, obs.y + 4, 16, 8);
      ctx.fillRect(obs.x + 2, obs.y + 4, 6, 20);
      // 2本連続の場合
      if (obs.w > 30) {
        ctx.fillRect(obs.x + 20, obs.y + 2, 12, obs.h - 2);
        ctx.fillRect(obs.x + 18, obs.y + 4, 16, 8);
        ctx.fillRect(obs.x + 20, obs.y + 4, 6, 18);
      }
    } else {
      ctx.fillRect(obs.x + 3, obs.y, 12, obs.h);
      ctx.fillRect(obs.x, obs.y + 4, 18, 8);
      ctx.fillRect(obs.x + 2, obs.y + 4, 6, 28);
      ctx.fillRect(obs.x + 10, obs.y + 20, 6, 18);
      // 2本連続の場合
      if (obs.w > 35) {
        ctx.fillRect(obs.x + 22, obs.y + 2, 12, obs.h - 2);
        ctx.fillRect(obs.x + 20, obs.y + 4, 16, 8);
        ctx.fillRect(obs.x + 22, obs.y + 4, 6, 26);
        ctx.fillRect(obs.x + 28, obs.y + 20, 6, 16);
      }
    }
  }

  drawScore(ctx, W, color) {
    GameUtils.drawHiScore(ctx, W, color, this.highScore, this.displayScore);
  }
}