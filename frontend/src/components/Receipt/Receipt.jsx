import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import API_BASE_URL from "../../config/api";


function Receipt() {
  const { state } = useLocation();
  const { txnId, amount, paymentMode } = state || {};
  const { user } = useAuth();
  const [date, setDate] = useState("");

  useEffect(() => {
    const today = new Date();
    const formatted = today.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setDate(formatted);
  }, []);

const generatePDF = () => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 160);
  doc.text("SaaS Base", 105, 15, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text("Recharge Wallet Receipt", 105, 25, { align: "center" });

  // Table using autoTable
  autoTable(doc, {
    startY: 40,
    head: [["Field", "Details"]],
    body: [
      ["Transaction ID", txnId],
      ["Name", user?.name || "—"],
      ["Date", date],
      ["Payment Mode", paymentMode],
      ["Amount Added", `₹${amount}`],
    ],
    theme: "grid",
    headStyles: { fillColor: [63, 81, 181] },
    bodyStyles: { textColor: 50 },
  });

  // Footer
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Thank you for using SaaS Base.", 105, finalY, { align: "center" });
  doc.text(
    "For support, contact support@saasbase.com",
    105,
    finalY + 6,
    { align: "center" }
  );

  doc.save(`receipt-${txnId}.pdf`);
};

const sendEmail = async () => {
  const doc = new jsPDF();

  // (same PDF generation code as in generatePDF)
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
      ["Transaction ID", txnId],
      ["Name", user?.name || "—"],
      ["Date", date],
      ["Payment Mode", paymentMode],
      ["Amount Added", `₹${amount}`],
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

  // Convert PDF to Base64
  const pdfBase64 = doc.output("datauristring");
  console.log("user email is ", user?.email);
  console.log("token is ", localStorage.getItem('token'));
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_BASE_URL}/receipts/send-receipt`, {
      method: "POST",
      headers: { "Content-Type": "application/json",
         "Authorization": `Bearer ${token}` 
       },
      body: JSON.stringify({
        email: user?.email,  // current logged-in user email
        pdfBase64,
        txnId,
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



  if (!txnId || !amount) {
    return (
      <div className="text-center py-10 text-gray-500">
        No receipt data found.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6">
      {/* On-screen Preview */}
      <div className="bg-white shadow-lg rounded-xl w-full max-w-md border border-gray-200 p-6">
        <div className="text-center border-b pb-4 mb-4">
          <h2 className="text-2xl font-bold text-indigo-600">SaaS Base</h2>
          <p className="text-sm text-gray-500">Recharge Wallet Receipt</p>
        </div>

        <div className="space-y-3 text-gray-700">
          <div className="flex justify-between">
            <span className="font-medium">Transaction ID:</span>
            <span>{txnId}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Name:</span>
            <span>{user?.name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Date:</span>
            <span>{date}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Payment Mode:</span>
            <span className="capitalize">{paymentMode}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold border-t pt-3">
            <span>Amount Added:</span>
            <span className="text-green-600">₹{amount}</span>
          </div>
        </div>

        <div className="mt-6 border-t pt-4 text-center text-sm text-gray-500">
          <p>Thank you for using SaaS Base.</p>
          <p>For support, contact support@saasbase.com</p>
        </div>
      </div>

      {/* PDF Download Button */}
     <div className="mt-6 flex gap-4">
  <button
    onClick={generatePDF}
    className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
  >
    Download Receipt (PDF)
  </button>

  <button
    onClick={sendEmail}
    className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
  >
    Get Receipt on Mail
  </button>
</div>

    </div>
  );
}

export default Receipt;
