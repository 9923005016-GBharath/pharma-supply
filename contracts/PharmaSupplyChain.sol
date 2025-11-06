// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PharmaSupplyChain {
    
    // Enums
    enum UserRole { NONE, FDA, INGREDIENT_SUPPLIER, MANUFACTURER, REPACKAGER, DISTRIBUTOR, PHARMACY }
    enum DrugStatus { NONE, INGREDIENTS_SUPPLIED, FDA_PENDING, FDA_APPROVED, FDA_REJECTED, MANUFACTURED, REPACKAGED, DISTRIBUTED, DISPENSED }
    enum AlertType { TEMPERATURE, HUMIDITY, PRESSURE, TAMPERING, FAKE_TRANSFER }
    
    // Structs
    struct User {
        address userAddress;
        string name;
        UserRole role;
        bool isActive;
        uint256 registeredAt;
    }
    
    struct Drug {
        string batchId;
        string drugName;
        address currentOwner;
        DrugStatus status;
        uint256 createdAt;
        bool exists;
    }
    
    struct Transaction {
        string batchId;
        address from;
        address to;
        DrugStatus status;
        uint256 timestamp;
        string location;
        string remarks;
    }
    
    struct IoTData {
        string batchId;
        uint256 timestamp;
        string location;
        int256 temperature; // in Celsius * 100 (for decimals)
        uint256 humidity; // in percentage
        uint256 pressure; // in kPa
        bool tamperDetected;
    }
    
    struct Alert {
        string batchId;
        AlertType alertType;
        uint256 timestamp;
        string message;
        bool resolved;
        address resolvedBy;
    }
    
    struct FDAApproval {
        string batchId;
        bool approved;
        uint256 timestamp;
        string remarks;
        address approvedBy;
    }
    
    // State variables
    address public admin;
    uint256 public transactionCount;
    uint256 public iotDataCount;
    uint256 public alertCount;
    
    // Mappings
    mapping(address => User) public users;
    mapping(string => Drug) public drugs;
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => IoTData) public iotDataLogs;
    mapping(uint256 => Alert) public alerts;
    mapping(string => FDAApproval) public fdaApprovals;
    mapping(string => uint256[]) public batchTransactions;
    mapping(string => uint256[]) public batchIoTData;
    mapping(string => uint256[]) public batchAlerts;
    
    // Events
    event UserRegistered(address indexed userAddress, string name, UserRole role);
    event DrugCreated(string batchId, string drugName, address indexed creator);
    event DrugTransferred(string batchId, address indexed from, address indexed to, DrugStatus status);
    event IoTDataLogged(string batchId, uint256 timestamp, int256 temperature, uint256 humidity);
    event AlertTriggered(string batchId, AlertType alertType, string message);
    event FDAApprovalRequested(string batchId, address indexed manufacturer);
    event FDAApprovalGranted(string batchId, address indexed fdaAgent);
    event FDAApprovalRejected(string batchId, address indexed fdaAgent, string reason);
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyRole(UserRole _role) {
        require(users[msg.sender].role == _role, "Unauthorized role");
        require(users[msg.sender].isActive, "User is not active");
        _;
    }
    
    modifier drugExists(string memory _batchId) {
        require(drugs[_batchId].exists, "Drug batch does not exist");
        _;
    }
    
    modifier onlyDrugOwner(string memory _batchId) {
        require(drugs[_batchId].currentOwner == msg.sender, "Not the current owner");
        _;
    }
    
    constructor() {
        admin = msg.sender;
        // Register admin as FDA
        users[msg.sender] = User({
            userAddress: msg.sender,
            name: "FDA Admin",
            role: UserRole.FDA,
            isActive: true,
            registeredAt: block.timestamp
        });
    }
    
    // User Management
    function registerUser(address _userAddress, string memory _name, UserRole _role) public onlyAdmin {
        require(_role != UserRole.NONE, "Invalid role");
        require(!users[_userAddress].isActive, "User already registered");
        
        users[_userAddress] = User({
            userAddress: _userAddress,
            name: _name,
            role: _role,
            isActive: true,
            registeredAt: block.timestamp
        });
        
        emit UserRegistered(_userAddress, _name, _role);
    }
    
    function deactivateUser(address _userAddress) public onlyAdmin {
        require(users[_userAddress].isActive, "User not active");
        users[_userAddress].isActive = false;
    }
    
    // Drug Supply Chain Functions
    function createDrugBatch(string memory _batchId, string memory _drugName) public onlyRole(UserRole.INGREDIENT_SUPPLIER) {
        require(!drugs[_batchId].exists, "Batch ID already exists");
        
        drugs[_batchId] = Drug({
            batchId: _batchId,
            drugName: _drugName,
            currentOwner: msg.sender,
            status: DrugStatus.INGREDIENTS_SUPPLIED,
            createdAt: block.timestamp,
            exists: true
        });
        
        _logTransaction(_batchId, address(0), msg.sender, DrugStatus.INGREDIENTS_SUPPLIED, "", "Ingredients supplied");
        
        emit DrugCreated(_batchId, _drugName, msg.sender);
    }
    
    function transferToManufacturer(string memory _batchId, address _manufacturer) 
        public 
        drugExists(_batchId)
        onlyDrugOwner(_batchId)
        onlyRole(UserRole.INGREDIENT_SUPPLIER)
    {
        require(users[_manufacturer].role == UserRole.MANUFACTURER, "Recipient must be a manufacturer");
        require(users[_manufacturer].isActive, "Manufacturer not active");
        
        drugs[_batchId].currentOwner = _manufacturer;
        drugs[_batchId].status = DrugStatus.FDA_PENDING;
        
        _logTransaction(_batchId, msg.sender, _manufacturer, DrugStatus.FDA_PENDING, "", "Transferred to manufacturer, pending FDA approval");
        
        emit DrugTransferred(_batchId, msg.sender, _manufacturer, DrugStatus.FDA_PENDING);
    }
    
    function requestFDAApproval(string memory _batchId) 
        public 
        drugExists(_batchId)
        onlyDrugOwner(_batchId)
        onlyRole(UserRole.MANUFACTURER)
    {
        require(drugs[_batchId].status == DrugStatus.FDA_PENDING, "Drug not in pending state");
        
        emit FDAApprovalRequested(_batchId, msg.sender);
    }
    
    function approveDrug(string memory _batchId, string memory _remarks) 
        public 
        drugExists(_batchId)
        onlyRole(UserRole.FDA)
    {
        require(drugs[_batchId].status == DrugStatus.FDA_PENDING, "Drug not in pending state");
        
        drugs[_batchId].status = DrugStatus.FDA_APPROVED;
        
        fdaApprovals[_batchId] = FDAApproval({
            batchId: _batchId,
            approved: true,
            timestamp: block.timestamp,
            remarks: _remarks,
            approvedBy: msg.sender
        });
        
        _logTransaction(_batchId, msg.sender, drugs[_batchId].currentOwner, DrugStatus.FDA_APPROVED, "", _remarks);
        
        emit FDAApprovalGranted(_batchId, msg.sender);
    }
    
    function rejectDrug(string memory _batchId, string memory _reason) 
        public 
        drugExists(_batchId)
        onlyRole(UserRole.FDA)
    {
        require(drugs[_batchId].status == DrugStatus.FDA_PENDING, "Drug not in pending state");
        
        drugs[_batchId].status = DrugStatus.FDA_REJECTED;
        
        fdaApprovals[_batchId] = FDAApproval({
            batchId: _batchId,
            approved: false,
            timestamp: block.timestamp,
            remarks: _reason,
            approvedBy: msg.sender
        });
        
        _logTransaction(_batchId, msg.sender, drugs[_batchId].currentOwner, DrugStatus.FDA_REJECTED, "", _reason);
        
        emit FDAApprovalRejected(_batchId, msg.sender, _reason);
    }
    
    function manufactureDrug(string memory _batchId) 
        public 
        drugExists(_batchId)
        onlyDrugOwner(_batchId)
        onlyRole(UserRole.MANUFACTURER)
    {
        require(drugs[_batchId].status == DrugStatus.FDA_APPROVED, "Drug not FDA approved");
        
        drugs[_batchId].status = DrugStatus.MANUFACTURED;
        
        _logTransaction(_batchId, msg.sender, msg.sender, DrugStatus.MANUFACTURED, "", "Drug manufactured");
        
        emit DrugTransferred(_batchId, msg.sender, msg.sender, DrugStatus.MANUFACTURED);
    }
    
    function transferToRepackager(string memory _batchId, address _repackager, string memory _location) 
        public 
        drugExists(_batchId)
        onlyDrugOwner(_batchId)
        onlyRole(UserRole.MANUFACTURER)
    {
        require(users[_repackager].role == UserRole.REPACKAGER, "Recipient must be a repackager");
        require(users[_repackager].isActive, "Repackager not active");
        require(drugs[_batchId].status == DrugStatus.MANUFACTURED, "Drug not manufactured");
        
        drugs[_batchId].currentOwner = _repackager;
        drugs[_batchId].status = DrugStatus.REPACKAGED;
        
        _logTransaction(_batchId, msg.sender, _repackager, DrugStatus.REPACKAGED, _location, "Transferred to repackager");
        
        emit DrugTransferred(_batchId, msg.sender, _repackager, DrugStatus.REPACKAGED);
    }
    
    function transferToDistributor(string memory _batchId, address _distributor, string memory _location) 
        public 
        drugExists(_batchId)
        onlyDrugOwner(_batchId)
    {
        require(users[_distributor].role == UserRole.DISTRIBUTOR, "Recipient must be a distributor");
        require(users[_distributor].isActive, "Distributor not active");
        require(drugs[_batchId].status == DrugStatus.REPACKAGED, "Drug not repackaged");
        
        drugs[_batchId].currentOwner = _distributor;
        drugs[_batchId].status = DrugStatus.DISTRIBUTED;
        
        _logTransaction(_batchId, msg.sender, _distributor, DrugStatus.DISTRIBUTED, _location, "Transferred to distributor");
        
        emit DrugTransferred(_batchId, msg.sender, _distributor, DrugStatus.DISTRIBUTED);
    }
    
    function transferToPharmacy(string memory _batchId, address _pharmacy, string memory _location) 
        public 
        drugExists(_batchId)
        onlyDrugOwner(_batchId)
        onlyRole(UserRole.DISTRIBUTOR)
    {
        require(users[_pharmacy].role == UserRole.PHARMACY, "Recipient must be a pharmacy");
        require(users[_pharmacy].isActive, "Pharmacy not active");
        require(drugs[_batchId].status == DrugStatus.DISTRIBUTED, "Drug not distributed");
        
        drugs[_batchId].currentOwner = _pharmacy;
        drugs[_batchId].status = DrugStatus.DISPENSED;
        
        _logTransaction(_batchId, msg.sender, _pharmacy, DrugStatus.DISPENSED, _location, "Transferred to pharmacy");
        
        emit DrugTransferred(_batchId, msg.sender, _pharmacy, DrugStatus.DISPENSED);
    }
    
    // IoT Data Logging
    function logIoTData(
        string memory _batchId,
        string memory _location,
        int256 _temperature,
        uint256 _humidity,
        uint256 _pressure,
        bool _tamperDetected
    ) public {
        require(drugs[_batchId].exists, "Drug batch does not exist");
        
        iotDataLogs[iotDataCount] = IoTData({
            batchId: _batchId,
            timestamp: block.timestamp,
            location: _location,
            temperature: _temperature,
            humidity: _humidity,
            pressure: _pressure,
            tamperDetected: _tamperDetected
        });
        
        batchIoTData[_batchId].push(iotDataCount);
        iotDataCount++;
        
        // Check for anomalies and trigger alerts
        if (_tamperDetected) {
            _triggerAlert(_batchId, AlertType.TAMPERING, "Tampering detected in shipment");
        }
        
        if (_temperature < -1000 || _temperature > 2500) { // -10°C to 25°C range
            _triggerAlert(_batchId, AlertType.TEMPERATURE, "Temperature out of safe range");
        }
        
        if (_humidity > 70) {
            _triggerAlert(_batchId, AlertType.HUMIDITY, "Humidity exceeds safe limit");
        }
        
        if (_pressure < 95 || _pressure > 105) { // 95-105 kPa
            _triggerAlert(_batchId, AlertType.PRESSURE, "Pressure anomaly detected");
        }
        
        emit IoTDataLogged(_batchId, block.timestamp, _temperature, _humidity);
    }
    
    // Alert Management
    function _triggerAlert(string memory _batchId, AlertType _alertType, string memory _message) private {
        alerts[alertCount] = Alert({
            batchId: _batchId,
            alertType: _alertType,
            timestamp: block.timestamp,
            message: _message,
            resolved: false,
            resolvedBy: address(0)
        });
        
        batchAlerts[_batchId].push(alertCount);
        alertCount++;
        
        emit AlertTriggered(_batchId, _alertType, _message);
    }
    
    function resolveAlert(uint256 _alertId) public {
        require(users[msg.sender].role != UserRole.NONE, "User not registered");
        require(users[msg.sender].isActive, "User not active");
        require(_alertId < alertCount, "Alert does not exist");
        alerts[_alertId].resolved = true;
        alerts[_alertId].resolvedBy = msg.sender;
    }
    
    // Internal helper
    function _logTransaction(
        string memory _batchId,
        address _from,
        address _to,
        DrugStatus _status,
        string memory _location,
        string memory _remarks
    ) private {
        transactions[transactionCount] = Transaction({
            batchId: _batchId,
            from: _from,
            to: _to,
            status: _status,
            timestamp: block.timestamp,
            location: _location,
            remarks: _remarks
        });
        
        batchTransactions[_batchId].push(transactionCount);
        transactionCount++;
    }
    
    // View Functions
    function getDrugHistory(string memory _batchId) public view returns (uint256[] memory) {
        return batchTransactions[_batchId];
    }
    
    function getIoTDataForBatch(string memory _batchId) public view returns (uint256[] memory) {
        return batchIoTData[_batchId];
    }
    
    function getAlertsForBatch(string memory _batchId) public view returns (uint256[] memory) {
        return batchAlerts[_batchId];
    }
    
    function getUser(address _userAddress) public view returns (User memory) {
        return users[_userAddress];
    }
    
    function getDrug(string memory _batchId) public view returns (Drug memory) {
        return drugs[_batchId];
    }
    
    function getFDAApproval(string memory _batchId) public view returns (FDAApproval memory) {
        return fdaApprovals[_batchId];
    }
}
