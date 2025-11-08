const { ethers } = require("hardhat");

async function main() {
    // Get the wallet address to fund from command line or use default
    const walletToFund = process.argv[2] || "0xcab93bb3f78CB9364Ea722A817e5b12Df3D25CEA";
    
    // Get one of Hardhat's default accounts (has 10000 ETH)
    const [funder] = await ethers.getSigners();
    
    console.log("💰 Funding Wallet...");
    console.log("From:", funder.address);
    console.log("To:", walletToFund);
    
    // Send 100 ETH to the wallet
    const tx = await funder.sendTransaction({
        to: walletToFund,
        value: ethers.parseEther("100")
    });
    
    await tx.wait();
    
    console.log("✅ Sent 100 ETH");
    console.log("Transaction hash:", tx.hash);
    
    // Check balance
    const balance = await ethers.provider.getBalance(walletToFund);
    console.log("New balance:", ethers.formatEther(balance), "ETH");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
