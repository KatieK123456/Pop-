import { useState } from "react";

function initials(name) {
  if (!name) return "";
  return name.slice(0, 2).toUpperCase();
}

export default function Profile({ user }) {
  const [tab, setTab] = useState("Listings");
  const tabs = ["Listings", "Liked", "My Closet"];

  return (
    <div>
      <div className="profile-card">
        <div className="profile-left">
          <span className="avatar-circle large">{initials(user.username)}</span>
          <div>
            <p className="profile-name">{user.username}</p>
            <p className="profile-handle">@{user.username} &middot; {user.email}</p>
            <p className="profile-bio">{user.bio || "Add a bio to let buyers know how to reach you!"}</p>
          </div>
        </div>
        <button className="btn-outline">Edit profile</button>
      </div>

      <div className="profile-tabs">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`profile-tab ${tab === t ? "active" : ""}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ paddingTop: "0.5rem", color: "#7a7a7a", fontSize: "0.9rem" }}>
        {tab === "Listings" && <p>Your active listings will show here.</p>}
        {tab === "Liked" && <p>Your wishlisted items will show here.</p>}
        {tab === "My Closet" && <p>Your past purchases and rentals will show here.</p>}
      </div>
    </div>
  );
}
