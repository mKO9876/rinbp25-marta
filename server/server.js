import "dotenv/config";
import express from 'express';
import matchmakingService from "../src/redis/matchmaking.js";
import cors from 'cors';
import leaderboardService from "../src/redis/leaderboard.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());


// matchmaking

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
app.post('/find-match', async (req, res) => {
    const { playerId } = req.body;
    const match = await matchmakingService.findMatch(playerId);
    if (match) res.status(201).json(match)
    else res.status(200).send("OK");
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

        console.log("data: ", data) // you'll need to edit data when there are multiple players
        res.status(200).send(data)
    } catch (error) {
        console.error('Error getting match leaderboard:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// app.post("/delete-leaderboard")


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
