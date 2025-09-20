const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { computeInvoiceHash } = require('../utils/hash');
const { registerHashOnChain } = require('../services/web3');
const { runFraudRules } = require('../fraud/rules');
const authMiddleware = require('../middleware/auth'); // verify JWT sets req.userId

router.post('/', authMiddleware, async (req, res) => {
  const userId = req.userId;
  const payload = req.body; // clientName, clientEmail, items, total, dueDate, invoiceNumber, escrow
  // minimal validation omitted for brevity
  const fraud = await runFraudRules(prisma, userId, payload);
  const invoice = await prisma.invoice.create({
    data: {
      userId,
      clientName: payload.clientName,
      clientEmail: payload.clientEmail,
      invoiceNumber: payload.invoiceNumber,
      items: payload.items,
      totalAmount: payload.total,
      dueDate: new Date(payload.dueDate),
      status: 'pending'
    }
  });

  // compute canonical & hash
  const canonicalObj = { ...payload, id: invoice.id, createdAt: invoice.createdAt };
  const invoiceHash = computeInvoiceHash(canonicalObj);

  // store hash
  await prisma.invoice.update({ where: { id: invoice.id }, data: { invoiceHash }});

  // register on chain (or simulated)
  try {
    const web3res = await registerHashOnChain(invoiceHash);
    await prisma.invoice.update({ where: { id: invoice.id }, data: { blockchainTx: web3res.txHash }});
  } catch (err) {
    console.error('web3 register failed', err);
    // optionally mark invoice with a failure flag - but don't block saving
  }

  // record fraud alert rows if flagged
  if (fraud.flagged) {
    await prisma.fraudAlert.create({
      data: {
        invoiceId: invoice.id,
        severity: fraud.severity,
        reason: JSON.stringify(fraud.reasons)
      }
    });
  }

  res.json({ invoice, fraud });
});

module.exports = router;
