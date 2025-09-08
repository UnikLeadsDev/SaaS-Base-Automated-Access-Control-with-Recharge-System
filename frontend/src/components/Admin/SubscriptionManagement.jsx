import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config/api';

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
  const [showOverride, setShowOverride] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
  });

  useEffect(() => {
    fetchSubscriptions();
    fetchPlans();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/subscriptions`, {
        headers: getAuthHeaders()
      });
      setSubscriptions(response.data.subscriptions || []);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      // Mock data for demo
      setSubscriptions([
        { sub_id: 1, name: 'John Doe', email: 'john@example.com', plan_name: 'Basic', status: 'active', end_date: '2024-02-15' },
        { sub_id: 2, name: 'Jane Smith', email: 'jane@example.com', plan_name: 'Pro', status: 'expired', end_date: '2024-01-10' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subscription/plans`);
      setPlans(response.data.plans || []);
    } catch (error) {
      setPlans([
        { plan_id: 1, plan_name: 'Basic', amount: 999 },
        { plan_id: 2, plan_name: 'Pro', amount: 1999 }
      ]);
    }
  };

  const handleOverride = async (subId, newStatus, newEndDate, reason) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/subscriptions/${subId}/override`, {
        status: newStatus,
        endDate: newEndDate,
        reason
      }, { headers: getAuthHeaders() });
      
      fetchSubscriptions();
      setShowOverride(false);
      alert('Subscription updated successfully');
    } catch (error) {
      console.error('Override failed:', error);
      alert('Failed to update subscription');
    }
  };

  const OverrideModal = () => {
    const [status, setStatus] = useState(selectedSub?.status || 'active');
    const [endDate, setEndDate] = useState(selectedSub?.end_date || '');
    const [reason, setReason] = useState('');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-96">
          <h3 className="text-lg font-semibold mb-4">Override Subscription</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
                <option value="grace">Grace Period</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Reason</label>
              <textarea 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows="3"
                placeholder="Reason for override..."
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-6">
            <button 
              onClick={() => handleOverride(selectedSub.sub_id, status, endDate, reason)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Update
            </button>
            <button 
              onClick={() => setShowOverride(false)}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div>Loading subscriptions...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Subscription Management</h2>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {subscriptions.map((sub) => (
              <tr key={sub.sub_id}>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{sub.name}</div>
                    <div className="text-sm text-gray-500">{sub.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">{sub.plan_name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    sub.status === 'active' ? 'bg-green-100 text-green-800' :
                    sub.status === 'expired' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sub.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{sub.end_date}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => {
                      setSelectedSub(sub);
                      setShowOverride(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Override
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showOverride && <OverrideModal />}
    </div>
  );
};

export default SubscriptionManagement;