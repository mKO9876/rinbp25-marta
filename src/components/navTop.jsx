import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

function NavTop() {
    const location = useLocation();

    const isOnAccountPage = location.pathname === "/account";
    const buttonLabel = isOnAccountPage ? "Lobby" : "Account";
    const targetPath = isOnAccountPage ? "/lobby" : "/account";

    return (
        <div id="nav_top_container">
            <img src={logo} alt="logo" />
            <Link to={targetPath}>
                <button>{buttonLabel}</button>
            </Link>
        </div>
    );
}

export default NavTop;
