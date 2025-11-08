const axios = require('axios');
const ethers = require('ethers');

async function checkPharmacyNotifications() {
    console.log('=== PHARMACY NOTIFICATIONS CHECK ===\n');
    
    // Get pharmacy address
    const fs = require('fs');
    const users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
    const pharmacy = users.find(u => u.role === 6);
    
    if (!pharmacy) {
        console.log('❌ No pharmacy registered in system!');
        console.log('Please sign up a user with Role 6 (Pharmacy)');
        return;
    }
    
    console.log('Pharmacy Info:');
    console.log('  Email:', pharmacy.email);
    console.log('  Address:', pharmacy.address);
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
            console.log(`  Owner matches pharmacy: ${currentOwner.toLowerCase() === pharmacy.address.toLowerCase()}`);
            
            // Check if pharmacy should see notification
            if (currentOwner.toLowerCase() === pharmacy.address.toLowerCase()) {
                if (status === 7) { // DISTRIBUTED - Just received from distributor
                    console.log(`  🔔 NOTIFICATION: Batch Received from Distributor - Ready to Dispense`);
                    notificationsFound++;
                }
                if (status === 8) { // DISPENSED
                    console.log(`  🔔 NOTIFICATION: Batch Dispensed to Patient`);
                    notificationsFound++;
                }
            } else {
                console.log(`  ❌ No notification - Pharmacy doesn't own this batch`);
            }
            console.log('');
        } catch (err) {
            console.log(`Error checking ${batchId}:`, err.message);
            console.log('');
        }
    }
    
    console.log('=== SUMMARY ===');
    console.log(`Total batches: ${batchIds.length}`);
    console.log(`Notifications for pharmacy: ${notificationsFound}`);
    
    if (notificationsFound === 0) {
        console.log('');
        console.log('⚠️ NO NOTIFICATIONS FOUND');
        console.log('');
        console.log('Possible reasons:');
        console.log('1. Pharmacy doesn\'t own any batches');
        console.log('2. No batches have been distributed yet (status 7)');
        console.log('3. Batches not transferred to pharmacy yet');
        console.log('');
        console.log('COMPLETE SUPPLY CHAIN FLOW:');
        console.log('Supplier → Manufacturer → Repackager → Distributor → PHARMACY → Patient');
        console.log('');
        console.log('Current pharmacy address:', pharmacy.address);
        console.log('');
        console.log('TO FIX:');
        console.log('1. Refresh frontend (F5) to load dropdown system');
        console.log('2. Complete full workflow from Supplier to Distributor');
        console.log('3. Distributor transfers to Pharmacy using dropdown');
        console.log('4. Pharmacy will see notification: "Batch Received - Ready to Dispense"');
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

checkPharmacyNotifications().catch(console.error);
