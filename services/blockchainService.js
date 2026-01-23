// services/blockchainService.js
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// --- 1. SETUP FILE PATHS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 2. CONFIGURATION ---
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

if (!RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
    console.error("❌ CRITICAL: Blockchain Config Missing. Check .env");
    // We don't exit here so the server can still run for non-blockchain tasks
}

// --- 3. INITIALIZE CONNECTION ---
let contract;

try {
    // Connect to Polygon (or Ganache)
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // Load the Contract ABI
    // This file was created by 'npx truffle migrate'
    const contractPath = path.resolve(__dirname, '../build/contracts/EventTicket.json');

    if (fs.existsSync(contractPath)) {
        const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        contract = new ethers.Contract(CONTRACT_ADDRESS, contractJson.abi, wallet);
        console.log(`🔗 Blockchain Connected.`);
        console.log(`   Target: ${RPC_URL}`);
        console.log(`   Contract: ${CONTRACT_ADDRESS}`);
    } else {
        console.error("⚠️  Contract JSON not found. Run 'npx truffle migrate' first.");
    }
} catch (e) {
    console.error("❌ Blockchain Connection Error:", e.message);
}

// --- 4. CORE FUNCTIONS ---

// @desc    Mints a new NFT ticket
export const mintTicket = async (attendeeAddress) => {
    console.log(`⛏️  Minting for: ${attendeeAddress}...`);

    if (!contract) {
        throw new Error("Blockchain disconnected.");
    }

    try {
        // 1. BROADCAST
        // We override timeout to 60s to handle slow networks
        const tx = await contract.mintTicket(attendeeAddress, { timeout: 60000 });

        console.log(`🚀 Transaction sent! Hash: ${tx.hash}`);

        // 2. OPTIMISTIC CONFIRMATION
        // We wait for 1 block. If it times out, we assume success because the hash exists.
        try {
            const receipt = await tx.wait(1);
            // Attempt to parse Token ID
            let tokenId = null;
            if (receipt.logs) {
                for (const log of receipt.logs) {
                    try {
                        const parsedLog = contract.interface.parseLog(log);
                        if (parsedLog && parsedLog.name === 'Transfer') {
                            tokenId = parsedLog.args[2].toString();
                            break;
                        }
                    } catch (e) {}
                }
            }
            const finalId = tokenId || tx.hash;
            console.log(`✅ Confirmed! Token ID: ${finalId}`);
            return finalId;

        } catch (waitError) {
            console.warn(`⚠️ Wait timed out, but transaction was sent. Hash: ${tx.hash}`);
            return tx.hash; // Return hash as fallback ID
        }

    } catch (error) {
        console.error("❌ Minting Failed:", error.message);
        throw error;
    }
};

export const markAsUsed = async (tokenId) => {
    // For V1.1/V2.0, we rely on MongoDB for status to keep it fast and free.
    // Real on-chain invalidation would cost gas.
    console.log(`🎫 Ticket ${tokenId} usage logged (Off-chain).`);
    return true;
};