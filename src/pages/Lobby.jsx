import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../config/supabaseClient";
import NavTop from "../components/navTop";

const Lobby = () => {
    const [fetchError, setFetchError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("mix");
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();


    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) {
            navigate("/login");
            return;
        }
    }, [navigate]);

    useEffect(() => {
        if (!localStorage.getItem('user')) return;
        const userData = JSON.parse(localStorage.getItem('user'));
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

    const handleStart = () => {
        if (!selectedCategory) {
            alert("Please select a category.");
            return;
        }
        navigate(`/game&category=${selectedCategory}`);
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
                        <option value="mix">All Categories</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>

                    <div id="lobby_button_container">
                        <button onClick={() => handleStart("public")}>
                            Play
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Lobby;