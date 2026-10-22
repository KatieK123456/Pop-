import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const CATEGORIES = ["Dress", "Top", "Jeans", "Skirt", "Pants", "Outerwear", "Shoes", "Accessories"];
export const SIZES = ["XS", "S", "M", "L", "XL"];
export const CONDITIONS = ["New", "Good", "Fair"];
export const MAX_PHOTOS = 5;

const EMPTY = {
  title: "",
  description: "",
  category: "Dress",
  size: "M",
  condition: "Good",
  price: "",
  listing_type: "sell",
};

// Shared by the New Listing and Edit Listing pages.
// onSubmit(values) should return an error message, or null if it worked.
export default function ListingForm({ initial, onSubmit, onDone, heading, subheading, submitLabel, successMessage }) {
  const { photo_urls: initialPhotos, ...initialValues } = initial || {};
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [photos, setPhotos] = useState(initialPhotos || []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const set = (field) => (e) => setValues({ ...values, [field]: e.target.value });

  async function handleFiles(e) {
    const files = Array.from(e.target.files);
    e.target.value = ""; // lets the same file be picked again later
    if (files.length === 0) return;

    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`You can add up to ${MAX_PHOTOS} photos per listing.`);
      return;
    }

    setError("");
    setUploading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append("photos", file));

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) setError(data.error);
      else setPhotos([...photos, ...data.urls]);
    } catch (err) {
      setError("Could not upload photos. Is the server running?");
    }
    setUploading(false);
  }

  function removePhoto(index) {
    setPhotos(photos.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (photos.length === 0) {
      setError("Please add at least 1 photo.");
      return;
    }

    const problem = await onSubmit({ ...values, photo_urls: photos });
    if (problem) {
      setError(problem);
      return;
    }
    setSuccess(true);
    setTimeout(onDone, 1200);
  }

  if (success) {
    return (
      <div className="form-card">
        <p style={{ color: "#2d7a3e", fontWeight: 600 }}>✅ {successMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="page-title">{heading}</h2>
      <p className="page-subtitle">{subheading}</p>

      <form onSubmit={handleSubmit} className="form-card">
        <label className="form-label">Photos (1 to {MAX_PHOTOS})</label>
        <div className="photo-grid">
          {photos.map((url, i) => (
            <div key={url + i} className="photo-thumb">
              <img src={url} alt={`Listing photo ${i + 1}`} />
              <button type="button" className="photo-remove" onClick={() => removePhoto(i)} aria-label="Remove photo">✕</button>
              {i === 0 && <span className="photo-cover">Cover</span>}
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="photo-add">
              {uploading ? "Uploading..." : "+ Add photos"}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                disabled={uploading}
                style={{ display: "none" }}
              />
            </label>
          )}
        </div>

        <label className="form-label">Listing Title</label>
        <input
          className="pop-input"
          placeholder="e.g. Vintage 90s Levi's Jacket"
          value={values.title}
          onChange={set("title")}
          required
        />

        <label className="form-label">Description</label>
        <textarea
          className="pop-input"
          rows={4}
          placeholder="Add size specs, condition flaws, meetup details..."
          value={values.description}
          onChange={set("description")}
        />

        <div className="form-row">
          <div>
            <label className="form-label">Category</label>
            <select className="pop-input" value={values.category} onChange={set("category")}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Size</label>
            <select className="pop-input" value={values.size} onChange={set("size")}>
              {SIZES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div>
            <label className="form-label">Condition</label>
            <select className="pop-input" value={values.condition} onChange={set("condition")}>
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
              value={values.price}
              onChange={set("price")}
              required
            />
          </div>
        </div>

        <label className="form-label">Listing Type</label>
        <select className="pop-input" value={values.listing_type} onChange={set("listing_type")}>
          <option value="sell">Buy (I'm selling this)</option>
          <option value="rent">Rent (I'm renting this out)</option>
        </select>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button type="button" className="btn-outline" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn-coral" disabled={uploading}>{submitLabel}</button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </form>
    </div>
  );
}
