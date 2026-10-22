import { useState } from "react";

const PLACEHOLDER_COLORS = ["#7fa1bf", "#e2b5c0", "#e6829d", "#425b72", "#b6c5e6", "#d4c4e0"];

// Asks Cloudinary for a smaller, compressed copy so big phone photos load fast
function optimized(url) {
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/f_auto,q_auto,w_700/");
  }
  return url;
}

// One listing card, used on the Feed and on the profile tabs.
// onToggleLike: shows a heart. onEdit / onDelete: shows the seller's buttons.
export default function ListingCard({ listing: l, onToggleLike, onEdit, onDelete, showSeller = true }) {
  const [index, setIndex] = useState(0);
  const unavailable = l.status !== "available";

  const photos =
    l.photo_urls && l.photo_urls.length > 0 ? l.photo_urls : l.photo_url ? [l.photo_url] : [];
  const current = Math.min(index, photos.length - 1);

  return (
    <div className="listing-card">
      {showSeller && <p className="listing-seller">@{l.seller_username} · {l.seller_email}</p>}

      {photos.length > 0 ? (
        <div className="photo-wrap">
          <img src={optimized(photos[current])} alt={l.title || l.category} className="listing-photo" />
          {photos.length > 1 && (
            <>
              <button
                className="photo-nav prev"
                onClick={() => setIndex((current - 1 + photos.length) % photos.length)}
                aria-label="Previous photo"
              >‹</button>
              <button
                className="photo-nav next"
                onClick={() => setIndex((current + 1) % photos.length)}
                aria-label="Next photo"
              >›</button>
              <span className="photo-count">{current + 1}/{photos.length}</span>
            </>
          )}
        </div>
      ) : (
        <div
          className="listing-photo"
          style={{ background: PLACEHOLDER_COLORS[l.id % PLACEHOLDER_COLORS.length] }}
        />
      )}

      <div className="listing-info">
        <div className="listing-row">
          <strong>{l.title || l.category}</strong>
          <span className="listing-price">${Number(l.price).toFixed(0)}</span>
        </div>
        <p className="listing-meta">{l.category} · Size {l.size} · {l.condition}</p>

        <div className="listing-row">
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <span className={l.listing_type === "rent" ? "tag-rent" : "tag-buy"}>
              {l.listing_type === "rent" ? "RENT" : "BUY"}
            </span>
            {unavailable && <span className="tag-unavailable">UNAVAILABLE</span>}
          </div>

          {onToggleLike && (
            <button
              className={`heart-btn ${l.liked ? "liked" : ""}`}
              onClick={() => onToggleLike(l)}
              aria-label={l.liked ? "Remove from Liked" : "Save to Liked"}
            >
              {l.liked ? "♥" : "♡"}
            </button>
          )}
        </div>

        {(onEdit || onDelete) && (
          <div className="card-actions">
            {onEdit && <button className="btn-outline small" onClick={() => onEdit(l)}>Edit</button>}
            {onDelete && <button className="btn-outline small danger" onClick={() => onDelete(l)}>Delete</button>}
          </div>
        )}
      </div>
    </div>
  );
}
