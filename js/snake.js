class SnakeGame {
  constructor() {
    this.app = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;
    this.running = false;
    this.reset();
  }

  reset() {
    this.gridSize = 20;
    this.snake = [];
    this.food = null;
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.score = 0;
    this.highScore = 0;
    this.gameOver = false;
    this.started = false;
    this.speed = 150;
    this.timer = 0;
    this.cols = 0;
    this.rows = 0;
    this.ox = 0;
    this.oy = 0;
  }

  start() {
    this.reset();
    this.canvas = this.app.canvas;
    this.ctx = this.app.ctx;
    this.highScore = this.app.scores.snake;
    const W = this.canvas.width;
    const H = this.canvas.height;
    this.cols = Math.floor(W * 0.85 / this.gridSize);
    this.rows = Math.floor(H * 0.85 / this.gridSize);
    this.ox = Math.floor((W - this.cols * this.gridSize) / 2);
    this.oy = Math.floor((H - this.rows * this.gridSize) / 2);
    const cx = Math.floor(this.cols / 2);
    const cy = Math.floor(this.rows / 2);
    this.snake = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
    this.spawnFood();
    this.setupInput();
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
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

  spawnFood() {
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * this.cols), y: Math.floor(Math.random() * this.rows) };
    } while (this.snake.some(s => s.x === pos.x && s.y === pos.y));
    this.food = pos;
  }

  setupInput() {
    this._onKeyDown = (e) => {
      if (this.gameOver) return;
      if (!this.started) {
        if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); this.startGame(); return; }
      }
      const dirMap = {
        ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
        KeyW: { x: 0, y: -1 }, KeyS: { x: 0, y: 1 },
        KeyA: { x: -1, y: 0 }, KeyD: { x: 1, y: 0 }
      };
      const nd = dirMap[e.code];
      if (nd && (nd.x !== -this.dir.x || nd.y !== -this.dir.y)) {
        e.preventDefault();
        this.nextDir = nd;
      }
    };
    this._onTouchStart = (e) => {
      e.preventDefault();
      if (this.gameOver) return;
      const touch = e.touches[0];
      if (!this.started) { this.startGame(); return; }
      this._touchStart = { x: touch.clientX, y: touch.clientY };
    };
    this._onTouchEnd = (e) => {
      e.preventDefault();
      if (!this._touchStart || this.gameOver) { this._touchStart = null; return; }
      const touch = e.changedTouches[0];
      const dx = touch.clientX - this._touchStart.x;
      const dy = touch.clientY - this._touchStart.y;
      if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0 && this.dir.x !== -1) this.nextDir = { x: 1, y: 0 };
          else if (dx < 0 && this.dir.x !== 1) this.nextDir = { x: -1, y: 0 };
        } else {
          if (dy > 0 && this.dir.y !== -1) this.nextDir = { x: 0, y: 1 };
          else if (dy < 0 && this.dir.y !== 1) this.nextDir = { x: 0, y: -1 };
        }
      }
      this._touchStart = null;
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

  loop(time) {
    if (!this.running) return;
    const dt = time - this.lastTime;
    this.lastTime = time;
    this.update(dt);
    this.render();
    this.animId = requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.gameOver || !this.started) return;
    this.timer += dt;
    if (this.timer < this.speed) return;
    this.timer = 0;
    this.dir = { ...this.nextDir };
    const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };
    if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows || this.snake.some(s => s.x === head.x && s.y === head.y)) {
      this.endGame(); return;
    }
    this.snake.unshift(head);
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score++;
      this.spawnFood();
      this.speed = Math.max(60, 150 - this.score * 3);
    } else {
      this.snake.pop();
    }
  }

  endGame() {
    this.gameOver = true;
    const isNew = this.app.recordScore('snake', this.score);
    this.app.showGameOver(this.score, isNew);
  }

  render() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, W, H);

    const g = this.gridSize;
    ctx.fillStyle = '#111128';
    ctx.fillRect(this.ox, this.oy, this.cols * g, this.rows * g);
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.ox, this.oy, this.cols * g, this.rows * g);

    this.snake.forEach((s, i) => {
      const t = 1 - i / this.snake.length * 0.5;
      ctx.fillStyle = i === 0 ? '#4ecca3' : `rgba(78, 204, 163, ${t})`;
      ctx.fillRect(this.ox + s.x * g + 1, this.oy + s.y * g + 1, g - 2, g - 2);
    });

    if (this.food) {
      ctx.fillStyle = '#e94560';
      ctx.beginPath();
      ctx.arc(this.ox + this.food.x * g + g / 2, this.oy + this.food.y * g + g / 2, g / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Export for Node-based unit tests; harmless in the browser (no `module` global there).
if (typeof module !== "undefined" && module.exports) {
  module.exports = SnakeGame;
}
