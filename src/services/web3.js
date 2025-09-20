require('dotenv').config();
const { ethers } = require('ethers');
const registryAbi = [ // minimal ABI for registerInvoice
  "function registerInvoice(bytes32 invoiceHash) external",
  "event InvoiceRegistered(bytes32 indexed invoiceHash, address indexed owner, uint256 timestamp)"
];

const USE_SIM = process.env.USE_SIMULATED_CHAIN === 'true';

async function registerHashOnChain(invoiceHash) {
  if (USE_SIM) {
    // simulated response
    return { simulated: true, txHash: `SIM_${Date.now()}` };
  }
  const provider = new ethers.providers.JsonRpcProvider(process.env.WEB3_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const registry = new ethers.Contract(process.env.INVOICE_REGISTRY_ADDRESS, registryAbi, wallet);
  const tx = await registry.registerInvoice(invoiceHash);
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}

module.exports = { registerHashOnChain };
