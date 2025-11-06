# Quick Start Guide

## ⚠️ BEFORE YOU START - Install Node.js

### 📥 Install Node.js & npm (5 minutes)

**You need to install Node.js first!**

1. **Download Node.js:**
   - Visit: https://nodejs.org/
   - Click the **LTS** version (recommended)
   - Example: "Download Node.js (LTS) v20.10.0"

2. **Run the Installer:**
   - Double-click the downloaded `.msi` file
   - Click "Next" → "Next" → "Install"
   - Wait for installation to complete

3. **Restart PowerShell:**
   - **IMPORTANT:** Close all PowerShell windows
   - Open a NEW PowerShell window
   
4. **Verify Installation:**
   ```powershell
   node --version
   npm --version
   ```
   
   You should see version numbers like:
   ```
   v20.10.0
   10.2.3
   ```

**Once npm is installed, continue below!**

---

## ⚡ Terminal Commands Reference Card

| Terminal | Directory | Command | Purpose |
|----------|-----------|---------|---------|
| **Terminal 1** | `c:\HACKTHON` | `npm run node` | Start local blockchain (keep running) |
| **Terminal 2** | `c:\HACKTHON` | `npm run compile` then `npm run deploy` | Deploy smart contract |
| **Terminal 3** | `c:\HACKTHON\backend` | `npm start` | Start API server (keep running) |
| **Terminal 4** | `c:\HACKTHON\frontend` | `npm start` | Start dashboard (keep running) |
| **Terminal 5** | `c:\HACKTHON\backend` | `node iot-simulator.js journey BATCH001 600` | Run IoT simulation (optional) |

---

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies (2 minutes)

```powershell
# Directory: c:\HACKTHON
cd c:\HACKTHON

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Start Blockchain (1 minute)

```powershell
# 📍 Terminal 1 - Directory: c:\HACKTHON
cd c:\HACKTHON
npm run node
```

**Keep this terminal running!** You'll see 20 test accounts with addresses and private keys.

### Step 3: Deploy Contract (1 minute)

Open a new PowerShell terminal:

```powershell
# 📍 Terminal 2 - Directory: c:\HACKTHON
cd c:\HACKTHON
npm run compile
npm run deploy
```

**Save the output!** You'll need:
- Contract Address
- Account addresses (Admin, Supplier, Manufacturer, etc.)

### Step 4: Configure Backend (30 seconds)

```powershell
# Directory: c:\HACKTHON\backend
cd c:\HACKTHON\backend
cp .env.example .env
```

Edit `backend\.env`:
```env
CONTRACT_ADDRESS=<paste_contract_address_from_deploy>
PRIVATE_KEY=<admin_private_key_from_node_output>
```

**Copy Contract ABI:**
```powershell
# Directory: c:\HACKTHON (project root)
cd c:\HACKTHON
copy artifacts\contracts\PharmaSupplyChain.sol\PharmaSupplyChain.json backend\contractABI.json
```

### Step 5: Start Application (30 seconds)

```powershell
# 📍 Terminal 3 - Directory: c:\HACKTHON\backend
cd c:\HACKTHON\backend
npm start
```
**Keep this terminal running!**

Open another new PowerShell terminal:

```powershell
# 📍 Terminal 4 - Directory: c:\HACKTHON\frontend
cd c:\HACKTHON\frontend
npm start
```

Dashboard opens at: `http://localhost:3000`

## 🔐 Role-Based Login System

The system now requires **role-based authentication**. Each user must login with their role before performing any actions.

### 6 Pre-Registered Demo Users

The deployment script automatically creates these users:

| Role | Name | Address | Private Key |
|------|------|---------|-------------|
| **FDA** | FDA Regulatory Authority | `0xf39F...2266` | `0xac09...ff80` |
| **Ingredient Supplier** | Ingredient Supplier Co. | `0x7099...79C8` | `0x59c6...690d` |
| **Manufacturer** | PharmaTech Manufacturing | `0x3C44...93BC` | `0x5de4...65a` |
| **Repackager** | RePackage Solutions Inc. | `0x90F7...b906` | `0x7c85...07a6` |
| **Distributor** | Global Distribution Network | `0x15d3...6A65` | `0x47e1...926a` |
| **Pharmacy** | City Central Pharmacy | `0x9965...A4dc` | `0x8b3a...ffba` |

