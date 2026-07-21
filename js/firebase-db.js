class FirebaseDB {
  constructor() {
    this.config = typeof FIREBASE_CONFIG !== 'undefined' ? FIREBASE_CONFIG : null;
    this.enabled = !!this.config;
    this.cache = this.emptyCache();
  }

  emptyCache() {
    return { dino: [], flappy: [], cave: [], tetris: [] };
  }

  get scoresUrl() {
    return `${this.config.databaseURL}/scores`;
  }

  async submitScore(game, name, score) {
    if (!this.enabled) return false;
    try {
      const res = await fetch(`${this.scoresUrl}/${game}.json`, {
        method: 'POST',
        body: JSON.stringify({ name, score, ts: Date.now() })
      });
      this.cache[game] = [];
      return res.ok;
    } catch {
      return false;
    }
  }

  async getTopScores(game, limit = 5) {
    if (!this.enabled) return [];
    if (this.cache[game] && this.cache[game].length > 0) {
      return this.cache[game];
    }
    try {
      const res = await fetch(
        `${this.scoresUrl}/${game}.json?orderBy="score"&limitToLast=${limit}`
      );
      const data = await res.json();
      if (!data) return [];
      const list = Object.values(data)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      this.cache[game] = list;
      return list;
    } catch {
      return [];
    }
  }

  clearCache() {
    this.cache = this.emptyCache();
  }
}
