import { useState } from "react";
import { Link, useNavigate } from "react-router";
import supabase from "../config/supabaseClient"

function LogIn() {
    const [userData, setUserData] = useState({
        username: "",
        password: ""
    });

    const navigate = useNavigate();

    function changeUserData(event) {
        const { name, value } = event.target;
        setUserData({ ...userData, [name]: value });
    }

    const validateData = (event) => {
        event.preventDefault();
        let allErrors = "Errors:\n ";

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email))
            allErrors += "Please enter a valid email address.\n";

        if (userData.password.length < 6)
            allErrors += "Password must be at least 6 characters long.\n";

        if (allErrors == "Errors:\n ")
            handleLogin()
        else {
            alert(allErrors);
            return;
        }
    };

    async function handleLogin(event) {
        event.preventDefault();
        try {
            const { data: { user }, error } = await supabase.auth.signInWithPassword({
                email: userData.email,
                password: userData.password
            });

            if (error) throw error;

            // Verify player exists
            const { error: playerError } = await supabase
                .from('player_players')
                .select()
                .eq('id', user.id)
                .single();

            if (playerError) throw new Error("Player profile not found");

            navigate('/dashboard');

        } catch (err) {
            alert(err.message);
            return;
        }
    }

    return (
        <form className="registration_container">
            <h1>Log in</h1>
            <p>Welcome back!</p>
            <input type="text" placeholder="Username" name="username"
                value={userData.username}
                onChange={changeUserData} />
            <input type="password" placeholder="Password" name="password"
                value={userData.password}
                onChange={changeUserData} />

            <button onClick={validateData}>Log in</button>
            <p>If you don't have account, sign up!</p>
            <Link to="/signup"><button>Sign up</button></Link>
        </form>
    )
}

export default LogIn
