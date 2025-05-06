import { useState } from "react";
import { Link, useNavigate } from "react-router";
import supabase from "../config/supabaseClient"

function SignUp() {
    const [userData, setUserData] = useState({
        username: "",
        email: "",
        password: ""
    });

    localStorage.clear();

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

        if (userData.username.trim() === "")
            allErrors += "Username cannot be empty.\n";

        if (allErrors == "Errors:\n ")
            handleSignup()
        else {
            alert(allErrors);
            return;
        }
    };

    async function handleSignup() {
        try {
            const { count: usernameCount } = await supabase
                .from('players')
                .select('*', { count: 'exact', head: true })
                .eq('username', userData.username,)
                .single();

            if (usernameCount > 0) throw new Error('Username already taken');

            const { count: emailCount } = await supabase
                .from('players')
                .select('*', { count: 'exact', head: true })
                .eq('email', userData.email);

            if (emailCount > 0) throw new Error('Email already registered');

            const { data: data, error: playerError } = await supabase
                .from('players')
                .insert({
                    username: userData.username,
                    email: userData.email,
                    password: userData.password
                })
                .select('id, skill_level')
                .single();

            if (playerError) { throw new Error("Failed to create profile: " + playerError.message); }

            localStorage.setItem('user', JSON.stringify({
                id: data.id,
                skill_level: data.skill_level

            }));
            navigate('/lobby');
        }

        catch (error) { alert(error) }

    }




    return (
        <form className="registration_container">
            <h1>Sign up</h1>
            <p>Welcome to The Big Brain Theory!</p>

            <input type="text" placeholder="Email" name="email"
                value={userData.email}
                onChange={changeUserData} />

            <input type="text" placeholder="Username" name="username"
                value={userData.username}
                onChange={changeUserData} />

            <input type="password" placeholder="Password" name="password"
                value={userData.password}
                onChange={changeUserData} />

            <button onClick={validateData}>Sign up</button>

            <p>If you already have an account, log in!</p>
            <Link to="/login">
                <button>Log in</button>
            </Link>
        </form>
    )
}

export default SignUp
