import redisClient from './config.js';

class LeaderboardService {
    constructor() {
        this.client = redisClient;
    }

    // Dodaj bodove igraču
    async addScore(playerId, score) {
        await this.client.zAdd('leaderboard', {
            score: score,
            value: playerId.toString()
        });
    }

    // Dohvati top N igrača
    async getTopPlayers(limit = 10) {
        return await this.client.zRevRange('leaderboard', 0, limit - 1, 'WITHSCORES');
    }

    // Dohvati rang igrača
    async getPlayerRank(playerId) {
        return await this.client.zRevRank('leaderboard', playerId.toString());
    }

    // Dohvati bodove igrača
    async getPlayerScore(playerId) {
        return await this.client.zScore('leaderboard', playerId.toString());
    }
}

export default new LeaderboardService(); 