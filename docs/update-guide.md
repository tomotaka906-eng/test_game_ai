# 更新手順書

このドキュメントでは、アプリの更新・修正からデプロイまでの手順を説明します。

---

## 1. 開発環境

- **OS**: Windows
- **Node.js**: 必須 (Firebase CLI 用)
- **Git**: バージョン管理用

### 初期セットアップ

```bash
# Firebase CLI インストール (初回のみ)
npm install -g firebase-tools

# Firebase ログイン (初回のみ)
firebase login

# リポジトリクローン
git clone https://github.com/tomotaka906-eng/test_game_ai.git
cd test_game_ai
```

---

## 2. 更新作業フロー

### 2.1 コード修正

```bash
# 最新のコードを取得
git pull

# 修正作業 (CSS/JS/HTML)
# ... ファイルを編集 ...
```

### 2.2 ローカル確認

```bash
# 任意の HTTP サーバーで起動して動作確認
npx serve .
# → http://localhost:5000 でアクセス
```

または直接 `index.html` をブラウザで開く (Service Worker は一部制限あり)。

### 2.3 コミット

```bash
git add -A
git commit -m "変更内容を簡潔に"
```

---

## 3. デプロイ

### GitHub Pages (自動)

GitHub の main ブランチにプッシュすると、GitHub Actions または GitHub Pages 設定により自動デプロイされます。

```bash
git push
# → https://tomotaka906-eng.github.io/test_game_ai/ に反映 (数分)
```

### Firebase Hosting (手動)

Firebase CLI を使って手動デプロイします。GitHub Pages と別に HTTPS カスタムドメイン等が必要な場合に使用。

```bash
firebase deploy --only hosting
# → https://test-game-ai.web.app に反映
```

---

## 4. Service Worker / キャッシュ注意点

アプリアップデート時、Service Worker のキャッシュ戦略によりユーザーが即座に新しいバージョンを取得できない場合があります。

### キャッシュ管理の仕組み

- `sw.js` の `CACHE_NAME` でキャッシュバージョンを管理 (例: `mgc-v2`)
- `CACHE_NAME` を変更すると新しい Service Worker がインストールされ、古いキャッシュは破棄される
- 新しい Service Worker がインストールされると、アプリ内で更新トーストが表示される

### Service Worker 更新時の注意

以下いずれかを変更しないと、ユーザーが新しいバージョンを取得できません:

1. `sw.js` 内の `CACHE_NAME` のバージョン番号を上げる
2. `sw.js` そのものを変更する (バイト単位で差分が必要)
3. アセットファイル名を変更する

**推奨手順:**

```javascript
// sw.js の先頭部分
const CACHE_NAME = 'mgc-v3';  // ← デプロイ時に v2→v3 に変更
```

### 更新ボタン

ヘッダーの ↻ ボタンは以下を実行:
1. すべてのキャッシュストレージを削除
2. Service Worker を登録解除
3. ページを強制リロード (`location.reload(true)`)

---

## 5. Firebase 関連

### スコアデータ構造

Firebase Realtime Database のパス構造:

```
/test_game_ai/
  └── scores/
      ├── dino/
      │   ├── {pushId}: { name: "Player", score: 100 }
      │   └── ...
      ├── flappy/
      ├── cave/
      ├── tetris/
      ├── snake/
      ├── breakout/
      └── game2048/
```

### Firebase 設定 (js/firebase-config.js)

```javascript
const FIREBASE_CONFIG = {
  projectId: 'test-game-ai',
  // ...
};
```

### Firebase ルール (firebase.json)

```json
{
  "hosting": {
    "public": ".",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  }
}
```

---

## 6. トラブルシューティング

### 更新が反映されない

1. ブラウザのキャッシュをクリア → ページをリロード
2. ヘッダーの ↻ ボタンをタップ (キャッシュ全削除)
3. Chrome DevTools → Application → Clear storage → Clear site data
4. Service Worker が古い場合は `sw.js` の `CACHE_NAME` を変更

### デプロイに失敗する

```bash
# Firebase デプロイエラー時
firebase login --reauth
firebase deploy --only hosting
```

### ローカルで Service Worker が動かない

`file://` プロトコルでは Service Worker は動作しません。`npx serve` など HTTP サーバーを使用してください。
