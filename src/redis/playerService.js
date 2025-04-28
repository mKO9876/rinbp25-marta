import redisClient from './config.js';
import { supabase } from '../supabase/client.js';

class PlayerService {
    constructor() {
        this.client = redisClient;
    }

    // Spremi podatke igrača u Redis nakon prijave kroz Supabase
    async savePlayerData(supabaseUserId) {
        try {
            // Dohvati podatke igrača iz Supabase
            const { data: player, error } = await supabase
                .from('players')
                .select('*')
                .eq('user_id', supabaseUserId)
                .single();

            if (error) throw error;

            // Spremi podatke u Redis
            await this.client.hSet(`player:${player.id}`, {
                id: player.id,
                username: player.username,
                score: player.score || 0,
                lastLogin: new Date().toISOString()
            });

            return player;
        } catch (error) {
            console.error('Error saving player data:', error);
            throw error;
        }
    }

    // Dohvati podatke igrača iz Redis-a
    async getPlayerData(playerId) {
        const playerData = await this.client.hGetAll(`player:${playerId}`);
        return Object.keys(playerData).length ? playerData : null;
    }

    // Ažuriraj podatke igrača u Redis-u
    async updatePlayerData(playerId, data) {
        await this.client.hSet(`player:${playerId}`, data);
    }

    // Obriši podatke igrača iz Redis-a
    async deletePlayerData(playerId) {
        await this.client.del(`player:${playerId}`);
    }

    // Provjeri postoji li igrač u Redis-u
    async playerExists(playerId) {
        return await this.client.exists(`player:${playerId}`);
    }
}

export default new PlayerService(); 