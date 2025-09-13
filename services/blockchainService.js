// services/blockchainService.js

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// --- ES Module equivalent for __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. Load Contract Artifacts ---
const contractArtifactPath = path.resolve(
  __dirname,
  '../build/contracts/EventTicket.json'
);
const contractArtifact = JSON.parse(fs.readFileSync(contractArtifactPath));
const contractAbi = contractArtifact.abi;
const contractAddress = process.env.CONTRACT_ADDRESS;
console.log("Using Contract Address:", contractAddress);

// --- 2. Setup Provider and Wallet ---
const provider = new ethers.JsonRpcProvider(process.env.GANACHE_RPC_URL);
const wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);

// --- 3. Create Contract Instance ---
const eventTicketContract = new ethers.Contract(
  contractAddress,
  contractAbi,
  wallet
);

console.log('✅ Blockchain Service Initialized: Connected to EventTicket contract.');

// --- 4. Export Service Functions ---

/**
 * Mints a new NFT ticket and assigns it to the attendee.
 * @param {string} attendeeAddress - The wallet address of the ticket buyer.
 * @returns {Promise<number>} The ID of the newly minted token.
 */
export const mintTicket = async (attendeeAddress) => {
  try {
    console.log(`Minting ticket for attendee: ${attendeeAddress}...`);
    const tx = await eventTicketContract.mintTicket(attendeeAddress);

    // Wait for the transaction to be mined and get the receipt
    const receipt = await tx.wait();

    // Find the Transfer event in the transaction logs
    const transferEvent = receipt.logs.find(log => {
        try {
            const parsedLog = eventTicketContract.interface.parseLog(log);
            return parsedLog?.name === 'Transfer';
        } catch (error) {
            // This log might not be from our contract, so we ignore parse errors
            return false;
        }
    });

    if (!transferEvent) {
      throw new Error('Minting failed, Transfer event not found in logs.');
    }

    // Parse the found event to get the arguments
    const parsedLog = eventTicketContract.interface.parseLog(transferEvent);
    const tokenId = Number(parsedLog.args.tokenId); // Convert BigInt to Number

    console.log(`✅ Ticket minted successfully! Token ID: ${tokenId}`);
    return tokenId;

  } catch (error) {
    console.error('❌ Error minting ticket:', error);
    throw error;
  }
};


/**
 * Marks a specific ticket as used on the blockchain.
 * @param {number} tokenId - The ID of the ticket to be marked as used.
 * @returns {Promise<void>}
 */
export const markAsUsed = async (tokenId) => {
  try {
    console.log(`Marking token ${tokenId} as used...`);
    const tx = await eventTicketContract.markAsUsed(tokenId);
    await tx.wait(); // Wait for the transaction to be mined
    console.log(`✅ Token ${tokenId} successfully marked as used.`);
  } catch (error) {
    console.error(`❌ Error marking token ${tokenId} as used:`, error);
    throw error;
  }
};
