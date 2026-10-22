// Temporary test: makes two tiny uploads and prints Cloudinary's full reply.
// Safe to share the output: it never prints your key or secret.
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const cloud = process.env.CLOUDINARY_CLOUD_NAME;
const key = process.env.CLOUDINARY_API_KEY;
const secret = process.env.CLOUDINARY_API_SECRET;
const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGN4kWgDAAO6AYbQB6sXAAAAAElFTkSuQmCC";

async function tryUpload(label, extra) {
  const params = { timestamp: Math.floor(Date.now() / 1000), ...extra };
  const toSign = Object.keys(params).sort().map((k) => k + "=" + params[k]).join("&");
  const signature = crypto.createHash("sha1").update(toSign + secret).digest("hex");

  const form = new FormData();
  form.append("file", tinyPng);
  form.append("api_key", key);
  form.append("signature", signature);
  for (const [k, v] of Object.entries(params)) form.append(k, String(v));

  const res = await fetch("https://api.cloudinary.com/v1_1/" + cloud + "/image/upload", {
    method: "POST",
    body: form,
  });
  const text = await res.text();
  console.log("\n[" + label + "] status " + res.status);
  console.log(text.slice(0, 500));
}

await tryUpload("upload with no folder", {});
await tryUpload("upload into folder pop-listings", { folder: "pop-listings" });
