import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ["Dress", "Top", "Jeans", "Skirt", "Pants", "Outerwear", "Shoes", "Accessories"];
const SIZES = ["XS", "S", "M", "L", "XL"];
const CONDITIONS = ["New", "Good", "Fair"];

export default function NewListing({ user }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Dress");
  const [size, setSize] = useState("M");
  const [condition, setCondition] = useState("Good");
  const [price, setPrice] = useState("");
  const [listingType, setListingType] = useState("sell");
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seller_id: user.id,
        title,
        description,
        category,
        size,
        price,
        condition,
        listing_type: listingType,
        photo_url: photoUrl,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setSuccess(true);
    setTimeout(() => navigate("/"), 1200);
  }

  if (success) {
    return (
      <div className="form-card">
        <p style={{ color: "#2d7a3e", fontWeight: 600 }}>✅ Listing posted! Taking you to the feed...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="page-title">New Listing</h2>
      <p className="page-subtitle">Share something great with your campus community.</p>

      <form onSubmit={handleSubmit} className="form-card">
        <label className="form-label">Listing Title</label>
        <input
          className="pop-input"
          placeholder="e.g. Vintage 90s Levi's Jacket"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label className="form-label">Description</label>
        <textarea
          className="pop-input"
          rows={4}
          placeholder="Add size specs, condition flaws, meetup details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="form-row">
          <div>
            <label className="form-label">Category</label>
            <select className="pop-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Size</label>
            <select className="pop-input" value={size} onChange={(e) => setSize(e.target.value)}>
              {SIZES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div>
            <label className="form-label">Condition</label>
            <select className="pop-input" value={condition} onChange={(e) => setCondition(e.target.value)}>
              {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Price ($)</label>
            <input
              className="pop-input"
              type="number"
              step="0.01"
              placeholder="45"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
        </div>

        <label className="form-label">Listing Type</label>
        <select className="pop-input" value={listingType} onChange={(e) => setListingType(e.target.value)}>
          <option value="sell">Buy (I'm selling this)</option>
          <option value="rent">Rent (I'm renting this out)</option>
        </select>

        <label className="form-label">Photo link (temporary)</label>
        <input
          className="pop-input"
          placeholder="Paste an image URL. Real photo uploads come next."
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
        />

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button type="button" className="btn-outline" onClick={() => navigate("/")}>Cancel</button>
          <button type="submit" className="btn-coral">Post Listing</button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </form>
    </div>
  );
}
