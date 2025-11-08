const axios = require('axios');

async function testAlertsAPI() {
    console.log('=== TESTING ALERTS API ===\n');
    
    try {
        // Test GET /api/alerts
        console.log('Testing: GET http://localhost:3001/api/alerts\n');
        const response = await axios.get('http://localhost:3001/api/alerts');
        
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log(`\n✅ Found ${response.data.alerts.length} alerts`);
            
            response.data.alerts.forEach((alert, idx) => {
                console.log(`\nAlert #${idx}:`);
                console.log(`  ID: ${alert.id}`);
                console.log(`  Batch ID: ${alert.batchId}`);
                console.log(`  Type: ${alert.alertType}`);
                console.log(`  Message: ${alert.message}`);
                console.log(`  Resolved: ${alert.resolved}`);
                console.log(`  Timestamp: ${new Date(alert.timestamp * 1000).toLocaleString()}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testAlertsAPI();
