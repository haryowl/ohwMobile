// backend-test.js - Simple test to verify backend API endpoints

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testBackendEndpoints() {
    console.log('🧪 Testing Backend API Endpoints...\n');
    
    const tests = [
        {
            name: 'Performance Metrics',
            url: '/api/data/performance',
            method: 'GET'
        },
        {
            name: 'Data Management Info',
            url: '/api/data/management',
            method: 'GET'
        },
        {
            name: 'Latest Data',
            url: '/api/data/latest',
            method: 'GET'
        },
        {
            name: 'Devices List',
            url: '/api/devices',
            method: 'GET'
        },
        {
            name: 'Peer Status',
            url: '/api/peer/status',
            method: 'GET'
        }
    ];
    
    for (const test of tests) {
        try {
            console.log(`📋 Testing: ${test.name}`);
            const response = await axios({
                method: test.method,
                url: `${BASE_URL}${test.url}`,
                timeout: 5000
            });
            
            console.log(`✅ ${test.name}: SUCCESS (${response.status})`);
            if (response.data && typeof response.data === 'object') {
                console.log(`   Data: ${JSON.stringify(response.data).substring(0, 100)}...`);
            }
        } catch (error) {
            console.log(`❌ ${test.name}: FAILED`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Error: ${error.response.data?.error || error.message}`);
            } else {
                console.log(`   Error: ${error.message}`);
            }
        }
        console.log('');
    }
    
    console.log('🎯 Backend API Test Complete!');
}

// Run the test
testBackendEndpoints().catch(console.error);
