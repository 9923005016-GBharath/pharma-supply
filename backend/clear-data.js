const { ethers } = require('ethers');

// Connect to Hardhat network
const provider = new ethers.JsonRpcProvider('http://localhost:8545');

async function clearData() {
    try {
        console.log('🔄 Clearing blockchain data...\n');
        
        // Stop Hardhat node (data will be cleared on restart)
        console.log('⚠️  To clear all data:');
        console.log('   1. Stop the Hardhat node (Ctrl+C in the Hardhat terminal)');
        console.log('   2. Restart it: npx hardhat node');
        console.log('   3. Redeploy contract: npx hardhat run scripts/deploy.js --network localhost');
        console.log('   4. Update contract address in backend files');
        console.log('   5. Restart backend server\n');
        
        // Check current state
        const blockNumber = await provider.getBlockNumber();
        console.log(`📊 Current block number: ${blockNumber}`);
        
        if (blockNumber > 1) {
            console.log('✅ Data exists on the blockchain');
            console.log('⚠️  Follow the steps above to clear it completely');
        } else {
            console.log('✅ Blockchain is fresh (no data)');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

clearData();
