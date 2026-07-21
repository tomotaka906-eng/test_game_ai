// 全ゲーム共通のライフサイクル・入力・描画ループを提供する基底クラス
class BaseGame {
  constructor() {
    this.app = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;
    this.running = false;
    this.reset();
  }

  // 各ゲームで状態を初期化する。サブクラスで必ず実装する
  reset() {}

  // canvas / ctx / ハイスコアを app から取り込む
  initCanvas() {
    this.canvas = this.app.canvas;
    this.ctx = this.app.ctx;
    this.highScore = this.app.scores[this.key] || 0;
  }

  hideStartMsg() {
    document.getElementById('startMsg').classList.add('hidden');
  }

  startGame() {
    this.started = true;
    this.hideStartMsg();
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

  // dt (前フレームからの経過ms) と time (高精度タイムスタンプ) を update に渡す
  startLoop() {
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  loop(time) {
    if (!this.running) return;
    const dt = time - this.lastTime;
    this.lastTime = time;
    this.update(dt, time);
    this.render();
    this.animId = requestAnimationFrame((t) => this.loop(t));
  }

  // ゲーム終了時: 記録更新の判定とゲームオーバー表示
  finishGame(score) {
    this.gameOver = true;
    const isNew = this.app.recordScore(this.key, score);
    this.app.showGameOver(score, isNew);
  }
}
