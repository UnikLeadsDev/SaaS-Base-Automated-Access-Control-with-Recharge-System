import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from "../../context/AuthContext";
import axios from 'axios';
import { 
  Users, DollarSign, FileText, AlertTriangle, TrendingUp, Activity, 
  CreditCard, UserCheck, Shield, Key, Clock, MapPin, Monitor,
  Search, Filter, Plus, Edit, Trash2, Ban, UserPlus, RefreshCw,
  Eye, EyeOff, Download, Calendar, Globe
} from 'lucide-react';
import API_BASE_URL from '../../config/api';
import EmptyBox from '../Common/EmptyBox';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newKeys, setNewKeys] = useState({});
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    totalApplications: 0,
    lowBalanceUsers: 0,
    activeSessions: 0,
    suspiciousLogins: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [billingHistory, setBillingHistory] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    page: 1,
    limit: 10
  });

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'DSA',
    status: 'active',
    password: ''
  });

  const [manualPayment, setManualPayment] = useState({
    userId: '',
    amount: '',
    txnRef: '',
    source: 'cash',
    reason: ''
  });

  const [transactionSearch, setTransactionSearch] = useState({
    transactionId: '',
    result: null,
    loading: false
  });

  const [keys, setKeys] = useState({
  RAZORPAY_KEY_ID: "",
  RAZORPAY_KEY_SECRET: "",
  MSG91_AUTH_KEY: "",
  MSG91_OTP_TEMPLATE_ID: ""
});


  useEffect(() => {
    fetchStats();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'security') fetchLoginHistory();
    if (activeTab === 'sessions') fetchActiveSessions();
    if (activeTab === 'billing') fetchBillingHistory();
  //  if (activeTab === 'api-keys') fetchApiKeys();
   if (activeTab === "api-keys") fetchEnvKeys();
   

  }, [activeTab, filters]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle both response formats
      if (response.data.success !== false) {
        const statsData = response.data.stats || response.data;
        setStats(statsData);
      } else {
        toast.error('Failed to fetch dashboard stats');
        setStats({
          totalUsers: 0,
          totalRevenue: 0,
          totalApplications: 0,
          lowBalanceUsers: 0,
          activeSessions: 0,
          suspiciousLogins: 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load dashboard data');
      setStats({
        totalUsers: 0,
        totalRevenue: 0,
        totalApplications: 0,
        lowBalanceUsers: 0,
        activeSessions: 0,
        suspiciousLogins: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(filters);
      const response = await axios.get(`${API_BASE_URL}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success !== false) {
        setUsers(response.data.users || []);
      } else {
        setUsers([]);
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
      toast.error('Failed to load users data');
    }
  };

  const fetchLoginHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/login-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success !== false) {
        setLoginHistory(response.data.history || []);
      } else {
        setLoginHistory([]);
      }
    } catch (error) {
      console.error('Failed to fetch login history:', error);
      setLoginHistory([]);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success !== false) {
        setActiveSessions(response.data.sessions || []);
      } else {
        setActiveSessions([]);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setActiveSessions([]);
    }
  };

  const fetchBillingHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/billing-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success !== false) {
        setBillingHistory(response.data.transactions || []);
      } else {
        setBillingHistory([]);
      }
    } catch (error) {
      console.error('Failed to fetch billing history:', error);
      setBillingHistory([]);
    }
  };

  const fetchEnvKeys = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_BASE_URL}/admin/get-api-keys`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setKeys({
  RAZORPAY_KEY_ID: res.data.razorpayKeyId,
  RAZORPAY_KEY_SECRET: res.data.razorpayKeySecret,
  MSG91_AUTH_KEY: res.data.msg91AuthKey,
  MSG91_OTP_TEMPLATE_ID: res.data.msg91OtpTemplateId,
});

    console.log(res.data);
  } catch (err) {
    console.error("Error fetching keys:", err);
  }
};

const handleUpdateEnvKeys = async () => {
  try {
    const token = localStorage.getItem("token");
    await axios.put(
      `${API_BASE_URL}/admin/api-keys`,
      keys,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    toast.success("API Keys updated successfully!");
    fetchEnvKeys();
  } catch (err) {
    console.error("Error updating keys:", err);
    toast.error("Failed to update keys");
  }
};


//   const fetchApiKeys = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await axios.get(`${API_BASE_URL}/admin/api-keys`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       if (response.data.success !== false) {
//         setApiKeys(response.data.keys || []);
//       } else {
//         setApiKeys([]);
//       }
//     } catch (error) {
//       console.error('Failed to fetch API keys:', error);
//       setApiKeys([]);
//     }
//   };

//   // Generate new API key
// const handleGenerateApiKey = async (name, permissions = ["read", "write"]) => {
//   try {
//     const token = localStorage.getItem("token");
//     const response = await axios.post(
//       `${API_BASE_URL}/admin/api-keys`,
//       { userId: 2, name, permissions }, // attach to Omkar (user_id=2)
//       { headers: { Authorization: `Bearer ${token}` } }
//     );

//     if (response.data.apiKey) {
//       toast.success(`API Key generated for ${name}`);
//       fetchApiKeys();
//     }
//   } catch (error) {
//     console.error("Failed to generate API key:", error);
//     toast.error("Failed to generate API key");
//   }
// };

// // Toggle API key status
// const handleToggleApiKey = async (keyId, currentStatus) => {
//   try {
//     const token = localStorage.getItem("token");
//     await axios.put(
//       `${API_BASE_URL}/admin/api-keys/${keyId}/toggle`,
//       { is_active: !currentStatus },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );

//     fetchApiKeys(); // refresh after update
//   } catch (error) {
//     console.error("Failed to toggle API key:", error);
//   }
// };

  const handleCreateUser = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/admin/users`, userForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User created successfully');
      setShowUserModal(false);
      setUserForm({ name: '', email: '', mobile: '', role: 'DSA', status: 'active', password: '' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/admin/users/${editingUser}`, userForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User updated successfully');
      setShowUserModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Delete user "${userName}"? This action cannot be undone.`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/admin/users/${userId}/status`, 
        { status: newStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`User ${newStatus} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleTerminateSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/admin/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Session terminated');
      fetchActiveSessions();
    } catch (error) {
      toast.error('Failed to terminate session');
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Users</p>
              <p className="text-3xl font-bold">{stats.totalUsers || 0}</p>
            </div>
            <Users className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Total Revenue</p>
              <p className="text-3xl font-bold">₹{(stats.totalRevenue || 0).toLocaleString()}</p>
            </div>
            <DollarSign className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Active Sessions</p>
              <p className="text-3xl font-bold">{stats.activeSessions || 0}</p>
            </div>
            <Monitor className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Low Balance Users</p>
              <p className="text-3xl font-bold">{stats.lowBalanceUsers || 0}</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">Suspicious Logins</p>
              <p className="text-3xl font-bold">{stats.suspiciousLogins || 0}</p>
            </div>
            <Shield className="h-12 w-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100">Applications</p>
              <p className="text-3xl font-bold">{stats.totalApplications || 0}</p>
            </div>
            <FileText className="h-12 w-12 text-indigo-200" />
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <button
          onClick={() => {
            setEditingUser(null);
            setUserForm({ name: '', email: '', mobile: '', role: 'DSA', status: 'active', password: '' });
            setShowUserModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex gap-4">
        <input
          type="text"
          placeholder="Search users..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <select
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Roles</option>
          <option value="DSA">DSA</option>
          <option value="NBFC">NBFC</option>
          <option value="Co-op">Co-op</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.user_id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
                      {user.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 
                    user.status === 'blocked' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {user.role === 'admin' ? 'N/A' : `₹${user.balance?.toLocaleString() || 0}`}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingUser(user.user_id);
                        setUserForm({
                          name: user.name,
                          email: user.email,
                          mobile: user.mobile || '',
                          role: user.role,
                          status: user.status,
                          password: ''
                        });
                        setShowUserModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleUserStatus(user.user_id, user.status)}
                      className={user.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.user_id, user.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="p-8">
            <EmptyBox message="No users found" size={100} />
          </div>
        )}
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Security & Login Tracking</h2>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Login Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Browser</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loginHistory.length > 0 ? loginHistory.map((login) => (
              <tr key={login.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{login.name}</div>
                  <div className="text-sm text-gray-500">{login.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(login.login_time).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{login.ip_address}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{login.browser || 'Unknown'}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{login.login_method || 'Email'}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    login.is_suspicious ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {login.is_suspicious ? 'Suspicious' : 'Normal'}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  <EmptyBox message="No login history found" size={80} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSessions = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Active Sessions</h2>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Browser</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {activeSessions.length > 0 ? activeSessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{session.name}</div>
                  <div className="text-sm text-gray-500">{session.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{session.ip_address}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{session.location || 'Unknown'}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{session.browser || 'Unknown'}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(session.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleTerminateSession(session.id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Terminate
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  <EmptyBox message="No active sessions found" size={80} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );


const renderEnvKeys = () => (
  <div className="p-6 max-w-5xl mx-auto bg-white shadow rounded">
    <h2 className="text-xl font-bold mb-6">Manage Environment API Keys</h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* --- Current Keys Section --- */}
      <div className="bg-gray-50 p-4 rounded shadow-inner">
        <h3 className="text-lg font-semibold mb-3">Current Keys</h3>
        {[
          { label: "Razorpay Key ID", field: "RAZORPAY_KEY_ID" },
          { label: "Razorpay Key Secret", field: "RAZORPAY_KEY_SECRET" },
          { label: "MSG91 Auth Key", field: "MSG91_AUTH_KEY" },
          { label: "MSG91 OTP Template ID", field: "MSG91_OTP_TEMPLATE_ID" }
        ].map(({ label, field }) => (
          <div key={field} className="mb-2">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-gray-700 bg-white border px-3 py-2 rounded">
              {keys[field] || "Not set"}
            </p>
          </div>
        ))}
      </div>

      {/* --- Update Keys Section --- */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Update Keys</h3>
        {[
          { label: "Razorpay Key ID", field: "razorpayKeyId" },
          { label: "Razorpay Key Secret", field: "razorpayKeySecret" },
          { label: "MSG91 Auth Key", field: "msg91AuthKey" },
          { label: "MSG91 OTP Template ID", field: "msg91OtpTemplateId" }
        ].map(({ label, field }) => (
          <div key={field} className="mb-3">
            <label className="block font-medium mb-1">{label}</label>
            <input
              type="text"
              value={newKeys[field] || ""}   // use newKeys here
              onChange={(e) =>
                setNewKeys({ ...newKeys, [field]: e.target.value })
              }
              placeholder="Enter new value"
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        ))}

        <button
          onClick={handleUpdateEnvKeys}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Update Keys
        </button>
      </div>
    </div>
  </div>
);






  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: Activity },
            { id: 'users', name: 'Users', icon: Users },
            { id: 'security', name: 'Security', icon: Shield },
            { id: 'sessions', name: 'Sessions', icon: Monitor },
            { id: 'billing', name: 'Billing', icon: CreditCard },
            { id: 'api-keys', name: 'API Keys', icon: Key }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'security' && renderSecurity()}
      {activeTab === 'sessions' && renderSessions()}
      {activeTab === 'api-keys' && renderEnvKeys()}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">
              {editingUser ? 'Edit User' : 'Create User'}
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
              <input
                type="email"
                placeholder="Email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
              <input
                type="tel"
                placeholder="Mobile"
                value={userForm.mobile}
                onChange={(e) => setUserForm({ ...userForm, mobile: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
              <input
                type="password"
                placeholder="Password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="DSA">DSA</option>
                <option value="NBFC">NBFC</option>
                <option value="Co-op">Co-op</option>
                <option value="admin">Admin</option>
              </select>
              <select
                value={userForm.status}
                onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingUser ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;