import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import ListingCard from "../components/ListingCard.jsx";
import { initials } from "../format.js";

// Another student's profile: username, bio, email, and only their current listings
export default function UserProfile({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [listings, setListings] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [userRes, listingsRes] = await Promise.all([
          fetch(`/api/users/${id}`),
          fetch(`/api/users/${id}/listings`),
        ]);
        const userData = await userRes.json();
        const listingsData = await listingsRes.json();
        if (!userRes.ok) return setError(userData.error);
        setPerson(userData.user);
        if (listingsRes.ok) setListings(listingsData.listings);
      } catch (err) {
        setError("Could not reach the server.");
      }
    }
    load();
  }, [id]);

  // Your own profile has the full version with all three tabs
  if (user && Number(id) === user.id) return <Navigate to="/profile" replace />;
  if (error) return <p className="error-text">{error}</p>;
  if (!person) return <p>Loading profile...</p>;

  return (
    <div>
      <div className="profile-card">
        <div className="profile-left">
          <span className="avatar-circle large">{initials(person.username)}</span>
          <div>
            <p className="profile-name">{person.username}</p>
            <p className="profile-handle">
              @{person.username} &middot; <a href={`mailto:${person.email}`}>{person.email}</a>
            </p>
            <p className="profile-bio">{person.bio || "No bio yet."}</p>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button className="profile-tab active">Listings</button>
      </div>

      {listings.length === 0 && (
        <p className="page-subtitle">@{person.username} doesn't have anything listed right now.</p>
      )}
      <div className="feed-grid">
        {listings.map((l) => (
          <ListingCard key={l.id} listing={l} showSeller={false} onOpen={() => navigate(`/listings/${l.id}`)} />
        ))}
      </div>
    </div>
  );
}
