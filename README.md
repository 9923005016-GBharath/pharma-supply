# Pharmaceutical Supply Chain Management System
## IoT & Blockchain Integration for Drug Traceability

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636.svg)
![Node](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-18.2-61DAFB.svg)

## 🎯 Overview

A comprehensive blockchain-based solution for pharmaceutical supply chain management that integrates IoT sensors to ensure drug authenticity, traceability, and safety throughout the entire supply chain from ingredient suppliers to patients.

### Key Features

- ✅ **End-to-End Drug Traceability** - Digital ledger tracking every transaction
- 🌡️ **IoT Sensor Integration** - Real-time monitoring of temperature, humidity, and pressure
- 🔐 **Blockchain Security** - Immutable records preventing data manipulation
- 👥 **Role-Based Access Control** - FDA, Suppliers, Manufacturers, Distributors, Pharmacies
- 🚨 **Automated Alerts** - Tamper detection and environmental anomaly notifications
- 📊 **Interactive Dashboard** - Real-time tracking and visualization
- ⚖️ **FDA Approval Workflow** - Digital approval process with smart contracts

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SYSTEM ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Ingredient      │ -> │  Manufacturer    │ -> │   Repackager     │
│  Supplier        │    │                  │    │                  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
                                |
                                v
                        ┌──────────────────┐
                        │   FDA Approval   │
                        │   (Digital)      │
                        └──────────────────┘
                                |
        ┌───────────────────────┴───────────────────────┐
        v                                               v
┌──────────────────┐                          ┌──────────────────┐
│   Distributor    │ ------------------------>│    Pharmacy      │
└──────────────────┘                          └──────────────────┘
        |                                               |
        v                                               v
┌──────────────────────────────────────────────────────────────────┐
│                      IoT Sensor Network                          │
│  • Temperature Monitoring  • Humidity Tracking                   │
│  • Pressure Sensors        • GPS Location                        │
│  • Tamper Detection        • Real-time Alerts                    │
└──────────────────────────────────────────────────────────────────┘
        |
        v
┌──────────────────────────────────────────────────────────────────┐
│              Ethereum Blockchain (Smart Contracts)               │
│  • Immutable Transaction Logs    • FDA Approval Records          │
│  • IoT Data Storage              • Alert Management              │
└──────────────────────────────────────────────────────────────────┘
        |
        v
┌──────────────────────────────────────────────────────────────────┐
│                   Web Dashboard (React)                          │
│  • Real-time Tracking  • Analytics  • Alert Notifications        │
└──────────────────────────────────────────────────────────────────┘
```

## 📦 Project Structure

```
HACKTHON/
├── contracts/
│   └── PharmaSupplyChain.sol      # Main smart contract
├── backend/
│   ├── server.js                  # Express API server
│   ├── iot-simulator.js           # IoT device simulator
│   ├── contractABI.json           # Contract ABI (generated)
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.js                 # Main dashboard component
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── .env
├── scripts/
│   └── deploy.js                  # Deployment script
├── hardhat.config.js              # Hardhat configuration
├── package.json
└── README.md
```

## 🚀 Quick Start

### ⚠️ FIRST TIME SETUP? START HERE!

```
┌─────────────────────────────────────────────────────────┐
│  Got "npm is not recognized" error?                     │
│  👉 Read START-HERE.md for complete setup guide         │
│  👉 Install Node.js from https://nodejs.org/            │
└─────────────────────────────────────────────────────────┘
```

### Prerequisites

- **Node.js 18+** and npm - [Download here](https://nodejs.org/) - **REQUIRED!**
  - After installation, **restart PowerShell**
  - Verify with: `node --version` and `npm --version`
- Git (optional)
- MetaMask or similar Web3 wallet (for production use)

**⚠️ Important:** After installing Node.js, restart your terminal/PowerShell before continuing.

### Quick Check

Run this to verify prerequisites:
```powershell
cd c:\HACKTHON
.\check-prerequisites.bat
```

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd HACKTHON
```

