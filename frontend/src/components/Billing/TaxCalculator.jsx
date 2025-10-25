import React, { useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

const TaxCalculator = () => {
  const [amount, setAmount] = useState('');
  const [isInterState, setIsInterState] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateGST = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/billing/calculate-gst', {
        amount: parseFloat(amount),
        isInterState
      });

      if (response.data.success) {
        setResult(response.data);
        toast.success('GST calculated successfully');
      }
    } catch (error) {
      // Fallback calculation when API fails
      const baseAmount = parseFloat(amount);
      const gstRate = 18.0;
      const gstAmount = (baseAmount * gstRate) / 100;
      
      const fallbackResult = {
        amount: baseAmount,
        gst_rate: gstRate,
        total_gst: gstAmount,
        total_with_gst: baseAmount + gstAmount
      };
      
      if (isInterState) {
        fallbackResult.igst = gstAmount;
        fallbackResult.cgst = 0;
        fallbackResult.sgst = 0;
      } else {
        fallbackResult.igst = 0;
        fallbackResult.cgst = gstAmount / 2;
        fallbackResult.sgst = gstAmount / 2;
      }
      
      setResult(fallbackResult);
      toast.success('GST calculated (offline mode)');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAmount('');
    setResult(null);
    setIsInterState(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <Calculator className="text-blue-600 mr-2" size={24} />
        <h2 className="text-xl font-semibold">GST Calculator</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="interstate"
              checked={isInterState}
              onChange={(e) => setIsInterState(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="interstate" className="text-sm">
              Inter-state transaction (IGST)
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={calculateGST}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Calculating...' : 'Calculate GST'}
            </button>
            <button
              onClick={reset}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Reset
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start">
              <Info className="text-blue-600 mr-2 mt-0.5" size={16} />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">GST Information:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Intra-state: CGST (9%) + SGST (9%) = 18%</li>
                  <li>• Inter-state: IGST (18%)</li>
                  <li>• Current GST rate: 18% for digital services</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Result Section */}
        <div>
          {result && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-4">GST Breakdown</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Base Amount:</span>
                  <span className="font-medium">₹{result.amount}</span>
                </div>
                
                <div className="border-t pt-2">
                  {isInterState ? (
                    <div className="flex justify-between">
                      <span>IGST ({result.gst_rate}%):</span>
                      <span className="font-medium">₹{result.igst.toFixed(2)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>CGST ({(result.gst_rate / 2)}%):</span>
                        <span className="font-medium">₹{result.cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST ({(result.gst_rate / 2)}%):</span>
                        <span className="font-medium">₹{result.sgst.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span>Total GST:</span>
                    <span className="font-medium">₹{result.total_gst.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="border-t pt-2 bg-blue-50 -m-2 p-2 rounded">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="font-bold text-blue-600">₹{result.total_with_gst.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaxCalculator;