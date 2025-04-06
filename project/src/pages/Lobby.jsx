import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import NavTop from "../components/navTop";

const Lobby = () => {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetch("https://opentdb.com/api_category.php")
            .then((res) => res.json())
            .then((data) => setCategories(data.trivia_categories))
            .catch((err) => console.error("Error fetching categories:", err));
    }, []);

    const handleStart = (mode) => {
        if (!selectedCategory) {
            alert("Please select a category.");
            return;
        }
        navigate(`/game?mode=${mode}&category=${selectedCategory}`);
    };

    return (
        <div id="lobby_container">
            <NavTop />
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
                    <button onClick={() => handleStart("public")} >Play with Friends</button>
                    <button onClick={() => handleStart("private")}>Play Private</button>
                </div>
            </div>
        </div>
    );
};

export default Lobby;
