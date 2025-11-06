const { ethers } = require('ethers');
require('dotenv').config();

const contractJSON = require('./contractABI.json');
const contractABI = contractJSON.abi;

class IoTSimulator {
    constructor(contractAddress, providerUrl, privateKey) {
        this.provider = new ethers.JsonRpcProvider(providerUrl);
        this.signer = new ethers.Wallet(privateKey, this.provider);
        this.contract = new ethers.Contract(contractAddress, contractABI, this.signer);
        this.activeShipments = new Map();
        this.simulationIntervals = new Map();
    }

    // GPS coordinates for common pharmaceutical supply chain locations
    getGPSCoordinates(locationName) {
        const coordinates = {
            'Warehouse A': { lat: 40.7128, lng: -74.0060, city: 'New York, NY' },
            'Transit Hub B': { lat: 41.8781, lng: -87.6298, city: 'Chicago, IL' },
            'Distribution Center C': { lat: 34.0522, lng: -118.2437, city: 'Los Angeles, CA' },
            'Pharmacy D': { lat: 37.7749, lng: -122.4194, city: 'San Francisco, CA' },
            'Supplier Warehouse': { lat: 39.9526, lng: -75.1652, city: 'Philadelphia, PA' },
            'Highway Route 1': { lat: 40.0583, lng: -76.3055, city: 'Route I-76' },
            'Manufacturing Plant': { lat: 42.3601, lng: -71.0589, city: 'Boston, MA' },
            'Quality Control Lab': { lat: 42.3736, lng: -71.1097, city: 'Cambridge, MA' },
            'Highway Route 2': { lat: 41.2565, lng: -73.9840, city: 'Route I-84' },
            'Repackaging Facility': { lat: 41.0534, lng: -73.5387, city: 'Stamford, CT' },
            'Packaging Line': { lat: 41.0632, lng: -73.5387, city: 'Stamford, CT' },
            'Highway Route 3': { lat: 40.7589, lng: -73.9851, city: 'Route I-95' },
            'Regional Hub': { lat: 38.9072, lng: -77.0369, city: 'Washington, DC' },
            'City Route': { lat: 39.2904, lng: -76.6122, city: 'Baltimore, MD' },
            'Local Pharmacy': { lat: 39.9612, lng: -82.9988, city: 'Columbus, OH' }
        };

        // Add small random variation to simulate GPS drift (±0.01 degrees ≈ 1km)
        const baseCoords = coordinates[locationName] || { lat: 40.7128, lng: -74.0060, city: 'Unknown' };
        const lat = baseCoords.lat + (Math.random() * 0.02 - 0.01);
        const lng = baseCoords.lng + (Math.random() * 0.02 - 0.01);

        return {
            latitude: Math.round(lat * 10000) / 10000,
            longitude: Math.round(lng * 10000) / 10000,
            city: baseCoords.city
        };
    }

    // Generate random sensor data
    generateSensorData(batchId, route) {
        const baseTemp = 5; // Base temperature in Celsius
        const tempVariation = Math.random() * 4 - 2; // -2 to +2 degrees variation
        const temperature = baseTemp + tempVariation;

        // Random chance of anomalies
        const hasAnomaly = Math.random() < 0.05; // 5% chance of anomaly

        let humidity = 40 + Math.random() * 20; // 40-60% normal range
        let pressure = 100 + Math.random() * 3; // 100-103 kPa normal
        let tamperDetected = false;

        if (hasAnomaly) {
            const anomalyType = Math.floor(Math.random() * 4);
            switch (anomalyType) {
                case 0: // Temperature anomaly
                    humidity = Math.random() < 0.5 ? -15 : 30; // Too cold or too hot
                    break;
                case 1: // Humidity anomaly
                    humidity = 75 + Math.random() * 20; // 75-95%
                    break;
                case 2: // Pressure anomaly
                    pressure = Math.random() < 0.5 ? 90 : 110;
                    break;
                case 3: // Tampering
                    tamperDetected = true;
                    break;
            }
        }

        const locationName = route[Math.floor(Math.random() * route.length)];
        const gps = this.getGPSCoordinates(locationName);

        return {
            batchId,
            location: `${locationName} (${gps.city})`,
            latitude: gps.latitude,
            longitude: gps.longitude,
            temperature: Math.round(temperature * 100) / 100,
            humidity: Math.round(humidity),
            pressure: Math.round(pressure),
            tamperDetected
        };
    }

