class App {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.currentGame = null;
    this.games = {};
    this.scores = this.loadScores();
  }

  init() {
    this.updateHighScoreLabels();
    this.setupMenu();
    this.setupBackButton();
    this.setupRestartButton();
    this.setupStartMessage();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  register(name, gameInstance) {
    this.games[name] = gameInstance;
    gameInstance.app = this;
  }

  loadScores() {
    try {
      const data = localStorage.getItem('mgc_scores');
      return data ? JSON.parse(data) : { dino: 0, flappy: 0, cave: 0, tetris: 0 };
    } catch {
      return { dino: 0, flappy: 0, cave: 0, tetris: 0 };
    }
  }

  saveScores() {
    try {
      localStorage.setItem('mgc_scores', JSON.stringify(this.scores));
    } catch {}
  }

  updateHighScoreLabels() {
    document.getElementById('hsDino').textContent = this.scores.dino;
    document.getElementById('hsFlappy').textContent = this.scores.flappy;
    document.getElementById('hsCave').textContent = this.scores.cave;
    document.getElementById('hsTetris').textContent = this.scores.tetris;
  }

  setupMenu() {
    document.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => {
        const game = card.dataset.game;
        this.startGame(game);
      });
      card.addEventListener('touchend', (e) => {
        e.preventDefault();
        const game = card.dataset.game;
        this.startGame(game);
      });
    });
  }

  setupStartMessage() {
    const msg = document.getElementById('startMsg');
    msg.addEventListener('click', () => {
      if (this.currentGame && this.games[this.currentGame].startGame) {
        this.games[this.currentGame].startGame();
      }
    });
    msg.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (this.currentGame && this.games[this.currentGame].startGame) {
        this.games[this.currentGame].startGame();
      }
    });
  }

  setupBackButton() {
    document.getElementById('backBtn').addEventListener('click', () => {
      this.showMenu();
    });
  }

  setupRestartButton() {
    document.getElementById('restartBtn').addEventListener('click', () => {
      this.restartGame();
    });
  }

  resizeCanvas() {
    const container = document.getElementById('gameScreen');
    const header = document.getElementById('gameHeader');
    const headerH = header.offsetHeight;
    const w = container.clientWidth;
    const h = container.clientHeight - headerH;
    this.canvas.width = Math.max(100, Math.floor(w * devicePixelRatio));
    this.canvas.height = Math.max(100, Math.floor(h * devicePixelRatio));
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.imageSmoothingEnabled = false;
  }

  showMenu() {
    if (this.currentGame) {
      this.games[this.currentGame].stop();
      this.currentGame = null;
    }
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('menuScreen').classList.add('active');
    document.getElementById('gameOverlay').querySelectorAll('> div').forEach(d => d.classList.add('hidden'));
  }

  startGame(name) {
    this.currentGame = name;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('gameScreen').classList.add('active');
    document.getElementById('gameTitle').textContent = {
      dino: 'Dino Runner',
      flappy: 'Flappy Bird',
      cave: 'Cave Runner',
      tetris: 'Tetris'
    }[name];
    this.resizeCanvas();
    this.showStartMessage();
    this.games[name].start();
  }

  restartGame() {
    if (this.currentGame) {
      document.getElementById('restartBtn').blur();
      this.games[this.currentGame].restart();
      this.showStartMessage();
    }
  }

  showStartMessage() {
    document.getElementById('gameoverMsg').classList.add('hidden');
    document.getElementById('startMsg').classList.remove('hidden');
  }

  showGameOver(score, isNewRecord) {
    document.getElementById('startMsg').classList.add('hidden');
    document.getElementById('finalScore').textContent = `Score: ${score}`;
    document.getElementById('newRecord').classList.toggle('hidden', !isNewRecord);
    document.getElementById('gameoverMsg').classList.remove('hidden');
  }

  updateScoreDisplay(score) {
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
  }

  recordScore(name, score) {
    if (score > this.scores[name]) {
      this.scores[name] = score;
      this.saveScores();
      this.updateHighScoreLabels();
      return true;
    }
    return false;
  }
}
