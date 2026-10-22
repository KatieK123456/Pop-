import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ListingCard from "../components/ListingCard.jsx";
import { CATEGORIES, SIZES } from "../components/ListingForm.jsx";

const NO_FILTERS = { category: "", size: "", min_price: "", max_price: "", listing_type: "" };

export default function Feed({ user }) {
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Reload the feed whenever a filter changes (or the user logs in or out)
  useEffect(() => {
    async function load() {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "") params.set(key, value);
      });
      if (user) params.set("user_id", user.id);

      try {
        const res = await fetch(`/api/listings?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error);
        } else {
          setError("");
          setListings(data.listings);
        }
      } catch (err) {
        setError("Could not reach the server.");
      }
      setLoading(false);
    }
    load();
  }, [filters, user]);

  const setFilter = (field) => (e) => setFilters({ ...filters, [field]: e.target.value });
  const filtersActive = Object.values(filters).some((v) => v !== "");

  async function handleToggleLike(listing) {
    if (!user) {
      navigate("/login");
      return;
    }
    const res = await fetch("/api/wishlist/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, listing_id: listing.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setListings(listings.map((l) => (l.id === listing.id ? { ...l, liked: data.liked } : l)));
    }
  }

  return (
    <div>
      <h2 className="page-title">Feed</h2>

      <div className="filter-bar">
        <div>
          <label className="form-label">Category</label>
          <select className="pop-input" value={filters.category} onChange={setFilter("category")}>
            <option value="">All</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Size</label>
          <select className="pop-input" value={filters.size} onChange={setFilter("size")}>
            <option value="">All</option>
            {SIZES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Type</label>
          <select className="pop-input" value={filters.listing_type} onChange={setFilter("listing_type")}>
            <option value="">Buy and Rent</option>
            <option value="sell">Buy</option>
            <option value="rent">Rent</option>
          </select>
        </div>
        <div>
          <label className="form-label">Min price ($)</label>
          <input className="pop-input" type="number" min="0" placeholder="0" value={filters.min_price} onChange={setFilter("min_price")} />
        </div>
        <div>
          <label className="form-label">Max price ($)</label>
          <input className="pop-input" type="number" min="0" placeholder="Any" value={filters.max_price} onChange={setFilter("max_price")} />
        </div>
        {filtersActive && (
          <button className="btn-outline" onClick={() => setFilters(NO_FILTERS)}>Clear filters</button>
        )}
      </div>

      {loading && <p>Loading listings...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && listings.length === 0 && (
        <p className="page-subtitle">
          {filtersActive ? "No listings match those filters." : "No listings yet. Be the first to post something!"}
        </p>
      )}

      <div className="feed-grid">
        {listings.map((l) => (
          <ListingCard key={l.id} listing={l} onToggleLike={handleToggleLike} />
        ))}
      </div>
    </div>
  );
}
