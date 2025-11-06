const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Blockchain configuration
let provider;
let contract;
let signer;

const contractJSON = require('./contractABI.json');
const contractABI = contractJSON.abi;
const contractAddress = process.env.CONTRACT_ADDRESS;

// Initialize blockchain connection
async function initBlockchain() {
    try {
        if (process.env.BLOCKCHAIN_NETWORK === 'local') {
            provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545');
        } else {
            provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
        }
        
        const privateKey = process.env.PRIVATE_KEY;
        signer = new ethers.Wallet(privateKey, provider);
        contract = new ethers.Contract(contractAddress, contractABI, signer);
        
        console.log('✅ Blockchain connection established');
        console.log('Contract Address:', contractAddress);
    } catch (error) {
        console.error('❌ Failed to initialize blockchain:', error.message);
    }
}

// Utility function to parse blockchain data
function parseUser(user) {
    return {
        userAddress: user.userAddress,
        name: user.name,
        role: Number(user.role),
        isActive: user.isActive,
        registeredAt: Number(user.registeredAt)
    };
}

function parseDrug(drug) {
    return {
        batchId: drug.batchId,
        drugName: drug.drugName,
        currentOwner: drug.currentOwner,
        status: Number(drug.status),
        createdAt: Number(drug.createdAt),
        exists: drug.exists
    };
}

function parseTransaction(tx) {
    return {
        batchId: tx.batchId,
        from: tx.from,
        to: tx.to,
        status: Number(tx.status),
        timestamp: Number(tx.timestamp),
        location: tx.location,
        remarks: tx.remarks
    };
}

function parseIoTData(data) {
    // Parse location and GPS coordinates
    let location = data.location;
    let latitude = null;
    let longitude = null;

    // Check if GPS data is embedded in location string (format: "Location|GPS:lat,lng")
    if (location.includes('|GPS:')) {
        const [loc, gpsStr] = location.split('|GPS:');
        location = loc;
        const [lat, lng] = gpsStr.split(',');
        latitude = parseFloat(lat);
        longitude = parseFloat(lng);
    }

    return {
        batchId: data.batchId,
        timestamp: Number(data.timestamp),
        location: location,
        latitude: latitude,
        longitude: longitude,
        temperature: Number(data.temperature) / 100, // Convert back to celsius
        humidity: Number(data.humidity),
        pressure: Number(data.pressure),
        tamperDetected: data.tamperDetected
    };
}

function parseAlert(alert) {
    return {
        batchId: alert.batchId,
        alertType: Number(alert.alertType),
        timestamp: Number(alert.timestamp),
        message: alert.message,
        resolved: alert.resolved
    };
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Pharma Supply Chain API is running' });
});

