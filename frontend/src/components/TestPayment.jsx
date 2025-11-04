import { useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import API_BASE_URL from '../config/api.js';
const testQrPayment = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    const qrRes = await axios.post(`${API_BASE_URL}/payment/create-qr`,
      { amount: 100 },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    toast.success("QR created! Scan to test payment.");
    window.open(qrRes.data.imageUrl, '_blank');
  } catch (err) {
    toast.error("QR test failed");
  } finally {
    setLoading(false);
  }
};


const TestPayment = () => {
  const [loading, setLoading] = useState(false);

  const testPayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Create order
      const response = await axios.post(
        `${API_BASE_URL}/payment/create-order`,
        { amount: 100 }, // $100 test
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, amount, currency, key } = response.data;

      // Razorpay options
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'SaaS Base Test',
        description: 'Test Payment',
        order_id: orderId,
        handler: async function (response) {
          try {
            const verifyResponse = await axios.post(
              `${API_BASE_URL}/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success(`Payment successful! $${verifyResponse.data.amount} added to wallet`);
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#4F46E5'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      toast.error('Failed to create payment order');
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={testPayment}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Test Payment $100'}
      </button>
      <button
        onClick={testQrPayment}
        disabled={loading}
        className="ml-3 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
      >
        {loading ? "Creating QR..." : "Test QR Payment"}
      </button>

    </div>
  );
};

export default TestPayment;