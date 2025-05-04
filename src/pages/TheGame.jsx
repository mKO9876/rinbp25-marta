import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../config/supabaseClient";
function Game() {

    const game = JSON.parse(localStorage.getItem('game'));
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]); //questions id
    const [answeres, setAnseres] = useState([]);

    useEffect(() => {
        if (!game) navigate("/login");
        const fetchQuestions = async () => {
            try {
                const { data, error } = await supabase
                    .from('game_questions')
                    .select('*')
                    .eq('game_id', game.id);

                if (error) throw error;

                setQuestions(data || []);
            } catch (err) {
                throw Error(err.message);
            }
        };

        fetchQuestions();
    }, [game]);

    function randomizeAnsweres() {

    }

    function fetchAnsweres() {

    }

    return (
        <div>
            <ul>
                <p>Something</p>
                {questions.map(question => (
                    <li key={question.id}>
                        <h3>{question.question_text}</h3>
                        {/* Render other question data as needed */}
                    </li>
                ))}
            </ul>
        </div>
    );
}
export default Game;