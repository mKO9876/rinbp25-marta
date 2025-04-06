import { Link } from "react-router";

import logo from "./assets/logo_2_2.png";
import "./designs/App.css";
import "./designs/index.css";

function App() {
  return (
    <div id="home_container">
      <img src={logo} alt="logo_image" />
      <h2>Only the Biggest Brains Survive.</h2>
      <p>Put your brain to the test—completely free! Challenge yourself with The Big Brain Theory,
        the ultimate trivia game where knowledge is power and every question proves just how sharp you really are.
        Play now, no paywalls, just pure brainy fun!</p>
      <div id='home_button_container'>
        <Link to="/login"><button>Log in</button></Link>
        <Link to="/signup"><button>Sign up</button></Link>
      </div>
    </div>
  )
}

export default App