2. **Install dependencies:**
```bash
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

3. **Start local blockchain:**
```bash
npm run node
```
Keep this terminal running.

4. **Deploy smart contract (in new terminal):**
```bash
npm run compile
npm run deploy
```

After deployment, you'll see output like:
```
Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Admin (FDA): 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
...
```

5. **Configure environment:**

Copy the contract address and update `backend/.env`:
```bash
cd backend
cp .env.example .env
# Edit .env with your contract address and private keys
```

6. **Extract Contract ABI:**
```bash
# Copy ABI from artifacts
cp artifacts/contracts/PharmaSupplyChain.sol/PharmaSupplyChain.json backend/contractABI.json
```

7. **Start backend server (new terminal):**
```bash
cd backend
npm start
```

8. **Start frontend dashboard (new terminal):**
```bash
cd frontend
npm start
```

The dashboard will open at `http://localhost:3000`

## 🎮 Usage Guide

### 1. Creating a Drug Batch

As an **Ingredient Supplier**:

```bash
curl -X POST http://localhost:3001/api/drugs/create \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": "BATCH001",
    "drugName": "Aspirin 500mg",
    "privateKey": "SUPPLIER_PRIVATE_KEY"
  }'
```

### 2. Transferring to Manufacturer

```bash
curl -X POST http://localhost:3001/api/drugs/transfer/manufacturer \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": "BATCH001",
    "manufacturer": "MANUFACTURER_ADDRESS",
    "privateKey": "SUPPLIER_PRIVATE_KEY"
  }'
```

### 3. FDA Approval Process

**Request Approval (Manufacturer):**
```bash
curl -X POST http://localhost:3001/api/fda/request \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": "BATCH001",
    "privateKey": "MANUFACTURER_PRIVATE_KEY"
  }'
```

**Approve Drug (FDA):**
```bash
curl -X POST http://localhost:3001/api/fda/approve \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": "BATCH001",
    "remarks": "Approved for production",
    "privateKey": "FDA_PRIVATE_KEY"
  }'
```

### 4. Manufacturing

```bash
curl -X POST http://localhost:3001/api/drugs/manufacture \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": "BATCH001",
    "privateKey": "MANUFACTURER_PRIVATE_KEY"
  }'
```

### 5. IoT Monitoring

**Start IoT Simulation:**
```bash
cd backend
node iot-simulator.js start BATCH001
```

**Simulate Complete Journey:**
```bash
node iot-simulator.js journey BATCH001 600
```

This will simulate the entire supply chain journey with IoT data logging.

**Manual IoT Data Logging:**
```bash
curl -X POST http://localhost:3001/api/iot/log \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": "BATCH001",
    "location": "Distribution Center",
    "temperature": 5.5,
    "humidity": 45,
    "pressure": 101,
    "tamperDetected": false
  }'
```

### 6. Tracking and Monitoring

**Track Batch:**
```bash
curl http://localhost:3001/api/drugs/BATCH001
```

**View Transaction History:**
```bash
curl http://localhost:3001/api/history/BATCH001
```

**View IoT Data:**
```bash
curl http://localhost:3001/api/iot/BATCH001
```

**View Alerts:**
```bash
curl http://localhost:3001/api/alerts/BATCH001
```

## 📊 Dashboard Features

### Main Dashboard
- **Real-time Statistics**: Transaction count, IoT logs, active alerts
- **Recent Transactions**: Live feed of supply chain activities
- **Create Batch**: Quick batch creation interface

### Batch Tracking
- **Search by Batch ID**: Instant lookup
- **Complete History**: All transactions and transfers
- **IoT Data Visualization**: Temperature and humidity charts
- **Alert Notifications**: Real-time anomaly detection

### Alert Management
- **Active Alerts**: All unresolved issues
- **Alert Types**: Temperature, Humidity, Pressure, Tampering, Fake Transfer
- **FDA Resolution**: FDA can mark alerts as resolved

### IoT Monitoring
- **Live Charts**: Temperature and humidity trends
- **Data Table**: Detailed sensor readings
- **Anomaly Detection**: Automatic alert triggering

## 🔐 Smart Contract Details

### User Roles

