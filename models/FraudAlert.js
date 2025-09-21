const mongoose = require('mongoose');

const fraudSchema = new mongoose.Schema({
  _id: { type: String },
  invoiceId: { type: String, required: true, index: true },
  severity: String,
  reason: String,
  resolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.models.FraudAlert || mongoose.model('FraudAlert', fraudSchema);
