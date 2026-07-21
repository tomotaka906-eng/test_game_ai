class App {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.currentGame = null;
    this.games = {};
    this.scores = this.loadScores();
    this.fb = new FirebaseDB();
    this.playerName = localStorage.getItem('mgc_name') || '';
    this.pendingScore = null;
  }

  init() {
    this.updateHighScoreLabels();
    this.setupMenu();
    this.setupBackButton();
    this.setupRestartButton();
    this.setupStartMessage();
    this.setupNameSubmit();
    this.setupUpdateBtn();
    this.setupDpad();
    this.resizeCanvas();
    this.loadLeaderboard();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  register(name, gameInstance) {
    this.games[name] = gameInstance;
    gameInstance.app = this;
  }

  loadScores() {
    try {
      const data = localStorage.getItem('mgc_scores');
      return data ? JSON.parse(data) : { dino: 0, flappy: 0, cave: 0, tetris: 0, snake: 0, breakout: 0, game2048: 0 };
    } catch {
      return { dino: 0, flappy: 0, cave: 0, tetris: 0, snake: 0, breakout: 0, game2048: 0 };
    }
  }

  saveScores() {
    try {
      localStorage.setItem('mgc_scores', JSON.stringify(this.scores));
    } catch {}
  }

  updateHighScoreLabels() {
    ['dino','flappy','cave','tetris','snake','breakout','game2048'].forEach(g => {
      const el = document.getElementById('hs' + g.charAt(0).toUpperCase() + g.slice(1));
      if (el) el.textContent = this.scores[g] || 0;
    });
  }

  setupMenu() {
    document.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => this.startGame(card.dataset.game));
      let touchY = 0;
      card.addEventListener('touchstart', (e) => {
        touchY = e.touches[0].clientY;
      }, { passive: true });
      card.addEventListener('touchend', (e) => {
        const dy = Math.abs(e.changedTouches[0].clientY - touchY);
        if (dy < 10) {
          e.preventDefault();
          this.startGame(card.dataset.game);
        }
      });
    });

  setupStartMessage() {
    const msg = document.getElementById('startMsg');
    const handler = () => {
      if (this.currentGame && this.games[this.currentGame].startGame) {
        this.games[this.currentGame].startGame();
      }
    };
    msg.addEventListener('click', handler);
    msg.addEventListener('touchend', (e) => { e.preventDefault(); handler(); });
  }

  setupBackButton() {
    document.getElementById('backBtn').addEventListener('click', () => this.showMenu());
  }

  setupRestartButton() {
    document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
  }

  setupNameSubmit() {
    const btn = document.getElementById('submitScoreBtn');
    const input = document.getElementById('nameInput');
    btn.addEventListener('click', () => this.submitHighScore(input.value.trim()));
    input.addEventListener('keydown', (e) => {
      if (e.code === 'Enter') this.submitHighScore(input.value.trim());
    });
    input.addEventListener('touchend', (e) => e.stopPropagation());
  }

  resizeCanvas() {
    const container = document.getElementById('gameScreen');
    const header = document.getElementById('gameHeader');
    const headerH = header.offsetHeight;
    const w = container.clientWidth;
    const h = container.clientHeight - headerH;
    this.canvas.width = w;
    this.canvas.height = h;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
  }

  showMenu() {
    if (this.currentGame) {
      this.games[this.currentGame].stop();
      this.currentGame = null;
    }
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('menuScreen').classList.add('active');
    document.getElementById('gameOverlay').querySelectorAll('> div').forEach(d => d.classList.add('hidden'));
    this.loadLeaderboard();
  }

  startGame(name) {
    this.currentGame = name;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('gameScreen').classList.add('active');
    document.getElementById('gameTitle').textContent = {
      dino: 'Dino Runner', flappy: 'Flappy Bird',
      cave: 'Cave Runner', tetris: 'Tetris',
      snake: 'Snake', breakout: 'Breakout', game2048: '2048'
    }[name];
    this.resizeCanvas();
    this.showStartMessage();
    this.updateControlsHint(name);
    this.updateDpad(name);
    this.games[name].start();
  }

  restartGame() {
    if (this.currentGame) {
      document.getElementById('restartBtn').blur();
      this.games[this.currentGame].restart();
      this.showStartMessage();
      this.updateControlsHint(this.currentGame);
    }
  }

  showStartMessage() {
    document.getElementById('nameOverlay').classList.add('hidden');
    document.getElementById('gameoverMsg').classList.add('hidden');
    document.getElementById('startMsg').classList.remove('hidden');
  }

  showGameOver(score, isNewRecord) {
    document.getElementById('startMsg').classList.add('hidden');
    document.getElementById('gameoverMsg').classList.remove('hidden');
    document.getElementById('finalScore').textContent = `Score: ${score}`;
    document.getElementById('newRecord').classList.add('hidden');
    document.getElementById('nameOverlay').classList.add('hidden');
    if (isNewRecord && score > 0) {
      document.getElementById('newRecord').classList.remove('hidden');
      setTimeout(() => this.askName(score), 800);
    }
  }

  askName(score) {
    const game = this.currentGame;
    if (!game) return;
    this.pendingScore = { game, score };
    const overlay = document.getElementById('nameOverlay');
    const input = document.getElementById('nameInput');
    overlay.classList.remove('hidden');
    if (this.playerName) {
      input.value = this.playerName;
    } else {
      input.value = '';
    }
    setTimeout(() => input.focus(), 100);
  }

  submitHighScore(name) {
    if (!this.pendingScore) return;
    name = name.slice(0, 12) || 'Anonymous';
    this.playerName = name;
    try { localStorage.setItem('mgc_name', name); } catch {}
    this.fb.submitScore(this.pendingScore.game, name, this.pendingScore.score);
    document.getElementById('nameOverlay').classList.add('hidden');
    this.pendingScore = null;
  }

  updateControlsHint(game) {
    const hints = {
      dino: 'Space / ↑ : ジャンプ  |  ↓ : しゃがむ',
      flappy: 'Space / タップ : 羽ばたく',
      cave: 'Space / ↑ : ジャンプ  |  ↓ : しゃがむ',
      tetris: '← → : 移動  |  ↑ : 回転  |  ↓ : 落下  |  Space : 一気に落下',
      snake: '← ↑ → ↓ / WASD : 移動',
      breakout: '← → / マウス : 移動',
      game2048: '← ↑ → ↓ / WASD : スライド'
    };
    document.getElementById('controlsHint').textContent = hints[game] || '';
  }

  setupDpad() {
    document.querySelectorAll('#dpad .dpad-btn').forEach(btn => {
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const key = btn.dataset.key;
        if (this.currentGame) {
          const game = this.games[this.currentGame];
          if (!game.started && game.startGame) {
            game.startGame();
          } else {
            window.dispatchEvent(new KeyboardEvent('keydown', { code: key, key: key }));
          }
        }
      };
      btn.addEventListener('touchstart', handler, { passive: false });
      btn.addEventListener('mousedown', handler);
    });
  }

  setupUpdateBtn() {
    document.getElementById('updateBtn').addEventListener('click', () => {
      if ('serviceWorker' in navigator) {
        caches.keys().then(names => Promise.all(names.map(n => caches.delete(n)))).then(() => {
          navigator.serviceWorker.getRegistrations().then(regs => {
            regs.forEach(r => r.unregister());
          }).then(() => location.reload(true));
        });
      } else {
        location.reload();
      }
    });
  }

  updateDpad(game) {
    const needs = { tetris: true, snake: true, game2048: true };
    const dpad = document.getElementById('dpad');
    dpad.classList.toggle('hidden', !needs[game]);
    document.getElementById('dpadExtra').classList.toggle('hidden', game !== 'tetris');
  }

  updateScoreDisplay(score) {
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
  }

  recordScore(game, score) {
    if (score > (this.scores[game] || 0)) {
      this.scores[game] = score;
      this.saveScores();
      this.updateHighScoreLabels();
      return true;
    }
    return false;
  }

  async loadLeaderboard() {
    const container = document.getElementById('leaderboard');
    if (!container) return;
    const games = ['dino','flappy','cave','tetris','snake','breakout','game2048'];
    const names = ['Dino Runner','Flappy Bird','Cave Runner','Tetris','Snake','Breakout','2048'];
    let html = '';
    for (const g of games) {
      const scores = await this.fb.getTopScores(g, 3);
      if (scores.length === 0) continue;
      html += `<div class="lb-section"><div class="lb-title">${names[games.indexOf(g)]}</div>`;
      scores.forEach((s, i) => {
        html += `<div class="lb-row"><span class="lb-rank">${i + 1}</span><span class="lb-name">${this.esc(s.name)}</span><span class="lb-score">${s.score}</span></div>`;
      });
      html += '</div>';
    }
    container.innerHTML = html || '<div class="lb-empty">まだスコアがありません</div>';
  }

  esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}
