const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
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
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

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

// Live Temperature Monitoring (ESP32 direct)
let latestTemperatureData = {
    temperature: null,
    timestamp: null,
    location: 'Unknown',
    humidity: 0,
    pressure: 0
};

app.post('/api/live-temperature', async (req, res) => {
    try {
        console.log('📥 Received data:', req.body);
        
        const { temperature, location, humidity, pressure } = req.body;
        
        if (temperature === undefined) {
            console.error('❌ Temperature is undefined in request body');
            return res.status(400).json({ success: false, error: 'Temperature is required' });
        }
        
        const temp = parseFloat(temperature);
        
        latestTemperatureData = {
            temperature: temp,
            timestamp: Date.now(),
            location: location || 'Lab',
            humidity: humidity || 0,
            pressure: pressure || 0
        };
        
        console.log(`🌡️  Live Temperature: ${temp}°C from ${location}`);
        
        // Log IoT data to blockchain for all active batches (this will auto-create alerts if temp is out of range)
        try {
            // Get all drug batches
            const txCount = await contract.transactionCount();
            const batches = new Set();
            
            for (let i = 0; i < txCount; i++) {
                const tx = await contract.transactions(i);
                batches.add(tx.batchId);
            }
            
            // Log IoT data for each active batch
            for (const batchId of batches) {
                try {
                    const drug = await contract.getDrug(batchId);
                    
                    // Only log for active batches (not dispensed yet)
                    if (Number(drug.status) < 8) {
                        const tempInt = Math.round(temp * 100); // Contract expects temp * 100
                        const tx = await contract.logIoTData(
                            batchId,
                            location || 'Lab',
                            tempInt,
                            humidity || 0,
                            pressure || 101,
                            false // tamperDetected
                        );
                        await tx.wait();
                        console.log(`📝 IoT data logged for batch ${batchId}: ${temp}°C`);
                        
                        // Log if alert was triggered
                        if (temp < 28 || temp > 33) {
                            console.log(`🚨 Alert auto-triggered for batch ${batchId}: Temperature ${temp}°C`);
                        }
                    }
                } catch (error) {
                    // Batch might not exist, continue
                    console.log(`   Skipping batch ${batchId}: ${error.message}`);
                }
            }
        } catch (error) {
            console.error('⚠️  Error logging IoT data:', error.message);
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Temperature data received',
            data: latestTemperatureData
        });
    } catch (error) {
        console.error('❌ Error in POST /api/live-temperature:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/live-temperature', (req, res) => {
    try {
        if (latestTemperatureData.temperature === null) {
            res.json({ 
                success: true, 
                data: null,
                message: 'No temperature data available yet'
            });
        } else {
            res.json({ 
                success: true, 
                data: latestTemperatureData
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Generate Wallet Endpoint
app.post('/api/auth/generate-wallet', (req, res) => {
    try {
        const wallet = ethers.Wallet.createRandom();
        res.json({
            success: true,
            address: wallet.address,
            privateKey: wallet.privateKey,
            message: 'Keep your private key safe! You cannot recover it if lost.'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// SIMPLIFIED AUTHENTICATION SYSTEM
// ============================================
const fs = require('fs');
const path = require('path');

// User data file path
const USERS_FILE = path.join(__dirname, 'users.json');

// Always start with fresh empty users array on restart
let users = [];
console.log('🔄 Starting with fresh user registry (all previous users cleared)');

// Clear users.json file on startup
try {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    console.log('✅ Users file cleared and ready for new registrations');
} catch (error) {
    console.error('⚠️  Error clearing users file:', error.message);
}

// Helper function to save users to file
function saveUsers() {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('⚠️  Error saving users:', error.message);
    }
}

// Track active sessions to prevent duplicate logins
const activeSessions = new Map(); // email -> { loginTime, address }

// Helper function to hash passwords (simple hashing for demo)
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper function to encrypt private key
function encryptPrivateKey(privateKey, password) {
    const cipher = crypto.createCipher('aes-256-cbc', password);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// Helper function to decrypt private key
function decryptPrivateKey(encryptedKey, password) {
    try {
        const decipher = crypto.createDecipher('aes-256-cbc', password);
        let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        return null;
    }
}

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validation
        if (!name || !email || !password || role === undefined) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters'
            });
        }

        // Check if email already exists
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Email already registered'
            });
        }

        // Generate blockchain wallet
        const wallet = ethers.Wallet.createRandom();

        // Hash password
        const hashedPassword = hashPassword(password);

        // Encrypt private key with user's password
        const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey, password);

        // Create user object
        const user = {
            name,
            email,
            hashedPassword,
            role: parseInt(role),
            address: wallet.address,
            encryptedPrivateKey,
            createdAt: Date.now()
        };

        // Store user
        users.push(user);
        saveUsers(); // Persist to file

        console.log(`✅ New user registered: ${email} (${name}) as role ${role}`);
        console.log(`   Blockchain Address: ${wallet.address}`);

        // Register user on blockchain
        try {
            // Step 1: Fund the new wallet with ETH (for gas fees)
            console.log(`   💰 Funding wallet with ETH...`);
            const fundTx = await signer.sendTransaction({
                to: wallet.address,
                value: ethers.parseEther("10") // Send 10 ETH
            });
            await fundTx.wait();
            console.log(`   ✅ Funded with 10 ETH`);

            // Step 2: Wait a moment for nonce to update
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 3: Register user on blockchain contract
            console.log(`   📋 Registering on blockchain...`);
            const tx = await contract.registerUser(wallet.address, name, parseInt(role));
            await tx.wait();
            console.log(`   ✅ Registered on blockchain: ${tx.hash}`);
        } catch (blockchainError) {
            console.error('   ⚠️ Blockchain registration failed:', blockchainError.message);
            // Continue anyway - user is registered in our system
            // They can still use the app, but blockchain operations may fail
        }

        res.json({
            success: true,
            message: 'Registration successful! You can now log in.',
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                address: user.address
            }
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Validation
        if (!email || !password || role === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Email, password and role are required'
            });
        }

        // Find user
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check if user is already logged in
        if (activeSessions.has(email)) {
            const session = activeSessions.get(email);
            return res.status(403).json({
                success: false,
                error: 'User already logged in',
                message: `This account is already active. Login time: ${new Date(session.loginTime).toLocaleString()}`
            });
        }

        // Verify role matches
        if (user.role !== parseInt(role)) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials - role does not match'
            });
        }

        // Verify password
        const hashedPassword = hashPassword(password);
        if (hashedPassword !== user.hashedPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Decrypt private key
        const privateKey = decryptPrivateKey(user.encryptedPrivateKey, password);
        if (!privateKey) {
            return res.status(500).json({
                success: false,
                error: 'Failed to decrypt wallet'
            });
        }

        // Create active session
        activeSessions.set(email, {
            loginTime: Date.now(),
            address: user.address,
            name: user.name,
            role: user.role
        });

        console.log(`✅ User logged in: ${email} (${user.name}) as role ${user.role}`);
        console.log(`   Active sessions: ${activeSessions.size}`);

        // Return user data with blockchain credentials
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                address: user.address,
                privateKey: privateKey // Decrypted for blockchain operations
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Validate user endpoint - checks if stored user data is still valid
app.post('/api/auth/validate', (req, res) => {
    try {
        const { email, address } = req.body;

        if (!email || !address) {
            return res.status(400).json({
                success: false,
                valid: false,
                error: 'Email and address are required'
            });
        }

        // Find user in current database
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return res.json({
                success: true,
                valid: false,
                reason: 'User not found in database'
            });
        }

        // Check if address matches
        if (user.address.toLowerCase() !== address.toLowerCase()) {
            return res.json({
                success: true,
                valid: false,
                reason: 'Address mismatch - account was recreated'
            });
        }

        // User data is valid
        res.json({
            success: true,
            valid: true,
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                address: user.address
            }
        });

    } catch (error) {
        console.error('❌ Validation error:', error);
        res.status(500).json({
            success: false,
            valid: false,
            error: error.message
        });
    }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        // Remove active session
        if (activeSessions.has(email)) {
            activeSessions.delete(email);
            console.log(`👋 User logged out: ${email}`);
            console.log(`   Active sessions: ${activeSessions.size}`);
            
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } else {
            res.json({
                success: true,
                message: 'No active session found'
            });
        }

    } catch (error) {
        console.error('❌ Logout error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get all registered users (for debugging)
app.get('/api/auth/users', (req, res) => {
    res.json({
        success: true,
        count: users.length,
        users: users.map(u => ({
            name: u.name,
            email: u.email,
            role: u.role,
            address: u.address,
            createdAt: u.createdAt
        }))
    });
});

// Get active sessions (for debugging)
app.get('/api/auth/sessions', (req, res) => {
    res.json({
        success: true,
        count: activeSessions.size,
        sessions: Array.from(activeSessions.entries()).map(([email, session]) => ({
            email,
            ...session,
            loginTime: new Date(session.loginTime).toLocaleString()
        }))
    });
});

// Fund and register existing user on blockchain (admin endpoint)
app.post('/api/auth/fund-user', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        // Find user
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        console.log(`💰 Funding user: ${email} (${user.address})`);

        // Fund the wallet
        const fundTx = await signer.sendTransaction({
            to: user.address,
            value: ethers.parseEther("10")
        });
        await fundTx.wait();
        console.log(`   ✅ Funded with 10 ETH`);

        // Wait for nonce to update
        await new Promise(resolve => setTimeout(resolve, 500));

        // Register on blockchain if not already registered
        try {
            const tx = await contract.registerUser(user.address, user.name, user.role);
            await tx.wait();
            console.log(`   ✅ Registered on blockchain: ${tx.hash}`);
        } catch (blockchainError) {
            if (blockchainError.message.includes("User already registered")) {
                console.log(`   ℹ️  Already registered on blockchain`);
            } else {
                throw blockchainError;
            }
        }

        res.json({
            success: true,
            message: 'User funded and registered successfully',
            address: user.address
        });

    } catch (error) {
        console.error('❌ Fund user error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
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
