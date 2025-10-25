import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import API_BASE_URL from "../../config/api";
import EmptyBox from "../Common/EmptyBox";
import { Calendar } from "lucide-react";

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
         setLoading(false);
         return;
       }

       const res = await fetch(`${API_BASE_URL}/receipts/my-receipts`, {
         headers: { Authorization: `Bearer ${token}` },
       });

       const data = await res.json();
       if (data.success) {
         setReceipts(data.receipts);
       } else {
         setReceipts([]);
       }
     } catch (err) {
       console.error("Error fetching receipts", err);
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

    doc.addFont('https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf', 'DejaVuSans', 'normal');
    doc.setFont('DejaVuSans');

    doc.setFontSize(18);
    doc.setTextColor(40, 40, 160);
    doc.text("Unik Leads", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Recharge Wallet Receipt", 105, 25, { align: "center" });

<<<<<<< HEAD
    const amountDisplay = receipt.payment_mode === 'usd'
  ? `₹${receipt.amount} (USD $${(receipt.amount / 83).toFixed(2)})`
  : `₹${receipt.amount}`;
=======
    const amountDisplay = receipt.payment_mode === 'usd' 
      ? `Rs. ${(receipt.amount / 83).toFixed(2)} (Rs. ${receipt.amount})` 
      : `Rs. ${receipt.amount}`;
      
>>>>>>> a21518b650b1ec36577379fe80f0be02bcd95ba0

    autoTable(doc, {
      startY: 40,
      head: [["Field", "Details"]],
      body: [
        ["Transaction ID", receipt.transaction_id || receipt.txn_ref || receipt.receipt_id],
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
      ? `₹${(receipt.amount / 83).toFixed(2)} (₹${receipt.amount})` 
      : `₹${receipt.amount}`;

    autoTable(doc, {
      startY: 40,
      head: [["Field", "Details"]],
      body: [
        ["Transaction ID", receipt.transaction_id || receipt.txn_ref || receipt.receipt_id],
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

    // try {
    //   if (!token || isMockToken) {
    //     alert("Email sending is unavailable in demo mode.");
    //     return;
    //   }
    //   const res = await fetch(`${API_BASE_URL}/receipts/send-receipt`, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization: `Bearer ${token}`,
    //     },
    //     body: JSON.stringify({
    //       email: user?.email,
    //       pdfBase64,
    //       txnId: receipt.txn_id,
    //     }),
    //   });

    //   const data = await res.json();
    //   if (data.success) {
    //     alert("Receipt sent to your email!");
    //   } else {
    //     alert("Failed to send email.");
    //   }
    // } catch (err) {
    //   console.error(err);
    //   alert("Error sending email.");
    // }
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
            <div className="flex items-center space-x-1 text-gray-700 text-sm">
              <Calendar className="h-4 w-4 text-indigo-500" />
              <span>
                {receipt.receipt_date
                  ? new Date(receipt.receipt_date).toLocaleDateString("en-IN")
                  : "—"}
              </span>
            </div>
          </td>
          <td className="px-4 py-2 border">
<<<<<<< HEAD
            {receipt.payment_mode === 'usd' ? `{(receipt.amount / 83).toFixed(2)} (${receipt.amount})` : `₹${receipt.amount}`}
=======
            {receipt.payment_mode === 'usd' ? `₹${(receipt.amount / 83).toFixed(2)} (₹${receipt.amount})` : `₹${receipt.amount}`}
>>>>>>> a21518b650b1ec36577379fe80f0be02bcd95ba0
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
