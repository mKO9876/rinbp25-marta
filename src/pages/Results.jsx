import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
import supabase from "../config/supabaseClient";
function GameResults() {

    function calculateNewRatings(playerRating, result) {
        //calculate new skill level
        return Math.round(result);
    }

    async function updatePlayerRatings() {
        const userData = JSON.parse(localStorage.getItem('user'));
        const { data: player, error } = await supabase
            .from('players')
            .select('id, skill_level')
            .eq('id', userData.id)
            .single();


        const newWinnerRating = calculateNewRatings(player.skill_level, 20);

        await supabase
            .from('players')
            .upsert([{ id: userData.id, skill_level: newWinnerRating }]);
    }

    return (
        <div className="rating-changes">
            {/* {ratingChange && (
                <>
                    <div className="winner">
                        +{ratingChange.winner.change} rating
                    </div>
                    <div className="loser">
                        {ratingChange.loser.change} rating
                    </div>
                </>
            )} */}
        </div>
    );
}

export default GameResults