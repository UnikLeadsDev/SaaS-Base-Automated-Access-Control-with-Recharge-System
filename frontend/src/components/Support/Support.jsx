import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageCircle, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_BASE_URL from '../../config/api';

const Support = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(response.data);
    } catch (error) {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/support/create`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Support ticket created successfully');
      setFormData({ subject: '', description: '', priority: 'medium' });
      setShowCreateForm(false);
      fetchTickets();
    } catch (error) {
      toast.error('Failed to create support ticket');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'closed':
        return <CheckCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600">Get help with your account and services</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Ticket
        </button>
      </div>

      {/* Create Ticket Form */}
      {showCreateForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Create Support Ticket</h3>
          <form onSubmit={createTicket}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create Ticket
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Support Tickets */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Your Support Tickets</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div key={ticket.ticket_id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(ticket.status)}
                    <div>
                      <h4 className="font-medium text-gray-900">{ticket.subject}</h4>
                      <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-500">
                          Created: {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          Updated: {new Date(ticket.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                      ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                      ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No support tickets found. Create your first ticket to get help.
            </div>
          )}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">How do I recharge my wallet?</h4>
              <p className="text-sm text-gray-600 mt-1">
                Go to the Wallet section and click on "Recharge Wallet". You can pay using Razorpay.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">What happens when my balance is low?</h4>
              <p className="text-sm text-gray-600 mt-1">
                You'll receive automatic alerts via SMS and email when your balance falls below ₹100.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">How do subscriptions work?</h4>
              <p className="text-sm text-gray-600 mt-1">
                Subscriptions give you unlimited access to forms for the duration of your plan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;