import { useState } from "react";
import NavTop from "../components/navTop";

const mockUser = {
    username: "trivia_master",
    email: "user@example.com",
    password: "********"
};

const Account = () => {
    const [user, setUser] = useState(mockUser);
    const [isEditing, setIsEditing] = useState(false);

    const handleChange = (e) => {
        setUser((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSave = () => {
        // You would send this to your backend here
        console.log("Updated user info:", user);
        setIsEditing(false);
    };

    return (
        <div id="account_container">
            <NavTop />
            <h1>My Account</h1>
            <div id="account_card">
                <label>Username</label>
                <input
                    name="username"
                    value={user.username}
                    onChange={handleChange}
                    disabled={!isEditing}
                />

                <label>Password</label>
                <input
                    name="password"
                    type="password"
                    value={user.password}
                    onChange={handleChange}
                    disabled={!isEditing}
                />

                {isEditing ? (
                    <button onClick={handleSave}>
                        Save Changes
                    </button>
                ) : (
                    <button onClick={() => setIsEditing(true)}>
                        Edit Info
                    </button>
                )}
            </div>
        </div>
    );
};

export default Account;
