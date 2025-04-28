import redisClient from './config.js';

class MatchmakingService {
    constructor() {
        this.client = redisClient;
    }

    // Dodaj igrača u red za čekanje
    async addToQueue(playerId, skillLevel) {
        await this.client.hSet('matchmaking_queue', playerId.toString(), skillLevel);
    }

    // Ukloni igrača iz reda za čekanje
    async removeFromQueue(playerId) {
        await this.client.hDel('matchmaking_queue', playerId.toString());
    }

    // Dohvati sve igrače u redu za čekanje
    async getQueue() {
        return await this.client.hGetAll('matchmaking_queue');
    }

    // Pronađi odgovarajućeg protivnika
    async findMatch(playerId, skillLevel, maxSkillDifference = 100) {
        const queue = await this.getQueue();
        const players = Object.entries(queue)
            .filter(([id, level]) => id !== playerId.toString())
            .map(([id, level]) => ({
                id,
                skillLevel: parseInt(level)
            }));

        return players.find(player =>
            Math.abs(player.skillLevel - skillLevel) <= maxSkillDifference
        );
    }
}

export default new MatchmakingService(); 