import React, { useRef, useEffect, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Receipt() {
  const receiptRef = useRef(null);
  const { state } = useLocation();
  const { txnId, amount, paymentMode } = state || {};
  const { user } = useAuth();
  const [date, setDate] = useState("");

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `receipt-${txnId}`,
  });

  useEffect(() => {
    const today = new Date();
    const formatted = today.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setDate(formatted);
  }, []);

  if (!txnId || !amount) {
    return (
      <div className="text-center py-10 text-gray-500">
        No receipt data found.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6">
      <div
        ref={receiptRef}
        className="bg-white shadow-lg rounded-xl w-full max-w-md border border-gray-200 p-6"
      >
        {/* Header */}
        <div className="text-center border-b pb-4 mb-4">
          <h2 className="text-2xl font-bold text-indigo-600">SaaS Base</h2>
          <p className="text-sm text-gray-500">Recharge Wallet Receipt</p>
        </div>

        {/* Body */}
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

        {/* Footer */}
        <div className="mt-6 border-t pt-4 text-center text-sm text-gray-500">
          <p>Thank you for using SaaS Base.</p>
          <p>For support, contact support@saasbase.com</p>
        </div>
      </div>

      {/* Download Button */}
      <div className="mt-6">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
        >
          Download Receipt
        </button>
      </div>
    </div>
  );
}

export default Receipt;
