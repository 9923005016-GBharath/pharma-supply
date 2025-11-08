const fs = require('fs');
const ethers = require('ethers');

async function diagnoseIssue() {
    console.log('=== DIAGNOSING "Unauthorized role" ERROR ===\n');
    
    // The error showed this address was used
    const problemAddress = '0xb16763770b6EA372b40338E3874232f0BE074529';
    
    console.log('ERROR DETAILS:');
    console.log(`Address that tried to manufacture: ${problemAddress}`);
    console.log('');
    
    // Check if this address exists in users.json
    const users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
    const userInFile = users.find(u => u.address.toLowerCase() === problemAddress.toLowerCase());
    
    console.log('CHECKING users.json:');
    if (userInFile) {
        console.log(`✅ Found in users.json: ${userInFile.email}`);
    } else {
        console.log(`❌ NOT FOUND in users.json - This is an OLD account!`);
    }
    console.log('');
    
    // Check blockchain registration
    console.log('CHECKING BLOCKCHAIN:');
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const artifact = require('./contractABI.json');
    const contract = new ethers.Contract('0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', artifact.abi, provider);
    
    try {
        const blockchainUser = await contract.users(problemAddress);
        const isRegistered = blockchainUser[0] !== '0x0000000000000000000000000000000000000000';
        
        if (isRegistered) {
            console.log(`✅ Registered on blockchain`);
            console.log(`   Name: ${blockchainUser[1]}`);
            console.log(`   Role: ${blockchainUser[2].toString()}`);
            console.log(`   Active: ${blockchainUser[3]}`);
        } else {
            console.log(`❌ NOT registered on blockchain`);
        }
    } catch (err) {
        console.log(`❌ Error checking blockchain:`, err.message);
    }
    
    console.log('');
    console.log('=== DIAGNOSIS ===');
    console.log('The manufacturer account stored in the browser is from an OLD session');
    console.log('before the persistent storage update. This account exists on blockchain');
    console.log('but NOT in the current users.json file.');
    console.log('');
    console.log('=== ROOT CAUSE ===');
    console.log('When the user logged in as manufacturer before, the browser saved:');
    console.log(`  - Address: ${problemAddress}`);
    console.log(`  - Private key from that old account`);
    console.log('');
    console.log('After backend updates with persistent storage (users.json), this old');
    console.log('account data was not migrated, but browser localStorage still has it!');
    console.log('');
    console.log('=== CURRENT VALID MANUFACTURER ===');
    const currentMfg = users.find(u => u.role === 3);
    if (currentMfg) {
        console.log(`Email: ${currentMfg.email}`);
        console.log(`Address: ${currentMfg.address}`);
        console.log('');
    }
    
    console.log('=== SOLUTION ===');
    console.log('1. In the browser: Open DevTools (F12) → Application tab → Storage');
    console.log('2. Clear localStorage for this site OR');
    console.log('3. Logout completely (close tab too)');
    console.log('4. Login again with NEW credentials:');
    if (currentMfg) {
        console.log(`   - Use: ${currentMfg.email}`);
        console.log(`   - This will load the correct address: ${currentMfg.address}`);
    }
    console.log('');
    console.log('This issue affects ANY user if they logged in before the persistent');
    console.log('storage update and their browser still has old localStorage data.');
}

diagnoseIssue().catch(console.error);