### Login Options

#### Option 1: Quick Login (Recommended for Testing)
1. Open dashboard at `http://localhost:3000`
2. Click on any pre-registered user button
3. You're logged in instantly!

#### Option 2: Manual Login
1. Select your role from dropdown
2. Enter your private key
3. Click "Login"

### Role-Based Actions

After login, you'll see **Available Actions** based on your role:

**FDA:**
- ✅ Approve Drug Batch
- ❌ Reject Drug Batch

**Ingredient Supplier:**
- ➕ Create Drug Batch
- 📤 Transfer to Manufacturer
- 📋 Request FDA Approval

**Manufacturer:**
- 🏭 Manufacture Drug
- 📤 Transfer to Repackager

**Repackager:**
- 📤 Transfer to Distributor

**Distributor:**
- 🚚 Transfer to Pharmacy

**Pharmacy:**
- 📦 View and track received batches (final destination)

### Logout
Click the **Logout** button (top-right) to switch users.

---

## 🎮 Testing the System

### Test Scenario 1: Create and Track a Drug Batch

1. **Open Dashboard** at `http://localhost:3000`

2. **Login as Ingredient Supplier:**
   - Click "Ingredient Supplier Co." quick login button

3. **Create a Batch:**
   - In "Available Actions" section, click "Create Drug Batch"
   - Batch ID: `BATCH001`
   - Drug Name: `Aspirin 500mg`
   - Click "Execute"
   - ✅ Success! Batch created

4. **Track the Batch:**
   - Go to "Track Batch" tab
   - Enter: `BATCH001`
   - Click "Search"
   - View batch info, transaction history, and IoT data

### Test Scenario 2: Complete Supply Chain Workflow (Multi-User)

**Step 1: Supplier Creates Batch**
1. Login as **Ingredient Supplier**
2. Create Drug Batch → Batch ID: `BATCH002`, Drug Name: `Paracetamol 250mg`

**Step 2: Supplier Requests FDA Approval**
1. Still logged in as **Ingredient Supplier**
2. Click "Request FDA Approval"
3. Enter Batch ID: `BATCH002`
4. Click "Execute"

**Step 3: FDA Reviews and Approves**
1. **Logout** (top-right corner)
2. Login as **FDA Regulatory Authority**
3. Click "Approve Drug Batch"
4. Batch ID: `BATCH002`
5. Remarks: `Meets all safety standards`
6. Click "Execute"

**Step 4: Supplier Transfers to Manufacturer**
1. **Logout** and login as **Ingredient Supplier**
2. Click "Transfer to Manufacturer"
3. Batch ID: `BATCH002`
4. Select: `PharmaTech Manufacturing`
5. Location: `Factory A, Mumbai`
6. Click "Execute"

**Step 5: Manufacturer Produces Drug**
1. **Logout** and login as **PharmaTech Manufacturing**
2. Click "Manufacture Drug"
3. Batch ID: `BATCH002`
4. Click "Execute"

**Step 6: Continue Through Supply Chain**
1. Manufacturer → Transfer to Repackager
2. Repackager → Transfer to Distributor
3. Distributor → Transfer to Pharmacy
4. Track batch at any time to see complete journey!

### Test Scenario 3: IoT Monitoring with Alerts

### Test Scenario 3: IoT Monitoring with Alerts

1. **Create a batch** (as Ingredient Supplier): `BATCH003`

2. **Start IoT Simulator:**
   ```powershell
   # Directory: c:\HACKTHON\backend
   cd c:\HACKTHON\backend
   node iot-simulator.js journey BATCH003 300
   ```

3. **Monitor in Dashboard:**
   - Go to "IoT Monitoring" tab
   - Track Batch → Enter `BATCH003`
   - Watch real-time temperature and humidity charts
   - View alerts when anomalies are detected (5% chance)

4. **Check Alerts Tab:**
   - Navigate to "Alerts" tab
   - See all active alerts across batches
   - FDA can resolve alerts

## 📊 Dashboard Features

### Main Dashboard Tab
- **Real-time metrics**: Transactions, IoT logs, alerts
- **Recent activity**: Latest supply chain events
- **Create batch**: Quick batch creation

