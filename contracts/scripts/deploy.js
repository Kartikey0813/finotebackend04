async function main() {
  const InvoiceRegistry = await ethers.getContractFactory("InvoiceRegistry");
  const registry = await InvoiceRegistry.deploy();
  await registry.deployed();
  console.log("InvoiceRegistry deployed to:", registry.address);
}
main().catch(e => { console.error(e); process.exit(1); });