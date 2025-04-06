import logo from "../assets/logo_2.png";
import "../designs/App.css";
import "../designs/index.css";

function HomePage() {
    return (
        <div id="home_container">
            <img src={logo} alt="logo_image" />
            <h2>Only the Biggest Brains Survive.</h2>
            <p>Put your brain to the test—completely free! Challenge yourself with The Big Brain Theory,
                the ultimate trivia game where knowledge is power and every question proves just how sharp you really are.
                Play now, no paywalls, just pure brainy fun!</p>
        </div>
    )
}

export default HomePage
