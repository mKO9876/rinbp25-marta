import { useState } from "react";
import { Link } from "react-router";
function LogIn() {
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
            <h1>Log in</h1>
            <p>Welcome back!</p>
            <input type="text" placeholder="Username" name="username"
                value={userData.username}
                onChange={changeUserData} />
            <input type="password" placeholder="Password" name="password"
                value={userData.password}
                onChange={changeUserData} />

            <Link to="/lobby"><button>Log in</button></Link>
            <p>If you don't have account, sign up!</p>
            <Link to="/signup"><button>Sign up</button></Link>
        </form>
    )
}

export default LogIn
