// Test script for manual payment updates
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Test admin login and manual payment functionality
async function testManualPaymentFeatures() {
  try {
    console.log('Testing Manual Payment Update Features...\n');

    // 1. Test transaction search
    console.log('1. Testing transaction search...');
    const searchResponse = await axios.get(`${API_BASE}/admin/transaction/test_txn_123`, {
      headers: { Authorization: 'Bearer YOUR_ADMIN_TOKEN' }
    });
    console.log('Search Result:', searchResponse.data);

    // 2. Test manual payment update
    console.log('\n2. Testing manual payment update...');
    const manualPaymentData = {
      userId: 1,
      amount: 500,
      txnRef: 'manual_test_' + Date.now(),
      source: 'cash',
      reason: 'Test manual payment'
    };
    
    const paymentResponse = await axios.post(`${API_BASE}/admin/manual-payment`, manualPaymentData, {
      headers: { Authorization: 'Bearer YOUR_ADMIN_TOKEN' }
    });
    console.log('Manual Payment Result:', paymentResponse.data);

    // 3. Test payment status update
    console.log('\n3. Testing payment status update...');
    const statusUpdateData = {
      status: 'success',
      amount: 500,
      reason: 'Payment reconciled'
    };
    
    const statusResponse = await axios.put(`${API_BASE}/admin/transaction/${manualPaymentData.txnRef}`, statusUpdateData, {
      headers: { Authorization: 'Bearer YOUR_ADMIN_TOKEN' }
    });
    console.log('Status Update Result:', statusResponse.data);

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Uncomment to run tests
// testManualPaymentFeatures();

export default testManualPaymentFeatures;