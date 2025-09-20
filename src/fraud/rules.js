async function runFraudRules(prisma, userId, invoice) {
  const reasons = [];
  // duplicate invoice number
  const existing = await prisma.invoice.findFirst({
    where: { userId, invoiceNumber: invoice.invoiceNumber }
  });
  if (existing) reasons.push('Duplicate invoice number for this user');

  // amount > threshold OR > 5x average
  const threshold = 100000; // configurable
  if (invoice.total > threshold) reasons.push('Amount greater than threshold');

  const agg = await prisma.invoice.aggregate({
    _avg: { totalAmount: true },
    where: { userId }
  });
  const avg = agg._avg.totalAmount || 0;
  if (avg > 0 && invoice.total > avg * 5) reasons.push('Amount > 5x user average');

  // same client email used by many payers
  const clients = await prisma.invoice.groupBy({
    by: ['clientEmail'],
    where: { clientEmail: invoice.clientEmail },
    _count: { clientEmail: true }
  });
  const usage = clients.length ? clients[0]._count.clientEmail : 0;
  if (usage > 5) reasons.push('Client email used by many invoices');

  const flagged = reasons.length > 0;
  return { flagged, severity: flagged ? (reasons.length > 1 ? 'high' : 'medium') : 'none', reasons };
}

module.exports = { runFraudRules };
