import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ListingCard from "../components/ListingCard.jsx";

function initials(name) {
  if (!name) return "";
  return name.slice(0, 2).toUpperCase();
}

export default function Profile({ user }) {
  const [tab, setTab] = useState("Listings");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const tabs = ["Listings", "Liked", "My Closet"];

  // Load the right list each time the tab changes, so it is always up to date
  useEffect(() => {
    if (tab === "My Closet") return;
    async function load() {
      setLoading(true);
      setError("");
      const path = tab === "Listings" ? "listings" : "wishlist";
      try {
        const res = await fetch(`/api/users/${user.id}/${path}`);
        const data = await res.json();
        if (!res.ok) setError(data.error);
        else setListings(data.listings);
      } catch (err) {
        setError("Could not reach the server.");
      }
      setLoading(false);
    }
    load();
  }, [tab, user.id]);

  async function handleDelete(listing) {
    const sure = window.confirm(`Delete "${listing.title || listing.category}"? This can't be undone.`);
    if (!sure) return;

    const res = await fetch(`/api/listings/${listing.id}?seller_id=${user.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setListings(listings.filter((l) => l.id !== listing.id));
  }

  async function handleUnlike(listing) {
    const res = await fetch("/api/wishlist/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, listing_id: listing.id }),
    });
    if (res.ok) setListings(listings.filter((l) => l.id !== listing.id));
  }

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

      {tab === "My Closet" ? (
        <p className="page-subtitle">Your past purchases and rentals will show here (coming in Checkpoint 3).</p>
      ) : (
        <>
          {loading && <p>Loading...</p>}
          {error && <p className="error-text">{error}</p>}
          {!loading && !error && listings.length === 0 && (
            <p className="page-subtitle">
              {tab === "Listings"
                ? "You haven't posted anything yet. Click Post to add your first listing."
                : "Nothing saved yet. Tap the heart on a listing in the feed to save it here."}
            </p>
          )}
          <div className="feed-grid">
            {listings.map((l) =>
              tab === "Listings" ? (
                <ListingCard
                  key={l.id}
                  listing={l}
                  showSeller={false}
                  onEdit={() => navigate(`/edit-listing/${l.id}`)}
                  onDelete={handleDelete}
                />
              ) : (
                <ListingCard key={l.id} listing={l} onToggleLike={handleUnlike} />
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
