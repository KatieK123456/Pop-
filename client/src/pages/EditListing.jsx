import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ListingForm from "../components/ListingForm.jsx";

export default function EditListing({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/listings/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else if (data.listing.seller_id !== user.id) {
        setError("You can only edit your own listings.");
      } else {
        setListing(data.listing);
      }
    }
    load();
  }, [id, user.id]);

  async function saveChanges(values) {
    const res = await fetch(`/api/listings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, seller_id: user.id }),
    });
    const data = await res.json();
    return res.ok ? null : data.error;
  }

  if (error) return <p className="error-text">{error}</p>;
  if (!listing) return <p>Loading listing...</p>;

  return (
    <ListingForm
      initial={{
        title: listing.title || "",
        description: listing.description || "",
        category: listing.category,
        size: listing.size,
        condition: listing.condition,
        price: listing.price,
        listing_type: listing.listing_type,
        photo_urls:
          listing.photo_urls && listing.photo_urls.length > 0
            ? listing.photo_urls
            : listing.photo_url ? [listing.photo_url] : [],
      }}
      heading="Edit Listing"
      subheading="Update the details of your listing."
      submitLabel="Save Changes"
      successMessage="Listing updated! Taking you back to your profile..."
      onSubmit={saveChanges}
      onDone={() => navigate("/profile")}
    />
  );
}
