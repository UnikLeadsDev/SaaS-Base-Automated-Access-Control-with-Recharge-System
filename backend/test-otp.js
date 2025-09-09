// Simple OTP test script
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
const TEST_MOBILE = '9876543210';

async function testOTPFlow() {
  try {
    console.log('🧪 Testing OTP Login Flow...\n');

    // Step 1: Send OTP
    console.log('📱 Step 1: Sending OTP...');
    const sendResponse = await axios.post(`${API_BASE}/auth/send-otp`, {
      mobile: TEST_MOBILE
    });
    
    console.log('✅ OTP Send Response:', sendResponse.data);
    
    if (!sendResponse.data.success) {
      console.log('❌ Failed to send OTP');
      return;
    }

    // Step 2: Verify OTP (using development OTP)
    console.log('\n🔐 Step 2: Verifying OTP...');
    const verifyResponse = await axios.post(`${API_BASE}/auth/verify-otp`, {
      mobile: TEST_MOBILE,
      otp: '123456' // Development OTP
    });
    
    console.log('✅ OTP Verify Response:', verifyResponse.data);
    
    if (verifyResponse.data.success) {
      console.log('\n🎉 OTP Login Flow Test PASSED!');
      console.log('Token:', verifyResponse.data.token);
      console.log('User:', verifyResponse.data.user);
    } else {
      console.log('\n❌ OTP Login Flow Test FAILED');
    }

  } catch (error) {
    console.error('\n❌ Test Error:', error.response?.data || error.message);
  }
}

// Run test
testOTPFlow();