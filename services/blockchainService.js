// services/blockchainService.js

import { ethers } from 'ethers';
import EventTicket from '../build/contracts/EventTicket.json' with { type: 'json' };
import dotenv from 'dotenv'; // <-- 1. IMPORT the dotenv library

// --- THIS IS THE CRITICAL FIX ---
// We load the environment variables directly in this file.
// This ensures they are available before any other code in this file runs.
dotenv.config();

// --- Secure Configuration from .env file ---
const ganacheUrl = process.env.GANACHE_RPC_URL;
const privateKey = process.env.OWNER_PRIVATE_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;

// This safety check will now work correctly.
if (!ganacheUrl || !privateKey || !contractAddress) {
  throw new Error("Missing required blockchain environment variables (GANACHE_RPC_URL, OWNER_PRIVATE_KEY, CONTRACT_ADDRESS) in .env file.");
}

// --- Initialize the blockchain connection ---
const provider = new ethers.JsonRpcProvider(ganacheUrl);
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, EventTicket.abi, wallet);


// @desc    Mints a new NFT ticket on the blockchain
export const mintTicket = async (attendeeAddress) => {
  console.log(`Minting ticket for attendee: ${attendeeAddress}...`);
  try {
    const tx = await contract.mintTicket(attendeeAddress);
    const receipt = await tx.wait(); // Fix for nonce error
    const tokenId = receipt.logs[0].args[2].toString();
    console.log(`✅ Ticket minted successfully! Token ID: ${tokenId}`);
    return tokenId;
  } catch (error) {
    console.error('❌ Error minting ticket:', error);
    throw new Error('Blockchain transaction failed.');
  }
};


// @desc    Marks a ticket as used on the blockchain
export const markAsUsed = async (tokenId) => {
  console.log(`Marking token ${tokenId} as used...`);
  try {
    const tx = await contract.markAsUsed(tokenId);
    await tx.wait(); // Fix for nonce error
    console.log(`✅ Token ${tokenId} successfully marked as used.`);
  } catch (error) {
    console.error(`❌ Error marking token ${tokenId} as used:`, error);
    throw new Error('Blockchain transaction failed while marking token as used.');
  }
};