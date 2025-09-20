const stringify = require('fast-json-stable-stringify');
const { ethers } = require('ethers');

function computeInvoiceHash(invoiceObject) {
  const canonical = stringify(invoiceObject);
  // returns 0x...32
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(canonical));
}

module.exports = { computeInvoiceHash };
