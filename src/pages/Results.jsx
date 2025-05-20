import { useEffect, useState } from "react";
import { Link } from "react-router";
import supabase from "../config/supabaseClient";

function Results() {
    const game = JSON.parse(localStorage.getItem("game"));
    const user = JSON.parse(localStorage.getItem("user"));
    const [scoreMultiplier, setScoreMultiplier] = useState(1);
    const [leaderboard, setLeaderboard] = useState([]);
    const [correctAnswers, setCorrectAnswers] = useState(0)

    useEffect(() => {
        if (!game || !user) return;

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

                setScoreMultiplier(difficulty.score);
                console.log("game id: ", game.id)
                const response = await fetch('http://localhost:3001/show-leaderboard', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        gameId: game.id
                    })
                });

                let data = await response.json()

                if (data.length <= 2) {
                    const { error: playerError } = await supabase
                        .from('players')
                        .update({ skill_level: scoreMultiplier + user.skill_level })
                        .eq('id', user.id);

                    if (playerError) throw playerError;
                }
                else if (user.skill_level > 0) {
                    const { error: playerError } = await supabase
                        .from('players')
                        .update({ skill_level: user.skill_level - scoreMultiplier })
                        .eq('id', user.id);

                    if (playerError) throw playerError;
                }

                // Pronađi korisnikov rezultat
                const userResult = data.find(player => player.username === user.username);
                if (userResult) {
                    setCorrectAnswers(userResult.score);
                }

                // Postavi leaderboard direktno iz novog formata podataka
                setLeaderboard(data);

            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);



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
            <Link to="/lobby"><button>Go to lobby</button></Link>
        </div>
    );
}

export default Results;