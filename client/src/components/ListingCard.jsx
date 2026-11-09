import { useState } from "react";

const PLACEHOLDER_COLORS = ["#7fa1bf", "#e2b5c0", "#e6829d", "#425b72", "#b6c5e6", "#d4c4e0"];

// Asks Cloudinary for a smaller, compressed copy so big phone photos load fast
export function optimized(url, width = 700) {
  if (url && url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
  }
  return url;
}

// All of a listing's photos, falling back to the older single photo_url column
export function photosOf(l) {
  if (l.photo_urls && l.photo_urls.length > 0) return l.photo_urls;
  return l.photo_url ? [l.photo_url] : [];
}

// One listing card, used on the Feed and on the profile tabs.
// onOpen: clicking the photo or title opens the listing page.
// onToggleLike: shows a heart. onEdit / onDelete: shows the seller's buttons.
// note: an extra line at the bottom (e.g. "Bought Nov 9 for $45").
export default function ListingCard({ listing: l, onOpen, onToggleLike, onEdit, onDelete, note, showSeller = true }) {
  const [index, setIndex] = useState(0);
  const unavailable = l.status !== "available";
  const photos = photosOf(l);
  const current = Math.min(index, photos.length - 1);

  // The arrow buttons sit on top of the photo, so stop them from also opening the listing
  function step(e, amount) {
    e.stopPropagation();
    setIndex((current + amount + photos.length) % photos.length);
  }

  return (
    <div className="listing-card">
      {showSeller && <p className="listing-seller">@{l.seller_username} · {l.seller_email}</p>}

      {photos.length > 0 ? (
        <div className={`photo-wrap ${onOpen ? "clickable" : ""}`} onClick={onOpen ? () => onOpen(l) : undefined}>
          <img
            src={optimized(photos[current])}
            alt={l.title || l.category}
            className={`listing-photo ${unavailable ? "faded" : ""}`}
          />
          {photos.length > 1 && (
            <>
              <button className="photo-nav prev" onClick={(e) => step(e, -1)} aria-label="Previous photo">‹</button>
              <button className="photo-nav next" onClick={(e) => step(e, 1)} aria-label="Next photo">›</button>
              <span className="photo-count">{current + 1}/{photos.length}</span>
            </>
          )}
        </div>
      ) : (
        <div
          className={`listing-photo ${onOpen ? "clickable" : ""}`}
          style={{ background: PLACEHOLDER_COLORS[l.id % PLACEHOLDER_COLORS.length] }}
          onClick={onOpen ? () => onOpen(l) : undefined}
        />
      )}

      <div className="listing-info">
        <div className="listing-row">
          {onOpen ? (
            <button className="card-title-link" onClick={() => onOpen(l)}>{l.title || l.category}</button>
          ) : (
            <strong>{l.title || l.category}</strong>
          )}
          <span className="listing-price">${Number(l.price).toFixed(0)}</span>
        </div>
        <p className="listing-meta">{l.category} · Size {l.size} · {l.condition}</p>

        <div className="listing-row">
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <span className={l.listing_type === "rent" ? "tag-rent" : "tag-buy"}>
              {l.listing_type === "rent" ? "RENT" : "BUY"}
            </span>
            {unavailable && <span className="tag-unavailable">NOT AVAILABLE</span>}
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

        {note && <p className="card-note">{note}</p>}

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
