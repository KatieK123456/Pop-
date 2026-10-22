import { useNavigate } from "react-router-dom";
import ListingForm from "../components/ListingForm.jsx";

export default function NewListing({ user }) {
  const navigate = useNavigate();

  async function createListing(values) {
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, seller_id: user.id }),
    });
    const data = await res.json();
    return res.ok ? null : data.error;
  }

  return (
    <ListingForm
      heading="New Listing"
      subheading="Share something great with your campus community."
      submitLabel="Post Listing"
      successMessage="Listing posted! Taking you to the feed..."
      onSubmit={createListing}
      onDone={() => navigate("/")}
    />
  );
}
