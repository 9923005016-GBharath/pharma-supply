const { ethers } = require('ethers');
const contractData = require('./contractABI.json');
const contractABI = contractData.abi;

// Configuration
const PROVIDER_URL = 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// Demo accounts (from Hardhat) - MATCHING demo-use-case.js
const FDA_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const SUPPLIER_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const MANUFACTURER_KEY = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
const REPACKAGER_KEY = '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6';
const DISTRIBUTOR_KEY = '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a';
const PHARMACY_KEY = '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba';

const FDA_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const SUPPLIER_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const MANUFACTURER_ADDRESS = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
const REPACKAGER_ADDRESS = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
const DISTRIBUTOR_ADDRESS = '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65';
const PHARMACY_ADDRESS = '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc';

// Drug names pool
const DRUG_NAMES = [
    'Aspirin', 'Ibuprofen', 'Amoxicillin', 'Paracetamol', 'Metformin',
    'Lisinopril', 'Atorvastatin', 'Omeprazole', 'Levothyroxine', 'Amlodipine',
    'Metoprolol', 'Losartan', 'Gabapentin', 'Sertraline', 'Simvastatin'
];

// Location pool
const LOCATIONS = [
    'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
    'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA',
    'Austin, TX', 'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC'
];

// GPS coordinates for locations
const GPS_COORDS = {
    'New York, NY': { lat: 40.7128, lng: -74.0060 },
    'Los Angeles, CA': { lat: 34.0522, lng: -118.2437 },
    'Chicago, IL': { lat: 41.8781, lng: -87.6298 },
    'Houston, TX': { lat: 29.7604, lng: -95.3698 },
    'Phoenix, AZ': { lat: 33.4484, lng: -112.0740 },
    'Philadelphia, PA': { lat: 39.9526, lng: -75.1652 },
    'San Antonio, TX': { lat: 29.4241, lng: -98.4936 },
    'San Diego, CA': { lat: 32.7157, lng: -117.1611 },
    'Dallas, TX': { lat: 32.7767, lng: -96.7970 },
    'San Jose, CA': { lat: 37.3382, lng: -121.8863 },
    'Austin, TX': { lat: 30.2672, lng: -97.7431 },
    'Jacksonville, FL': { lat: 30.3322, lng: -81.6557 },
    'Fort Worth, TX': { lat: 32.7555, lng: -97.3308 },
    'Columbus, OH': { lat: 39.9612, lng: -82.9988 },
    'Charlotte, NC': { lat: 35.2271, lng: -80.8431 }
};

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

