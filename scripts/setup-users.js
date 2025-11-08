const { ethers } = require("hardhat");

async function main() {
    // Contract address from deployment
    const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    
    // Get contract ABI
    const contractJSON = require("../backend/contractABI.json");
    const contractABI = contractJSON.abi;
    
    // Get funder account (Hardhat default account with ETH)
    const [funder] = await ethers.getSigners();
    
    // Connect to contract
    const contract = new ethers.Contract(contractAddress, contractABI, funder);
    
    console.log("🔧 Setting up user accounts...\n");
    
    // User accounts from backend
    const users = [
        {
            address: "0x8C2F93A23216954e312Dc8FD2deD505F804A40b4",
            name: "chandu",
            role: 1 // FDA
        },
        {
            address: "0xcab93bb3f78CB9364Ea722A817e5b12Df3D25CEA",
            name: "bharath",
            role: 2 // Ingredient Supplier
        }
    ];
    
    // Fund and register each user
    for (const user of users) {
        console.log(`📝 Processing ${user.name}...`);
        
        // 1. Fund with ETH
        console.log(`   💰 Funding ${user.address}`);
        const fundTx = await funder.sendTransaction({
            to: user.address,
            value: ethers.parseEther("100")
        });
        await fundTx.wait();
        console.log(`   ✅ Funded with 100 ETH`);
        
        // 2. Register on blockchain
        console.log(`   📋 Registering on blockchain...`);
        try {
            const registerTx = await contract.registerUser(user.address, user.name, user.role);
            await registerTx.wait();
            console.log(`   ✅ Registered as role ${user.role}`);
        } catch (error) {
            if (error.message.includes("User already registered")) {
                console.log(`   ℹ️  Already registered`);
            } else {
                console.log(`   ❌ Error: ${error.message}`);
            }
        }
        
        // 3. Check balance
        const balance = await ethers.provider.getBalance(user.address);
        console.log(`   💵 Final balance: ${ethers.formatEther(balance)} ETH\n`);
    }
    
    console.log("✅ All users setup complete!\n");
    console.log("You can now:");
    console.log("  1. Login as bharath (Supplier) to create batches");
    console.log("  2. Login as chandu (FDA) to approve batches");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
