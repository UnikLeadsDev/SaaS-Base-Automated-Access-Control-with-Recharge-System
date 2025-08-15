import React from 'react';

const AdminDashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Users</h3>
          <p className="text-gray-600">Manage system users</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Forms</h3>
          <p className="text-gray-600">Monitor form submissions</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Analytics</h3>
          <p className="text-gray-600">View system analytics</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;