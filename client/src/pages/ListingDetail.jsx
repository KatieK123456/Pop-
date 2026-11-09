import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { optimized, photosOf } from "../components/ListingCard.jsx";
import { initials, formatDate, formatPrice } from "../format.js";

// The full page for one listing: photo gallery, details, seller, and the buy/rent checkout.
export default function ListingDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [error, setError] = useState("");
  const [photoIndex, setPhotoIndex] = useState(0);

  const [confirming, setConfirming] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState("");
  const [justBought, setJustBought] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const query = user ? `?user_id=${user.id}` : "";
        const res = await fetch(`/api/listings/${id}${query}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error);
        } else {
          setListing(data.listing);
          setTransaction(data.transaction);
        }
      } catch (err) {
        setError("Could not reach the server.");
      }
    }
    load();
  }, [id, user]);

  if (error) return <p className="error-text">{error}</p>;
  if (!listing) return <p>Loading listing...</p>;

  const photos = photosOf(listing);
  const isRent = listing.listing_type === "rent";
  const isMine = user && listing.seller_id === user.id;
  const available = listing.status === "available";
  const verb = isRent ? "Rent" : "Buy";

  async function toggleLike() {
    if (!user) return navigate("/login");
    const res = await fetch("/api/wishlist/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, listing_id: listing.id }),
    });
    const data = await res.json();
    if (res.ok) setListing({ ...listing, liked: data.liked });
  }

  async function confirmCheckout() {
    setWorking(true);
    setActionError("");
    try {
      const res = await fetch(`/api/listings/${listing.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyer_id: user.id, agreed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error);
      } else {
        setListing({ ...listing, status: "unavailable" });
        setTransaction({ ...data.transaction, buyer_id: user.id });
        setJustBought(true);
        setConfirming(false);
      }
    } catch (err) {
      setActionError("Could not reach the server.");
    }
    setWorking(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${listing.title || listing.category}"? It will be removed from the feed. Anyone who liked it will still see it as Not available.`)) return;
    const res = await fetch(`/api/listings/${listing.id}?seller_id=${user.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) setActionError(data.error);
    else navigate("/profile");
  }

  function closeConfirm() {
    setConfirming(false);
    setAgreed(false);
    setActionError("");
  }

  // What shows in the action area depends on who is looking and whether the item is still available
  function renderActions() {
    if (justBought) {
      return (
        <div className="success-box">
          <p className="success-title">It's yours!</p>
          <p>
            Email <strong>@{listing.seller_username}</strong> at{" "}
            <a href={`mailto:${listing.seller_email}`}>{listing.seller_email}</a> to set up a time to meet on
            campus. You'll pay them in person.
          </p>
          <div className="detail-buttons">
            <button className="btn-coral" onClick={() => navigate("/profile?tab=closet")}>View my Closet</button>
            <button className="btn-outline" onClick={() => navigate("/")}>Back to feed</button>
          </div>
        </div>
      );
    }

    if (isMine) {
      if (available) {
        return (
          <div className="detail-buttons">
            <button className="btn-coral" onClick={() => navigate(`/edit-listing/${listing.id}`)}>Edit listing</button>
            <button className="btn-outline danger" onClick={handleDelete}>Delete</button>
          </div>
        );
      }
      return (
        <div className="status-box">
          {transaction
            ? <>{transaction.type === "rent" ? "Rented" : "Sold"} to <strong>@{transaction.buyer_username}</strong> on {formatDate(transaction.date)} for {formatPrice(transaction.price)}. Reach them at <a href={`mailto:${transaction.buyer_email}`}>{transaction.buyer_email}</a>.</>
            : "This item is no longer available."}
        </div>
      );
    }

    if (!available) {
      if (transaction && user && transaction.buyer_id === user.id) {
        return (
          <div className="status-box">
            You {transaction.type === "rent" ? "rented" : "bought"} this on {formatDate(transaction.date)}.{" "}
            <Link to="/profile?tab=closet">See it in your Closet</Link>
          </div>
        );
      }
      return (
        <div className="status-box">
          {listing.status === "removed"
            ? "The seller removed this listing, but it stays in your Liked tab for inspiration."
            : "This item is no longer available."}
        </div>
      );
    }

    if (!user) {
      return (
        <div className="detail-buttons">
          <button className="btn-coral" onClick={() => navigate("/login")}>Log in to {verb.toLowerCase()}</button>
        </div>
      );
    }

    return (
      <div className="detail-buttons">
        <button className="btn-coral" onClick={() => setConfirming(true)}>
          {verb} for {formatPrice(listing.price)}
        </button>
        <button className={`btn-outline heart-pill ${listing.liked ? "liked" : ""}`} onClick={toggleLike}>
          {listing.liked ? "♥ Saved" : "♡ Save"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <button className="back-link" onClick={() => navigate(-1)}>← Back</button>

      <div className="detail-layout">
        <div className="detail-gallery">
          {photos.length > 0 ? (
            <img
              src={optimized(photos[photoIndex], 1000)}
              alt={listing.title || listing.category}
              className={`detail-photo ${available ? "" : "faded"}`}
            />
          ) : (
            <div className="detail-photo placeholder" />
          )}
          {photos.length > 1 && (
            <div className="detail-thumbs">
              {photos.map((url, i) => (
                <button
                  key={url}
                  className={`detail-thumb ${i === photoIndex ? "active" : ""}`}
                  onClick={() => setPhotoIndex(i)}
                  aria-label={`Photo ${i + 1}`}
                >
                  <img src={optimized(url, 200)} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          <div className="detail-tags">
            <span className={isRent ? "tag-rent" : "tag-buy"}>{isRent ? "RENT" : "BUY"}</span>
            {!available && <span className="tag-unavailable">NOT AVAILABLE</span>}
          </div>

          <h2 className="page-title">{listing.title || listing.category}</h2>
          <p className="detail-price">
            {formatPrice(listing.price)}
            {isRent && <span className="detail-price-note"> to rent</span>}
          </p>

          <div className="detail-tiles">
            <div className="detail-tile"><span>Size</span><strong>{listing.size}</strong></div>
            <div className="detail-tile"><span>Condition</span><strong>{listing.condition}</strong></div>
            <div className="detail-tile"><span>Category</span><strong>{listing.category}</strong></div>
          </div>

          {listing.description && <p className="detail-description">{listing.description}</p>}

          <Link to={isMine ? "/profile" : `/users/${listing.seller_id}`} className="seller-box">
            <span className="avatar-circle">{initials(listing.seller_username)}</span>
            <div>
              <p className="seller-name">@{listing.seller_username}{isMine ? " (you)" : ""}</p>
              <p className="seller-email">{listing.seller_email}</p>
            </div>
          </Link>

          {renderActions()}
          {actionError && !confirming && <p className="error-text">{actionError}</p>}
        </div>
      </div>

      {confirming && (
        <div className="modal-backdrop" onClick={closeConfirm}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3 className="modal-title">Confirm your {isRent ? "rental" : "purchase"}</h3>
            <p className="modal-item">
              {listing.title || listing.category} · <strong>{formatPrice(listing.price)}</strong> from @{listing.seller_username}
            </p>

            <div className="disclosure-box">
              <p className="disclosure-title">How checkout works on Pop</p>
              <ul>
                <li>Pop doesn't process payments. You'll pay the seller in person when you meet.</li>
                <li>Pop doesn't offer buyer or seller protection, refunds, or payment guarantees.</li>
                <li>Meet in a safe, public place on campus.</li>
                <li>Confirming marks this item as unavailable for everyone else.</li>
              </ul>
            </div>

            <label className="agree-row">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              I understand how checkout works on Pop.
            </label>

            {actionError && <p className="error-text">{actionError}</p>}

            <div className="detail-buttons">
              <button className="btn-coral" disabled={!agreed || working} onClick={confirmCheckout}>
                {working ? "Confirming..." : `Confirm ${verb.toLowerCase()}`}
              </button>
              <button className="btn-outline" onClick={closeConfirm}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
