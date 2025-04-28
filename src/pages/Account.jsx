import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../config/supabaseClient";
import NavTop from "../components/navTop";


function Account() {
    const [user, setUser] = useState({
        username: "",
        created_at: ""
    });
    const navigate = useNavigate();

    async function fetchData(userData) {
        const { data, error: fetchError } = await supabase
            .from('players')
            .select('*')
            .eq('id', userData.id)
            .single();

        if (fetchError) throw fetchError;
        console.log(data)
        const formattedDate = new Date(data.created_at).toISOString().split('T')[0];
        setUser({ username: data.username, created_at: formattedDate })
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
                <label>Username: {user.username}</label>
                <label>Created at: {user.created_at}</label>
            </div>
        </div>
    );
};

export default Account;