    // Start monitoring a shipment
    async startMonitoring(batchId, route, intervalSeconds = 30) {
        console.log(`📡 Starting IoT monitoring for batch: ${batchId}`);
        console.log(`📍 Route: ${route.join(' → ')}`);

        this.activeShipments.set(batchId, {
            route,
            startTime: Date.now()
        });

        // Initial data log
        await this.logData(batchId, route);

        // Set up periodic logging
        const interval = setInterval(async () => {
            await this.logData(batchId, route);
        }, intervalSeconds * 1000);

        this.simulationIntervals.set(batchId, interval);

        return {
            success: true,
            message: `IoT monitoring started for ${batchId}`,
            interval: intervalSeconds
        };
    }

    // Stop monitoring a shipment
    stopMonitoring(batchId) {
        if (this.simulationIntervals.has(batchId)) {
            clearInterval(this.simulationIntervals.get(batchId));
            this.simulationIntervals.delete(batchId);
            this.activeShipments.delete(batchId);
            console.log(`⏹️ Stopped monitoring batch: ${batchId}`);
            return { success: true, message: `Monitoring stopped for ${batchId}` };
        }
        return { success: false, message: `No active monitoring for ${batchId}` };
    }

    // Log sensor data to blockchain
    async logData(batchId, route) {
        try {
            const data = this.generateSensorData(batchId, route);
            
            console.log(`\n📊 Logging IoT Data for ${batchId}:`);
            console.log(`  📍 Location: ${data.location}`);
            console.log(`  🌐 GPS: ${data.latitude}, ${data.longitude}`);
            console.log(`  🌡️  Temperature: ${data.temperature}°C`);
            console.log(`  💧 Humidity: ${data.humidity}%`);
            console.log(`  📊 Pressure: ${data.pressure} kPa`);
            console.log(`  🔒 Tamper Detected: ${data.tamperDetected ? '⚠️ YES' : '✅ NO'}`);

            const tempInt = Math.round(data.temperature * 100);

            // Include GPS coordinates in location string
            const locationWithGPS = `${data.location}|GPS:${data.latitude},${data.longitude}`;

            const tx = await this.contract.logIoTData(
                data.batchId,
                locationWithGPS,
                tempInt,
                data.humidity,
                data.pressure,
                data.tamperDetected
            );

            await tx.wait();
            console.log(`✅ Data logged successfully. TX: ${tx.hash.substring(0, 10)}...`);

            // Check if anomaly detected
            if (data.tamperDetected || 
                data.temperature < -10 || data.temperature > 25 ||
                data.humidity > 70 ||
                data.pressure < 95 || data.pressure > 105) {
                console.log(`🚨 ALERT: Anomaly detected for batch ${batchId}!`);
            }

            return { success: true, data, txHash: tx.hash };
        } catch (error) {
            console.error(`❌ Error logging data for ${batchId}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    // Get active shipments
    getActiveShipments() {
        const shipments = [];
        this.activeShipments.forEach((data, batchId) => {
            shipments.push({
                batchId,
                route: data.route,
                startTime: data.startTime,
                duration: Date.now() - data.startTime
            });
        });
        return shipments;
    }

    // Simulate complete journey
    async simulateJourney(batchId, stages, durationSeconds = 300) {
        console.log(`\n🚛 Starting journey simulation for batch: ${batchId}`);
        console.log(`⏱️ Duration: ${durationSeconds} seconds`);
        console.log(`📍 Stages: ${stages.length}`);

        const stageCount = stages.length;
        const intervalPerStage = durationSeconds / stageCount;
        let currentStage = 0;

        return new Promise((resolve) => {
            const journeyInterval = setInterval(async () => {
                if (currentStage >= stageCount) {
                    clearInterval(journeyInterval);
                    console.log(`\n✅ Journey completed for ${batchId}`);
                    resolve({ success: true, message: 'Journey completed' });
                    return;
                }

                const stage = stages[currentStage];
                console.log(`\n🚚 Stage ${currentStage + 1}/${stageCount}: ${stage.name}`);
                
                await this.logData(batchId, stage.locations);
                currentStage++;
            }, intervalPerStage * 1000);
        });
    }
}

// CLI Interface
async function main() {
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const providerUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
    const privateKey = process.env.IOT_PRIVATE_KEY || process.env.PRIVATE_KEY;

    if (!contractAddress || !privateKey) {
        console.error('❌ Missing required environment variables');
        console.error('Required: CONTRACT_ADDRESS, PRIVATE_KEY or IOT_PRIVATE_KEY');
        process.exit(1);
    }

    const simulator = new IoTSimulator(contractAddress, providerUrl, privateKey);

    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'start':
            {
                const batchId = args[1] || 'BATCH001';
                const route = args[2] ? args[2].split(',') : [
                    'Warehouse A',
                    'Transit Hub B',
                    'Distribution Center C',
                    'Pharmacy D'
                ];
                const interval = parseInt(args[3]) || 30;
                
                await simulator.startMonitoring(batchId, route, interval);
                console.log('\n💡 Press Ctrl+C to stop monitoring');
            }
            break;

        case 'journey':
            {
                const batchId = args[1] || 'BATCH001';
                const duration = parseInt(args[2]) || 300;
                
                const stages = [
                    {
                        name: 'Supplier → Manufacturer',
                        locations: ['Supplier Warehouse', 'Highway Route 1', 'Manufacturing Plant']
                    },
                    {
                        name: 'Manufacturing',
                        locations: ['Manufacturing Plant', 'Quality Control Lab']
                    },
                    {
                        name: 'Manufacturer → Repackager',
                        locations: ['Manufacturing Plant', 'Highway Route 2', 'Repackaging Facility']
                    },
                    {
                        name: 'Repackaging',
                        locations: ['Repackaging Facility', 'Packaging Line']
                    },
                    {
                        name: 'Repackager → Distributor',
                        locations: ['Repackaging Facility', 'Highway Route 3', 'Distribution Center']
                    },
                    {
                        name: 'Distribution',
                        locations: ['Distribution Center', 'Regional Hub']
                    },
                    {
                        name: 'Distributor → Pharmacy',
                        locations: ['Regional Hub', 'City Route', 'Local Pharmacy']
                    }
                ];

                await simulator.simulateJourney(batchId, stages, duration);
                process.exit(0);
            }
            break;

        case 'log':
            {
                const batchId = args[1] || 'BATCH001';
                const location = args[2] || 'Test Location';
                
                await simulator.logData(batchId, [location]);
                process.exit(0);
            }
            break;

        default:
            console.log(`
📡 IoT Simulator for Pharmaceutical Supply Chain

Usage:
  node iot-simulator.js start [batchId] [route] [interval]
    Start continuous monitoring
    - batchId: Batch ID to monitor (default: BATCH001)
    - route: Comma-separated locations (default: predefined route)
    - interval: Seconds between logs (default: 30)

  node iot-simulator.js journey [batchId] [duration]
    Simulate complete supply chain journey
    - batchId: Batch ID (default: BATCH001)
    - duration: Total journey duration in seconds (default: 300)

  node iot-simulator.js log [batchId] [location]
    Log a single IoT data point
    - batchId: Batch ID (default: BATCH001)
    - location: Current location (default: Test Location)

Examples:
  node iot-simulator.js start BATCH001
  node iot-simulator.js journey BATCH001 600
  node iot-simulator.js log BATCH001 "Distribution Center"
            `);
            break;
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = IoTSimulator;
