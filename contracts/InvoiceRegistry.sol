// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract InvoiceRegistry {
    event InvoiceRegistered(bytes32 indexed invoiceHash, address indexed owner, uint256 timestamp);

    mapping(bytes32 => bool) public registered;

    function registerInvoice(bytes32 invoiceHash) external {
        require(!registered[invoiceHash], "Already registered");
        registered[invoiceHash] = true;
        emit InvoiceRegistered(invoiceHash, msg.sender, block.timestamp);
    }
}