// Helper functions
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomElement(array) {
    return array[randomInt(0, array.length - 1)];
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate IoT data
async function generateIoTData(batchId, location, shouldTriggerAlert = false) {
    const gps = GPS_COORDS[location];
    let temperature, humidity, pressure;
    
    if (shouldTriggerAlert) {
        // Generate out-of-range values to trigger alerts
        const alertType = randomInt(0, 2);
        if (alertType === 0) {
            temperature = randomFloat(-15, -11); // Too cold
        } else if (alertType === 1) {
            temperature = randomFloat(26, 30); // Too hot
        } else {
            temperature = randomFloat(15, 25); // Normal temp
        }
        
        humidity = alertType === 1 ? randomInt(75, 90) : randomInt(40, 70);
        pressure = randomInt(98, 103);
    } else {
        // Normal ranges
        temperature = randomFloat(15, 25);
        humidity = randomInt(40, 70);
        pressure = randomInt(98, 103);
    }
    
    const tamperDetected = shouldTriggerAlert && randomInt(0, 10) > 8;
    
    return {
        location: `${location}|GPS:${gps.lat},${gps.lng}`,
        temperature: Math.round(temperature * 100), // Convert to int (Celsius * 100)
        humidity: humidity,
        pressure: pressure,
        tamperDetected: tamperDetected
    };
}

// Create a complete batch workflow
async function createCompleteBatch(drugName, batchIndex, generateAlerts = false) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Creating Batch #${batchIndex}: ${drugName}`);
    console.log('='.repeat(60));
    
    const batchId = `${drugName.toUpperCase()}-${Date.now()}-${batchIndex}`;
    const location1 = randomElement(LOCATIONS);
    const location2 = randomElement(LOCATIONS.filter(l => l !== location1));
    const location3 = randomElement(LOCATIONS.filter(l => l !== location1 && l !== location2));
    
    try {
        // Step 1: Supplier creates batch
        console.log(`\n[1/8] Supplier creating batch ${batchId}...`);
        const supplierSigner = new ethers.Wallet(SUPPLIER_KEY, provider);
        const supplierContract = contract.connect(supplierSigner);
        let tx = await supplierContract.createDrugBatch(batchId, drugName);
        await tx.wait();
        console.log('✅ Batch created');
        
        // Add IoT data at supplier
        await sleep(500);
        const iotData1 = await generateIoTData(batchId, location1, false);
        tx = await supplierContract.logIoTData(
            batchId, iotData1.location, iotData1.temperature, 
            iotData1.humidity, iotData1.pressure, iotData1.tamperDetected
        );
        await tx.wait();
        console.log(`📡 IoT logged at ${location1}`);
        
        // Step 2: Transfer to Manufacturer
        await sleep(500);
        console.log(`\n[2/8] Transferring to Manufacturer...`);
        tx = await supplierContract.transferToManufacturer(batchId, MANUFACTURER_ADDRESS);
        await tx.wait();
        console.log('✅ Transferred to Manufacturer');
        
        // Step 3: FDA Approval
        await sleep(500);
        console.log(`\n[3/8] FDA reviewing batch...`);
        const fdaSigner = new ethers.Wallet(FDA_KEY, provider);
        const fdaContract = contract.connect(fdaSigner);
        tx = await fdaContract.approveDrug(batchId, 'FDA Approved - All quality checks passed');
        await tx.wait();
        console.log('✅ FDA Approved');
        
        // Add IoT data at manufacturer
        await sleep(500);
        const manufacturerSigner = new ethers.Wallet(MANUFACTURER_KEY, provider);
        const manufacturerContract = contract.connect(manufacturerSigner);
        const iotData2 = await generateIoTData(batchId, location2, generateAlerts && randomInt(0, 2) === 0);
        tx = await manufacturerContract.logIoTData(
            batchId, iotData2.location, iotData2.temperature, 
            iotData2.humidity, iotData2.pressure, iotData2.tamperDetected
        );
        await tx.wait();
        console.log(`📡 IoT logged at ${location2}${iotData2.temperature < -1000 || iotData2.temperature > 2500 ? ' ⚠️ ALERT' : ''}`);
        
        // Step 4: Manufacture
        await sleep(500);
        console.log(`\n[4/8] Manufacturing drug...`);
        tx = await manufacturerContract.manufactureDrug(batchId);
        await tx.wait();
        console.log('✅ Drug manufactured');
        
        // Step 5: Transfer to Repackager
        await sleep(500);
        console.log(`\n[5/8] Transferring to Repackager...`);
        tx = await manufacturerContract.transferToRepackager(batchId, REPACKAGER_ADDRESS, location3);
        await tx.wait();
        console.log('✅ Transferred to Repackager');
        
        // Add IoT data at repackager
        await sleep(500);
        const repackagerSigner = new ethers.Wallet(REPACKAGER_KEY, provider);
        const repackagerContract = contract.connect(repackagerSigner);
        const iotData3 = await generateIoTData(batchId, location3, generateAlerts && randomInt(0, 3) === 0);
        tx = await repackagerContract.logIoTData(
            batchId, iotData3.location, iotData3.temperature, 
            iotData3.humidity, iotData3.pressure, iotData3.tamperDetected
        );
        await tx.wait();
        console.log(`📡 IoT logged at ${location3}${iotData3.temperature < -1000 || iotData3.temperature > 2500 ? ' ⚠️ ALERT' : ''}`);
        
        // Step 6: Transfer to Distributor
        await sleep(500);
        console.log(`\n[6/8] Transferring to Distributor...`);
        const distributorSigner = new ethers.Wallet(DISTRIBUTOR_KEY, provider);
        tx = await repackagerContract.transferToDistributor(batchId, DISTRIBUTOR_ADDRESS, location1);
        await tx.wait();
        console.log('✅ Transferred to Distributor');
        
        // Add more IoT data at distributor
        await sleep(500);
        const distributorContract = contract.connect(distributorSigner);
        const iotData4 = await generateIoTData(batchId, location1, generateAlerts && randomInt(0, 4) === 0);
        tx = await distributorContract.logIoTData(
            batchId, iotData4.location, iotData4.temperature, 
            iotData4.humidity, iotData4.pressure, iotData4.tamperDetected
        );
        await tx.wait();
        console.log(`📡 IoT logged at ${location1}${iotData4.temperature < -1000 || iotData4.temperature > 2500 ? ' ⚠️ ALERT' : ''}`);
        
        // Step 7: Transfer to Pharmacy (Final step - sets status to DISPENSED)
        await sleep(500);
        console.log(`\n[7/7] Transferring to Pharmacy...`);
        tx = await distributorContract.transferToPharmacy(batchId, PHARMACY_ADDRESS, location2);
        await tx.wait();
        console.log('✅ Transferred to Pharmacy');
        
        // Add final IoT data at pharmacy
        await sleep(500);
        const pharmacySigner = new ethers.Wallet(PHARMACY_KEY, provider);
        const pharmacyContract = contract.connect(pharmacySigner);
        const iotData5 = await generateIoTData(batchId, location2, false); // No alerts at final stage
        tx = await pharmacyContract.logIoTData(
            batchId, iotData5.location, iotData5.temperature, 
            iotData5.humidity, iotData5.pressure, iotData5.tamperDetected
        );
        await tx.wait();
        console.log(`📡 IoT logged at ${location2}`);
        
        console.log(`\n✅ Batch ${batchId} completed successfully! (Status: DISPENSED)`);
        return true;
    } catch (error) {
        console.error(`❌ Error creating batch ${batchId}:`, error.message);
        return false;
    }
}

