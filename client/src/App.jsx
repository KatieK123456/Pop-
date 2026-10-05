import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import Feed from "./pages/Feed.jsx";
import Profile from "./pages/Profile.jsx";

function initials(name) {
  if (!name) return "";
  return name.slice(0, 2).toUpperCase();
}

function NavBar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  function handleLogout() {
    onLogout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <div>
        <p className="pop-logo">POP!</p>
        <p className="pop-logo-sub">DePauw University</p>
      </div>

      <div className="nav-links">
        <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
        Home
        </Link>
        <Link to="/new-listing" className={`nav-link ${isActive("/new-listing") ? "active" : ""}`}>
          ⊕ Post
        </Link>
        <Link to="/profile" className={`nav-link ${isActive("/profile") ? "active" : ""}`}>
        Profile
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {user ? (
          <>
            <div className="nav-avatar">
              <span className="avatar-circle">{initials(user.username)}</span>
              @{user.username}
            </div>
            <button onClick={handleLogout} className="btn-outline" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>
              Log out
            </button>
          </>
        ) : (
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="nav-link">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <NavBar user={user} onLogout={() => setUser(null)} />

      <div className="page-wrap">
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/signup" element={<Signup onSignup={setUser} />} />
          <Route path="/login" element={<Login onLogin={setUser} />} />
          <Route
            path="/profile"
            element={user ? <Profile user={user} /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
