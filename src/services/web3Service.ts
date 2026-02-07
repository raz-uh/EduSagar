
import { ethers } from 'ethers';

// Soulbound Academic Credit ABI (Non-transferable ERC20-like)
const ACADEMIC_CREDIT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function totalCredits(address) view returns (uint256)", // Non-transferable total
  "event AchievementUnlocked(address indexed student, string achievementId, uint256 amount)"
];

const ACADEMIC_CREDIT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

export async function linkAcademicID() {
  if (!(window as any).ethereum) {
    alert("Please access via a secure browser or install a Digital Identity extension.");
    return null;
  }
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  return accounts[0];
}

export async function getAcademicCredits(address: string) {
  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const contract = new ethers.Contract(ACADEMIC_CREDIT_ADDRESS, ACADEMIC_CREDIT_ABI, provider);
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.warn("Offline: Using local achievement cache.");
    return null;
  }
}

export async function verifyAchievementOnChain(address: string, achievementId: string) {
  console.log(`Verifying soulbound achievement ${achievementId} for ${address} on decentralized ledger...`);
  // This simulates a gasless transaction or meta-transaction for the student
  return { 
    id: "SB-" + Math.random().toString(36).slice(2, 11).toUpperCase(),
    timestamp: new Date().toISOString() 
  };
}
