import { useState } from 'react';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSubscriptionAccess } from '../../hooks/useSubscriptionAccess';
import FormEligibilityCheck from './FormEligibilityCheck';

const LoanForm = () => {
  const { hasActiveSubscription, checkFormAccess, getAccessMessage } = useSubscriptionAccess();

  const [formType, setFormType] = useState('basic');
  const [eligibility, setEligibility] = useState(null);

  const handleEligibilityChange = (eligibilityData) => {
    setEligibility(eligibilityData);
  };

  // ✅ Allow dashboard access only if the user has subscription
  const canAccessDashboard = () => eligibility?.eligible === true;


  // ✅ Dashboard redirection logic
  const handleDashboardRedirect = (dashboard) => {
    if (!eligibility) {
      toast.error('Please wait while we check your eligibility');
      return;
    }

    if (!canAccessDashboard()) {
      toast.error('You need an active subscription to access this dashboard');
      return;
    }

    // ✅ If subscribed, allow access
    if (dashboard === 'attendance') {
      window.open('http://65.0.176.231/admin/dashboard', '_blank');
    } else if (dashboard === 'crm') {
      window.open('http://44.193.214.12/admin/', '_blank');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Application Access Panel</h2>

        {/* 🔹 Live Eligibility Check */}
        <FormEligibilityCheck 
          formType={formType} 
          onEligibilityChange={handleEligibilityChange} 
        />

        {eligibility && (
          <>
            {/* 🔹 Dashboard Selection Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Application Dashboard
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Attendance Dashboard */}
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    canAccessDashboard()
                      ? 'hover:border-blue-500 hover:bg-blue-50'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => canAccessDashboard() && handleDashboardRedirect('attendance')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-lg text-gray-800">
                        Attendance Dashboard
                      </h3>
                      <p className="text-sm text-gray-600">
                        Manage employee attendance
                      </p>
                    </div>
                    {!canAccessDashboard() && <Lock className="h-5 w-5 text-red-500" />}
                  </div>
                </div>

                {/* CRM Dashboard */}
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    canAccessDashboard()
                      ? 'hover:border-blue-500 hover:bg-blue-50'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => canAccessDashboard() && handleDashboardRedirect('crm')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-lg text-gray-800">
                        CRM Admin Dashboard
                      </h3>
                      <p className="text-sm text-gray-600">
                        Manage leads, clients & operations
                      </p>
                    </div>
                    {!canAccessDashboard() && <Lock className="h-5 w-5 text-red-500" />}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 🔹 Eligibility message */}
        {eligibility && (
          <div className="text-sm text-gray-600 pt-4">
            {eligibility.accessType === 'subscription'
              ? 'You have an active subscription. Full access enabled.'
              : 'Access restricted. Please subscribe to unlock dashboards.'}
            {eligibility.demoMode && (
              <span className="ml-2 text-orange-600">(Demo Mode)</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanForm;
