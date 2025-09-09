import { useEffect, useState } from "react";
import API_BASE_URL from '../../config/api';
import { useAuth } from '../../context/AuthContext';

import axios from "axios";

const RevenueStat = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
const [transactions, setTransactions] = useState([]);

   useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/admin/revenue-breakdown`);
        setUsers(response.data.data || []);
      } catch (error) {
        console.error("Error fetching revenue breakdown:", error);
      }
    };

    fetchRevenue();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.mobile.toLowerCase().includes(search.toLowerCase())
  );

  const handleUserClick = async (userId) => {
  setSelectedUser(userId);
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/revenue-breakdown/${userId}`);
    setTransactions(response.data.data || []);
    
   
  } catch (err) {
    console.error("Error fetching transactions:", err);
  }
};

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-700">Revenue Stats</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search here..."
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="px-3 py-2 border rounded-md bg-gray-100 hover:bg-gray-200 text-sm">
            Filter
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 text-sm">
          <thead>
            <tr className="bg-blue-50 text-gray-700">
              <th className="p-3 text-left">User Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Mobile</th>
              <th className="p-3 text-right">Total Contribution (₹)</th>
              <th className="p-3 text-center">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="p-3">{user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.mobile}</td>
                <td className="p-3 text-right font-medium">
                  ₹{user.total_contribution}
                </td>
                <td className="p-3 text-center" key={user.user_id} onClick={() => handleUserClick(user.user_id)}>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm">
                    See Details
                  </button>
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center p-4 text-gray-500">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {selectedUser && (
  <div className="mt-6">
    <h3 className="text-lg font-semibold">Transactions for User #{selectedUser}</h3>
    <table className="min-w-full divide-y divide-gray-200 mt-2 border">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-2">Transaction ID</th>
          <th className="px-4 py-2">Amount</th>
          <th className="px-4 py-2">Payment Method</th>
          <th className="px-4 py-2">Date</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx) => (
          <tr key={tx.id} className="hover:bg-gray-50">
            <td className="px-4 py-2">{tx.txn_ref}</td>
            <td className="px-4 py-2">₹{tx.amount}</td>
            <td className="px-4 py-2">{tx.payment_mode}</td>
            <td className="px-4 py-2">
              {new Date(tx.created_at).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

    </div>
  );
};

export default RevenueStat;
