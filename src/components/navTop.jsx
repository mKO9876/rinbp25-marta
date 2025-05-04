import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

function NavTop() {
    const location = useLocation();
    const navigate = useNavigate();
    const isOnAccountPage = location.pathname === "/account";
    const buttonLabel = isOnAccountPage ? "Lobby" : "Account";
    const targetPath = isOnAccountPage ? "/lobby" : "/account";

    function logOut() {
        localStorage.clear();
        navigate("/")
    }

    return (
        <div id="nav_top_container">
            <img src={logo} alt="logo" />
            <div>
                <Link to={targetPath}>
                    <button>{buttonLabel}</button>
                </Link>
                <button onClick={logOut}>Log out</button>
            </div>
        </div>
    );
}

export default NavTop;