// Register all users
async function registerUsers() {
    console.log('\n👥 Registering users...');
    
    try {
        // Use first Hardhat account (deployer) to register users
        const deployerKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
        const deployerSigner = new ethers.Wallet(deployerKey, provider);
        const deployerContract = contract.connect(deployerSigner);
        
        const usersToRegister = [
            { address: FDA_ADDRESS, name: 'FDA', role: 1 },
            { address: SUPPLIER_ADDRESS, name: 'Ingredient Supplier', role: 2 },
            { address: MANUFACTURER_ADDRESS, name: 'Manufacturer', role: 3 },
            { address: REPACKAGER_ADDRESS, name: 'Repackager', role: 4 },
            { address: DISTRIBUTOR_ADDRESS, name: 'Distributor', role: 5 },
            { address: PHARMACY_ADDRESS, name: 'Pharmacy', role: 6 }
        ];
        
        for (const user of usersToRegister) {
            try {
                const tx = await deployerContract.registerUser(user.address, user.name, user.role);
                await tx.wait();
                console.log(`✅ ${user.name} registered`);
            } catch (e) {
                if (e.message.includes('already registered')) {
                    console.log(`ℹ️  ${user.name} already registered`);
                } else {
                    console.log(`⚠️  ${user.name} registration error:`, e.message.substring(0, 100));
                }
            }
        }
        
        console.log('✅ All users registered!\n');
    } catch (error) {
        console.error('❌ Error registering users:', error.message);
        throw error;
    }
}

// Main execution
async function main() {
    console.log('\n🚀 Starting Demo Data Generation...\n');
    console.log('📋 Configuration:');
    console.log(`   - Contract: ${CONTRACT_ADDRESS}`);
    console.log(`   - Provider: ${PROVIDER_URL}`);
    console.log(`   - Drugs: ${DRUG_NAMES.length} types`);
    console.log(`   - Locations: ${LOCATIONS.length} cities\n`);
    
    // Register users first
    await registerUsers();
    
    const numBatches = parseInt(process.argv[2]) || 5;
    const includeAlerts = process.argv[3] === 'alerts';
    
    console.log(`📦 Creating ${numBatches} demo batches${includeAlerts ? ' with alerts' : ''}...\n`);
    
    let successCount = 0;
    
    for (let i = 1; i <= numBatches; i++) {
        const drugName = randomElement(DRUG_NAMES);
        const generateAlerts = includeAlerts && randomInt(0, 2) === 0; // 33% chance of alerts
        
        const success = await createCompleteBatch(drugName, i, generateAlerts);
        if (success) successCount++;
        
        // Wait between batches
        if (i < numBatches) {
            console.log(`\n⏳ Waiting before next batch...\n`);
            await sleep(2000);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Demo Data Generation Complete!');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created: ${successCount}/${numBatches} batches`);
    console.log(`📊 Total transactions: ~${successCount * 8}`);
    console.log(`📡 Total IoT logs: ~${successCount * 5}`);
    if (includeAlerts) {
        console.log(`⚠️  Alerts generated: Random (check dashboard)`);
    }
    console.log('\n💡 You can now:');
    console.log('   1. Login to the dashboard');
    console.log('   2. View all batches in Dashboard tab');
    console.log('   3. Track individual batches in Track Batch tab');
    console.log('   4. Monitor IoT data in IoT Monitoring tab');
    console.log('   5. Check alerts in Alerts tab\n');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
