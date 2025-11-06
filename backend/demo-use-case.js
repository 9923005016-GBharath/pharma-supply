const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Account addresses and private keys from deployment
const SUPPLIER_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const SUPPLIER_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

const MANUFACTURER_ADDRESS = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
const MANUFACTURER_KEY = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';

const FDA_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const FDA_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const REPACKAGER_ADDRESS = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
const REPACKAGER_KEY = '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6';

const DISTRIBUTOR_ADDRESS = '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65';
const DISTRIBUTOR_KEY = '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a';

const PHARMACY_ADDRESS = '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc';
const PHARMACY_KEY = '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function demonstrateUseCase() {
    console.log('='.repeat(70));
    console.log('PHARMACEUTICAL SUPPLY CHAIN - COMPLETE USE CASE DEMONSTRATION');
    console.log('='.repeat(70));
    console.log();

    const batchId = 'ASPIRIN-' + Date.now();
    const drugName = 'Aspirin 500mg Tablets';

    try {
        // Step 1: Ingredient Supplier creates drug batch
        console.log('📦 STEP 1: Ingredient Supplier Creates Drug Batch');
        console.log(`   Batch ID: ${batchId}`);
        console.log(`   Drug: ${drugName}`);
        const createRes = await axios.post(`${API_BASE}/drugs/create`, {
            batchId,
            drugName,
            privateKey: SUPPLIER_KEY
        });
        console.log('   ✅ Batch created successfully!');
        console.log(`   Transaction: ${createRes.data.txHash.substring(0, 20)}...`);
        console.log();
        await sleep(2000);

        // Step 2: Transfer to Manufacturer
        console.log('🏭 STEP 2: Transfer to Manufacturer');
        const transferRes = await axios.post(`${API_BASE}/drugs/transfer/manufacturer`, {
            batchId,
            manufacturer: MANUFACTURER_ADDRESS,
            privateKey: SUPPLIER_KEY
        });
        console.log('   ✅ Transferred to manufacturer!');
        console.log(`   Transaction: ${transferRes.data.txHash.substring(0, 20)}...`);
        console.log();
        await sleep(2000);

        // Step 3: Manufacturer requests FDA approval
        console.log('📋 STEP 3: Manufacturer Requests FDA Approval');
        const requestRes = await axios.post(`${API_BASE}/fda/request`, {
            batchId,
            privateKey: MANUFACTURER_KEY
        });
        console.log('   ✅ FDA approval requested!');
        console.log(`   Transaction: ${requestRes.data.txHash.substring(0, 20)}...`);
        console.log();
        await sleep(2000);

        // Step 4: FDA reviews and approves
        console.log('✅ STEP 4: FDA Approves Drug for Production');
        const approveRes = await axios.post(`${API_BASE}/fda/approve`, {
            batchId,
            remarks: 'Approved for production. All quality standards met.',
            privateKey: FDA_KEY
        });
        console.log('   ✅ Drug approved by FDA!');
        console.log(`   Transaction: ${approveRes.data.txHash.substring(0, 20)}...`);
        console.log();
        await sleep(2000);

        // Step 5: Manufacturing
        console.log('⚙️  STEP 5: Manufacturing Process');
        const manufactureRes = await axios.post(`${API_BASE}/drugs/manufacture`, {
            batchId,
            privateKey: MANUFACTURER_KEY
        });
        console.log('   ✅ Drug manufactured successfully!');
        console.log(`   Transaction: ${manufactureRes.data.txHash.substring(0, 20)}...`);
        console.log();
        await sleep(2000);

        // Step 6: Transfer to Repackager
        console.log('📦 STEP 6: Transfer to Repackaging Facility');
        const repackageRes = await axios.post(`${API_BASE}/drugs/transfer/repackager`, {
            batchId,
            repackager: REPACKAGER_ADDRESS,
            location: 'Manufacturing Plant A → Repackaging Facility B',
            privateKey: MANUFACTURER_KEY
        });
        console.log('   ✅ Transferred to repackager!');
        console.log(`   Transaction: ${repackageRes.data.txHash.substring(0, 20)}...`);
        console.log();
        await sleep(2000);

        // Step 7: IoT monitoring during transport to distributor
        console.log('🌡️  STEP 7: IoT Monitoring During Transport to Distributor');
        console.log('   Logging sensor data...');
        
        // Log IoT data
        await axios.post(`${API_BASE}/iot/log`, {
            batchId,
            location: 'Highway Transit - Route 66',
            temperature: 5.2,
            humidity: 45,
            pressure: 101,
            tamperDetected: false
        });
        console.log('   ✅ IoT Data logged: Temp 5.2°C, Humidity 45%, Pressure 101kPa');
        await sleep(1000);

        // Step 8: Transfer to Distributor
        console.log();
        console.log('🚚 STEP 8: Transfer to Distribution Center');
        const distributeRes = await axios.post(`${API_BASE}/drugs/transfer/distributor`, {
            batchId,
            distributor: DISTRIBUTOR_ADDRESS,
            location: 'Distribution Center - East Coast',
            privateKey: REPACKAGER_KEY
        });
        console.log('   ✅ Transferred to distributor!');
        console.log(`   Transaction: ${distributeRes.data.txHash.substring(0, 20)}...`);
        console.log();
        await sleep(2000);

        // Step 9: IoT detects anomaly (temperature deviation)
        console.log('🚨 STEP 9: IoT Detects Temperature Deviation!');
        console.log('   Logging anomaly...');
        await axios.post(`${API_BASE}/iot/log`, {
            batchId,
            location: 'Distribution Center - Cold Storage',
            temperature: 28.5, // HIGH TEMPERATURE!
            humidity: 65,
            pressure: 100,
            tamperDetected: false
        });
        console.log('   ⚠️  ALERT TRIGGERED: Temperature 28.5°C exceeds safe limit!');
        console.log('   Alert logged immutably on blockchain');
        console.log();
        await sleep(2000);

        // Step 10: Transfer to Pharmacy
        console.log('🏥 STEP 10: Transfer to Pharmacy');
        const pharmacyRes = await axios.post(`${API_BASE}/drugs/transfer/pharmacy`, {
            batchId,
            pharmacy: PHARMACY_ADDRESS,
            location: 'Local Pharmacy - Downtown',
            privateKey: DISTRIBUTOR_KEY
        });
        console.log('   ✅ Transferred to pharmacy!');
        console.log(`   Transaction: ${pharmacyRes.data.txHash.substring(0, 20)}...`);
        console.log();
        await sleep(2000);

        // Final: Get complete history
        console.log('📊 STEP 11: Retrieving Complete Supply Chain History');
        const historyRes = await axios.get(`${API_BASE}/history/${batchId}`);
        const iotRes = await axios.get(`${API_BASE}/iot/${batchId}`);
        const alertsRes = await axios.get(`${API_BASE}/alerts/${batchId}`);

        console.log();
        console.log('='.repeat(70));
        console.log('FINAL SUMMARY');
        console.log('='.repeat(70));
        console.log(`Batch ID: ${batchId}`);
        console.log(`Total Transactions: ${historyRes.data.history.length}`);
        console.log(`IoT Data Points: ${iotRes.data.iotData.length}`);
        console.log(`Alerts Triggered: ${alertsRes.data.alerts.length}`);
        console.log();

        console.log('Transaction History:');
        historyRes.data.history.forEach((tx, idx) => {
            const statuses = ['None', 'Ingredients Supplied', 'FDA Pending', 'FDA Approved', 
                            'FDA Rejected', 'Manufactured', 'Repackaged', 'Distributed', 'Dispensed'];
            console.log(`  ${idx + 1}. ${statuses[tx.status]} - ${tx.remarks}`);
        });

        console.log();
        console.log('IoT Monitoring Data:');
        iotRes.data.iotData.forEach((data, idx) => {
            console.log(`  ${idx + 1}. ${data.location}: ${data.temperature}°C, ${data.humidity}%, ${data.pressure}kPa`);
        });

        console.log();
        if (alertsRes.data.alerts.length > 0) {
            console.log('⚠️  Alerts:');
            alertsRes.data.alerts.forEach((alert, idx) => {
                const types = ['Temperature', 'Humidity', 'Pressure', 'Tampering', 'Fake Transfer'];
                console.log(`  ${idx + 1}. ${types[alert.alertType]}: ${alert.message}`);
            });
        }

        console.log();
        console.log('='.repeat(70));
        console.log('✅ USE CASE DEMONSTRATION COMPLETE!');
        console.log('='.repeat(70));
        console.log();
        console.log('View full details in the dashboard:');
        console.log(`http://localhost:3000 → Track Batch → Search: ${batchId}`);
        console.log();

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

demonstrateUseCase();
