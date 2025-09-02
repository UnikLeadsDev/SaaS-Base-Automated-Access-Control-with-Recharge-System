import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import API_BASE_URL from "../../config/api";
import EmptyBox from "../Common/EmptyBox";

function Receipt() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState([]);

  const token = localStorage.getItem("token");
  const isMockToken = token && token.startsWith("mock_jwt_token_");

  // Fetch all receipts
  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        if (!token || isMockToken) {
          setReceipts([]);
          return;
        }
        const res = await fetch(`${API_BASE_URL}/receipts/receipts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setReceipts([]);
          return;
        }
        const data = await res.json();
        setReceipts(Array.isArray(data) ? data : []);
      } catch (err) {
        // Silently handle API failure
        setReceipts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [token, isMockToken]);

  // PDF generation
  const generatePDF = (receipt) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(40, 40, 160);
    doc.text("Unik Leads", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Recharge Wallet Receipt", 105, 25, { align: "center" });

    const amountDisplay = receipt.payment_mode === 'usd' 
      ? `$${(receipt.amount / 83).toFixed(2)} (₹${receipt.amount})` 
      : `₹${receipt.amount}`;

    autoTable(doc, {
      startY: 40,
      head: [["Field", "Details"]],
      body: [
        ["Transaction ID", receipt.txn_id],
        ["Name", user?.name || "—"],
        ["Date", new Date(receipt.receipt_date).toLocaleDateString("en-IN")],
        ["Payment Mode", receipt.payment_mode],
        ["Amount Added", amountDisplay],
      ],
      theme: "grid",
      headStyles: { fillColor: [63, 81, 181] },
      bodyStyles: { textColor: 50 },
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Thank you for using Unik Leads.", 105, finalY, { align: "center" });
    doc.text("For support, contact support@unikleads.com", 105, finalY + 6, { align: "center" });

    doc.save(`receipt-${receipt.txn_id}.pdf`);
  };

  // Email receipt
  const sendEmail = async (receipt) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(40, 40, 160);
    doc.text("Unik Leads", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Recharge Wallet Receipt", 105, 25, { align: "center" });

    const amountDisplay = receipt.payment_mode === 'usd' 
      ? `$${(receipt.amount / 83).toFixed(2)} (₹${receipt.amount})` 
      : `₹${receipt.amount}`;

    autoTable(doc, {
      startY: 40,
      head: [["Field", "Details"]],
      body: [
        ["Transaction ID", receipt.txn_id],
        ["Name", user?.name || "—"],
        ["Date", new Date(receipt.receipt_date).toLocaleDateString("en-IN")],
        ["Payment Mode", receipt.payment_mode],
        ["Amount Added", amountDisplay],
      ],
      theme: "grid",
      headStyles: { fillColor: [63, 81, 181] },
      bodyStyles: { textColor: 50 },
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Thank you for using Unik Leads.", 105, finalY, { align: "center" });
    doc.text("For support, contact support@unikleads.com", 105, finalY + 6, { align: "center" });

    const pdfBase64 = doc.output("datauristring");

    try {
      if (!token || isMockToken) {
        alert("Email sending is unavailable in demo mode.");
        return;
      }
      const res = await fetch(`${API_BASE_URL}/receipts/send-receipt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: user?.email,
          pdfBase64,
          txnId: receipt.txn_id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Receipt sent to your email!");
      } else {
        alert("Failed to send email.");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending email.");
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading...</div>;
  }

  if (!receipts || receipts.length === 0) {
    return (
      <div className="flex flex-col items-center p-6 w-full">
        <h2 className="text-xl font-bold text-indigo-600 mb-4">Your Receipts</h2>
        <EmptyBox message="" size={120} />
      </div>
    );
  }

return (
  <div className="flex flex-col items-center p-6 w-full">
    <h2 className="text-xl font-bold text-indigo-600 mb-4">Your Receipts</h2>

   <div className="overflow-x-auto w-full">
  <table className="w-full bg-white border rounded-lg shadow">
    <thead>
      <tr className="bg-gray-100 text-left text-sm font-medium text-gray-700">
        <th className="px-4 py-2 border">Index</th>
        <th className="px-4 py-2 border">Date</th>
        <th className="px-4 py-2 border">Amount</th>
        <th className="px-4 py-2 border">Transaction ID</th>
        <th className="px-4 py-2 border text-center">Actions</th>
      </tr>
    </thead>
    <tbody>
      {receipts.map((receipt, index) => (
        <tr key={receipt.receipt_id || receipt.txn_id} className="text-sm text-gray-600">
          <td className="px-4 py-2 border">{index + 1}</td>
          <td className="px-4 py-2 border">
            {new Date(receipt.receipt_date).toLocaleDateString("en-IN")}
          </td>
          <td className="px-4 py-2 border">
            {receipt.payment_mode === 'usd' ? `$${(receipt.amount / 83).toFixed(2)} (₹${receipt.amount})` : `₹${receipt.amount}`}
          </td>
          <td className="px-4 py-2 border break-all">
            {receipt.transaction_id || receipt.txn_ref || receipt.receipt_id}
          </td>
          <td className="px-4 py-2 border text-center">
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => generatePDF(receipt)}
                className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-xs"
              >
                PDF
              </button>
              <button
                onClick={() => sendEmail(receipt)}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
              >
                Mail
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


  </div>
);

}

export default Receipt;
