# Role-Based Authentication System

## Overview

The pharmaceutical supply chain system now implements **complete role-based authentication** ensuring that only authorized users can perform specific supply chain actions.

## 🔐 Authentication Flow

### 1. Login Process
- Users must login before accessing the dashboard
- Two login methods available:
  - **Quick Login**: Click pre-registered demo user (instant access)
  - **Manual Login**: Select role + enter private key

### 2. Session Management
- User credentials stored in `localStorage`
- Persists across page refreshes
- Includes: address, name, role, and **privateKey**

### 3. Logout
- Clears localStorage
- Returns to login screen
- Allows switching between different role accounts

## 👥 Pre-Registered Users

| Role ID | Role Name | Organization | Actions Available |
|---------|-----------|--------------|-------------------|
| **1** | FDA | FDA Regulatory Authority | Approve/Reject drugs, Resolve alerts |
| **2** | Ingredient Supplier | Ingredient Supplier Co. | Create batches, Transfer to manufacturer, Request FDA approval |
| **3** | Manufacturer | PharmaTech Manufacturing | Manufacture drugs, Transfer to repackager |
| **4** | Repackager | RePackage Solutions Inc. | Transfer to distributor |
| **5** | Distributor | Global Distribution Network | Transfer to pharmacy |
| **6** | Pharmacy | City Central Pharmacy | View and track received batches |

## 🔑 User Credentials (Demo)

```javascript
// FDA
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

// Ingredient Supplier
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

// Manufacturer
Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

// Repackager
Address: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6

// Distributor
Address: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
Private Key: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a

// Pharmacy
Address: 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc
Private Key: 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba
```

## 🎯 Role-Based Permissions

### FDA (Role 1)
**Smart Contract Functions:**
- ✅ `approveDrug(batchId, remarks)`
- ✅ `rejectDrug(batchId, reason)`
- ✅ `resolveAlert(alertId)`

**Dashboard Actions:**
- Approve Drug Batch
- Reject Drug Batch
- View all batches and alerts

### Ingredient Supplier (Role 2)
**Smart Contract Functions:**
- ✅ `createDrugBatch(batchId, drugName)`
- ✅ `transferToManufacturer(batchId, manufacturer)`
- ✅ `requestFDAApproval(batchId)`

**Dashboard Actions:**
- Create Drug Batch
- Transfer to Manufacturer
- Request FDA Approval

### Manufacturer (Role 3)
**Smart Contract Functions:**
- ✅ `manufactureDrug(batchId)`
- ✅ `transferToRepackager(batchId, repackager, location)`

**Dashboard Actions:**
- Manufacture Drug
- Transfer to Repackager

### Repackager (Role 4)
**Smart Contract Functions:**
- ✅ `transferToDistributor(batchId, distributor, location)`

**Dashboard Actions:**
- Transfer to Distributor

### Distributor (Role 5)
**Smart Contract Functions:**
- ✅ `transferToPharmacy(batchId, pharmacy, location)`

**Dashboard Actions:**
- Transfer to Pharmacy

### Pharmacy (Role 6)
**Capabilities:**
- 📦 View received batches
- 📊 Track complete supply chain history
- 🔍 Monitor IoT data for received drugs
- ⚠️ View alerts

*Note: Pharmacy is the final destination - no transfer actions available*

## 🏗️ Implementation Architecture

### Frontend Components

#### 1. `Login.js`
- Renders login screen with quick-login buttons
- Validates manual login credentials
- Calls `onLogin(user)` callback with complete user object
- User object includes: `{ address, privateKey, name, role }`

#### 2. `App.js`
- Main application container
- Manages authentication state with `currentUser`
- Persists session to `localStorage`
- Shows login screen if no user logged in
- Displays logout button with user info when logged in
- Passes `currentUser` to `WorkflowActions` component

#### 3. `WorkflowActions.js`
- Dynamically renders action buttons based on `currentUser.role`
- Opens role-specific dialogs for each action
- Automatically includes `currentUser.privateKey` in all API calls
- Shows appropriate form fields based on action type
- Provides dropdown selection for target addresses (e.g., select manufacturer)

### Backend Integration

#### API Authentication
All state-changing endpoints accept `privateKey` parameter:

```javascript
// Example: Create batch
POST /api/drugs/create
{
  "batchId": "BATCH001",
  "drugName": "Aspirin 500mg",
  "privateKey": "0x59c6995e..." // Supplier's private key
}

// Backend creates signer from private key
const userSigner = new ethers.Wallet(privateKey, provider);
const userContract = contract.connect(userSigner);
const tx = await userContract.createDrugBatch(batchId, drugName);
```

#### Smart Contract Enforcement
The smart contract enforces role-based access with modifiers:

