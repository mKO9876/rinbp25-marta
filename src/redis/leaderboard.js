import redisClient from './config.js';

class LeaderboardService {
    constructor() {
        this.client = redisClient;
    }

    /**
     * Check if leaderboard exists for a game
     * @param {string} gameId 
     * @returns {Promise<boolean>}
     */
    async leaderboardExists(gameId) {
        try {
            const leaderboardKey = `game:${gameId}:leaderboard`;
            const exists = await this.client.exists(leaderboardKey);
            return exists === 1;
        } catch (error) {
            console.error('Error checking leaderboard existence:', error);
            return false;
        }
    }


    /**
 * Return the winner of the game
 * @param {string} gameId 
 * @returns {Promise<boolean>}
 */
    async returnWinner(gameId) {
        const leaderboardKey = `game:${gameId}:leaderboard`;

        try {
            // Check if leaderboard exists and has players
            const leaderboardSize = await this.client.zCard(leaderboardKey);

            if (leaderboardSize === 0) {
                console.warn(`Leaderboard empty for game ${gameId}`);
                return null;  // Explicitly return null instead of throwing
            }

            // Get top player
            const topPlayers = await this.client.zRange(
                leaderboardKey,
                0, 0,  // Get first-ranked player
                { REV: true, WITHSCORES: true }
            );

            return topPlayers[0];  // Return playerId

        } catch (error) {
            console.error(`Error determining winner for game ${gameId}:`, error);
            throw new Error('Failed to determine winner');
        }
    }

    /**
     * Initialize a new match leaderboard with all players at 0 points
     * @param {string} gameId 
     * @param {Array} players - Array of player objects with id, username, and skill_level
     * @returns {Promise<boolean>}
     */
    async initMatchLeaderboard(gameId, players) {
        try {
            // Prvo provjeri postoji li već leaderboard
            const exists = await this.leaderboardExists(gameId);
            if (exists) {
                console.log(`Leaderboard for game ${gameId} already exists, skipping initialization`);
                return true;
            }

            const leaderboardKey = `game:${gameId}:leaderboard`;
            const playersArray = Object.entries(players);

            if (!playersArray.length) {
                throw new Error('No players provided for leaderboard');
            }

            const multi = this.client.multi();

            multi.del(leaderboardKey);

            playersArray.forEach(([playerId, playerUsername]) => {
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
            console.log(`Successfully initialized leaderboard for game ${gameId}`);
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
        const leaderboardKey = `game:${gameId}:leaderboard`;
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
        const leaderboardKey = `game:${gameId}:leaderboard`;
        const players = await this.client.sendCommand(['ZREVRANGE', `${leaderboardKey}`, '0', '-1', 'WITHSCORES']);

        // Transformiraj rezultate u format [username, score]
        const formattedLeaderboard = [];
        for (let i = 0; i < players.length; i += 2) {
            const playerId = players[i];
            const score = players[i + 1];
            const username = await this.client.hGet('leaderboard:player_info', playerId);
            formattedLeaderboard.push([username, score]);
        }

        return formattedLeaderboard;
    }

    /**
 * Get match leaderboard with player info
 * @param {string} gameId 
 * @returns {Promise<Array>} Sorted leaderboard
 */

    async deleteLeaderboard(gameId) {
        if (!await this.leaderboardExists(gameId)) {
            console.log('Leaderboard not found');
            return true;
        }

        const leaderboardKey = `game:${gameId}:leaderboard`;

        try {
            // 1. First get all player IDs from the sorted set
            const playerIds = await this.client.zRange(leaderboardKey, 0, -1);

            // 2. Start a transaction for atomic deletion
            const multi = this.client.multi();

            // Delete the leaderboard sorted set
            multi.del(leaderboardKey);

            // Delete each player's info from the hash
            playerIds.forEach(playerId => {
                multi.hDel('leaderboard:player_info', playerId);
            });

            // Execute all commands atomically
            const results = await multi.exec();

            console.log(`Deleted leaderboard ${leaderboardKey} and ${playerIds.length} player entries`);
            return {
                success: results[0] === 1,  // First result is from DEL command
                playersRemoved: playerIds.length
            };
        } catch (err) {
            console.error('Redis error:', err);
            throw new Error('Failed to delete leaderboard');
        }
    }
}


const leaderboardService = new LeaderboardService();
export default leaderboardService;