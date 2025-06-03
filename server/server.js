import "dotenv/config";
import express from 'express';
import cors from 'cors';

import { createClient } from '@supabase/supabase-js';

import matchmakingService from "../src/redis/matchmaking.js";
import leaderboardService from "../src/redis/leaderboard.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);


// matchmaking
app.post('/join-matchmaking', async (req, res) => {
    const { playerId, skillLevel, categoryId } = req.body;
    const result = await matchmakingService.addToQueue(playerId, skillLevel, categoryId);

    if (result === false)
        return res.status(500).json({ error: 'Failed to add player to queue' });

    res.status(200).json({ message: 'Player added to matchmaking queue' });
});

app.post('/find-match', async (req, res) => {
    const { playerId, categoryId, difficultyId } = req.body;

    try {
        // 1. Find or create match
        const match = await matchmakingService.findMatch(playerId);
        if (!match) return res.status(200).json('WAITING');

        const { matchId, players } = match;

        // 2. Handle game creation
        const { data: gameExists } = await supabase
            .from('games')
            .select('id')
            .eq('category_id', categoryId)
            .eq('difficulty_id', difficultyId)
            .eq('status', 'waiting')
            .single();

        let gameId;

        if (gameExists != null) {
            gameId = gameExists.id;

            const { data, error: gameError } = await supabase
                .from('games')
                .update({ status: 'active' })
                .eq('id', gameExists.id);

            if (gameError) {
                console.error('Game update error:', gameError);
                return res.status(500).json({ error: gameError.message });
            }
        }

        else {
            const { data: newGame, error } = await supabase
                .from('games')
                .insert({ category_id: categoryId, difficulty_id: difficultyId, status: "waiting" })
                .select('id')
                .single();

            if (error) return res.status(500).json({ error: error.message });
            gameId = newGame.id
        }


        // 3. Add players with RLS bypass (if needed)
        const { error: playersError } = await supabase
            .from('games_players')
            .upsert(
                players.map(p => ({
                    game_id: gameId,
                    player_id: p,
                }))
            );

        if (playersError) { console.error('Player insert failed:', playersError); }

        // 4. Initialize leaderboard with proper data
        try {
            let playerData = {};
            // Use Promise.all to handle async operations properly
            await Promise.all(players.map(async (player) => {
                const data = await fetchUsernames(player);
                playerData[player] = data;
            }));

            await leaderboardService.initMatchLeaderboard(gameId, playerData);
        } catch (leaderboardError) {
            console.error('Non-critical leaderboard error:', leaderboardError);
            // Continue even if leaderboard fails
        }

        // 5. Single response point
        return res.status(201).json(gameId);

    } catch (error) {
        console.error('Matchmaking error:', error);
        if (!res.headersSent) {
            return res.status(500).json({
                error: error.message || 'Matchmaking failed'
            });
        }
    }
});

async function fetchUsernames(player) {
    try {
        const { data, error } = await supabase
            .from('players')
            .select('username')
            .eq('id', player)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return null;
        }
        return data?.username || null;
    } catch (err) {
        console.error('Error fetching username:', err);
        return null;
    }
}


// leaderboard
app.post('/add-points', async (req, res) => {
    try {
        const { gameId, playerId } = req.body;
        const points = 1
        await leaderboardService.addPoints(gameId, playerId, points);
        res.status(200).send("OK");
    } catch (error) {
        console.error('Error adding points:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/show-leaderboard', async (req, res) => {
    try {
        const { gameId } = req.body;
        const data = await leaderboardService.getLeaderboard(gameId);

        // Formatiraj podatke u pregledniji format
        const formattedData = data.map(([username, score]) => ({
            username,
            score: parseFloat(score)
        }));

        res.status(200).json(formattedData);
    } catch (error) {
        console.error('Error getting match leaderboard:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});



app.post("/delete-leaderboard-and-match", async (req, res) => {
    try {
        const { gameId } = req.body;

        if (!gameId) {
            return res.status(400).json({
                success: false,
                error: "Missing gameId"
            });
        }

        // Delete leaderboard
        const leaderboardKey = `match:${gameId}:leaderboard`;
        await leaderboardService.client.del(leaderboardKey);

        // Delete player info for this game
        const players = await leaderboardService.getLeaderboard(gameId);
        for (const [username, _] of players) {
            await leaderboardService.client.hDel('leaderboard:player_info', username);
        }

        res.status(200).json({ success: true, message: "Leaderboard and match data deleted successfully" });
    } catch (error) {
        console.error('Error deleting leaderboard and match:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
