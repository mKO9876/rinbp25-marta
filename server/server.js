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

    return res.status(200).json({ message: 'Player added to matchmaking queue' });
});

app.post('/find-match', async (req, res) => {
    const { playerId, categoryId, difficultyId } = req.body;

    try {
        // 1. Find or create match
        const match = await matchmakingService.findMatch(playerId);

        // 2. Handle game creation
        const { data: gameExists } = await supabase
            .from('games')
            .select('id')
            .eq('category_id', categoryId)
            .eq('difficulty_id', difficultyId)
            .eq('status', 'waiting')
            .single();

        let gameId;
        console.log("MATCH: ", match)
        const { matchId, players } = match;

        if (gameExists != null) {
            gameId = gameExists.id;

            const { error: gameError } = await supabase
                .from('games')
                .update({ status: 'active' })
                .eq('id', gameExists.id);

            if (gameError) {
                console.error('Game update error:', gameError);
                return res.status(500).json({ error: gameError.message });
            }
        }

        else if (!gameExists || !matchId) {
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

            console.log("PLAYER DATA: ", playerData)

            await leaderboardService.initMatchLeaderboard(gameId, playerData);
        } catch (leaderboardError) {
            console.error('Non-critical leaderboard error:', leaderboardError);
            // Continue even if leaderboard fails
        }

        // 5. Single response point
        return res.status(201).json({ game_id: gameId, match_id: matchId });

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

app.post("/get-winner", async (req, res) => {
    const { gameId, scoreAdd } = req.body;
    const playerId = await leaderboardService.returnWinner(gameId)
    if (playerId) return res.status(200).send("OK")

    const { data: player, error: playerError } = await supabase
        .from('players')
        .select('skill_level')
        .eq('id', playerId)
        .single();

    if (playerError) throw playerError;

    if (!player) throw new Error('Player not found');

    const currentSkill = player.skill_level || 0;
    const newSkill = currentSkill + scoreAdd;

    // 3. Update the player record
    const { error: updateError } = await supabase
        .from('players')
        .update({ skill_level: newSkill })
        .eq('id', playerId);

    if (updateError) throw updateError;

    const { error: updateGPError } = await supabase
        .from('games_players')
        .update('winner', true)
        .eq('player_id', playerId)
        .eq('game_id', gameId)
        .single();

    if (updateGPError) throw updateGPError;

    return res.status(201).send("Updated");
})

app.post("/delete-leaderboard-and-match", async (req, res) => {
    try {
        const { gameId, matchId } = req.body;

        if (!gameId) return res.status(400).json("Missing gameId");
        let matchData = true;
        if (matchId != null) {
            matchData = await matchmakingService.deleteMatch(matchId);
        }
        const leaderboardData = await leaderboardService.deleteLeaderboard(gameId);

        if (matchData && leaderboardData) return res.status(200).send("OK");
        return res.status(500).send("SOMETHING WENT WRONG");

    } catch (error) {
        console.error('Error deleting leaderboard and match:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
