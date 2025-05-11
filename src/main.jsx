import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import NoPage from "./pages/NoPage";
import LogIn from "./pages/LogIn";
import SignUp from "./pages/SignUp";
import Lobby from "./pages/Lobby";
import Account from "./pages/Account";
import Game from "./pages/TheGame";
import Results from "./pages/Results.jsx";


const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<LogIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/lobby" element={<Lobby />} />
      <Route path="/account" element={<Account />} />
      <Route path="/game" element={<Game />} />
      <Route path="/results" element={<Results />} />
      <Route path="*" element={<NoPage />} />
    </Routes>
  </BrowserRouter>
);

