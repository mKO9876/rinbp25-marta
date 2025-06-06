import { useEffect, useState } from "react";
import supabase from "../config/supabaseClient";
import { useNavigate } from "react-router-dom";

function Results() {
    const game = JSON.parse(localStorage.getItem("game"));
    const user = JSON.parse(localStorage.getItem("user"));
    const match = JSON.parse(localStorage.getItem("match"));

    const [scoreAdd, setScoreAdd] = useState(1);
    const [leaderboard, setLeaderboard] = useState([]);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const navigate = useNavigate()

    useEffect(() => {
        if (!game || !user || !match) {
            navigate("/login");
            localStorage.clear();
        }

        const fetchData = async () => {
            try {
                const { data: gameData, error: gameError } = await supabase
                    .from("games")
                    .select("difficulty_id")
                    .eq("id", game.id)
                    .single();

                if (gameError) throw gameError;

                const { data: difficulty, error: diffError } = await supabase
                    .from("difficulties")
                    .select("score")
                    .eq("id", gameData.difficulty_id)
                    .single();

                if (diffError) throw diffError;

                setScoreAdd(difficulty.score);

                const response = await fetch('http://localhost:3001/show-leaderboard', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        gameId: game.id
                    })
                });

                let data = await response.json()

                // Pronađi korisnikov rezultat
                const userResult = data.find(player => player.username === user.username);
                if (userResult) setCorrectAnswers(userResult.score);
                setLeaderboard(data);

            } catch (error) { console.error("Error fetching data:", error) }
        };
        fetchData();
    }, []);

    async function gotoLobby() {
        try {
            await fetch('http://localhost:3001/get-winner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameId: game.id,
                    score: scoreAdd

                })
            })

            // Delete leaderboard and match data
            await fetch('http://localhost:3001/delete-leaderboard-and-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameId: game.id,
                    matchId: match.id
                })
            });

            // Clear game data from localStorage
            localStorage.removeItem('game');
            localStorage.removeItem('match');

            // Navigate to lobby
            navigate("/lobby");

        } catch (error) {
            console.error("Error cleaning up game data:", error);
            // Still navigate to lobby even if cleanup fails
            navigate("/lobby");
        }
    }

    async function DeleteMatchLeaderboard() {

    }



    return (
        <div className="game-results">
            <h1>Game Results</h1>

            <div className="score-summary">
                <h2>Your Performance: {correctAnswers} / 10</h2>
            </div>

            <div className="leaderboard">
                <h2>Leaderboard</h2>
                {leaderboard.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Player</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((player) => (
                                <tr key={player.username}>
                                    <td>
                                        {player.username === user.username ? `${player.username} (You)` : player.username}
                                    </td>
                                    <td>{player.score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No leaderboard data available</p>
                )}
            </div>
            <button onClick={gotoLobby}>Go to lobby</button>
        </div>
    );
}

export default Results;