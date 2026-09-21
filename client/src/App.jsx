import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import Feed from "./pages/Feed.jsx";
import Profile from "./pages/Profile.jsx";

function initials(name) {
  if (!name) return "";
  return name.slice(0, 2).toUpperCase();
}

function NavBar({ user }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

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

      <div>
        {user ? (
          <div className="nav-avatar">
            <span className="avatar-circle">{initials(user.username)}</span>
            @{user.username}
          </div>
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
      <NavBar user={user} />

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
