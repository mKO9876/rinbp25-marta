import redisClient from './config.js';

class LeaderboardService {
    constructor() {
        this.client = redisClient;
    }

    // Increment player score
    async incrementScore(playerId, points) {
        return await this.client.zIncrBy('leaderboard', points, playerId.toString());
    }

    // Get player data
    async getPlayerInfo(playerId) {
        const data = await this.client.hGet('leaderboard:player_info', playerId.toString());
        return data ? JSON.parse(data) : null;
    }

    // Get top players with full info
    async getTopPlayers(limit = 10) {
        const players = await this.client.zRevRange('leaderboard', 0, limit - 1, 'WITHSCORES');

        return await Promise.all(players.map(async ([playerId, score]) => {
            const info = await this.getPlayerInfo(playerId);
            return {
                playerId,
                score: parseFloat(score),
                rank: await this.client.zRevRank('leaderboard', playerId),
                ...(info || {})
            };
        }));
    }

    // Get players around a specific player (for competitive context)
    async getPlayersAround(playerId, radius = 2) {
        const rank = await this.getPlayerRank(playerId);
        if (rank === null) return null;

        const start = Math.max(0, rank - radius);
        const end = rank + radius;

        const players = await this.client.zRevRange('leaderboard', start, end, 'WITHSCORES');

        return await Promise.all(players.map(async ([id, score]) => ({
            playerId: id,
            score: parseFloat(score),
            rank: await this.client.zRevRank('leaderboard', id),
            ...(await this.getPlayerInfo(id)) || {}
        })));
    }

    // Get player rank (1-based)
    async getPlayerRank(playerId) {
        const rank = await this.client.zRevRank('leaderboard', playerId.toString());
        return rank !== null ? rank + 1 : null;
    }

    // Get player score
    async getPlayerScore(playerId) {
        const score = await this.client.zScore('leaderboard', playerId.toString());
        return score ? parseFloat(score) : null;
    }

    // Reset leaderboard (for testing/seasonal resets)
    async resetLeaderboard() {
        await this.client.del('leaderboard');
    }
}

export default new LeaderboardService();