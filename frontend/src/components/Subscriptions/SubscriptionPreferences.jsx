import { useState, useEffect } from 'react';
import { Settings, Bell, CreditCard, Save } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_BASE_URL from '../../config/api';

const SubscriptionPreferences = () => {
  const [preferences, setPreferences] = useState({
    auto_renewal: false,
    preferred_plan_id: null,
    notification_days_before: 7,
    email_notifications: true,
    sms_notifications: false,
    whatsapp_notifications: true
  });
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
    fetchPlans();
  }, []);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/subscription/preferences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPreferences(response.data.preferences);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subscription/plans`);
      if (response.data.success) {
        setPlans(response.data.plans);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE_URL}/subscription/preferences`, preferences, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Preferences updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update preferences');
      console.error('Error updating preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Subscription Preferences</h3>
        <Settings className="h-5 w-5 text-indigo-600" />
      </div>

      <div className="space-y-6">
        {/* Auto-renewal Settings */}
        <div className="border-b pb-4">
          <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Auto-Renewal Settings
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Enable Auto-Renewal</label>
                <p className="text-xs text-gray-500">Automatically renew subscription before expiry</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.auto_renewal}
                  onChange={(e) => handleChange('auto_renewal', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Plan for Auto-Renewal
              </label>
              <select
                value={preferences.preferred_plan_id || ''}
                onChange={(e) => handleChange('preferred_plan_id', e.target.value || null)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!preferences.auto_renewal}
              >
                <option value="">Select a plan</option>
                {plans.map(plan => (
                  <option key={plan.plan_id} value={plan.plan_id}>
                    {plan.plan_name} - ₹{plan.amount}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="border-b pb-4">
          <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Notification Preferences
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notify me {preferences.notification_days_before} days before expiry
              </label>
              <input
                type="range"
                min="1"
                max="30"
                value={preferences.notification_days_before}
                onChange={(e) => handleChange('notification_days_before', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 day</span>
                <span>30 days</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="text-sm font-medium">Email</span>
                  <p className="text-xs text-gray-500">Email notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.email_notifications}
                  onChange={(e) => handleChange('email_notifications', e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="text-sm font-medium">SMS</span>
                  <p className="text-xs text-gray-500">Text messages</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.sms_notifications}
                  onChange={(e) => handleChange('sms_notifications', e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="text-sm font-medium">WhatsApp</span>
                  <p className="text-xs text-gray-500">WhatsApp messages</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.whatsapp_notifications}
                  onChange={(e) => handleChange('whatsapp_notifications', e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPreferences;