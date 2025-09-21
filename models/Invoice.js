const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  _id: { type: String },
  userId: { type: String, required: true, index: true },
  clientName: String,
  clientEmail: String,
  invoiceNumber: String,
  items: { type: Array, default: [] },
  totalAmount: Number,
  dueDate: Date,
  status: { type: String, default: 'draft' },
  invoiceHash: String,
  blockchainTx: String,
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

invoiceSchema.index({ userId: 1, invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
