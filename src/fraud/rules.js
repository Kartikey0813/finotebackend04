async function runFraudRules(Invoice, userId, payload) {
  const duplicate = await Invoice.findOne({ userId, invoiceNumber: payload.invoiceNumber });
  if (duplicate) {
    return { flagged: true, severity: 'high', reasons: ['Duplicate invoice number'] };
  }
  return { flagged: false, reasons: [] };
}
module.exports = { runFraudRules };
