// 各ゲームで共通利用するユーティリティ関数群
const GameUtils = {
  // キャンバスをクリアして単色で塗りつぶす
  clearCanvas(ctx, w, h, bg) {
    ctx.clearRect(0, 0, w, h);
    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
    }
  },

  // AABB (軸平行境界ボックス) の重なり判定
  rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  },

  // 右上に「HI 〇〇 / スコア」を描画する共通HUD
  drawHiScore(ctx, canvasW, color, highScore, score) {
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.floor(14 * (canvasW / 600))}px monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(`HI ${highScore}`, canvasW - 8, 24);
    ctx.fillText(`${score}`, canvasW - 8, 42);
  },

  // 画面座標をキャンバス内部座標へ変換する
  canvasPoint(canvas, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  },

  // スワイプ方向を判定する (しきい値未満は null)
  swipeDir(dx, dy, threshold = 20) {
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return null;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    }
    return dy > 0 ? 'down' : 'up';
  }
};
