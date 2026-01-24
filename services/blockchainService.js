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
// Using generic names to support both Polygon and Ganache based on .env
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
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const contractPath = path.resolve(__dirname, '../build/contracts/EventTicket.json');

    if (fs.existsSync(contractPath)) {
        const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        contract = new ethers.Contract(CONTRACT_ADDRESS, contractJson.abi, wallet);
        console.log(`🔗 Blockchain Connected.`);
    } else {
        console.error("⚠️  Contract JSON not found. Run 'npx truffle migrate' first.");
    }
} catch (e) {
    console.error("❌ Blockchain Connection Error:", e.message);
}

// --- 4. CORE FUNCTIONS ---

// @desc    Mints a new NFT ticket
// @returns Object { tokenId, txHash }
export const mintTicket = async (attendeeAddress) => {
    console.log(`⛏️  Minting for: ${attendeeAddress}...`);

    if (!contract) {
        throw new Error("Blockchain disconnected.");
    }

    try {
        // 1. BROADCAST
        const tx = await contract.mintTicket(attendeeAddress, { timeout: 60000 });
        const txHash = tx.hash;

        console.log(`🚀 Transaction sent! Hash: ${txHash}`);

        // 2. CONFIRMATION
        try {
            const receipt = await tx.wait(1);
            let tokenId = null;

            // Try to parse logs to find the Token ID
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

            const finalId = tokenId || txHash; // Fallback to hash if ID parsing fails
            console.log(`✅ Confirmed! Token ID: ${finalId}`);

            // --- RETURN BOTH ID AND HASH ---
            return { tokenId: finalId, txHash: txHash };

        } catch (waitError) {
            console.warn(`⚠️ Wait timed out, but transaction sent. Hash: ${txHash}`);
            // Return Hash for both if confirmation failed but tx sent
            return { tokenId: txHash, txHash: txHash };
        }

    } catch (error) {
        console.error("❌ Minting Failed:", error.message);
        throw error;
    }
};

export const markAsUsed = async (tokenId) => {
    console.log(`🎫 Ticket ${tokenId} usage logged (Off-chain).`);
    return true;
};