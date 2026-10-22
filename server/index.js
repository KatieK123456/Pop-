import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import listingRoutes from "./routes/listings.js";
import wishlistRoutes from "./routes/wishlist.js";
import uploadRoutes from "./routes/upload.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", listingRoutes);
app.use("/api", wishlistRoutes);
app.use("/api", uploadRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "Pop server is running" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Pop server listening on http://localhost:${PORT}`);
});
