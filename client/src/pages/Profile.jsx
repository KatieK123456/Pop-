import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ListingCard from "../components/ListingCard.jsx";
import { initials, formatDate, formatPrice } from "../format.js";

const TABS = [
  { key: "listings", label: "Listings" },
  { key: "liked", label: "Liked" },
  { key: "closet", label: "My Closet" },
];
const MAX_BIO = 200;

export default function Profile({ user, onUserUpdate }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === searchParams.get("tab")) ? searchParams.get("tab") : "listings";

  const [listings, setListings] = useState([]);
  const [sold, setSold] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(user.bio || "");
  const [bioError, setBioError] = useState("");

  const navigate = useNavigate();
  const open = (l) => navigate(`/listings/${l.id}`);

  // Load the right list each time the tab changes, so it is always up to date
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      setListings([]);
      setSold([]);
      try {
        const path = { listings: "listings", liked: "wishlist", closet: "closet" }[tab];
        const res = await fetch(`/api/users/${user.id}/${path}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setListings(data.listings);

        // On the Listings tab, also show what has already been bought or rented
        if (tab === "listings") {
          const salesRes = await fetch(`/api/users/${user.id}/sales`);
          const salesData = await salesRes.json();
          if (salesRes.ok) setSold(salesData.listings);
        }
      } catch (err) {
        setError(err.message || "Could not reach the server.");
      }
      setLoading(false);
    }
    load();
  }, [tab, user.id]);

  async function handleDelete(listing) {
    const sure = window.confirm(`Delete "${listing.title || listing.category}"? It will be removed from the feed. Anyone who liked it will still see it as Not available.`);
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

  async function saveBio() {
    setBioError("");
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, bio: bioDraft }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBioError(data.error);
      return;
    }
    onUserUpdate(data.user);
    setEditingBio(false);
  }

  const emptyMessage = {
    listings: "You don't have anything for sale or rent right now. Click Post to add a listing.",
    liked: "Nothing saved yet. Tap the heart on a listing in the feed to save it here.",
    closet: "Nothing here yet. Items you buy or rent on Pop will show up in your Closet.",
  }[tab];

  return (
    <div>
      <div className="profile-card">
        <div className="profile-left">
          <span className="avatar-circle large">{initials(user.username)}</span>
          <div>
            <p className="profile-name">{user.username}</p>
            <p className="profile-handle">@{user.username} &middot; {user.email}</p>
            {editingBio ? (
              <div className="bio-editor">
                <textarea
                  className="pop-input"
                  rows={2}
                  maxLength={MAX_BIO}
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value)}
                  placeholder="Tell buyers a little about you, like when you're free to meet."
                />
                <span className="bio-count">{bioDraft.length}/{MAX_BIO}</span>
                {bioError && <p className="error-text">{bioError}</p>}
              </div>
            ) : (
              <p className="profile-bio">{user.bio || "Add a bio to let buyers know how to reach you!"}</p>
            )}
          </div>
        </div>
        {editingBio ? (
          <div className="detail-buttons">
            <button className="btn-coral" onClick={saveBio}>Save</button>
            <button className="btn-outline" onClick={() => { setEditingBio(false); setBioDraft(user.bio || ""); setBioError(""); }}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn-outline" onClick={() => setEditingBio(true)}>Edit profile</button>
        )}
      </div>

      <div className="profile-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSearchParams(t.key === "listings" ? {} : { tab: t.key })}
            className={`profile-tab ${tab === t.key ? "active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && listings.length === 0 && <p className="page-subtitle">{emptyMessage}</p>}

      <div className="feed-grid">
        {listings.map((l) => {
          if (tab === "listings") {
            return (
              <ListingCard
                key={l.id}
                listing={l}
                showSeller={false}
                onOpen={open}
                onEdit={() => navigate(`/edit-listing/${l.id}`)}
                onDelete={handleDelete}
              />
            );
          }
          if (tab === "liked") {
            return <ListingCard key={l.id} listing={l} onOpen={open} onToggleLike={handleUnlike} />;
          }
          return (
            <ListingCard
              key={l.transaction_id}
              listing={l}
              onOpen={open}
              note={`${l.transaction_type === "rent" ? "Rented" : "Bought"} ${formatDate(l.transaction_date)} · ${formatPrice(l.paid_price)}`}
            />
          );
        })}
      </div>

      {tab === "listings" && sold.length > 0 && (
        <>
          <h3 className="section-heading">Sold and rented out</h3>
          <div className="feed-grid">
            {sold.map((l) => (
              <ListingCard
                key={l.transaction_id}
                listing={l}
                showSeller={false}
                onOpen={open}
                note={`${l.transaction_type === "rent" ? "Rented" : "Sold"} to @${l.buyer_username} · ${formatDate(l.transaction_date)}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
