// truffle-config.cjs

// 1. Import the necessary libraries
// 'dotenv' allows us to read our secret keys from the .env file
require('dotenv').config();
// 'HDWalletProvider' is the secure tool that connects Truffle to MetaMask
const HDWalletProvider = require('@truffle/hdwallet-provider');

// 2. Read your secrets securely from the .env file
const { META_MASK_MNEMONIC, POLYGON_AMOY_RPC_URL } = process.env;

module.exports = {
  // This specifies where the compiled contract files will be saved.
  contracts_build_directory: './build/contracts',

  networks: {
    // This is our old, local development network for quick tests with Ganache.
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*", // Match any network id
    },

    // --- THIS IS OUR NEW, LIVE PUBLIC TEST NETWORK ---
    amoy: {
      // We use the HDWalletProvider to securely connect to the Polygon network
      // using your MetaMask secret phrase and the public RPC URL.
      provider: () => new HDWalletProvider(META_MASK_MNEMONIC, POLYGON_AMOY_RPC_URL),
      network_id: 80002, // This is the official ID for the Amoy testnet
      confirmations: 2,    // Wait for 2 blocks to be mined before considering a transaction successful
      timeoutBlocks: 200,  // Time out if a transaction is pending for too long
      skipDryRun: true     // Skip the test simulation and deploy directly to the network
    },
  },

  // Configure the Solidity compiler
  compilers: {
    solc: {
      version: "0.8.19", // A stable and recommended version of the Solidity compiler
    }
  },
};