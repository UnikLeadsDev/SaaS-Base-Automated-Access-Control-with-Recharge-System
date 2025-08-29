import React, { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp, FileText } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

const BillingReports = () => {
  const [reportType, setReportType] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [monthYear, setMonthYear] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    try {
      setLoading(true);
      let response;

      if (reportType === 'monthly') {
        response = await api.get(`/billing/statement?year=${monthYear.year}&month=${monthYear.month}`);
      } else {
        const params = new URLSearchParams(dateRange).toString();
        response = await api.get(`/billing/report?${params}`);
      }

      if (response.data.success) {
        setReport(response.data.statement || response.data.report);
        toast.success('Report generated successfully');
      }
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const calculateGST = async () => {
    try {
      const response = await api.post('/billing/calculate-gst', {
        amount: 1000,
        isInterState: false
      });

      if (response.data.success) {
        toast.success(`GST Calculation: CGST: ₹${response.data.cgst}, SGST: ₹${response.data.sgst}`);
      }
    } catch (error) {
      toast.error('Failed to calculate GST');
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Billing Reports</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="monthly">Monthly Statement</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {reportType === 'monthly' ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Year</label>
                <input
                  type="number"
                  value={monthYear.year}
                  onChange={(e) => setMonthYear({...monthYear, year: parseInt(e.target.value)})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Month</label>
                <select
                  value={monthYear.month}
                  onChange={(e) => setMonthYear({...monthYear, month: parseInt(e.target.value)})}
                  className="w-full border rounded px-3 py-2"
                >
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i+1} value={i+1}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={generateReport}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          <button
            onClick={calculateGST}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Calculate GST
          </button>
        </div>
      </div>

      {/* Report Results */}
      {report && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Report Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded">
              <div className="flex items-center">
                <TrendingUp className="text-blue-600 mr-2" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Total Invoiced</p>
                  <p className="text-xl font-semibold">₹{report.summary?.totalInvoiced || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded">
              <div className="flex items-center">
                <FileText className="text-green-600 mr-2" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Total GST</p>
                  <p className="text-xl font-semibold">₹{report.summary?.totalGST || 0}</p>
                </div>
              </div>
            </div>

            {report.summary?.totalCredits !== undefined && (
              <div className="bg-purple-50 p-4 rounded">
                <div>
                  <p className="text-sm text-gray-600">Credits</p>
                  <p className="text-xl font-semibold">₹{report.summary.totalCredits}</p>
                </div>
              </div>
            )}

            {report.summary?.totalDebits !== undefined && (
              <div className="bg-red-50 p-4 rounded">
                <div>
                  <p className="text-sm text-gray-600">Debits</p>
                  <p className="text-xl font-semibold">₹{report.summary.totalDebits}</p>
                </div>
              </div>
            )}
          </div>

          {/* Invoices Table */}
          {report.invoices && report.invoices.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium mb-3">Invoices</h4>
              <div className="overflow-x-auto">
                <table className="w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Invoice #</th>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Amount</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.invoices.map((invoice) => (
                      <tr key={invoice.invoice_id} className="border-b">
                        <td className="px-4 py-2">{invoice.invoice_number}</td>
                        <td className="px-4 py-2">{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                        <td className="px-4 py-2">₹{invoice.total_amount}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {invoice.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          {report.transactions && report.transactions.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Transactions</h4>
              <div className="overflow-x-auto">
                <table className="w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Description</th>
                      <th className="px-4 py-2 text-left">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.transactions.map((transaction) => (
                      <tr key={transaction.transaction_id} className="border-b">
                        <td className="px-4 py-2">{new Date(transaction.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            transaction.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2">{transaction.description}</td>
                        <td className="px-4 py-2">₹{transaction.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BillingReports;