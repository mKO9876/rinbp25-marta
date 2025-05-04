import "dotenv/config";
import express from 'express';
import matchmakingService from "../src/redis/matchmaking.js";
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/join-matchmaking', async (req, res) => {
    const { playerId, skillLevel, categoryId } = req.body;
    await matchmakingService.addToQueue(playerId, skillLevel, categoryId);
    res.send({ message: 'Player added to matchmaking queue' });
});

app.delete('/remove-from-queue', async (req, res) => {
    const { playerId } = req.body;
    await matchmakingService.removeFromQueue(playerId);
    res.send({ message: 'Player removed from matchmaking queue' });
});
app.post('/find-match', async (req, res) => {
    console.log("Find match...")
    const { playerId } = req.body;
    const match = await matchmakingService.findMatch(playerId);
    console.log("match: ", match)
    if (!match) res.status(201).send("No players found")
    else res.status(200).send("OK");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
