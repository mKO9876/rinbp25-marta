import { useState } from "react";
import { Link } from "react-router";

function SignUp() {
    const [userData, setUserData] = useState({
        username: "",
        password: ""
    });

    function changeUserData(event) {
        const { name, value } = event.target;
        setUserData({ ...userData, [name]: value });
    }


    return (
        <form className="registration_container">
            <h1>Sign up</h1>
            <p>Welcome to The Big Brain Theory!</p>

            <input type="text" placeholder="Username" name="username"
                value={userData.username}
                onChange={changeUserData} />
            <input type="password" placeholder="Password" name="password"
                value={userData.password}
                onChange={changeUserData} />

            <Link to="/lobby"><button>Sign up</button></Link>
            <p>If you already have an account, log in!</p>
            <Link to="/login"><button>Log in</button></Link>
        </form>
    )
}

export default SignUp