### Track Batch Tab
- **Search**: Find any batch by ID
- **History**: Complete transaction timeline
- **IoT Data**: Sensor readings with charts
- **Alerts**: Anomaly notifications

### Alerts Tab
- **Active alerts**: Unresolved issues
- **Alert details**: Type, message, timestamp
- **FDA resolution**: Mark as resolved

### IoT Monitoring Tab
- **Live charts**: Temperature, humidity trends
- **Data table**: All sensor readings
- **Location tracking**: Shipment journey

## 🎯 Demo Accounts (from Hardhat node)

After running `npm run node`, you get 20 test accounts. The deployment script uses:

```
Account #0 (Admin/FDA): 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1 (Supplier): 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2 (Manufacturer): 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

... and more
```

## 🚨 Common Issues & Solutions

### Issue: "Cannot connect to blockchain"
**Solution:** Ensure `npm run node` is running in Terminal 1

### Issue: "Contract not found"
**Solution:** 
1. Deploy contract: `npm run deploy`
2. Update `backend\.env` with new contract address
3. Restart backend server

### Issue: "Frontend API errors"
**Solution:**
1. Check backend is running: `http://localhost:3001/api/health`
2. Verify `frontend\.env` has correct API URL
3. Restart frontend: `npm start`

### Issue: "IoT simulator fails"
**Solution:**
1. Verify `backend\contractABI.json` exists
2. Check contract address in `backend\.env`
3. Ensure blockchain is running

## 📱 API Testing with PowerShell

### Check System Health
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/health"
```

### Get Analytics
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/analytics/overview"
```

### Get Drug Info
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/drugs/BATCH001"
```

### Get All Alerts
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/alerts"
```

## 🎬 Complete Demo Script

Run this for a full demonstration:

```powershell
# 📍 Terminal 1 - Start Blockchain
cd c:\HACKTHON
npm run node
# Keep running! Note: First account (0xf39F...2266) is used for FDA role

# 📍 Terminal 2 - Deploy Contract
cd c:\HACKTHON
npm run compile
npm run deploy
# ✅ Saves contract address and registers 6 users automatically

# 📍 Terminal 3 - Start Backend API
cd c:\HACKTHON\backend
# Edit .env file with contract address from Terminal 2
npm start
# Keep running!

# 📍 Terminal 4 - Start Frontend Dashboard
cd c:\HACKTHON\frontend
npm start
# Browser opens at http://localhost:3000

# 📍 Now use the dashboard with role-based login:
# 1. Click "Ingredient Supplier Co." to login
# 2. Create a drug batch
# 3. Logout and login as different roles
# 4. Complete the workflow step by step!

# 📍 Terminal 5 (Optional) - IoT Simulator
cd c:\HACKTHON\backend
node iot-simulator.js journey BATCH001 600
# Simulates 10 minutes of IoT data with anomalies
```

## 🎓 Learning Resources

### Smart Contract Functions
- `createDrugBatch()` - Supplier creates new batch
- `transferToManufacturer()` - Move to manufacturer
- `requestFDAApproval()` - Request approval
- `approveDrug()` - FDA approves
- `manufactureDrug()` - Create medication
- `transferToRepackager()` - Send to repackaging
- `transferToDistributor()` - Send to distribution
- `transferToPharmacy()` - Send to pharmacy
- `logIoTData()` - Record sensor data

### API Endpoints
```
POST /api/users/register
POST /api/drugs/create
POST /api/drugs/transfer/manufacturer
POST /api/fda/request
POST /api/fda/approve
POST /api/fda/reject
POST /api/iot/log
GET  /api/drugs/:batchId
GET  /api/history/:batchId
GET  /api/iot/:batchId
GET  /api/alerts/:batchId
```

## 🎯 Next Steps

1. **Explore the Dashboard** - Navigate through all tabs
2. **Create Multiple Batches** - Test concurrent tracking
3. **Trigger Alerts** - Use IoT simulator with anomalies
4. **Test FDA Workflow** - Approve and reject drugs
5. **Monitor IoT Data** - View charts and trends

## 📞 Need Help?

- Check the main README.md for detailed documentation
- Review smart contract comments in `contracts/PharmaSupplyChain.sol`
- Examine API server code in `backend/server.js`
- Study IoT simulator in `backend/iot-simulator.js`

**Happy Testing! 🎉**
