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
     * @returns {Promise<boolean>} - returns true if action was successful
     */
    async addToQueue(playerId, skillLevel, username, categoryId) {
        try {
            const playerKey = `player:${playerId}`;
            const categoryQueueKey = `matchmaking:queue:${categoryId}`; // Per-category queue

            // Store player data
            await this.client.hSet(this.PLAYER_DATA_KEY, playerKey, JSON.stringify({
                username,
                skillLevel,
                categoryId,
                joinedAt: Date.now()
            }));

            // Add to the category-specific Sorted Set
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

            const { category } = playerData;
            const categoryQueueKey = `matchmaking:queue:${category}`;

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
            const maxSkillDifference = 100;
            const maxWaitTime = 10000;
            const playerKey = `player:${playerId}`;
            const playerData = JSON.parse(await this.client.hGet(this.PLAYER_DATA_KEY, playerKey));

            // Remove player if playerData is empty
            if (!playerData) {
                await this.removeFromQueue(playerId);
                console.log("Error with playerData");
                return null;
            }

            const { skillLevel, categoryId, joinedAt } = playerData;
            const currentTime = Date.now();
            const timeWaiting = currentTime - joinedAt;

            // Dynamic skill - increase skill difference
            const dynamicTolerance = Math.min(
                maxSkillDifference * 2,
                maxSkillDifference + Math.floor(timeWaiting / 5000) * 20
            );

            // Search in the player's category queue
            const categoryQueueKey = `matchmaking:queue:${categoryId}`;
            const potentialMatches = await this.client.zRangeByScore(
                categoryQueueKey,
                skillLevel - dynamicTolerance,
                skillLevel + dynamicTolerance,
                { LIMIT: { offset: 0, count: 10 } }
            );

            // Filter out self and invalid players
            const opponents = await Promise.all(
                potentialMatches
                    .filter(key => key !== playerKey)
                    .map(async key => ({
                        key,
                        data: JSON.parse(await this.client.hGet(this.PLAYER_DATA_KEY, key))
                    }))
            );

            // Sort by closest skill match and limit to 5
            const bestMatches = opponents
                .filter(opp => opp.data)
                .sort((a, b) => Math.abs(a.data.skillLevel - skillLevel) - Math.abs(b.data.skillLevel - skillLevel))
                .slice(0, 5)
                .map(match => ({
                    id: match.key.replace('player:', ''),
                    username: match.data.username
                }));

            // If matches are found, return them
            if (bestMatches.length > 0) { return bestMatches; }

            // If no match found, wait and try again
            const timeElapsed = currentTime - joinedAt;
            const remainingWaitTime = maxWaitTime - timeElapsed;

            if (remainingWaitTime > 0) {
                const retryDelay = Math.min(remainingWaitTime, 5000);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return this.findMatch(playerId);
            }

            // If maxWaitTime has passed and still no match, return null
            await this.removeFromQueue(playerId);
            return null;
        } catch (error) {
            console.error('Error finding match:', error);
            return null;
        }
    }

}

const matchmakingService = new MatchmakingService();
export default matchmakingService;