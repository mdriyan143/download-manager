import mongoose from "mongoose";

// Metadata only. Media files are never stored on the server.
// There are no accounts: each browser gets an anonymous visitor id (httpOnly cookie).
const downloadSchema = new mongoose.Schema({
  visitorId: { type: String, required: true, index: true },
  platform: { type: String, required: true, maxlength: 60 },
  mediaUrl: { type: String, required: true, maxlength: 2048 },
  title: { type: String, default: "Untitled", maxlength: 300 },
  filename: { type: String, default: "download", maxlength: 300 },
  thumbnail: { type: String, default: null, maxlength: 2048 },
  format: { type: String, maxlength: 20 },
  quality: { type: String, maxlength: 40 },
  watermarkStatus: { type: String, default: "unknown", maxlength: 20 },
  status: { type: String, default: "started", maxlength: 20 },
  createdAt: { type: Date, default: Date.now },
});
downloadSchema.index({ visitorId: 1, createdAt: -1 });

export default mongoose.models.Download || mongoose.model("Download", downloadSchema);
