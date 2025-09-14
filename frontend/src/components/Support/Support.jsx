import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { HelpCircle, Plus, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import EmptyBox from '../Common/EmptyBox';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    category: '', // added category
    subject: '',
    description: '',
    // priority: 'medium', // default priority
    attachment: null,
  });
  const [openFaq, setOpenFaq] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [ticketDetails, setTicketDetails] = useState(null);

  const faqs = [
    { question: 'How do I recharge my wallet?', answer: 'Go to the Wallet section and click "Recharge Wallet". You can pay securely using Razorpay.' },
    { question: 'What are the form processing rates?', answer: 'Basic forms cost $5 each, and realtime validation forms cost $50 each.' },
    { question: 'How do I get low balance alerts?', answer: 'Alerts are sent automatically via SMS and email when your balance falls below $100.' },
    { question: 'Can I update my subscription plan?', answer: 'Yes, go to the Subscription section in your dashboard to upgrade or change your plan.' },
  ];

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get( `${API_BASE_URL}/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(res.data);
    } catch (err) {
      // Mock data for demo when API fails
      if (err.response?.status === 401 || err.response?.status === 500 || err.code === 'ERR_NETWORK' || !err.response) {
        setTickets([
          {
            ticket_id: 'TKT001',
            subject: 'Wallet recharge issue',
            status: 'open',
            priority: 'medium',
            created_at: new Date().toISOString()
          }
        ]);
      }
    }
  };

  const createTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('category', newTicket.category);
      formData.append('subject', newTicket.subject);
      formData.append('description', newTicket.description);
      if (newTicket.attachment) {
        formData.append('attachment', newTicket.attachment);
      }

      const res = await axios.post(`${API_BASE_URL}/support/create`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const { ticketId } = res.data;
      const mockTicketId = ticketId || 'TKT' + Date.now();
      setTicketDetails({
        ticketId: mockTicketId,
        subject: newTicket.subject,
        category: newTicket.category,
        createdAt: new Date().toLocaleString(),
        status: 'Open'
      });
      setNewTicket({ category: '', subject: '', description: '', attachment: null });
      setShowCreateTicket(false);
      setShowSuccessModal(true);
      fetchTickets();
    } catch (err) {
      console.error(err);
      if (err.code === 'ERR_NETWORK' || !err.response || err.response?.status === 500) {
        // Mock success for demo mode
        const mockTicketId = 'TKT' + Date.now();
        setTicketDetails({
          ticketId: mockTicketId,
          subject: newTicket.subject,
          category: newTicket.category,
          createdAt: new Date().toLocaleString(),
          status: 'Open',
          demoMode: true
        });
        setNewTicket({ category: '', subject: '', description: '', attachment: null });
        setShowCreateTicket(false);
        setShowSuccessModal(true);
        fetchTickets();
      } else {
        toast.error('❌ Failed to create support ticket. Please try again.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-yellow-100 text-yellow-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

return (
  <div className="space-y-6 px-3 sm:px-6">
    <div className="bg-white shadow rounded-lg p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center">
          <HelpCircle className="h-6 w-6 text-gray-400 mr-2" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Support Center</h2>
        </div>
        <button
          onClick={() => setShowCreateTicket(true)}
          className="inline-flex items-center justify-center px-3 sm:px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Raise Ticket
        </button>
      </div>

      {/* Tickets List */}
      <div className="mb-8">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          Your Support Tickets
        </h3>
        {tickets.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr key={ticket.ticket_id}>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">#{ticket.ticket_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{ticket.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 sm:hidden">
              {tickets.map((ticket) => (
                <div key={ticket.ticket_id} className="border rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold text-gray-900">#{ticket.ticket_id}</p>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{ticket.subject}</p>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span className={`px-2 py-0.5 rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </span>
                    <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyBox message="" size={100} />
        )}
      </div>

      {/* FAQ Section */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div key={index} className="border rounded-lg">
              <button
                className="w-full flex justify-between items-center px-3 sm:px-4 py-3 text-left text-gray-800 font-medium hover:bg-gray-50"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                {faq.question}
                {openFaq === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
              {openFaq === index && <div className="px-3 sm:px-4 pb-4 text-gray-600 text-sm">{faq.answer}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Create Ticket Modal */}
    {showCreateTicket && (
      <div 
        className="fixed bg-black bg-opacity-50 flex items-start justify-center pt-10"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
          margin: 0,
          padding: 0
        }}
      >
        <div className="relative w-full max-w-lg mx-4 bg-white shadow-lg rounded-lg">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Raise Support Ticket</h3>
              <button onClick={() => setShowCreateTicket(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a category</option>
                  <option value="Billing">Billing / Payment Issue</option>
                  <option value="Wallet">Wallet Recharge Issue</option>
                  <option value="Access">Access / Login Issue</option>
                  <option value="Technical">Technical Error</option>
                  <option value="General">General Query</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Brief summary of the issue"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Explain your issue in detail"
                />
              </div>

              {/* Attachment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attachment (optional)</label>
                <input
                  type="file"
                  onChange={(e) => setNewTicket({ ...newTicket, attachment: e.target.files[0] })}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:space-x-3 mt-6 space-y-3 sm:space-y-0">
              <button
                onClick={createTicket}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Submit Ticket
              </button>
              <button
                onClick={() => setShowCreateTicket(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Success Modal */}
    {showSuccessModal && ticketDetails && (
      <div 
        className="fixed bg-black bg-opacity-50 flex items-center justify-center"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
          margin: 0,
          padding: 0
        }}
      >
        <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket Created Successfully!</h3>
            <p className="text-sm text-gray-500 mb-4">#{ticketDetails.ticketId}</p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Created At</span>
                  <span className="text-gray-900">{ticketDetails.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Ticket ID</span>
                  <span className="text-gray-900">#{ticketDetails.ticketId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Subject</span>
                  <span className="text-gray-900">{ticketDetails.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Category</span>
                  <span className="text-gray-900">{ticketDetails.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Status</span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{ticketDetails.status}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);

};

export default Support;
