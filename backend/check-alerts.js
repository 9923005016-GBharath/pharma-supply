const { ethers } = require('ethers');
const contractABI = require('./contractABI.json').abi;

const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const contract = new ethers.Contract(contractAddress, contractABI, provider);

async function checkAlerts() {
    console.log('=== CHECKING ALERTS ===\n');
    
    try {
        // Get total alert count
        const alertCount = await contract.alertCount();
        console.log(`Total Alerts: ${alertCount}\n`);
        
        if (alertCount > 0) {
            console.log('Alert Details:');
            console.log('─────────────────────────────────────────────────');
            
            for (let i = 0; i < alertCount; i++) {
                const alert = await contract.alerts(i);
                
                console.log(`\nAlert #${i}:`);
                console.log(`  Batch ID: ${alert.batchId}`);
                console.log(`  Alert Type: ${alert.alertType} (0=Temperature, 1=Humidity, 2=Pressure, 3=Tampering, 4=Fake Transfer)`);
                console.log(`  Message: ${alert.message}`);
                console.log(`  Timestamp: ${new Date(Number(alert.timestamp) * 1000).toLocaleString()}`);
                console.log(`  Resolved: ${alert.resolved}`);
                console.log(`  Raised By: ${alert.raisedBy}`);
            }
        } else {
            console.log('❌ No alerts found in the system.');
            console.log('\nPossible reasons:');
            console.log('  1. Temperature is currently in safe range (28-33°C)');
            console.log('  2. No batches have been created yet');
            console.log('  3. ESP32 is not sending data');
            console.log('  4. Backend not processing temperature alerts');
        }
        
        // Check batches
        console.log('\n\n=== CHECKING BATCHES ===\n');
        const txCount = await contract.transactionCount();
        const batches = new Set();
        
        for (let i = 0; i < txCount; i++) {
            const tx = await contract.transactions(i);
            batches.add(tx.batchId);
        }
        
        console.log(`Total Batches: ${batches.size}`);
        if (batches.size > 0) {
            console.log('Batch IDs:', Array.from(batches).join(', '));
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkAlerts();
