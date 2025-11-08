const { ethers } = require('ethers');
require('dotenv').config();

const contractJSON = require('./contractABI.json');
const contractABI = contractJSON.abi;
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Your deployed contract

async function testAlert() {
    try {
        console.log('=== TESTING ALERT CREATION ===\n');
        
        // Connect to blockchain
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        
        // Use first account (FDA/Admin) to raise alert
        const signer = await provider.getSigner(0);
        const contractWithSigner = contract.connect(signer);
        
        console.log('Connected to contract:', contractAddress);
        console.log('Using signer:', await signer.getAddress());
        
        // Get all batches
        console.log('\n📦 Checking for batches...');
        const txCount = await contract.transactionCount();
        console.log(`Total transactions: ${txCount}`);
        
        const batches = new Set();
        for (let i = 0; i < txCount; i++) {
            const tx = await contract.transactions(i);
            batches.add(tx.batchId);
        }
        
        console.log(`Found ${batches.size} unique batches:`, Array.from(batches));
        
        if (batches.size === 0) {
            console.log('\n❌ No batches found! Create a batch first.');
            return;
        }
        
        // Create alert for first batch
        const batchId = Array.from(batches)[0];
        console.log(`\n🚨 Creating temperature alert for batch: ${batchId}`);
        
        const message = 'Test Alert: Temperature 35.5°C (Safe range: 28-33°C). Batch may be compromised!';
        
        const tx = await contractWithSigner.raiseAlert(batchId, 0, message);
        console.log('Transaction sent:', tx.hash);
        
        const receipt = await tx.wait();
        console.log('✅ Alert created successfully!');
        console.log('Gas used:', receipt.gasUsed.toString());
        
        // Get alerts
        console.log('\n📋 Fetching alerts...');
        const alertIds = await contract.getAlertsForBatch(batchId);
        console.log(`Found ${alertIds.length} alerts for batch ${batchId}`);
        
        for (let id of alertIds) {
            const alert = await contract.alerts(id);
            console.log(`\nAlert #${id}:`);
            console.log('  Type:', Number(alert.alertType));
            console.log('  Message:', alert.message);
            console.log('  Resolved:', alert.resolved);
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.message.includes('raiseAlert')) {
            console.log('\n⚠️  The smart contract may not have a raiseAlert function.');
            console.log('Check your contract code or use the correct function name.');
        }
    }
}

testAlert();
