import "dotenv/config";
import express from 'express';
import matchmakingService from "../src/redis/matchmaking.js";

const app = express();
const PORT = 3001;

app.use(express.json());

app.post('/join-matchmaking', async (req, res) => {
    const { playerId, skillLevel } = req.body;
    await matchmakingService.addToQueue(playerId, skillLevel);
    res.send({ message: 'Player added to matchmaking queue' });
});
app.delete('/remove-from-queue', async (req, res) => {
    const { playerId } = req.body;
    await matchmakingService.removeFromQueue(playerId);
    res.send({ message: 'Player removed from matchmaking queue' });
});
app.post('/find-match', async (req, res) => {
    const { playerId } = req.body;
    const match = await matchmakingService.findMatch(playerId);
    res.send({ match });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
