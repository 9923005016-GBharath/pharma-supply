const fs = require('fs');
const ethers = require('ethers');

async function checkAllUsers() {
    try {
        // Load users from file
        const users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
        
        // Connect to blockchain
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const artifact = require('./contractABI.json');
        const contract = new ethers.Contract('0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', artifact.abi, provider);
        
        console.log('=== CHECKING ALL USERS ===\n');
        
        for (const user of users) {
            try {
                const blockchainUser = await contract.users(user.address);
                const isRegistered = blockchainUser[0] !== '0x0000000000000000000000000000000000000000';
                
                console.log(`Email: ${user.email}`);
                console.log(`  Local Role: ${user.role} (${getRoleName(user.role)})`);
                console.log(`  Address: ${user.address}`);
                console.log(`  Blockchain Registered: ${isRegistered}`);
                
                if (isRegistered) {
                    console.log(`  Blockchain Name: ${blockchainUser[1]}`);
                    console.log(`  Blockchain Role: ${blockchainUser[2].toString()}`);
                    console.log(`  Active: ${blockchainUser[3]}`);
                    
                    const rolesMatch = parseInt(blockchainUser[2]) === user.role;
                    if (rolesMatch) {
                        console.log(`  ✅ Roles Match - User can perform blockchain operations`);
                    } else {
                        console.log(`  ⚠️ WARNING: Role mismatch! Local=${user.role}, Blockchain=${blockchainUser[2]}`);
                    }
                } else {
                    console.log(`  ❌ NOT REGISTERED ON BLOCKCHAIN - User will get "Unauthorized role" errors`);
                }
                console.log('');
            } catch (err) {
                console.log(`Error checking ${user.email}:`, err.message);
                console.log('');
            }
        }
        
        console.log('=== SUMMARY ===');
        console.log(`Total users in system: ${users.length}`);
        
        // Check for registered users
        let registeredCount = 0;
        for (const user of users) {
            try {
                const blockchainUser = await contract.users(user.address);
                const isRegistered = blockchainUser[0] !== '0x0000000000000000000000000000000000000000';
                if (isRegistered) registeredCount++;
            } catch (err) {
                // Skip
            }
        }
        
        console.log(`Registered on blockchain: ${registeredCount}`);
        console.log(`Not registered: ${users.length - registeredCount}`);
        
        if (registeredCount < users.length) {
            console.log('\n⚠️ ISSUE DETECTED: Some users are not registered on blockchain!');
            console.log('These users will face "Unauthorized role" errors when trying to perform actions.');
            console.log('\nSOLUTION: Users need to logout and signup again to get properly registered.');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

function getRoleName(role) {
    const roles = {
        0: 'Patient',
        1: 'FDA',
        2: 'Supplier',
        3: 'Manufacturer',
        4: 'Repackager',
        5: 'Distributor',
        6: 'Pharmacy'
    };
    return roles[role] || 'Unknown';
}

checkAllUsers();
