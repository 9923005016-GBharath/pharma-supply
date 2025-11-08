const axios = require('axios');
const ethers = require('ethers');

async function checkManufacturerNotifications() {
    console.log('=== MANUFACTURER NOTIFICATIONS CHECK ===\n');
    
    // Get manufacturer address
    const fs = require('fs');
    const users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
    const manufacturer = users.find(u => u.role === 3);
    
    console.log('Manufacturer Info:');
    console.log('  Email:', manufacturer.email);
    console.log('  Address:', manufacturer.address);
    console.log('');
    
    // Get all transactions
    const res = await axios.get('http://localhost:3001/api/transactions');
    const transactions = res.data.transactions;
    
    console.log('Total transactions:', transactions.length);
    console.log('');
    
    // Get unique batch IDs
    const batchIds = [...new Set(transactions.map(t => t.batchId))];
    console.log('Batches found:', batchIds.join(', '));
    console.log('');
    
    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const artifact = require('./contractABI.json');
    const contract = new ethers.Contract('0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', artifact.abi, provider);
    
    console.log('=== CHECKING EACH BATCH ===\n');
    
    let notificationsFound = 0;
    
    for (const batchId of batchIds) {
        try {
            const drug = await contract.drugs(batchId);
            const currentOwner = drug[2]; // currentOwner
            const status = parseInt(drug[3]); // status
            
            console.log(`Batch: ${batchId}`);
            console.log(`  Current Owner: ${currentOwner}`);
            console.log(`  Status: ${status} (${getStatusName(status)})`);
            console.log(`  Owner matches manufacturer: ${currentOwner.toLowerCase() === manufacturer.address.toLowerCase()}`);
            
            // Check if manufacturer should see notification
            if (currentOwner.toLowerCase() === manufacturer.address.toLowerCase()) {
                if (status === 2) { // FDA_PENDING
                    console.log(`  🔔 NOTIFICATION: Batch Received - Waiting for FDA approval`);
                    notificationsFound++;
                }
                if (status === 3) { // FDA_APPROVED
                    console.log(`  🔔 NOTIFICATION: FDA Approved - Action Required (Manufacture Drug)`);
                    notificationsFound++;
                }
            } else {
                console.log(`  ❌ No notification - Manufacturer doesn't own this batch`);
            }
            console.log('');
        } catch (err) {
            console.log(`Error checking ${batchId}:`, err.message);
            console.log('');
        }
    }
    
    console.log('=== SUMMARY ===');
    console.log(`Total batches: ${batchIds.length}`);
    console.log(`Notifications for manufacturer: ${notificationsFound}`);
    
    if (notificationsFound === 0) {
        console.log('');
        console.log('⚠️ NO NOTIFICATIONS FOUND');
        console.log('');
        console.log('Possible reasons:');
        console.log('1. Manufacturer doesn\'t own any batches');
        console.log('2. Batches owned by manufacturer are not FDA_PENDING or FDA_APPROVED status');
        console.log('3. Batches not transferred to manufacturer yet');
        console.log('');
        console.log('TO FIX:');
        console.log('1. Login as Supplier');
        console.log('2. Create a new batch');
        console.log('3. Transfer batch to manufacturer address:', manufacturer.address);
        console.log('4. Request FDA approval');
        console.log('5. Login as FDA and approve');
        console.log('6. NOW manufacturer will see notification');
    }
}

function getStatusName(status) {
    const names = [
        'NONE',
        'INGREDIENTS_SUPPLIED',
        'FDA_PENDING',
        'FDA_APPROVED',
        'MANUFACTURED',
        'REPACKAGED',
        'DISTRIBUTED',
        'DISPENSED'
    ];
    return names[status] || 'UNKNOWN';
}

checkManufacturerNotifications().catch(console.error);
