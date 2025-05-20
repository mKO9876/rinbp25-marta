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
app.post('/find-match', async (req, res) => {
    const { playerId, categoryId, difficultyId } = req.body;

    try {
        const match = await matchmakingService.findMatch(playerId);

        if (!match) return res.status(200).send("Waiting for match...");

        const { matchId, players } = match;

        // Check if a game already exists for this match
        const matchDataRaw = await matchmakingService.client.hGet('active_matches', matchId);
        const matchData = JSON.parse(matchDataRaw);

        if (!matchData.created) {
            // Create game
            const { data: game, error } = await supabase
                .from('games')
                .insert({ category_id: categoryId, difficulty_id: difficultyId })
                .select('id')
                .single();

            if (error) return res.status(500).json({ error: error.message });

            // Mark game as created in Redis
            matchData.created = true;
            matchData.gameId = game.id;
            await matchmakingService.client.hSet('active_matches', matchId, JSON.stringify(matchData));

            // Init leaderboard
            await fetch('http://localhost:3001/init-leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameId: game.id,
                    players: players
                })
            });

            return res.status(201).json(game.id);
        }

        // If game already created, return existing gameId
        return res.status(200).json({ gameId: matchData.gameId });

    } catch (error) {
        console.error("Error in /find-match:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


app.post('/join-matchmaking', async (req, res) => {
    const { playerId, skillLevel, username, categoryId } = req.body;
    const ok = await matchmakingService.addToQueue(playerId, skillLevel, username, categoryId);
    if (ok) res.send({ message: 'Player added to matchmaking queue' });
    else res.status(500)
});

app.delete('/remove-from-queue', async (req, res) => {
    const { playerId } = req.body;
    await matchmakingService.removeFromQueue(playerId);
    res.send({ message: 'Player removed from matchmaking queue' });
});


// leaderboard
app.post('/init-leaderboard', async (req, res) => {
    try {
        const { gameId, players } = req.body;

        if (!gameId || !players) {
            return res.status(400).json({
                success: false,
                error: "Missing gameId or players array"
            });
        }

        await leaderboardService.initMatchLeaderboard(gameId, players);
        res.status(201).json({ success: true });

    } catch (error) {
        console.error('Error initializing leaderboard:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

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

// app.post("/delete-leaderboard")


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
