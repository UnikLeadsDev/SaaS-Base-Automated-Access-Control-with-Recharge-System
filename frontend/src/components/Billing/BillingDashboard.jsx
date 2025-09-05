import React, { useState, useEffect } from 'react';
import { FileText, Calculator, TrendingUp, Download } from 'lucide-react';
import InvoiceList from './InvoiceList';
import BillingReports from './BillingReports';
import TaxCalculator from './TaxCalculator';
import api from '../../config/api';
import toast from 'react-hot-toast';

const BillingDashboard = () => {
  const [activeTab, setActiveTab] = useState('invoices');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingSummary();
  }, []);

  const fetchBillingSummary = async () => {
    try {
      const response = await api.get('/billing/summary');
      if (response.data.success) {
        setSummary(response.data.summary);
      }
    } catch (error) {
      // Set fallback data instead of showing error
      setSummary({
        paid_invoices: 0,
        pending_invoices: 0,
        total_paid: 0,
        total_outstanding: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'calculator', label: 'GST Calculator', icon: Calculator }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'invoices':
        return <InvoiceList />;
      case 'reports':
        return <BillingReports />;
      case 'calculator':
        return <TaxCalculator />;
      default:
        return <InvoiceList />;
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold">Billing & Invoicing</h1>
      </div>

      {/* Summary Cards */}
      {!loading && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Paid Invoices</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{summary.paid_invoices}</p>
              </div>
              <FileText className="text-green-600" size={20} />
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Pending Invoices</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">{summary.pending_invoices}</p>
              </div>
              <FileText className="text-yellow-600" size={20} />
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Paid</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">₹{summary.total_paid}</p>
              </div>
              <TrendingUp className="text-blue-600" size={20} />
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Outstanding</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">₹{summary.total_outstanding}</p>
              </div>
              <Download className="text-red-600" size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="mr-2" size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;