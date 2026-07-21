if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
const app = new App();
app.register('dino', new DinoGame());
app.register('flappy', new FlappyGame());
app.register('cave', new CaveGame());
app.register('tetris', new TetrisGame());
app.register('snake', new SnakeGame());
app.register('breakout', new BreakoutGame());
app.register('game2048', new Game2048());
app.register('minesweeper', new MinesweeperGame());
app.init();
