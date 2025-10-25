import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config/api';

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
  const [showOverride, setShowOverride] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
const [editPlan, setEditPlan] = useState(null);

  const [newPlan, setNewPlan] = useState({
    plan_name: "",
    amount: "",
    duration_days: "",
    grace_period_days: "",
    basic_form_limit: "",
    realtime_form_limit: "",
    api_access: 0,
    priority_support: 0,
    status: "active",
  });

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
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subscription/plans`);
      setPlans(response.data.plans || []);
      
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      setPlans([]);
    }
  };

  const handleEdit = (plan) => {
  setEditPlan({ ...plan }); // clone so we can edit independently
  setIsEditOpen(true);
};
const handleEditChange = (e) => {
  const { name, value } = e.target;
  setEditPlan((prev) => ({
    ...prev,
    [name]: value
  }));
};

const handleUpdatePlan = async (e) => {
  e.preventDefault();
  try {
    await axios.put(
      `${API_BASE_URL}/admin/subscription-plans/${editPlan.plan_id}`,
      editPlan,
      { headers: getAuthHeaders() }
    );

    alert("Plan updated successfully ✅");
    setIsEditOpen(false);
    fetchPlans(); // refresh list
  } catch (error) {
    console.error("Failed to update plan:", error);
    alert("Failed to update plan ❌");
  }
};


const handleDelete = async (planId) => {
  if (!window.confirm("Are you sure you want to delete this plan?")) return;

  try {
    await axios.delete(
      `${API_BASE_URL}/admin/subscription-plans/${planId}`,
      { headers: getAuthHeaders() }
    );

    alert("Plan deleted successfully 🗑️");
    fetchPlans(); // refresh list
  } catch (error) {
    console.error("Failed to delete plan:", error);
    alert("Failed to delete plan ❌");
  }
};

  const handleAddPlan = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_BASE_URL}/admin/subscription-plans`,
        newPlan,
        { headers: getAuthHeaders() }
      );
      alert("Plan added successfully");
      setNewPlan({
  plan_name: "",
  amount: "",
  duration_days: "",
  grace_period_days: "",
  basic_form_limit: "",
  realtime_form_limit: "",
  api_access: 0,
  priority_support: 0,
  status: "active",
});

      fetchPlans();
    } catch (error) {
      console.error("Failed to add plan:", error);
      alert("Failed to add plan");
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

  if (loading) return <div>Loading subscriptions...</div>;

  return (
    <div className="space-y-10">
      {/* === SECTION 1: EXISTING USER SUBSCRIPTIONS === */}
      <div className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold">Subscription Management</h2>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left">User</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left">Plan</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left">Status</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left">End Date</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subscriptions.map((sub) => (
                <tr key={sub.sub_id}>
                  <td className="px-3 sm:px-6 py-2 sm:py-4">
                    <div>
                      <div className="font-medium">{sub.name}</div>
                      <div className="text-gray-500 text-xs">{sub.email}</div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-2 sm:py-4">{sub.plan_name}</td>
                  <td className="px-3 sm:px-6 py-2 sm:py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      sub.status === "active"
                        ? "bg-green-100 text-green-800"
                        : sub.status === "expired"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-2 sm:py-4">{sub.end_date}</td>
                  <td className="px-3 sm:px-6 py-2 sm:py-4">
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

      {/* === SECTION 2: ADMIN PLAN MANAGEMENT === */}
      <div className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold">Manage Subscription Plans</h2>
        
        {/* Add Plan Form */}
        <form
          onSubmit={handleAddPlan}
          className="bg-white p-4 rounded-lg shadow space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Plan Name"
              value={newPlan.plan_name}
              onChange={(e) => setNewPlan({ ...newPlan, plan_name: e.target.value })}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="number"
              placeholder="Amount"
              value={newPlan.amount}
              onChange={(e) => setNewPlan({ ...newPlan, amount: e.target.value })}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="number"
              placeholder="Duration Days"
              value={newPlan.duration_days}
              onChange={(e) => setNewPlan({ ...newPlan, duration_days: e.target.value })}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="number"
              placeholder="Grace Period Days"
              value={newPlan.grace_period_days}
              onChange={(e) => setNewPlan({ ...newPlan, grace_period_days: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="Basic Form Limit"
              value={newPlan.basic_form_limit}
              onChange={(e) => setNewPlan({ ...newPlan, basic_form_limit: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="Realtime Form Limit"
              value={newPlan.realtime_form_limit}
              onChange={(e) => setNewPlan({ ...newPlan, realtime_form_limit: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <select
              value={newPlan.api_access}
              onChange={(e) => setNewPlan({ ...newPlan, api_access: Number(e.target.value) })}
              className="border rounded px-3 py-2"
            >
              <option value={0}>API Access: No</option>
              <option value={1}>API Access: Yes</option>
            </select>
            <select
              value={newPlan.priority_support}
              onChange={(e) => setNewPlan({ ...newPlan, priority_support: Number(e.target.value) })}
              className="border rounded px-3 py-2"
            >
              <option value={0}>Priority Support: No</option>
              <option value={1}>Priority Support: Yes</option>
            </select>
            <select
              value={newPlan.status}
              onChange={(e) => setNewPlan({ ...newPlan, status: e.target.value })}
              className="border rounded px-3 py-2"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Plan
          </button>
        </form>

    <div className="overflow-x-auto rounded-lg shadow-md">
  <table className="min-w-full border border-gray-200 bg-white text-sm">
    {/* Table Head */}
    <thead className="bg-gray-100 text-gray-700">
      <tr>
        <th className="px-4 py-3 text-left font-semibold">Plan Name</th>
        <th className="px-4 py-3 text-left font-semibold">Amount</th>
        <th className="px-4 py-3 text-left font-semibold">Duration</th>
        <th className="px-4 py-3 text-left font-semibold">Grace</th>
        <th className="px-4 py-3 text-left font-semibold">Basic Limit</th>
        <th className="px-4 py-3 text-left font-semibold">Realtime Limit</th>
        <th className="px-4 py-3 text-left font-semibold">API</th>
        <th className="px-4 py-3 text-left font-semibold">Support</th>
        <th className="px-4 py-3 text-left font-semibold">Status</th>
        <th className="px-4 py-3 text-left font-semibold">Actions</th>
      </tr>
    </thead>

    {/* Table Body */}
    <tbody className="divide-y divide-gray-200">
      {plans.map((plan) => (
        <tr
          key={plan.plan_id}
          className="hover:bg-gray-50 transition-colors"
        >
          <td className="px-4 py-2">{plan.plan_name}</td>
          <td className="px-4 py-2">₹{plan.amount}</td>
          <td className="px-4 py-2">{plan.duration_days} days</td>
          <td className="px-4 py-2">{plan.grace_period_days} days</td>
          <td className="px-4 py-2">{plan.basic_form_limit}</td>
          <td className="px-4 py-2">{plan.realtime_form_limit}</td>
          <td className="px-4 py-2">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                plan.api_access ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {plan.api_access ? "Yes" : "No"}
            </span>
          </td>
          <td className="px-4 py-2">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                plan.priority_support ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
              }`}
            >
              {plan.priority_support ? "Yes" : "No"}
            </span>
          </td>
          <td className="px-4 py-2">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                plan.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {plan.status}
            </span>
          </td>
          <td className="px-4 py-2 space-x-3">
            <button
              className="px-3 py-1 rounded-md bg-blue-500 text-white text-xs hover:bg-blue-600 transition"
             onClick={() => {
                              handleEdit(plan);
                              setIsEditOpen(true);
                            }}

              
            >
              Edit
            </button>
            <button
              className="px-3 py-1 rounded-md bg-red-500 text-white text-xs hover:bg-red-600 transition"
              onClick={() => handleDelete(plan.plan_id)}
            >
              Delete
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>



{isEditOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6">
      <h2 className="text-xl font-semibold mb-4">Edit Subscription Plan</h2>

      <form onSubmit={handleUpdatePlan} className="grid grid-cols-2 gap-6">
        {/* LEFT SIDE */}
        <div className="space-y-4">
          {/* Plan Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Plan Name</label>
            <input
              type="text"
              name="plan_name"
              value={editPlan?.plan_name || ""}
              onChange={handleEditChange}
              className="w-full border p-2 rounded"
              placeholder="Enter plan name"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              name="amount"
              value={editPlan?.amount || ""}
              onChange={handleEditChange}
              className="w-full border p-2 rounded"
              placeholder="Enter amount"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium mb-1">Duration (Days)</label>
            <input
              type="number"
              name="duration_days"
              value={editPlan?.duration_days || ""}
              onChange={handleEditChange}
              className="w-full border p-2 rounded"
              placeholder="Duration in days"
            />
          </div>

          {/* Grace Period */}
          <div>
            <label className="block text-sm font-medium mb-1">Grace Period (Days)</label>
            <input
              type="number"
              name="grace_period_days"
              value={editPlan?.grace_period_days || ""}
              onChange={handleEditChange}
              className="w-full border p-2 rounded"
              placeholder="Grace period in days"
            />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-4">
          {/* Basic Limit */}
          <div>
            <label className="block text-sm font-medium mb-1">Basic Limit</label>
            <input
              type="number"
              name="basic_form_limit"
              value={editPlan?.basic_form_limit || ""}
              onChange={handleEditChange}
              className="w-full border p-2 rounded"
              placeholder="Enter basic limit"
            />
          </div>

          {/* Realtime Limit */}
          <div>
            <label className="block text-sm font-medium mb-1">Realtime Limit</label>
            <input
              type="number"
              name="realtime_form_limit"
              value={editPlan?.realtime_form_limit || ""}
              onChange={handleEditChange}
              className="w-full border p-2 rounded"
              placeholder="Enter realtime limit"
            />
          </div>

          {/* API Access */}
          <div>
            <label className="block text-sm font-medium mb-1">API Access</label>
            <select
              name="api_access"
              value={editPlan?.api_access ? "true" : "false"}
              onChange={(e) =>
                setEditPlan((prev) => ({
                  ...prev,
                  api_access: e.target.value === "true",
                }))
              }
              className="w-full border p-2 rounded"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          {/* Support */}
          <div>
            <label className="block text-sm font-medium mb-1">Priority Support</label>
            <select
              name="priority_support"
              value={editPlan?.priority_support ? "true" : "false"}
              onChange={(e) =>
                setEditPlan((prev) => ({
                  ...prev,
                  priority_support: e.target.value === "true",
                }))
              }
              className="w-full border p-2 rounded"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              value={editPlan?.status || "active"}
              onChange={handleEditChange}
              className="w-full border p-2 rounded"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="col-span-2 flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => setIsEditOpen(false)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Update
          </button>
        </div>
      </form>
    </div>
  </div>
)}




      </div>
    </div>
  );
};

export default SubscriptionManagement;
