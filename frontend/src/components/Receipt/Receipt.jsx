import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import API_BASE_URL from "../../config/api";

function Receipt() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState([]);

  const token = localStorage.getItem("token");

  // Fetch all receipts
  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/receipts/receipts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setReceipts(data);
      } catch (err) {
        console.error("Error fetching receipts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [token]);

  // PDF generation
  const generatePDF = (receipt) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(40, 40, 160);
    doc.text("SaaS Base", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Recharge Wallet Receipt", 105, 25, { align: "center" });

    autoTable(doc, {
      startY: 40,
      head: [["Field", "Details"]],
      body: [
        ["Transaction ID", receipt.txn_id],
        ["Name", user?.name || "—"],
        ["Date", new Date(receipt.receipt_date).toLocaleDateString("en-IN")],
        ["Payment Mode", receipt.payment_mode],
        ["Amount Added", `₹${receipt.amount}`],
      ],
      theme: "grid",
      headStyles: { fillColor: [63, 81, 181] },
      bodyStyles: { textColor: 50 },
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Thank you for using SaaS Base.", 105, finalY, { align: "center" });
    doc.text("For support, contact support@saasbase.com", 105, finalY + 6, { align: "center" });

    doc.save(`receipt-${receipt.txn_id}.pdf`);
  };

  // Email receipt
  const sendEmail = async (receipt) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(40, 40, 160);
    doc.text("SaaS Base", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Recharge Wallet Receipt", 105, 25, { align: "center" });

    autoTable(doc, {
      startY: 40,
      head: [["Field", "Details"]],
      body: [
        ["Transaction ID", receipt.txn_id],
        ["Name", user?.name || "—"],
        ["Date", new Date(receipt.receipt_date).toLocaleDateString("en-IN")],
        ["Payment Mode", receipt.payment_mode],
        ["Amount Added", `₹${receipt.amount}`],
      ],
      theme: "grid",
      headStyles: { fillColor: [63, 81, 181] },
      bodyStyles: { textColor: 50 },
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Thank you for using SaaS Base.", 105, finalY, { align: "center" });
    doc.text("For support, contact support@saasbase.com", 105, finalY + 6, { align: "center" });

    const pdfBase64 = doc.output("datauristring");

    try {
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

  if (receipts.length === 0) {
    return <div className="text-center py-10 text-gray-500">No receipts found.</div>;
  }

  return (
    <div className="flex flex-col items-center p-6 w-full max-w-2xl">
      <h2 className="text-xl font-bold text-indigo-600 mb-4">Your Receipts</h2>
      <div className="space-y-4 w-full flex flex-row gap-6">
        {receipts.map((receipt) => (
          <div
            key={receipt.receipt_id}
            className="bg-white shadow rounded-lg gap-5 p-4 border flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">Txn ID: {receipt.txn_id}</p>
              <p className="text-sm text-gray-500">
                {new Date(receipt.receipt_date).toLocaleDateString("en-IN")} — ₹{receipt.amount}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => generatePDF(receipt)}
                className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                PDF
              </button>
              <button
                onClick={() => sendEmail(receipt)}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Mail
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Receipt;
