import { useState } from "react";
import { Link, useNavigate } from "react-router";
import supabase from "../config/supabaseClient"

function SignUp() {
    const [userData, setUserData] = useState({
        username: "",
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
        const { data: { user }, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password
        });

        if (error) {
            console.error("Error signing up:", error);
            return;
        }

        const { data, error: playerError } = await supabase
            .rpc('create_player_profile', {
                user_id: user.id,
                username: userData.username
            });

        if (playerError) {
            alert("Failed to create profile: " + playerError.message);
            return;
        }

        console.log("Player profile created:", data);
        navigate('/lobby');
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
