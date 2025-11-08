const axios = require('axios');
const ethers = require('ethers');

async function checkDistributorNotifications() {
    console.log('=== DISTRIBUTOR NOTIFICATIONS CHECK ===\n');
    
    // Get distributor address
    const fs = require('fs');
    const users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
    const distributor = users.find(u => u.role === 5);
    
    if (!distributor) {
        console.log('❌ No distributor registered in system!');
        console.log('Please sign up a user with Role 5 (Distributor)');
        return;
    }
    
    console.log('Distributor Info:');
    console.log('  Email:', distributor.email);
    console.log('  Address:', distributor.address);
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
            console.log(`  Owner matches distributor: ${currentOwner.toLowerCase() === distributor.address.toLowerCase()}`);
            
            // Check if distributor should see notification
            if (currentOwner.toLowerCase() === distributor.address.toLowerCase()) {
                if (status === 6) { // REPACKAGED - Just received from repackager
                    console.log(`  🔔 NOTIFICATION: Batch Received from Repackager`);
                    notificationsFound++;
                }
                if (status === 7) { // DISTRIBUTED - Ready to transfer to pharmacy
                    console.log(`  🔔 NOTIFICATION: Batch Ready for Pharmacy Transfer`);
                    notificationsFound++;
                }
            } else {
                console.log(`  ❌ No notification - Distributor doesn't own this batch`);
            }
            console.log('');
        } catch (err) {
            console.log(`Error checking ${batchId}:`, err.message);
            console.log('');
        }
    }
    
    console.log('=== SUMMARY ===');
    console.log(`Total batches: ${batchIds.length}`);
    console.log(`Notifications for distributor: ${notificationsFound}`);
    
    if (notificationsFound === 0) {
        console.log('');
        console.log('⚠️ NO NOTIFICATIONS FOUND');
        console.log('');
        console.log('Possible reasons:');
        console.log('1. Distributor doesn\'t own any batches');
        console.log('2. No batches have been repackaged yet (status 6)');
        console.log('3. Batches not transferred to distributor yet');
        console.log('');
        console.log('SUPPLY CHAIN FLOW:');
        console.log('Supplier → Manufacturer → Repackager → DISTRIBUTOR → Pharmacy');
        console.log('');
        console.log('Current distributor address:', distributor.address);
        console.log('');
        console.log('TO FIX:');
        console.log('1. Complete workflow up to Repackager');
        console.log('2. Repackager transfers to distributor');
        console.log('3. Distributor will see notification');
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

checkDistributorNotifications().catch(console.error);
