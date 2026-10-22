import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

// Keep uploaded files in memory just long enough to send them on to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("NOT_AN_IMAGE"));
  },
});

function sendToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: "pop-listings" }, (err, result) => {
      if (err) reject(err);
      else resolve(result.secure_url);
    });
    stream.end(buffer);
  });
}

// POST /api/upload - receives up to 5 photos, returns their Cloudinary URLs
router.post("/upload", (req, res) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return res.status(500).json({
      error: "Photo uploads aren't set up yet. Add your Cloudinary keys to server/.env and restart the server.",
    });
  }

  upload.array("photos", 5)(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Each photo must be under 8 MB." });
      }
      if (err.message === "NOT_AN_IMAGE") {
        return res.status(400).json({ error: "Only image files can be uploaded." });
      }
      return res.status(400).json({ error: "You can upload up to 5 photos at a time." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No photos were received." });
    }

    try {
      const urls = await Promise.all(req.files.map((file) => sendToCloudinary(file.buffer)));
      res.json({ urls });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Cloudinary rejected the upload. Check your keys in server/.env." });
    }
  });
});

export default router;
