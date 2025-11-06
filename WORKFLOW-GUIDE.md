# 🔄 Supply Chain Workflow Guide

## ⚠️ IMPORTANT: Ownership Rules

**YOU MUST OWN A BATCH TO TRANSFER IT!**

Each transfer changes ownership. You can only perform actions on batches YOU currently own.

---

## 📋 Complete Workflow Sequence

### BATCH002 Current Status Problem:

```
❌ WRONG ORDER:
   1. Supplier created BATCH002 → Supplier owns it
   2. You tried: Manufacturer → Manufacture 
      ERROR: Manufacturer doesn't own it!
   3. You tried: Manufacturer → Transfer to Repackager
      ERROR: Manufacturer still doesn't own it!

✅ CORRECT ORDER:
   1. Supplier creates BATCH002 → Supplier owns it
   2. Supplier transfers to Manufacturer → Manufacturer owns it
   3. Manufacturer manufactures → Manufacturer still owns it
   4. Manufacturer transfers to Repackager → Repackager owns it
   5. Repackager transfers to Distributor → Distributor owns it
   6. Distributor transfers to Pharmacy → Pharmacy owns it
```

---

## 🎯 Step-by-Step: Complete a Batch from Start to Finish

### Step 1: Create Batch (Ingredient Supplier)
```
Login: Ingredient Supplier Co.
Action: Create Drug Batch
Input:
  - Batch ID: BATCH003
  - Drug Name: Paracetamol 250mg
Result: BATCH003 created, owned by Supplier
Status: INGREDIENTS_SUPPLIED
```

### Step 2: Request FDA Approval (Ingredient Supplier - OPTIONAL)
```
Login: Ingredient Supplier Co. (still logged in)
Action: Request FDA Approval
Input:
  - Batch ID: BATCH003
Result: Request logged (no ownership change)
Status: Still INGREDIENTS_SUPPLIED
```

### Step 3: Transfer to Manufacturer (Ingredient Supplier)
```
Login: Ingredient Supplier Co. (must still be logged in!)
Action: Transfer to Manufacturer
Input:
  - Batch ID: BATCH003
  - Select: PharmaTech Manufacturing
  - Location: Factory A, Mumbai
Result: BATCH003 now owned by Manufacturer
Status: FDA_PENDING
```

### Step 4: FDA Approval (FDA)
```
Logout → Login: FDA Regulatory Authority
Action: Approve Drug Batch
Input:
  - Batch ID: BATCH003
  - Remarks: Approved for production
Result: Batch approved (no ownership change)
Status: FDA_APPROVED
Owner: Still Manufacturer
```

### Step 5: Manufacture Drug (Manufacturer)
```
Logout → Login: PharmaTech Manufacturing
Action: Manufacture Drug
Input:
  - Batch ID: BATCH003
Result: Drug manufactured (no ownership change)
Status: MANUFACTURED
Owner: Still Manufacturer
```

### Step 6: Transfer to Repackager (Manufacturer)
```
Login: PharmaTech Manufacturing (still logged in!)
Action: Transfer to Repackager
Input:
  - Batch ID: BATCH003
  - Select: RePackage Solutions Inc.
  - Location: Warehouse B, Delhi
Result: BATCH003 now owned by Repackager
Status: REPACKAGED
```

### Step 7: Transfer to Distributor (Repackager)
```
Logout → Login: RePackage Solutions Inc.
Action: Transfer to Distributor
Input:
  - Batch ID: BATCH003
  - Select: Global Distribution Network
  - Location: Distribution Center, Bangalore
Result: BATCH003 now owned by Distributor
Status: DISTRIBUTED
```

### Step 8: Transfer to Pharmacy (Distributor)
```
Logout → Login: Global Distribution Network
Action: Transfer to Pharmacy
Input:
  - Batch ID: BATCH003
  - Select: City Central Pharmacy
  - Location: Pharmacy Store, Chennai
Result: BATCH003 now owned by Pharmacy
Status: DISPENSED
```

### Step 9: View Complete Journey (Any Role)
```
Login: Any user
Tab: Track Batch
Input: BATCH003
Result: See complete history with all transfers!
```

---

## 🚨 Common Errors & Solutions

### Error: "Not the current owner"

**Problem:** You're trying to transfer a batch you don't own.

**Solution:**
1. Go to "Track Batch" tab
2. Search for your batch ID
3. Look at "Current Owner" field
4. Logout and login as that owner
5. Now you can transfer it!

**Example:**
```
Batch: BATCH002
Current Owner: 0x7099...79C8 (Ingredient Supplier)
Your Login: Manufacturer

❌ You can't transfer it!
✅ Logout → Login as "Ingredient Supplier Co." → Transfer to Manufacturer
```

---

## 📊 Ownership Transfer Matrix

| From Role | To Role | Function | Ownership Changes? |
|-----------|---------|----------|-------------------|
| Supplier | Manufacturer | Transfer to Manufacturer | ✅ YES |
| Manufacturer | Manufacturer | Manufacture Drug | ❌ NO |
| Manufacturer | Repackager | Transfer to Repackager | ✅ YES |
| Repackager | Distributor | Transfer to Distributor | ✅ YES |
| Distributor | Pharmacy | Transfer to Pharmacy | ✅ YES |
| FDA | - | Approve/Reject | ❌ NO (FDA never owns batches) |

---

## 🔍 How to Check Who Owns a Batch

### Method 1: Track Batch Tab
1. Go to "Track Batch" tab
2. Enter Batch ID
3. Click "Search"
4. Look at "Current Owner" field
5. Compare with user addresses below

### Method 2: User Address Reference

```
Ingredient Supplier: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Manufacturer:        0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Repackager:          0x90F79bf6EB2c4f870365E785982E1f101E93b906
Distributor:         0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
Pharmacy:            0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc
```

---

## 💡 Pro Tips

1. **Stay logged in** when doing multiple actions as the same role
2. **Track before transferring** - check current owner first
3. **FDA can approve anytime** - doesn't need ownership
4. **Pharmacy is the end** - no transfers after this
5. **Create new batches** if you make mistakes - easier than debugging

---

## 🎬 Quick Test Workflow (5 minutes)

```powershell
# Create a fresh batch and complete the full journey:

1. Login: Ingredient Supplier
   → Create: BATCH999, Aspirin 500mg
   
2. Still Supplier
   → Transfer to Manufacturer (select PharmaTech)
   
3. Logout → Login: FDA
   → Approve BATCH999
   
4. Logout → Login: Manufacturer
   → Manufacture BATCH999
   
5. Still Manufacturer
   → Transfer to Repackager (select RePackage Solutions)
   
6. Logout → Login: Repackager
   → Transfer to Distributor (select Global Distribution)
   
7. Logout → Login: Distributor
   → Transfer to Pharmacy (select City Central)
   
8. Go to Track Batch → Search BATCH999
   → See complete journey! ✅
```

---

## 🆘 BATCH002 Fix Right Now

Your BATCH002 is stuck because Supplier still owns it.

**Fix it:**
```
1. Logout
2. Login as "Ingredient Supplier Co."
3. Click "Transfer to Manufacturer"
4. Batch ID: BATCH002
5. Select: PharmaTech Manufacturing
6. Location: Factory A
7. Execute
8. ✅ NOW manufacturer can manufacture it!
```

---

**Remember: Always transfer BEFORE the next person can do their action!** 🔄