```solidity
modifier onlyRole(UserRole _role) {
    require(users[msg.sender].role == _role, "Unauthorized role");
    require(users[msg.sender].isActive, "User is not active");
    _;
}

// Example usage
function createDrugBatch(string memory _batchId, string memory _drugName) 
    public 
    onlyRole(UserRole.IngredientSupplier) 
{
    // Only Ingredient Suppliers can execute this
}
```

## 🔄 Complete Workflow Example

### Scenario: Drug Batch from Creation to Pharmacy

**Step 1: Supplier Creates Batch**
```
Login: Ingredient Supplier
Action: Create Drug Batch
Input: BATCH001, Aspirin 500mg
Result: Batch created with status "Ingredients Supplied"
```

**Step 2: Supplier Requests FDA Approval**
```
Login: Ingredient Supplier (same user)
Action: Request FDA Approval
Input: BATCH001
Result: Batch status → "FDA Pending"
```

**Step 3: FDA Reviews**
```
Logout → Login: FDA Regulatory Authority
Action: Approve Drug Batch
Input: BATCH001, "Meets safety standards"
Result: Batch status → "FDA Approved"
```

**Step 4: Supplier Transfers**
```
Logout → Login: Ingredient Supplier
Action: Transfer to Manufacturer
Input: BATCH001, Select manufacturer, Location
Result: Ownership transferred to manufacturer
```

**Step 5: Manufacturing**
```
Logout → Login: Manufacturer
Action: Manufacture Drug
Input: BATCH001
Result: Batch status → "Manufactured"
```

**Step 6-8: Continue Chain**
```
Manufacturer → Repackager → Distributor → Pharmacy
Each transfer requires logging in as the current owner
```

**Step 9: Track Journey**
```
Login: Any role
Go to Track Batch tab
Search: BATCH001
View: Complete history, all transactions, IoT data
```

## 🛡️ Security Features

### 1. Private Key Protection
- Never exposed in UI (password input type)
- Transmitted via HTTPS in production
- Only used server-side to sign transactions
- Not stored on blockchain (only address)

### 2. Smart Contract Validation
- Every function checks `msg.sender` role
- Active user status verified
- Ownership transfers validated
- Status progression enforced

### 3. Session Management
- Logout clears all credentials
- Private keys stored only in browser localStorage
- Each action requires re-authentication via private key

### 4. Transaction Signing
- All blockchain transactions signed with user's private key
- Backend creates temporary signer per request
- No long-lived key storage on server

## 📊 Testing Checklist

- [ ] Login as FDA → Approve/Reject batch
- [ ] Login as Supplier → Create batch + Request FDA
- [ ] Login as Manufacturer → Manufacture drug
- [ ] Login as Repackager → Transfer to distributor
- [ ] Login as Distributor → Transfer to pharmacy
- [ ] Login as Pharmacy → View received batch
- [ ] Logout → Verify session cleared
- [ ] Refresh page → Verify session persists
- [ ] Try unauthorized action → Verify smart contract rejects
- [ ] Complete multi-user workflow → Track entire journey

## 🚀 Deployment Checklist

### Development
- ✅ Hardhat local network with test accounts
- ✅ Pre-registered demo users
- ✅ Quick-login for easy testing

### Production
- [ ] Use environment-specific private keys
- [ ] Implement proper key management (e.g., AWS KMS, HashiCorp Vault)
- [ ] Add HTTPS for API communication
- [ ] Implement rate limiting
- [ ] Add multi-factor authentication
- [ ] Use production blockchain network (e.g., Polygon, Ethereum mainnet)
- [ ] Implement user registration workflow
- [ ] Add admin panel for user management

## 📝 API Examples

### Create Batch (Supplier)
```bash
curl -X POST http://localhost:3001/api/drugs/create \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": "BATCH001",
    "drugName": "Aspirin 500mg",
    "privateKey": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
  }'
```

### Approve Drug (FDA)
```bash
curl -X POST http://localhost:3001/api/fda/approve \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": "BATCH001",
    "remarks": "Approved for production",
    "privateKey": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  }'
```

### Transfer to Manufacturer (Supplier)
```bash
curl -X POST http://localhost:3001/api/drugs/transfer/manufacturer \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": "BATCH001",
    "manufacturer": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "privateKey": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
  }'
```

## 🎓 Key Learnings

1. **Separation of Concerns**: Login component handles auth, App manages state, WorkflowActions renders role-specific UI
2. **Smart Contract Security**: Role enforcement happens on-chain, not just in frontend
3. **User Experience**: Quick-login simplifies testing without compromising security model
4. **State Management**: localStorage provides persistence without backend session management
5. **Dynamic UI**: Same dashboard shows different actions based on logged-in user role

---

**Built with**: React 18, Material-UI, Solidity 0.8.20, Hardhat, ethers.js v6

**Security Note**: These private keys are for LOCAL DEVELOPMENT ONLY. Never use these accounts or keys in production or on public networks.
