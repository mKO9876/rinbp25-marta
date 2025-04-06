
import { Link } from "react-router";
import logo from "../assets/logo.png";
function NavTop() {
    return (
        <div id="nav_top_container">
            <img src={logo} alt="logo" />
            <Link to="/account"><button>Account</button></Link>
        </div>
    )
}

export default NavTop