// User Management
app.post('/api/users/register', async (req, res) => {
    try {
        const { userAddress, name, role } = req.body;
        
        const tx = await contract.registerUser(userAddress, name, role);
        await tx.wait();
        
        res.json({ 
            success: true, 
            message: 'User registered successfully',
            txHash: tx.hash 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/api/users/:address', async (req, res) => {
    try {
        const user = await contract.getUser(req.params.address);
        res.json({ success: true, user: parseUser(user) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Drug Batch Management
app.post('/api/drugs/create', async (req, res) => {
    try {
        const { batchId, drugName, privateKey } = req.body;
        
        const userSigner = new ethers.Wallet(privateKey, provider);
        const userContract = contract.connect(userSigner);
        
        const tx = await userContract.createDrugBatch(batchId, drugName);
        await tx.wait();
        
        res.json({ 
            success: true, 
            message: 'Drug batch created successfully',
            txHash: tx.hash 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/drugs/:batchId', async (req, res) => {
    try {
        const drug = await contract.getDrug(req.params.batchId);
        res.json({ success: true, drug: parseDrug(drug) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/drugs/transfer/manufacturer', async (req, res) => {
    try {
        const { batchId, manufacturer, privateKey } = req.body;
        
        const userSigner = new ethers.Wallet(privateKey, provider);
        const userContract = contract.connect(userSigner);
        
        const tx = await userContract.transferToManufacturer(batchId, manufacturer);
        await tx.wait();
        
        res.json({ 
            success: true, 
            message: 'Transferred to manufacturer successfully',
            txHash: tx.hash 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/drugs/manufacture', async (req, res) => {
    try {
        const { batchId, privateKey } = req.body;
        
        const userSigner = new ethers.Wallet(privateKey, provider);
        const userContract = contract.connect(userSigner);
        
        const tx = await userContract.manufactureDrug(batchId);
        await tx.wait();
        
        res.json({ 
            success: true, 
            message: 'Drug manufactured successfully',
            txHash: tx.hash 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/drugs/transfer/repackager', async (req, res) => {
    try {
        const { batchId, repackager, location, privateKey } = req.body;
        
        const userSigner = new ethers.Wallet(privateKey, provider);
        const userContract = contract.connect(userSigner);
        
        const tx = await userContract.transferToRepackager(batchId, repackager, location);
        await tx.wait();
        
        res.json({ 
            success: true, 
            message: 'Transferred to repackager successfully',
            txHash: tx.hash 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/drugs/transfer/distributor', async (req, res) => {
    try {
        const { batchId, distributor, location, privateKey } = req.body;
        
        const userSigner = new ethers.Wallet(privateKey, provider);
        const userContract = contract.connect(userSigner);
        
        const tx = await userContract.transferToDistributor(batchId, distributor, location);
        await tx.wait();
        
        res.json({ 
            success: true, 
            message: 'Transferred to distributor successfully',
            txHash: tx.hash 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/drugs/transfer/pharmacy', async (req, res) => {
    try {
        const { batchId, pharmacy, location, privateKey } = req.body;
        
        const userSigner = new ethers.Wallet(privateKey, provider);
        const userContract = contract.connect(userSigner);
        
        const tx = await userContract.transferToPharmacy(batchId, pharmacy, location);
        await tx.wait();
        
        res.json({ 
            success: true, 
            message: 'Transferred to pharmacy successfully',
            txHash: tx.hash 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// FDA Approval
app.post('/api/fda/request', async (req, res) => {
    try {
        const { batchId, privateKey } = req.body;
        
        const userSigner = new ethers.Wallet(privateKey, provider);
        const userContract = contract.connect(userSigner);
        
        const tx = await userContract.requestFDAApproval(batchId);
        await tx.wait();
        
        res.json({ 
            success: true, 
            message: 'FDA approval requested successfully',
            txHash: tx.hash 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/fda/approve', async (req, res) => {
    try {
        const { batchId, remarks, privateKey } = req.body;
        
        const userSigner = new ethers.Wallet(privateKey, provider);
        const userContract = contract.connect(userSigner);
        
        const tx = await userContract.approveDrug(batchId, remarks);
        await tx.wait();
        
        res.json({ 
            success: true, 
            message: 'Drug approved successfully',
            txHash: tx.hash 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/fda/reject', async (req, res) => {
    try {
        const { batchId, reason, privateKey } = req.body;
        
        const userSigner = new ethers.Wallet(privateKey, provider);
        const userContract = contract.connect(userSigner);
        
        const tx = await userContract.rejectDrug(batchId, reason);
        await tx.wait();
        
        res.json({ 
            success: true, 
            message: 'Drug rejected successfully',
            txHash: tx.hash 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/fda/approval/:batchId', async (req, res) => {
    try {
        const approval = await contract.getFDAApproval(req.params.batchId);
        res.json({ 
            success: true, 
            approval: {
                batchId: approval.batchId,
                approved: approval.approved,
                timestamp: Number(approval.timestamp),
                remarks: approval.remarks,
                approvedBy: approval.approvedBy
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// IoT Data Logging
app.post('/api/iot/log', async (req, res) => {
    try {
        const { batchId, location, temperature, humidity, pressure, tamperDetected } = req.body;
        
        // Convert temperature to integer (multiply by 100)
        const tempInt = Math.round(temperature * 100);
        
        const tx = await contract.logIoTData(
            batchId,
            location,
            tempInt,
            humidity,
            pressure,
            tamperDetected || false
        );
        await tx.wait();
        
        res.json({ 
            success: true, 
            message: 'IoT data logged successfully',
            txHash: tx.hash 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/iot/:batchId', async (req, res) => {
    try {
        const iotDataIds = await contract.getIoTDataForBatch(req.params.batchId);
        const iotData = [];
        
        for (let id of iotDataIds) {
            const data = await contract.iotDataLogs(id);
            iotData.push(parseIoTData(data));
        }
        
        res.json({ success: true, iotData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Alerts
app.get('/api/alerts/:batchId', async (req, res) => {
    try {
        const alertIds = await contract.getAlertsForBatch(req.params.batchId);
        const alerts = [];
        
        for (let id of alertIds) {
            const alert = await contract.alerts(id);
            alerts.push({ id: Number(id), ...parseAlert(alert) });
        }
        
        res.json({ success: true, alerts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/alerts', async (req, res) => {
    try {
        const alertCount = await contract.alertCount();
        const alerts = [];
        
        for (let i = 0; i < alertCount; i++) {
            const alert = await contract.alerts(i);
            alerts.push({ id: i, ...parseAlert(alert) });
        }
        
        res.json({ success: true, alerts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/alerts/:alertId/resolve', async (req, res) => {
    try {
        const { privateKey } = req.body;
        
        const userSigner = new ethers.Wallet(privateKey, provider);
        const userContract = contract.connect(userSigner);
        
        const tx = await userContract.resolveAlert(req.params.alertId);
        await tx.wait();
        
        res.json({ 
            success: true, 
            message: 'Alert resolved successfully',
            txHash: tx.hash 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Transaction History
app.get('/api/history/:batchId', async (req, res) => {
    try {
        const txIds = await contract.getDrugHistory(req.params.batchId);
        const history = [];
        
        for (let id of txIds) {
            const tx = await contract.transactions(id);
            history.push(parseTransaction(tx));
        }
        
        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all transactions (for dashboard)
app.get('/api/transactions', async (req, res) => {
    try {
        const txCount = await contract.transactionCount();
        const transactions = [];
        
        const limit = Math.min(Number(txCount), 100); // Limit to last 100
        
        for (let i = 0; i < limit; i++) {
            const tx = await contract.transactions(i);
            transactions.push({ id: i, ...parseTransaction(tx) });
        }
        
        res.json({ success: true, transactions: transactions.reverse() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Analytics
app.get('/api/analytics/overview', async (req, res) => {
    try {
        const txCount = await contract.transactionCount();
        const iotCount = await contract.iotDataCount();
        const alertCount = await contract.alertCount();
        
        res.json({
            success: true,
            analytics: {
                totalTransactions: Number(txCount),
                totalIoTLogs: Number(iotCount),
                totalAlerts: Number(alertCount)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
async function startServer() {
    await initBlockchain();
    
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
    });
}

startServer();
