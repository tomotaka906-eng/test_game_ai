class FirebaseDB {
  constructor() {
    this.config = typeof FIREBASE_CONFIG !== 'undefined' ? FIREBASE_CONFIG : null;
    this.enabled = !!this.config;
    this.cache = { dino: [], flappy: [], cave: [], tetris: [] };
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
      if (!res.ok) {
        console.error(`Firebase submitScore failed for "${game}": ${res.status} ${res.statusText}`);
        return false;
      }
      this.cache[game] = [];
      return true;
    } catch (err) {
      console.error(`Firebase submitScore error for "${game}":`, err);
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
      if (!res.ok) {
        console.error(`Firebase getTopScores failed for "${game}": ${res.status} ${res.statusText}`);
        return [];
      }
      const data = await res.json();
      if (!data) return [];
      const list = Object.values(data)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      this.cache[game] = list;
      return list;
    } catch (err) {
      console.error(`Firebase getTopScores error for "${game}":`, err);
      return [];
    }
  }

  clearCache() {
    this.cache = { dino: [], flappy: [], cave: [], tetris: [] };
  }
}
