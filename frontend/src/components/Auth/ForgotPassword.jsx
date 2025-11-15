import React, { useState } from "react";
import axios from "axios";
import API_BASE_URL from "../../config/api"; // adjust if needed
import { useNavigate } from "react-router-dom";




  // Inline input field component
const InputField = ({ label, type = "text", value, onChange, required = false }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1">{label}</label>
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e)}
      required={required}
      autoComplete="off"
      spellCheck="false"
      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);
const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();




  // Step 1 → Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
      alert(res.data.message);
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 → Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/verify-otp`, { email, otp });
      alert(res.data.message);
      setStep(3);
    } catch (err) {
      alert(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 3 → Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        email,
        newPassword,
      });
      alert(res.data.message);
      setStep(1);
      setEmail("");
      setOtp("");
      setNewPassword("");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-md mt-10">
      <h2 className="text-lg font-semibold mb-4 text-center border-b pb-2">
        {step === 1 && "Forgot Password"}
        {step === 2 && "Verify OTP"}
        {step === 3 && "Set New Password"}
      </h2>

      {step === 1 && (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <InputField label="Enter OTP" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <InputField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
           
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
