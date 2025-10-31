  import { useState, useEffect } from 'react';
  import { toast } from 'react-hot-toast';
  import { useAuth } from "../../context/AuthContext";
  import axios from 'axios';
  import { 
    Users, DollarSign, FileText, AlertTriangle, TrendingUp, Activity, 
    CreditCard, UserCheck, Shield, Key, Clock, MapPin, Monitor,
    Search, Filter, Plus, Edit, Trash2, Ban, UserPlus, RefreshCw,
    Eye, EyeOff, Download, Calendar, Globe, LogIn, Copy,IndianRupee 
  } from 'lucide-react';
  import API_BASE_URL from '../../config/api';
  import EmptyBox from '../Common/EmptyBox';
  import SubscriptionManagement from './SubscriptionManagement';
  import RevenueStat from './RevenueStat';
  import AdminLayout from './AdminLayout';

  const AdminDashboard = () => {
    const { user, login } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [newKeys, setNewKeys] = useState({});
    const [visibleKeys, setVisibleKeys] = useState({});
    const [stats, setStats] = useState({
      totalUsers: 0,
      totalRevenue: 0,
      totalApplications: 0,
      lowBalanceUsers: 0,
      activeSessions: 0,
      suspiciousLogins: 0
    });
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [loginHistory, setLoginHistory] = useState([]);
    const [activeSessions, setActiveSessions] = useState([]);
    const [billingHistory, setBillingHistory] = useState([]);
  
    
    const [filters, setFilters] = useState({
      search: '',
      role: '',
      status: '',
      page: 1,
      limit: 10
    });

    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [details, setDetails] = useState({});
    const [selectedCard, setSelectedCard] = useState(null); // which card is clicked
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [userDetailsModal, setUserDetailsModal] = useState(false);
    const [selectedUserDetails, setSelectedUserDetails] = useState(null);
    const [exportLoading, setExportLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
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
      // if (activeTab === 'billing') fetchBillingHistory();
    //  if (activeTab === 'api-keys') fetchApiKeys();
    if (activeTab === "api-keys") fetchEnvKeys();
    

    }, [activeTab, filters]);

    const handleCardClick = async (card) => {
    setSelectedCard(card);
    setShowModal(true);
    setModalLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      let response;
      
      if (card === 'lowBalance') {
        response = await axios.get(`${API_BASE_URL}/admin/low-balance-users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setModalData(response.data.users || []);
      } else if (card === 'applications') {
        response = await axios.get(`${API_BASE_URL}/admin/applications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setModalData(response.data.applications || []);
      } else if (card === 'revenue') {
        response = await axios.get(`${API_BASE_URL}/admin/revenue-breakdown`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(response.data);
        setModalData(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch modal data:', error);
      toast.error('Failed to load data');
      setModalData([]);
    } finally {
      setModalLoading(false);
    }
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCard(null);
    setModalData([]);
  };

  const handleSearch = () => {
    setFilters({
      ...filters,
      search: searchTerm,
      role: roleFilter,
      status: statusFilter,
      page: 1
    });
  };

  const handleUserDetails = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/users/${userId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUserDetails(response.data);
      setUserDetailsModal(true);
    } catch (error) {
      toast.error('Failed to fetch user details');
    }
  };

  const handleExport = async (type) => {
    try {
      setExportLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/export?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const csvContent = convertToCSV(response.data.data);
      downloadCSV(csvContent, response.data.filename);
      toast.success('Export completed successfully');
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setExportLoading(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const Modal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-3/4 max-w-2xl">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✖</button>
        </div>
        <div className="p-4 max-h-[400px] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success !== false) {
        const statsData = response.data.stats || {};
        const detailsData = response.data.details || {};

        setStats(statsData);
        setDetails(detailsData);
      } else {
        toast.error('Failed to fetch dashboard stats');
        setStats({});
        setDetails({});
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load dashboard data');
      setStats({});
      setDetails({});
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

    // const fetchBillingHistory = async () => {
    //   try {
    //     const token = localStorage.getItem('token');
    //     const response = await axios.get(`${API_BASE_URL}/admin/billing-history`, {
    //       headers: { Authorization: `Bearer ${token}` }
    //     });
        
    //     if (response.data.success !== false) {
    //       setBillingHistory(response.data.transactions || []);
    //     } else {
    //       setBillingHistory([]);
    //     }
    //   } catch (error) {
    //     console.error('Failed to fetch billing history:', error);
    //     setBillingHistory([]);
    //   }
    // };

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

    // ✅ Only send the new values entered by user
    const payload = {
      razorpayKeyId: newKeys.razorpayKeyId?.trim(),
      razorpayKeySecret: newKeys.razorpayKeySecret?.trim(),
      msg91AuthKey: newKeys.msg91AuthKey?.trim(),
      msg91OtpTemplateId: newKeys.msg91OtpTemplateId?.trim(),
    };

    // ✅ Remove empty fields so backend doesn't overwrite with blanks
    const filteredPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v)
    );

    await axios.put(`${API_BASE_URL}/admin/api-keys`, filteredPayload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    toast.success("API Keys updated successfully!");

    // ✅ Refresh current env keys display
    fetchEnvKeys();

    // ✅ Reset update fields
    setNewKeys({});
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
          <div  onClick={()=>setActiveTab("users")} className="cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers || 0}</p>
              </div>
              <Users className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          <div 
    onClick={() => setActiveTab("revenue")}
    className="cursor-pointer bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-green-100">Total Revenue</p>
        <p className="text-3xl font-bold">₹{(stats.totalRevenue || 0).toLocaleString()}</p>
      </div>
      <IndianRupee className="h-12 w-12 text-green-200" />
    </div>
  </div>


          <div  onClick={()=>setActiveTab("sessions")} className=" cursor-pointer bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Active Sessions</p>
                <p className="text-3xl font-bold">{stats.activeSessions || 0}</p>
              </div>
              <Monitor className="h-12 w-12 text-purple-200" />
            </div>
          </div>

        <div 
    onClick={() => handleCardClick("lowBalance")}
    className="cursor-pointer bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg text-white hover:from-red-600 hover:to-red-700 transition-all"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-red-100">Low Balance Users</p>
        <p className="text-3xl font-bold">{stats.lowBalanceUsers || 0}</p>
      </div>
      <AlertTriangle className="h-12 w-12 text-red-200" />
    </div>
  </div>



          <div onClick={()=>setActiveTab("security")} className="cursor-pointer bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Suspicious Logins</p>
                <p className="text-3xl font-bold">{stats.suspiciousLogins || 0}</p>
              </div>
              <Shield className="h-12 w-12 text-yellow-200" />
            </div>
          </div>

          <div 
    onClick={() => handleCardClick("applications")}
    className="cursor-pointer bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 rounded-lg text-white hover:from-indigo-600 hover:to-indigo-700 transition-all"
  >
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
    <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
      <h2 className="text-xl sm:text-2xl font-bold">User Management</h2>
      <button
        onClick={() => {
          setEditingUser(null);
          setUserForm({
            name: "",
            email: "",
            mobile: "",
            role: "DSA",
            status: "active",
            password: "",
          });
          setShowUserModal(true);
        }}
        className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm sm:text-base"
      >
        <UserPlus className="h-4 w-4" />
        Add User
      </button>
    </div>

    {/* Filters */}
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md text-sm sm:text-base"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm sm:text-base"
        >
          <option value="">All Roles</option>
          <option value="DSA">DSA</option>
          <option value="NBFC">NBFC</option>
          <option value="Co-op">Co-op</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm sm:text-base"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
          <option value="pending">Pending</option>
        </select>
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm sm:text-base"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleExport("users")}
          disabled={exportLoading}
          className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 text-sm"
        >
          <Download className="h-4 w-4" />
          {exportLoading ? "Exporting..." : "Export Users"}
        </button>
        <button
          onClick={() => handleExport("stats")}
          disabled={exportLoading}
          className="bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2 text-sm"
        >
          <Download className="h-4 w-4" />
          Export Stats
        </button>
      </div>
    </div>

    {/* Users Table (Desktop) */}
    <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Balance
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Last Login
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
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
                    <div className="text-sm font-medium text-gray-900">
                      {user.name}
                    </div>
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
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.status === "active"
                      ? "bg-green-100 text-green-800"
                      : user.status === "blocked"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {user.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {user.role === "admin"
                  ? "N/A"
                  : `$${user.balance?.toLocaleString() || 0}`}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {user.last_login
                  ? new Date(user.last_login).toLocaleDateString()
                  : "Never"}
              </td>
              <td className="px-6 py-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUserDetails(user.user_id)}
                    className="text-green-600 hover:text-green-900"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingUser(user.user_id);
                      setUserForm({
                        name: user.name,
                        email: user.email,
                        mobile: user.mobile || "",
                        role: user.role,
                        status: user.status,
                        password: "",
                      });
                      setShowUserModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>
                      handleToggleUserStatus(user.user_id, user.status)
                    }
                    className={
                      user.status === "active"
                        ? "text-red-600 hover:text-red-900"
                        : "text-green-600 hover:text-green-900"
                    }
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

    {/* Mobile Cards */}
    <div className="sm:hidden space-y-4">
      {users.map((user) => (
        <div
          key={user.user_id}
          className="bg-white shadow rounded-lg p-4 flex flex-col gap-2"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <p>
              <span className="font-medium">Role:</span> {user.role}
            </p>
            <p>
              <span className="font-medium">Status:</span>{" "}
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  user.status === "active"
                    ? "bg-green-100 text-green-800"
                    : user.status === "blocked"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {user.status}
              </span>
            </p>
            <p>
              <span className="font-medium">Balance:</span>{" "}
              {user.role === "admin"
                ? "N/A"
                : `$${user.balance?.toLocaleString() || 0}`}
            </p>
            <p>
              <span className="font-medium">Last Login:</span>{" "}
              {user.last_login
                ? new Date(user.last_login).toLocaleDateString()
                : "Never"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => handleUserDetails(user.user_id)}
              className="text-green-600"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setEditingUser(user.user_id);
                setUserForm({
                  name: user.name,
                  email: user.email,
                  mobile: user.mobile || "",
                  role: user.role,
                  status: user.status,
                  password: "",
                });
                setShowUserModal(true);
              }}
              className="text-blue-600"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleToggleUserStatus(user.user_id, user.status)}
              className={
                user.status === "active" ? "text-red-600" : "text-green-600"
              }
            >
              <Ban className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteUser(user.user_id, user.name)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>

    );

    const renderSecurity = () => (
      <div className="space-y-6">
    <h2 className="text-xl sm:text-2xl font-bold">Security & Login Tracking</h2>

    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full text-xs sm:text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">User</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">Login Time</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">IP Address</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">Browser</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">Method</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {loginHistory.length > 0 ? (
            loginHistory.map((login) => (
              <tr key={login.id} className="hover:bg-gray-50">
                <td className="px-3 sm:px-6 py-2 sm:py-4">
                  <div className="font-medium text-gray-900 truncate">{login.name}</div>
                  <div className="text-gray-500 truncate">{login.email}</div>
                </td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 text-gray-900 whitespace-nowrap">
                  {new Date(login.login_time).toLocaleString()}
                </td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 text-gray-900">{login.ip_address}</td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 text-gray-900">{login.browser || 'Unknown'}</td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 text-gray-900">{login.login_method || 'Email'}</td>
                <td className="px-3 sm:px-6 py-2 sm:py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-full ${
                      login.is_suspicious
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {login.is_suspicious ? 'Suspicious' : 'Normal'}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                <EmptyBox message="No login history found" size={60} />
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
    {/* Header with Refresh */}
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
      <h2 className="text-xl sm:text-2xl font-bold">Active Sessions</h2>
      <button
        onClick={fetchActiveSessions}
        className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm sm:text-base"
      >
        <RefreshCw className="h-4 w-4" />
        Refresh
      </button>
    </div>

    {/* Setup Required Warning */}
    {activeSessions.length === 0 && (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium text-sm sm:text-base">Setup Required</span>
        </div>
        <p className="text-yellow-700 mt-1 text-xs sm:text-sm">
          Run the <code>setup_sessions.sql</code> script in your database to enable session tracking.
        </p>
      </div>
    )}

    {/* Table */}
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full text-xs sm:text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">User</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">IP</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">Location</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">Browser</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">Started</th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {activeSessions.length > 0 ? (
            activeSessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-3 sm:px-6 py-2 sm:py-4">
                  <div className="flex items-center">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium">
                      {session.name?.charAt(0) || 'U'}
                    </div>
                    <div className="ml-2 sm:ml-3">
                      <div className="font-medium text-gray-900 truncate">{session.name || 'Unknown User'}</div>
                      <div className="text-gray-500 text-[11px] sm:text-xs truncate">{session.email || 'No email'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-2 sm:py-4">{session.ip_address || 'Unknown'}</td>
                <td className="px-3 sm:px-6 py-2 sm:py-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                    {session.location || 'Unknown'}
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-2 sm:py-4">
                  <div className="flex items-center gap-1">
                    <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                    {session.browser || 'Unknown'}
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                    {new Date(session.created_at).toLocaleString()}
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-2 sm:py-4">
                  <button
                    onClick={() => handleTerminateSession(session.id)}
                    className="text-red-600 hover:text-red-900 font-medium flex items-center gap-1 text-xs sm:text-sm"
                  >
                    <Ban className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Terminate
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                <EmptyBox message="No active sessions found" size={60} />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>

    );


  const renderEnvKeys = () => {
    

    const toggleVisibility = (field) => {
      setVisibleKeys((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const copyToClipboard = (value) => {
      if (!value) return;
      navigator.clipboard.writeText(value);
      alert("Copied to clipboard!");
    };

    return (
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
                <div className="flex items-center border px-3 py-2 rounded bg-white">
                  <p className="flex-1 text-gray-700 truncate">
                    {visibleKeys[field]
                      ? keys[field] || "Not set"
                      : keys[field]
                      ? "•".repeat(10)
                      : "Not set"}
                  </p>
                  {keys[field] && (
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        type="button"
                        onClick={() => toggleVisibility(field)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {visibleKeys[field] ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(keys[field])}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  )}
                </div>
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
                  value={newKeys[field] || ""}
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
  };


    return (
    <div className="space-y-6">
    

    {/* Sidebar Navigation
  <div className="w-56 bg-white border-r border-gray-200 h-screen">
    <nav className="flex flex-col space-y-1 p-3">
      {[
        { id: 'dashboard', name: 'Dashboard', icon: Activity },
        { id: 'users', name: 'Users', icon: Users },
        { id: 'security', name: 'Security', icon: Shield },
        { id: 'sessions', name: 'Sessions', icon: Monitor },
        { id: 'subscriptions', name: 'Subscriptions', icon: Calendar },
        { id: 'revenue', name: 'Revenue', icon: DollarSign },
        { id: 'api-keys', name: 'API Keys', icon: Key }
      ].map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${
              activeTab === tab.id
                ? 'bg-indigo-100 text-indigo-600 border-l-4 border-indigo-500'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent'
            } flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md`}
          >
            <Icon className="h-5 w-5" />
            {tab.name}
          </button>
        );
      })}
    </nav>
  </div> */}


    {/* Tab Content
    <div className="px-1 sm:px-0">
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'security' && renderSecurity()}
      {activeTab === 'sessions' && renderSessions()}
      {activeTab === 'subscriptions' && <SubscriptionManagement />}
      {activeTab === 'revenue' && <RevenueStat />}
      {activeTab === 'api-keys' && renderEnvKeys()}
    </div> */}

     <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "users" && renderUsers()}
      {activeTab === "security" && renderSecurity()}
      {activeTab === "sessions" && renderSessions()}
      {activeTab === "subscriptions" && <SubscriptionManagement />}
      {activeTab === "revenue" && <RevenueStat />}
      {activeTab === "api-keys" && renderEnvKeys()}
    </AdminLayout>

  {/* Data Modal */}
  {showModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-2">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h3 className="text-lg font-semibold mb-4">
          {selectedCard === "lowBalance" && "Low Balance Users"}
          {selectedCard === "applications" && "Applications"}
          {selectedCard === "revenue" && "Revenue Breakdown"}
        </h3>

        {modalLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : modalData.length > 0 ? (
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {modalData.map((item, idx) => (
              <li
                key={idx}
                className="p-3 border rounded-md flex justify-between text-sm"
              >
                <span>{item.name || item.applicationId || `Item ${idx + 1}`}</span>
                {item.email && <span className="text-gray-500">{item.email}</span>}
                {item.amount && <span className="font-medium">${item.amount}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No data available</p>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )}

    {/* User Details Modal */}
    {userDetailsModal && selectedUserDetails && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-2">
        <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto text-sm sm:text-base">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-medium">User Details</h3>
            <button onClick={() => setUserDetailsModal(false)} className="text-gray-500 hover:text-gray-700">✖</button>
          </div>
          
          {/* Grid responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div><label className="block text-xs sm:text-sm font-medium text-gray-700">Name</label>
              <p className="text-gray-900">{selectedUserDetails.user.name}</p></div>
            <div><label className="block text-xs sm:text-sm font-medium text-gray-700">Email</label>
              <p className="text-gray-900">{selectedUserDetails.user.email}</p></div>
            <div><label className="block text-xs sm:text-sm font-medium text-gray-700">Mobile</label>
              <p className="text-gray-900">{selectedUserDetails.user.mobile || 'N/A'}</p></div>
            <div><label className="block text-xs sm:text-sm font-medium text-gray-700">Role</label>
              <p className="text-gray-900">{selectedUserDetails.user.role}</p></div>
            <div><label className="block text-xs sm:text-sm font-medium text-gray-700">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                selectedUserDetails.user.status === 'active' ? 'bg-green-100 text-green-800' : 
                selectedUserDetails.user.status === 'blocked' ? 'bg-red-100 text-red-800' : 
                'bg-yellow-100 text-yellow-800'}`}>{selectedUserDetails.user.status}</span></div>
            <div><label className="block text-xs sm:text-sm font-medium text-gray-700">Balance</label>
              <p className="text-gray-900">${selectedUserDetails.user.balance || 0}</p></div>
            <div><label className="block text-xs sm:text-sm font-medium text-gray-700">Join Date</label>
              <p className="text-gray-900">{new Date(selectedUserDetails.user.created_at).toLocaleDateString()}</p></div>
            <div><label className="block text-xs sm:text-sm font-medium text-gray-700">Applications</label>
              <p className="text-gray-900">{selectedUserDetails.user.total_applications || 0}</p></div>
          </div>

          {/* Transactions */}
          <div className="mt-4">
            <h4 className="text-sm sm:text-md font-medium mb-2">Recent Transactions</h4>
            <div className="max-h-40 overflow-y-auto">
              {selectedUserDetails.transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-2 py-1 text-left">Amount</th>
                        <th className="px-2 py-1 text-left">Type</th>
                        <th className="px-2 py-1 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUserDetails.transactions.map((txn, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="px-2 py-1">${txn.amount}</td>
                          <td className="px-2 py-1">{txn.type}</td>
                          <td className="px-2 py-1">{new Date(txn.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No transactions found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>

    );
  };

  export default AdminDashboard;