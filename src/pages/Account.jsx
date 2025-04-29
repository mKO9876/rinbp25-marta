import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../config/supabaseClient";
import NavTop from "../components/navTop";


function Account() {
    const [user, setUser] = useState({
        username: "",
        created_at: "",
        skill_level: 0
    });

    const [avatar, setAvatar] = useState({
        rank_name: "",
        avatar: "https://api.dicebear.com/9.x/big-smile/svg?seed=Jade&flip=true&backgroundType=solid,gradientLinear&backgroundColor=ffd5dc,ffdfbf"
    });

    const navigate = useNavigate();

    async function fetchData(userData) {
        const { data: playerData, error: fetchError } = await supabase
            .from('players')
            .select('*')
            .eq('id', userData.id)
            .single();

        if (fetchError) throw fetchError;

        const formattedDate = new Date(playerData.created_at).toString().split('T')[0];
        setUser({ username: playerData.username, created_at: formattedDate, skill_level: playerData.skill_level });

        const { data: rank, error: error } = await supabase
            .from('ranks')
            .select('*')
            .lte('min_points', playerData.skill_level)
            .order('min_points', { ascending: false })
            .limit(1)
            .single();

        if (error) throw error;
        setAvatar({ rank_name: rank.name, avatar: rank.avatar_url, })
    }

    useEffect(() => {
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (!userData) {
                navigate("/login");
                return;
            }

            fetchData(userData);

        } catch (err) {
            console.error("Failed to fetch user:", err);
            navigate("/login");
        }
    }, [navigate]);

    return (
        <div id="account_container">
            <NavTop />
            <h1>My Account</h1>
            <div id="account_card">
                <img src={avatar.avatar} alt="" />
                <table>
                    <tbody>
                        <tr>
                            <td>Username:</td>
                            <td>{user.username}</td>
                        </tr>
                        <tr>
                            <td>Created at:</td>
                            <td>{user.created_at}</td>
                        </tr>
                        <tr>
                            <td>Skill level:</td>
                            <td>{avatar.rank_name}</td>
                        </tr>
                    </tbody>
                </table>

            </div>
        </div>
    );
};

export default Account;
