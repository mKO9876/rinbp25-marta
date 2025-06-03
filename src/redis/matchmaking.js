import redisClient from './config.js';

class MatchmakingService {
    constructor() {
        this.client = redisClient;
        this.QUEUE_KEY = 'matchmaking:queue';
        this.PLAYER_DATA_KEY = 'matchmaking:player_data';
    }

    /**
     * Add player to matchmaking queue with additional metadata
     * @param {string} playerId
     * @param {number} skillLevel
     * @param {string} username
     * @param {string} categoryId
     * @returns {Promise<object|null>} - returns true if action was successful
     */
    async addToQueue(playerId, skillLevel, username, categoryId) {
        try {
            const playerKey = `player:${playerId}`;
            const categoryQueueKey = `matchmaking:waitingQueue:${categoryId}`;

            await this.client.hSet(this.PLAYER_DATA_KEY, playerKey, JSON.stringify({
                username,
                skillLevel,
                categoryId,
                joinedAt: Date.now()
            }));

            await this.client.zAdd(categoryQueueKey, {
                score: skillLevel,
                value: playerKey
            });

            return true;
        } catch (error) {
            console.error('Error adding to queue:', error);
            return false;
        }
    }

    /**
     * Remove player from queue completely
     * @param {string} playerId
     * @returns {Promise<boolean>}
     */
    async removeFromQueue(playerId) {
        try {
            const playerKey = `player:${playerId}`;
            const playerData = JSON.parse(await this.client.hGet(this.PLAYER_DATA_KEY, playerKey));

            if (!playerData) return false;

            const { categoryId } = playerData;
            const categoryQueueKey = `matchmaking:waitingQueue:${categoryId}`;

            await Promise.all([
                this.client.zRem(categoryQueueKey, playerKey),
                this.client.hDel(this.PLAYER_DATA_KEY, playerKey)
            ]);

            return true;
        } catch (error) {
            console.error('Error removing from queue:', error);
            return false;
        }
    }

    /**
     * Find best match for a player
     * @param {string} playerId
     * @returns {Promise<object|null>} - Returns matched player or null
     */


    async findMatch(playerId) {
        try {
            const playerKey = `player:${playerId}`;
            const playerData = JSON.parse(await this.client.hGet(this.PLAYER_DATA_KEY, playerKey));
            const joinedAt = Date.now();

            //check active matches first
            const activeMatches = await matchmakingService.client.hGetAll('active_matches');
            for (const [matchId, matchData] of Object.entries(activeMatches)) {
                const match = JSON.parse(matchData);
                if (match.players.includes(playerId)) {
                    const matchAge = Date.now() - match.timestamp;

                    // If match is less than 10 seconds, confirm it
                    if (matchAge <= 10000) {
                        return {
                            matchId: matchId,
                            players: JSON.parse(matchData).players
                        };
                    }
                }
            }

            if (!playerData) {
                await this.removeFromQueue(playerId);
                console.log("Error with playerData");
                return null;
            }

            const { skillLevel, categoryId } = playerData;
            const fixedTolerance = 300;

            const categoryQueueKey = `matchmaking:waitingQueue:${categoryId}`;
            const potentialMatches = await this.client.zRangeByScore(
                categoryQueueKey,
                skillLevel - fixedTolerance,
                skillLevel + fixedTolerance,
                { LIMIT: { offset: 0, count: 10 } }
            );

            // Avoiding self and invalid users
            const opponents = await Promise.all(
                potentialMatches
                    .filter(key => key !== playerKey)
                    .map(async key => ({
                        key,
                        data: JSON.parse(await this.client.hGet(this.PLAYER_DATA_KEY, key))
                    }))
            );

            // Find players with simmilar skill level
            const bestMatches = opponents
                .filter(opp => opp.data)
                .sort((a, b) => Math.abs(a.data.skillLevel - skillLevel) - Math.abs(b.data.skillLevel - skillLevel))
                .slice(0, 5)
                .map(match => ({
                    id: match.key.replace('player:', ''),
                    username: match.data.username
                }));

            if (bestMatches.length > 0) {
                const matchedPlayer = bestMatches[0];
                const matchId = [playerId, matchedPlayer.id].sort().join(':');

                // Check if it already exists
                const existingMatch = await this.client.hGet('active_matches', matchId);
                if (existingMatch) {
                    const matchData = JSON.parse(existingMatch);
                    const matchAge = Date.now() - matchData.timestamp;

                    // If it is less than 10 seconds
                    if (matchAge <= 10000) {
                        return {
                            matchId,
                            players: [
                                { id: playerId, username: playerData.username },
                                matchedPlayer
                            ]
                        };
                    }
                    return null;
                }

                // Create new match
                await this.client.hSet('active_matches', matchId, JSON.stringify({
                    players: [playerId, matchedPlayer.id],
                    created: false,
                    timestamp: Date.now()
                }));

                // Remove players from waitingQueue
                await Promise.all([
                    this.removeFromQueue(playerId),
                    this.removeFromQueue(matchedPlayer.id)
                ]);

                const players = [playerId, matchedPlayer.id]
                return { matchId, players };
            }

            const timeElapsed = Date.now() - joinedAt;
            const maxWaitTime = 10000;
            const remainingWaitTime = maxWaitTime - timeElapsed;

            if (remainingWaitTime > 0) {
                const retryDelay = Math.min(remainingWaitTime, 5000);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return this.findMatch(playerId);
            }

            await this.removeFromQueue(playerId);
            return null;

        } catch (error) {
            console.error('Error finding match:', error);
            return "ERROR FINDING MATCH";
        }
    }

    /**
     * Delete match from active matches
     * @param {string} matchId - ID of the match to delete
     * @returns {Promise<boolean>} - returns true if match was successfully deleted
     */
    async deleteMatch(matchId) {
        try {
            const deleted = await this.client.hDel('active_matches', matchId);
            return deleted === 1;
        } catch (error) {
            console.error('Error deleting match:', error);
            return false;
        }
    }

}

const matchmakingService = new MatchmakingService();
export default matchmakingService;