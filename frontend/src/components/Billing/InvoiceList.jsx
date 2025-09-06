import React, { useState, useEffect } from 'react';
import { Download, Eye, Calendar, Filter } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

import EmptyBox from '../Common/EmptyBox';
import axios from "axios";
import API_BASE_URL from "../../config/api";


const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchInvoices();
  }, [filters]);

const fetchInvoices = async () => {
  try {
    setLoading(true);
    const params = new URLSearchParams(filters).toString();

    const response = await axios.get(`${API_BASE_URL}/billing/invoices?${params}`);
    console.log("Invoices Response:", response.data);

    if (response.data.success) {
      setInvoices(response.data.invoices);
      setPagination(response.data.pagination);
    }
  } catch (error) {
    console.error("Error fetching invoices:", error.response?.data || error.message);

    // fallback empty data
    setInvoices([]);
    setPagination({ page: 1, pages: 1, total: 0 });
  } finally {
    setLoading(false);
  }
};

// ✅ Download invoice as PDF
const downloadPDF = async (invoiceId, invoiceNumber) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/billing/invoice/${invoiceId}/pdf`,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoice-${invoiceNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success("Invoice downloaded successfully");
  } catch (error) {
    console.error("Error downloading invoice:", error.response?.data || error.message);
    toast.error("Failed to download invoice");
  }
};

  const getStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      sent: 'bg-blue-100 text-blue-800',
      overdue: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
            className="border rounded px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="sent">Sent</option>
            <option value="overdue">Overdue</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading invoices...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Invoice #</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Due Date</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8">
                      <EmptyBox message="" size={80} />
                    </td>
                  </tr>
                ) : invoices.map((invoice) => (
                  <tr key={invoice.invoice_id} className="border-b">
                    <td className="px-4 py-3 font-medium">{invoice.invoice_number}</td>
                    <td className="px-4 py-3">{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{new Date(invoice.due_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">₹{invoice.total_amount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(invoice.status)}`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadPDF(invoice.invoice_id, invoice.invoice_number)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Download PDF"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setFilters({...filters, page})}
                  className={`px-3 py-1 rounded ${
                    page === pagination.page 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InvoiceList;