import redisClient from './config.js';

class SessionService {
    constructor() {
        this.client = redisClient;
    }

    // Spremi sesiju igrača
    async saveSession(sessionId, playerId, expiresIn = 86400) { // 24 sata
        await this.client.set(`session:${sessionId}`, playerId.toString(), {
            EX: expiresIn
        });
    }

    // Dohvati ID igrača iz sesije
    async getPlayerId(sessionId) {
        return await this.client.get(`session:${sessionId}`);
    }

    // Obriši sesiju
    async deleteSession(sessionId) {
        await this.client.del(`session:${sessionId}`);
    }

    // Provjeri je li sesija valjana
    async isValidSession(sessionId) {
        return await this.client.exists(`session:${sessionId}`);
    }
}

export default new SessionService(); 