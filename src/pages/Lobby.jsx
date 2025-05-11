import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../config/supabaseClient";
import NavTop from "../components/navTop";

const Lobby = () => {
    const [fetchError, setFetchError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState();
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const userData = JSON.parse(localStorage.getItem('user'));


    useEffect(() => {
        if (!localStorage.getItem('user')) return;

        if (!userData) {
            navigate("/login");
            return;
        }
        const fetchCategories = async () => {
            try {
                setIsLoading(true);
                const { data, error } = await supabase
                    .from('categories')
                    .select('*')
                    .order('name', { ascending: true });

                if (error) {
                    throw error;
                }

                setCategories(data || []);
                setFetchError(null);
            } catch (error) {
                setFetchError("Could not fetch categories");
                console.error("Fetch error:", error);
                setCategories([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, []);

    async function joinQueue() {
        //Redis
        await fetch('http://localhost:3001/join-matchmaking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerId: userData.id,
                skillLevel: userData.skill_level,
                username: userData.username,
                categoryId: selectedCategory
            })
        });
        findMatch()
    }

    async function findMatch() {
        setIsLoading(true);
        const response = await fetch('http://localhost:3001/find-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: userData.id })
        });

        const { data: difficulty, error: ranksError } = await supabase
            .from('ranks')
            .select('difficulty_id')
            .lte('min_points', userData.skill_level)
            .order('min_points', { ascending: false })
            .limit(1)
            .single();

        if (ranksError) throw ranksError;

        const { data: data, error: gameError } = await supabase
            .from('games')
            .insert({
                category_id: selectedCategory,
                difficulty_id: difficulty.difficulty_id
            })
            .select('id')
            .single();

        if (gameError) throw gameError;

        if (response.status == 201) {
            const res = response.json()
            console.log("res: ", res)
            const playersInMatch = res.players;

            await fetch('http://localhost:3001/init-leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameId: data.id,
                    players: playersInMatch.map(player => ({
                        id: player.id,
                        username: player.username
                    }))
                })
            });
        }
        else {
            await fetch('http://localhost:3001/init-leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameId: data.id,
                    players: { id: userData.id, username: userData.username }
                })
            });
        }


        localStorage.setItem('game', JSON.stringify({ id: data.id }));
        setIsLoading(false);
        navigate(`/game`);
    }

    function handleStart() {

        if (!selectedCategory || selectedCategory == "none") {
            alert("Please select a category.");
            return;
        }

        localStorage.setItem('category', JSON.stringify({
            id: selectedCategory
        }));

        joinQueue();
    };

    return (
        <div id="lobby_container">
            <NavTop />
            {fetchError && <p className="error-message">{fetchError}</p>}
            {isLoading ? (
                <p>Loading, please wait...</p>
            ) : (
                <div id="category_container">
                    <label>Choose Trivia Category:</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="none">Choose category</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>

                    <div id="lobby_button_container">
                        <button onClick={handleStart}>
                            Play
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Lobby;