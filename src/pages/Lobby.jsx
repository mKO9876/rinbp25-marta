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
        const userData = JSON.parse(localStorage.getItem('user'));
        const { data: player, error } = await supabase
            .from('players')
            .select('skill_level, username')
            .eq('id', userData.id)
            .single();

        if (error || !player) {
            throw new Error('Player data not found');
        }

        //Redis
        await fetch('http://localhost:3001/join-queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerId: userData.id,
                skillLevel: player.skill_level
            })
        });

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
                <p>Loading categories...</p>
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