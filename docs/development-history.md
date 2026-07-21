# 開発履歴

## 概要

オフライン対応 PWA ミニゲームコレクション。ブラウザ/スマホで動作し、Firebase Realtime Database によるスコア共有機能を持つ。

- 公開 URL (GitHub Pages): https://tomotaka906-eng.github.io/test_game_ai/
- 公開 URL (Firebase Hosting): https://test-game-ai.web.app
- リポジトリ: https://github.com/tomotaka906-eng/test_game_ai

---

## 開発の流れ

### Phase 1: 初期構築 (3ゲーム + PWA)

| 日付 | 内容 |
|------|------|
| Initial | 初回コミット。Dino Runner, Flappy Bird, Cave Runner の 3 ゲーム実装 |
| | Service Worker + manifest.json により PWA オフライン対応 |
| | メニュー選択 → ゲームプレイ → スコア表示 の基本フロー |

### Phase 2: 機能拡張

| コミット | 内容 |
|----------|------|
| `3a60803` | **Tetris 追加** - 7-bag ランダマイザー、ゴーストピース、NEXT プレビュー、壁蹴り、ロックディレイ |
| `ce4f282` | **Firebase スコア共有** - グローバルリーダーボード、名前入力、localStorage フォールバック |
| `1541e81`, `ca747af` | **Firebase Hosting 設定** |
| `837de6a` | **コントロールヒント** - 各ゲームに操作方法表示、名前保存の永続化 |
| `cafe012` | **3 ゲーム追加** - Snake, Breakout, 2048 (全 7 ゲーム) |
| `5738a77` | **D-Pad 追加** - Tetris/Snake/2048 用オンスクリーン矢印ボタン |

### Phase 3: モバイル最適化・バグ修正

| コミット | 内容 |
|----------|------|
| `a7b902a` | **スケーリング修正** - DevicePixelRatio 除去で全機種で統一物理演算 |
| | **タッチ操作改善** - Dino/Cave 上下分割 (上60%ジャンプ/下40%しゃがみ)、Snake/2048/Tetris touchend スワイプ |
| | **Tetris ロックディレイ** - 500ms 猶予、移動/回転でリセット |
| `bf31d80` | **メニュースクロール誤動作修正** - 10px の移動閾値を設定 |
| | **更新ボタン追加** - ヘッダーに ↻ ボタン、キャッシュクリア＋リロード |
| `86b89d2` | **D-Pad 不具合修正** - 未開始時はゲーム開始として扱う,D-pad 非表示ゲームで表示されない |
| | **UI 調整** |

### Phase 4: Service Worker / 更新通知

| コミット | 内容 |
|----------|------|
| `c21a6b1` | **Service Worker 更新** - ネットワークファースト戦略、自動更新トースト通知 |
| | **タッチ処理修正** - 一部ゲームのタッチ入力を window ベースに変更 |
| `50f080d` | **スタート画面タップ不具合修正** - CSS pointer-events:auto でオーバーレイ直接操作可能に |

---

## ゲーム一覧

| ゲーム | 概要 | 操作 |
|--------|------|------|
| Dino Runner | 恐竜がサボテンをジャンプ/しゃがみで回避 | Space/↑ ジャンプ, ↓ しゃがみ |
| Flappy Bird | 鳥をタップで飛ばしパイプを回避 | Space/タップ 羽ばたく |
| Cave Runner | 洞窟内で足場/天井の障害物を回避 | Space/↑ ジャンプ, ↓ しゃがみ |
| Tetris | 7-bag ランダマイザー式テトリス | ←→ 移動, ↑ 回転, ↓ 落下, Space ハードドロップ |
| Snake | 蛇を操作して餌を食べる | ←↑→↓ (WASD) 移動 |
| Breakout | パドルでボールを跳ね返しブロック破壊 | ←→/マウス 移動 |
| 2048 | タイルをスライドして2048を目指す | ←↑→↓ (WASD) スライド |

## 技術スタック

- **フロントエンド**: バニラ JS, Canvas 2D, CSS
- **バックエンド**: Firebase Realtime Database (REST API)
- **インフラ**: GitHub Pages / Firebase Hosting
- **PWA**: Service Worker (ネットワークファースト戦略), manifest.json

## 主要ファイル構成

```
/
├── index.html           # メイン HTML (PWA + 全ゲーム読み込み)
├── manifest.json        # PWA マニフェスト
├── sw.js                # Service Worker (ネットワークファースト)
├── firebase.json        # Firebase Hosting 設定
├── .firebaserc          # Firebase プロジェクト設定
├── css/
│   └── style.css        # 全スタイル
├── js/
│   ├── app.js           # アプリケーション制御 (メニュー, 画面遷移, 更新通知, D-Pad)
│   ├── firebase-config.js  # Firebase 設定
│   ├── firebase-db.js      # Firebase REST API スコア送受信
│   ├── dino.js          # Dino Runner
│   ├── flappy.js        # Flappy Bird
│   ├── cave.js          # Cave Runner
│   ├── tetris.js        # Tetris
│   ├── snake.js         # Snake
│   ├── breakout.js      # Breakout
│   └── game2048.js      # 2048
├── assets/
│   ├── icon.svg
│   └── icon-192.png
└── docs/
    ├── development-history.md
    └── update-guide.md
```
