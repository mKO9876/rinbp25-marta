import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import supabase from "../config/supabaseClient";
function Game() {

    const navigate = useNavigate();
    useEffect(() => {
        const categ_id = JSON.parse(localStorage.getItem('category'));
        if (!categ_id) {
            navigate("/login");
            return;
        }
    }, [navigate]);
    console.log
    return (<></>)
}
export default Game;