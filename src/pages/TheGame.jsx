import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../config/supabaseClient";

function Game() {
    const game = JSON.parse(localStorage.getItem("game"));
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    const [questionList, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);

    useEffect(() => {
        if (!game) {
            navigate("/login");
            return;
        }

        const fetchQuestionList = async () => {
            try {
                console.log("game: ", game.id)
                const { data: questions, error: error } = await supabase
                    .from("game_questions")
                    .select("question_id")
                    .eq("game_id", game.id);

                if (error) throw error;
                console.log("data: ", questions)
                const questionIds = questions.map((item) => item.question_id);
                setQuestions(questionIds);

            } catch (err) {
                console.error("Error fetching questions:", err);
            }
        };

        fetchQuestionList();
    }, []);


    useEffect(() => {
        if (questionList.length === 0) return;

        const fetchQuestionData = async () => {
            const { data: gameData, error: gameError } = await supabase
                .from("games")
                .select("current_question_id")
                .eq("id", game.id)
                .single()

            if (gameError) throw Error(gameError)

            let questionId;
            if (gameData.current_question_id != null) {
                questionId = gameData.current_question_id
                const foundIndex = questionList.findIndex(id => id === questionId);

                if (foundIndex !== -1) setCurrentQuestionIndex(foundIndex);
            }

            else questionId = questionList[currentQuestionIndex];

            try {
                const { data: questionData, error } = await supabase
                    .from("questions")
                    .select("question, correct_answer, incorrect_answers")
                    .eq("id", questionId)
                    .single();

                if (error) throw error;

                setCurrentQuestion(questionData.question);
                const shuffledAnswers = [questionData.correct_answer, ...questionData.incorrect_answers]
                    .sort(() => Math.random() - 0.5);
                setAnswers(shuffledAnswers);
            } catch (err) {
                console.error("Error fetching question data:", err);
            }
        };

        fetchQuestionData();
    }, [questionList, currentQuestionIndex]);

    async function checkUserChoice() {
        const questionId = questionList[currentQuestionIndex];

        try {
            const { error: insertError } = await supabase
                .from("games_players_questions")
                .upsert({
                    game_id: game.id,
                    player_id: user.id,
                    question_id: questionId,
                    answer: selectedAnswer,
                })

            if (insertError) { throw insertError; }

            const { data: result, error: error } = await supabase
                .from("games_players_questions")
                .select("is_correct")
                .eq("game_id", game.id)
                .eq("player_id", user.id)
                .eq("question_id", questionId)
                .single()

            if (error) throw error;

            if (result.is_correct) {
                console.log("i am correct")
                await fetch('http://localhost:3001/add-points', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        gameId: game.id,
                        playerId: user.id
                    })
                });
            }


        } catch (err) {
            console.error("Error saving answer:", err);
        }
    }

    async function goToNextQuestion() {
        await checkUserChoice();

        if (currentQuestionIndex < questionList.length - 1) {
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            setSelectedAnswer(null);

            const { error: error } = await supabase
                .from("games")
                .update({
                    current_question_id: questionList[nextIndex]
                })
                .eq("id", game.id)

            if (error) throw Error(error)

        } else {
            const { error: error } = await supabase
                .from("games")
                .update({
                    status: "ended",
                    current_question_id: null
                })
                .eq("id", game.id)
            if (error) throw Error(error)
            navigate("/results");
        }
    }

    return (
        <div className="game-container">
            <div className="score">
                Question {currentQuestionIndex + 1}/{questionList.length}
            </div>

            <div className="question">
                <h2>{currentQuestion}</h2>
            </div>

            <div className="answers">
                {answers.map((answer) => (
                    <button
                        key={answer}
                        onClick={() => setSelectedAnswer(answer)}
                        style={{
                            backgroundColor: selectedAnswer === answer ? "lightblue" : "white",
                        }}
                    >
                        {answer}
                    </button>
                ))}
            </div>

            <button id="nextButton" onClick={goToNextQuestion} disabled={!selectedAnswer}>
                Next
            </button>
        </div>
    );
}

export default Game;