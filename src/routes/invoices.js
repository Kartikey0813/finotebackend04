const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const dbConnect = require('../../lib/mongodb');       // ✅ MongoDB connection helper
const Invoice = require('../../models/Invoice');     // ✅ Mongoose model
const FraudAlert = require('../../models/FraudAlert');

const { computeInvoiceHash } = require('../utils/hash');
const { registerHashOnChain } = require('../services/web3');
const { runFraudRules } = require('../fraud/rules'); // You’ll need to adapt this for Mongo
const authMiddleware = require('../middleware/auth'); // JWT middleware sets req.userId

// ---------------------------------------------------
// POST /api/invoices
// ---------------------------------------------------
router.post('/', authMiddleware, async (req, res) => {
  try {
    await dbConnect(); // ✅ ensure Mongo connection

    const userId = req.userId;
    const payload = req.body;

    // Fraud rules (adapt: pass Mongoose models instead of Prisma)
    const fraud = await runFraudRules(Invoice, userId, payload);

    // Create invoice doc
    const invoice = new Invoice({
      _id: crypto.randomUUID(),
      userId,
      clientName: payload.clientName,
      clientEmail: payload.clientEmail,
      invoiceNumber: payload.invoiceNumber,
      items: payload.items,
      totalAmount: payload.total,
      dueDate: new Date(payload.dueDate),
      status: 'pending',
      createdAt: new Date()
    });

    await invoice.save();

    // compute canonical & hash
    const canonicalObj = { ...payload, id: invoice._id, createdAt: invoice.createdAt };
    const invoiceHash = computeInvoiceHash(canonicalObj);

    // update invoice with hash
    invoice.invoiceHash = invoiceHash;

    // register on chain (or simulated)
    try {
      const web3res = await registerHashOnChain(invoiceHash);
      invoice.blockchainTx = web3res.txHash;
    } catch (err) {
      console.error('⚠️ web3 register failed', err);
    }

    await invoice.save();

    // record fraud alert if flagged
    if (fraud.flagged) {
      const alert = new FraudAlert({
        _id: crypto.randomUUID(),
        invoiceId: invoice._id,
        severity: fraud.severity,
        reason: JSON.stringify(fraud.reasons),
        createdAt: new Date()
      });
      await alert.save();
    }

    res.json({ invoice, fraud });
  } catch (err) {
    console.error('❌ Invoice creation failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
