const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: { type: String }, // preserve Prisma UUID
  name: String,
  email: { type: String, required: true, unique: true },
  password: String,
  role: String,
  walletAddress: String,
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
