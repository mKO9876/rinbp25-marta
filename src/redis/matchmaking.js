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
    async addToQueue(playerId, skillLevel, categoryId) {
        try {
            const playerKey = `player:${playerId}`;
            const categoryQueueKey = `matchmaking:waitingQueue:${categoryId}`;

            await this.client.hSet(this.PLAYER_DATA_KEY, playerKey, JSON.stringify({
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


    async findMatch(playerId, maxWaitTime = 10000) {
        try {
            const playerKey = `player:${playerId}`;
            const playerData = JSON.parse(await this.client.hGet(this.PLAYER_DATA_KEY, playerKey));

            if (!playerData) {
                console.log("Nema podataka za igrača:", playerId);
                return {
                    matchId: null,
                    players: [playerId]
                };
            }

            const { skillLevel, categoryId } = playerData;

            // Provjeri postojeće aktivne utakmice
            const activeMatches = await this.client.hGetAll('active_matches');
            for (const [matchId, matchData] of Object.entries(activeMatches)) {
                const match = JSON.parse(matchData);
                if (match.players.includes(playerId)) {
                    const matchAge = Date.now() - match.timestamp;
                    if (matchAge <= 10000) {
                        return {
                            matchId: matchId,
                            players: match.players
                        };
                    }
                }
            }

            const categoryQueueKey = `matchmaking:waitingQueue:${categoryId}`;
            const queueSize = await this.client.zCard(categoryQueueKey);

            // Ako nema drugih igrača u redu čekanja za ovu kategoriju
            if (queueSize <= 1) {
                // Umjesto da odmah vratimo null, čekamo ostatak vremena
                const remainingWaitTime = maxWaitTime - 1000;
                if (remainingWaitTime > 0) {
                    console.log(`Igrač ${playerId} čeka još ${remainingWaitTime}ms za potencijalne protivnike`);
                    await new Promise(resolve => setTimeout(resolve, Math.min(remainingWaitTime, 2000)));
                    return this.findMatch(playerId, remainingWaitTime);
                }
                return {
                    matchId: null,
                    players: [playerId]
                };
            }

            // Pronađi potencijalne protivnike s istom kategorijom i sličnim skill levelom
            const skillTolerance = Math.max(300, Math.floor(skillLevel * 0.2));
            const potentialMatches = await this.client.zRangeByScore(
                categoryQueueKey,
                skillLevel - skillTolerance,
                skillLevel + skillTolerance,
                { LIMIT: { offset: 0, count: 10 } }
            );

            // Filtriraj i dohvati podatke o protivnicima
            const opponents = await Promise.all(
                potentialMatches
                    .filter(key => key !== playerKey)
                    .map(async key => ({
                        key,
                        data: JSON.parse(await this.client.hGet(this.PLAYER_DATA_KEY, key))
                    }))
            );

            // Filtriraj protivnike koji žele igrati istu kategoriju
            const validOpponents = opponents
                .filter(opp => opp.data && opp.data.categoryId === categoryId)
                .sort((a, b) => Math.abs(a.data.skillLevel - skillLevel) - Math.abs(b.data.skillLevel - skillLevel));

            if (validOpponents.length > 0) {
                const matchedPlayer = validOpponents[0];
                const matchId = [playerId, matchedPlayer.key.replace('player:', '')].sort().join(':');

                // Provjeri postoji li već utakmica
                const existingMatch = await this.client.hGet('active_matches', matchId);
                if (existingMatch) {
                    const matchData = JSON.parse(existingMatch);
                    const matchAge = Date.now() - matchData.timestamp;
                    if (matchAge <= 10000) {
                        return {
                            matchId,
                            players: matchData.players
                        };
                    }
                }

                // Kreiraj novu utakmicu
                await this.client.hSet('active_matches', matchId, JSON.stringify({
                    players: [playerId, matchedPlayer.key.replace('player:', '')],
                    categoryId: categoryId,
                    timestamp: Date.now()
                }));

                // Ukloni igrače iz reda čekanja
                await Promise.all([
                    this.removeFromQueue(playerId),
                    this.removeFromQueue(matchedPlayer.key.replace('player:', ''))
                ]);

                return {
                    matchId,
                    players: [playerId, matchedPlayer.key.replace('player:', '')]
                };
            }

            // Ako nema odgovarajućih protivnika, pokušaj ponovno nakon kratkog čekanja
            const remainingWaitTime = maxWaitTime - 1000;
            if (remainingWaitTime > 0) {
                console.log(`Igrač ${playerId} čeka još ${remainingWaitTime}ms za potencijalne protivnike`);
                const retryDelay = Math.min(remainingWaitTime, 2000);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return this.findMatch(playerId, remainingWaitTime);
            }

            // Ako nema pronađenih utakmica nakon maksimalnog vremena čekanja
            console.log(`Igrač ${playerId} nije pronašao protivnika nakon ${maxWaitTime}ms čekanja`);
            return {
                matchId: null,
                players: [playerId]
            };

        } catch (error) {
            console.error('Greška pri pronalaženju utakmice:', error);
            return {
                matchId: null,
                players: [playerId]
            };
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