| Role ID | Role Name | Permissions |
|---------|-----------|-------------|
| 1 | FDA | Approve/reject drugs, resolve alerts |
| 2 | Ingredient Supplier | Create batches, transfer to manufacturers |
| 3 | Manufacturer | Request FDA approval, manufacture, transfer to repackagers |
| 4 | Repackager | Repackage drugs, transfer to distributors |
| 5 | Distributor | Distribute drugs, transfer to pharmacies |
| 6 | Pharmacy | Dispense drugs to patients |

### Drug Status Flow

```
1. Ingredients Supplied
   ↓
2. FDA Pending
   ↓
3. FDA Approved (or FDA Rejected)
   ↓
4. Manufactured
   ↓
5. Repackaged
   ↓
6. Distributed
   ↓
7. Dispensed
```

### IoT Monitoring Thresholds

| Parameter | Safe Range | Alert Trigger |
|-----------|------------|---------------|
| Temperature | -10°C to 25°C | Outside range |
| Humidity | 0% to 70% | Above 70% |
| Pressure | 95 kPa to 105 kPa | Outside range |
| Tampering | None | Any detection |

## 🧪 Testing

### Unit Tests

Create test file `test/PharmaSupplyChain.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PharmaSupplyChain", function () {
  it("Should deploy and register users", async function () {
    const [admin, supplier] = await ethers.getSigners();
    const PharmaSupplyChain = await ethers.getContractFactory("PharmaSupplyChain");
    const contract = await PharmaSupplyChain.deploy();
    
    await contract.registerUser(supplier.address, "Test Supplier", 2);
    const user = await contract.getUser(supplier.address);
    
    expect(user.name).to.equal("Test Supplier");
    expect(user.role).to.equal(2);
  });
});
```

Run tests:
```bash
npx hardhat test
```

## 🚨 Alert System

### Automated Alerts

The system automatically triggers alerts for:

1. **Temperature Anomalies**: < -10°C or > 25°C
2. **Humidity Issues**: > 70%
3. **Pressure Problems**: < 95 kPa or > 105 kPa
4. **Tampering Detected**: IoT sensor triggers
5. **Unauthorized Transfers**: Role-based validation failures

### Alert Resolution

Only FDA users can resolve alerts through:
- Dashboard UI
- API endpoint: `POST /api/alerts/:alertId/resolve`

## 🔧 Advanced Configuration

### Custom Network Deployment

Edit `hardhat.config.js`:

```javascript
networks: {
  sepolia: {
    url: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

Deploy:
```bash
npm run deploy:testnet
```

### Environment Variables

**Backend (.env):**
```env
PORT=3001
BLOCKCHAIN_NETWORK=local
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
IOT_PRIVATE_KEY=0x...
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:3001/api
```

## 📈 Analytics & Monitoring

### Available Endpoints

```
GET /api/analytics/overview
GET /api/transactions
GET /api/alerts
GET /api/drugs/:batchId
GET /api/history/:batchId
GET /api/iot/:batchId
GET /api/fda/approval/:batchId
```

## 🛡️ Security Considerations

1. **Private Key Management**: Never commit private keys to version control
2. **Role-Based Access**: All functions validate user roles
3. **Immutable Records**: Blockchain ensures data integrity
4. **Input Validation**: Smart contract validates all inputs
5. **Reentrancy Protection**: Built-in Solidity 0.8+ protections

## 🐛 Troubleshooting

### Common Issues

**1. Contract deployment fails:**
```bash
# Ensure local blockchain is running
npm run node
```

**2. Backend can't connect to blockchain:**
```bash
# Check .env file has correct CONTRACT_ADDRESS and RPC_URL
# Verify blockchain is accessible
```

**3. Frontend API errors:**
```bash
# Ensure backend is running on correct port
# Check REACT_APP_API_URL in frontend/.env
```

**4. IoT simulator errors:**
```bash
# Verify contract ABI is correctly copied
# Check IOT_PRIVATE_KEY in backend/.env
```

## 📝 API Documentation

Complete API documentation available at:
`http://localhost:3001/api/health` (when server is running)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

Developed for Pharmaceutical Supply Chain Hackathon

## 🙏 Acknowledgments

- Ethereum Foundation
- Hardhat Development Environment
- Material-UI Components
- React Community

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact: [your-email]

---

**Built with ❤️ using Blockchain & IoT Technologies**
