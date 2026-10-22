// Run with: node test-cloudinary.js
// Checks that your Cloudinary keys in .env work, without starting the whole app.
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

try {
  const result = await cloudinary.api.ping();
  console.log("✅ Cloudinary keys work!", result);
} catch (err) {
  console.error("❌ Cloudinary rejected the keys:", err.error?.message || err.message);
}
