// truffle-config.cjs
require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

// --- SAFETY CHECK ---
const privateKey = process.env.PRIVATE_KEY;
const rpcUrl = process.env.RPC_URL;

module.exports = {
  contracts_build_directory: './build/contracts',

  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
    },

    // Polygon Amoy Testnet (High Latency Config)
    amoy: {
      provider: () => {
        if (!privateKey || !rpcUrl) {
          throw new Error("❌ Missing RPC_URL or PRIVATE_KEY in .env file");
        }
        return new HDWalletProvider({
          privateKeys: [privateKey],
          providerOrUrl: rpcUrl,
          pollingInterval: 30000, // Check every 30s (Very polite to the server)
          disableConfirmationListener: true // Disable listening to prevent socket hangups
        });
      },
      network_id: 80002,
      gas: 5500000,
      gasPrice: 35000000000, // 35 Gwei
      confirmations: 2,
      timeoutBlocks: 500,
      skipDryRun: true,
      networkCheckTimeout: 10000000, // 10,000 seconds
      deploymentPollingInterval: 30000 // Check deployment status every 30s
    },
  },

  compilers: {
    solc: {
      version: "0.8.19",
    }
  },
};