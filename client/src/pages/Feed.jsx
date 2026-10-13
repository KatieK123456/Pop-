import { useEffect, useState } from "react";

const PLACEHOLDER_COLORS = ["#7fa1bf", "#e2b5c0", "#e6829d", "#425b72", "#b6c5e6", "#d4c4e0"];

export default function Feed() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/listings");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error);
        } else {
          setListings(data.listings);
        }
      } catch (err) {
        setError("Could not reach the server.");
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p>Loading listings...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div>
      <h2 className="page-title">Feed</h2>
      {listings.length === 0 ? (
        <p className="page-subtitle">No listings yet. Be the first to post something!</p>
      ) : (
        <div className="feed-grid">
          {listings.map((l) => (
            <div key={l.id} className="listing-card">
              <p className="listing-seller">@{l.seller_username} · {l.seller_email}</p>
              {l.photo_url ? (
                <img src={l.photo_url} alt={l.title || l.category} className="listing-photo" />
              ) : (
                <div className="listing-photo" style={{ background: PLACEHOLDER_COLORS[l.id % PLACEHOLDER_COLORS.length] }} />
              )}
              <div className="listing-info">
                <div className="listing-row">
                  <strong>{l.title || l.category}</strong>
                  <span className="listing-price">${Number(l.price).toFixed(0)}</span>
                </div>
                <p className="listing-meta">{l.category} · Size {l.size} · {l.condition}</p>
                <span className={l.listing_type === "rent" ? "tag-rent" : "tag-buy"}>
                  {l.listing_type === "rent" ? "RENT" : "BUY"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
