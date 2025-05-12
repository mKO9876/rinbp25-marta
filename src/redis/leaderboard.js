import redisClient from './config.js';

class LeaderboardService {
    constructor() {
        this.client = redisClient;
    }

    /**
     * Initialize a new match leaderboard with all players at 0 points
     * @param {string} gameId 
     * @param {Array} players - Array of player objects with id, username, and skill_level
     * @param {string} playerId
     * @param {string} playerUsername
    * @returns {Promise<boolean>}
     */
    async initMatchLeaderboard(gameId, players) {
        try {
            const leaderboardKey = `match:${gameId}:leaderboard`;
            const playersArray = Array.isArray(players) ? players : [players];

            if (!playersArray.length) {
                throw new Error('No players provided for leaderboard');
            }

            const multi = this.client.multi();

            multi.del(leaderboardKey);

            playersArray.forEach(player => {
                const playerId = String(player.id);
                const playerUsername = String(player.username);
                multi.hSet(
                    'leaderboard:player_info',
                    playerId,
                    playerUsername
                );
                multi.zAdd(
                    leaderboardKey,
                    { value: playerId, score: 0 }
                );
            });

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
        const players = await this.client.sendCommand(['ZREVRANGE', `${leaderboardKey}`, '0', '-1', 'WITHSCORES']);

        return players
    }
}

const leaderboardService = new LeaderboardService();
export default leaderboardService;