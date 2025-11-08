const ethers = require('ethers');

async function clearBlockchainData() {
    console.log('=== CLEARING BLOCKCHAIN DATA ===\n');
    console.log('⚠️  WARNING: This will clear all batches and transactions');
    console.log('Users will remain registered on blockchain\n');
    
    try {
        // Connect to blockchain
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const artifact = require('./contractABI.json');
        
        // Use the default Hardhat account with lots of ETH
        const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
        const signer = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract('0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', artifact.abi, signer);
        
        console.log('Connected to blockchain');
        console.log('Contract address:', contract.target);
        console.log('');
        
        // Get current batches
        const batches = ['BATCH1', 'BATCH2', 'BATCH3', 'BATCH4', 'BATCH5', 'BATCH6', 'batch1'];
        
        console.log('Checking batches...');
        for (const batchId of batches) {
            try {
                const drug = await contract.drugs(batchId);
                if (drug[5]) { // exists
                    console.log(`  Found: ${batchId} (Owner: ${drug[2]}, Status: ${drug[3]})`);
                }
            } catch (err) {
                // Batch doesn't exist
            }
        }
        
        console.log('');
        console.log('⚠️  IMPORTANT NOTES:');
        console.log('');
        console.log('1. Blockchain data is IMMUTABLE - we cannot delete transactions');
        console.log('2. Old batches will remain on the blockchain permanently');
        console.log('3. SOLUTION: Simply create NEW batches with new names');
        console.log('');
        console.log('✅ RECOMMENDED APPROACH:');
        console.log('');
        console.log('Instead of deleting (which is impossible on blockchain),');
        console.log('create NEW batches with clear names:');
        console.log('  - TEST_BATCH_001');
        console.log('  - TEST_BATCH_002');
        console.log('  - FINAL_TEST_001');
        console.log('');
        console.log('Old batches will be ignored since they are owned by old accounts.');
        console.log('Your notification system will ONLY show batches you OWN.');
        console.log('');
        console.log('🎯 ALTERNATIVE: Restart Hardhat Network (Nuclear Option)');
        console.log('');
        console.log('To completely reset the blockchain:');
        console.log('1. Stop Hardhat node (Ctrl+C in the terminal running it)');
        console.log('2. Delete: node_modules/.hardhat/');
        console.log('3. Restart: npx hardhat node');
        console.log('4. Redeploy contract: npx hardhat run scripts/deploy.js --network localhost');
        console.log('5. Update CONTRACT_ADDRESS in backend/.env');
        console.log('6. Re-register all users (they will need to sign up again)');
        console.log('');
        console.log('⚠️  This is DRASTIC and will require re-setup of everything!');
        console.log('');
        console.log('💡 EASIEST SOLUTION: Just use the NEW dropdown system');
        console.log('   Old batches will be invisible to your new workflow!');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

clearBlockchainData();
