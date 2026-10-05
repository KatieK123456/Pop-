import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup({ onSignup }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setSuccess(true);
    onSignup(data.user);
    setTimeout(() => navigate("/profile"), 1200);
  }

  return (
    <div className="auth-card">
      <h2>Sign Up for Pop!</h2>
      {success ? (
        <p style={{ color: "#2d7a3e", fontWeight: 600 }}>✅ Account created! Taking you to your profile...</p>
      ) : (
        <>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <input
              className="pop-input"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              className="pop-input"
              placeholder="you@depauw.edu"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="pop-input"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn-coral">Create Account</button>
          </form>
          {error && <p className="error-text">{error}</p>}
        </>
      )}
    </div>
  );
}
