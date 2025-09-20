// const stringify = require('fast-json-stable-stringify');
// const { ethers } = require('ethers');

// function computeInvoiceHash(invoiceObject) {
//   const canonical = stringify(invoiceObject);
//   // returns 0x...32
//   return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(canonical));
// }

// module.exports = { computeInvoiceHash };


// src/utils/hash.js
const stringify = require('fast-json-stable-stringify');
const { createHash } = require('crypto');

let ethers;
try {
  ethers = require('ethers'); // v6
} catch (e) {
  ethers = null;
}

function computeInvoiceHash(invoiceObject) {
  const canonical = stringify(invoiceObject);

  // Preferred: ethers v6
  try {
    if (ethers) {
      // v6 provides top-level keccak256 and toUtf8Bytes
      if (typeof ethers.keccak256 === 'function' && typeof ethers.toUtf8Bytes === 'function') {
        return ethers.keccak256(ethers.toUtf8Bytes(canonical)); // returns 0x...
      }

      // fallback v6 shape: ethers.hashing.keccak256
      if (ethers.hashing && typeof ethers.hashing.keccak256 === 'function') {
        // ethers.hashing.keccak256 expects Uint8Array
        const bytes = ethers.toUtf8Bytes ? ethers.toUtf8Bytes(canonical) : new TextEncoder().encode(canonical);
        return ethers.hashing.keccak256(bytes);
      }
    }
  } catch (err) {
    console.warn('ethers keccak attempt failed:', err && err.message);
  }

  // FINAL fallback: sha256 (note: not keccak). Prefixed so caller can detect fallback.
  const sha = createHash('sha256').update(canonical).digest('hex');
  return `sha256:${sha}`;
}

module.exports = { computeInvoiceHash };
