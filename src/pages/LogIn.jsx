import { useState } from "react";
import { Link, useNavigate } from "react-router";
import supabase from "../config/supabaseClient"

function LogIn() {
    const [userData, setUserData] = useState({
        email: "",
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

    async function handleLogin() {
        try {

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: userData.email,
                password: userData.password
            });

            if (authError) {
                console.error('Authentication error:', authError);
                throw new Error(authError.message || 'Login failed');
            }

            const { error: playerError } = await supabase
                .from('players')
                .select('id, username')
                .eq('id', authData.user.id)
                .single();

            if (playerError) {
                console.error('RLS Debug:', {
                    uid: authData.user.id,
                    isAuthenticated: (await supabase.auth.getSession()).data.session !== null
                });
                throw playerError
            }

            localStorage.setItem('user', JSON.stringify({
                id: authData.user.id
            }));

            navigate('/lobby');


        } catch (err) {
            console.error("Login error:", err);
            alert(err.message || "Login failed. Please try again.");
        }
    }

    return (
        <form className="registration_container">
            <h1>Log in</h1>
            <p>Welcome back!</p>
            <input type="text" placeholder="Email" name="email"
                value={userData.email}
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
