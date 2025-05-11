import redisClient from './config.js';

class LeaderboardService {
    constructor() {
        this.client = redisClient;
    }

    /**
     * Initialize a new match leaderboard with all players at 0 points
     * @param {string} gameId 
     * @param {Array} players - Array of player objects with id, username, and skill_level
     * @returns {Promise<boolean>}
     */
    async initMatchLeaderboard(gameId, players) {
        try {
            const leaderboardKey = `match:${gameId}:leaderboard`;
            const playersArray = Array.isArray(players) ? players : [players];

            if (!playersArray.length) {
                throw new Error('No players provided for leaderboard');
            }

            // Start a transaction
            const multi = this.client.multi();

            // Delete existing leaderboard
            multi.del(leaderboardKey);

            // Add all players atomically
            playersArray.forEach(player => {
                multi.hSet(
                    'leaderboard:player_info',
                    player.id,
                    JSON.stringify({
                        username: player.username,
                        skill_level: player.skill_level
                    })
                );
                multi.zAdd(
                    leaderboardKey,
                    { score: 0, value: player.id }
                );
            });

            // Execute transaction
            await multi.exec();
            return true;

        } catch (error) {
            console.error('Leaderboard init failed:', error);
            throw error;
        }
    }

    /**
     * Add points to a player in a specific match
     * @param {string} gameId 
     * @param {string} playerId 
     * @param {number} points 
     * @returns {Promise<number>} New score
     */
    async addPoints(gameId, playerId, points) {
        const leaderboardKey = `match:${gameId}:leaderboard`;
        const newScore = await this.client.zIncrBy(
            leaderboardKey,
            points,
            playerId.toString()
        );
        return parseFloat(newScore);
    }

    /**
     * Get match leaderboard with player info
     * @param {string} gameId 
     * @returns {Promise<Array>} Sorted leaderboard
     */
    async getLeaderboard(gameId) {
        const leaderboardKey = `match:${gameId}:leaderboard`;

        const players = await this.client.zRevRange(  // or zrevrange (check your Redis client)
            leaderboardKey,
            0, -1,
            { WITHSCORES: true }
        );

        return Promise.all(players.map(async ([playerId, score]) => {
            const info = await this.client.hGet('leaderboard:player_info', playerId);
            return {
                playerId,
                score: parseFloat(score),
                ...(info ? JSON.parse(info) : {})
            };
        }));
    }
}

const leaderboardService = new LeaderboardService();
export default leaderboardService;