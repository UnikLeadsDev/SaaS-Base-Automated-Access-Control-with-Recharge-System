import React from "react";
import { QrCode } from "lucide-react";
import paymentQR from "../assets/PaymentQR.jpeg"; // ✅ use your file

const PayViaQRModal = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[320px] text-center relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-lg"
        >
          ✕
        </button>

        <div className="flex items-center justify-center mb-3">
          <QrCode className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">Scan & Pay</h2>
        </div>

        {/* ✅ Your local QR image */}
        <img
          src={paymentQR}
          alt="Payment QR"
          className="w-56 h-56 mx-auto border-2 border-gray-200 rounded-lg object-contain"
        />

        <p className="mt-3 text-sm text-gray-600">
          Scan this QR to make your payment securely.
        </p>
      </div>
    </div>
  );
};

export default PayViaQRModal;
