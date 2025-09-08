import React, { useEffect, useState } from "react";
import axios from "axios";
import { Settings } from "lucide-react";
import API_BASE_URL from "../../config/api";
import SubscriptionPreferences from "../Subscriptions/SubscriptionPreferences";

const Profile = () => {
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [company, setCompany] = useState({
    company_name: "", industry: "", country: "", state: "", zipcode: "",
    city: "", address: "", gst_no: "", pan_no: "", website: "", logo_url: ""
  });
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [showSubscriptionPrefs, setShowSubscriptionPrefs] = useState(false);

  const getToken = () => localStorage.getItem("token");
  const getAuthHeaders = () => ({ Authorization: `Bearer ${getToken()}` });
  
  const handleChange = (setter) => (e) => {
    const { name, value } = e.target;
    setter(prev => ({ ...prev, [name]: value }));
  };

  const InputField = ({ label, name, value, onChange, type = "text", disabled = false, rows }) => (
    <div>
      <label className="block mb-1 text-sm font-medium">{label}</label>
      {rows ? (
        <textarea name={name} value={value} onChange={onChange} rows={rows} 
          className="w-full border rounded-md px-3 py-2" />
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} disabled={disabled}
          className="w-full border rounded-md px-3 py-2" required={type === "password"} />
      )}
    </div>
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/profile/profile`, { headers: getAuthHeaders() });
        setProfile({
          name: res.data.user?.name || "",
          email: res.data.user?.email || "",
          phone: res.data.user?.mobile || ""
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...company, pincode: company.zipcode, gstin: company.gst_no, 
        pan: company.pan_no, email: profile.email, phone: profile.phone };
      await axios.post(`${API_BASE_URL}/profile/profile/company`, payload, { headers: getAuthHeaders() });
      alert("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile!");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/profile/update-password`, passwords, { headers: getAuthHeaders() });
      alert("Password updated successfully!");
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Error updating password:", error);
      alert(error.response?.data?.message || "Failed to update password!");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-semibold mb-6">Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Company Details</h2>
          <div className="space-y-4">
            <InputField label="Company Name" name="company_name" value={company.company_name} onChange={handleChange(setCompany)} />
            <InputField label="Industry" name="industry" value={company.industry} onChange={handleChange(setCompany)} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Country" name="country" value={company.country} onChange={handleChange(setCompany)} />
              <InputField label="State" name="state" value={company.state} onChange={handleChange(setCompany)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Zipcode" name="zipcode" value={company.zipcode} onChange={handleChange(setCompany)} />
              <InputField label="City" name="city" value={company.city} onChange={handleChange(setCompany)} />
            </div>
            <InputField label="Address" name="address" value={company.address} onChange={handleChange(setCompany)} rows="3" />
            <InputField label="GST No." name="gst_no" value={company.gst_no} onChange={handleChange(setCompany)} />
            <InputField label="PAN No." name="pan_no" value={company.pan_no} onChange={handleChange(setCompany)} />
            <InputField label="Website" name="website" value={company.website} onChange={handleChange(setCompany)} />
            <InputField label="Logo URL" name="logo_url" value={company.logo_url} onChange={handleChange(setCompany)} />
          </div>
          <button onClick={handleSaveProfile} className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
            Save Profile
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">User Details</h2>
          <div className="space-y-4 mb-6">
            <InputField label="Username" name="name" value={profile.name} onChange={handleChange(setProfile)} disabled />
            <InputField label="Email" name="email" value={profile.email} onChange={handleChange(setProfile)} type="email" disabled />
            <InputField label="Phone" name="phone" value={profile.phone} onChange={handleChange(setProfile)} type="tel" />
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-semibold">Subscription Settings</h2>
              <button
                onClick={() => setShowSubscriptionPrefs(!showSubscriptionPrefs)}
                className="inline-flex items-center px-3 py-2 text-sm bg-indigo-100 hover:bg-indigo-200 rounded-md"
              >
                <Settings className="h-4 w-4 mr-1" /> Preferences
              </button>
            </div>
            {showSubscriptionPrefs && (
              <div className="mt-4">
                <SubscriptionPreferences />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Update Password</h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <InputField label="Current Password" name="oldPassword" value={passwords.oldPassword} onChange={handleChange(setPasswords)} type="password" />
              <InputField label="New Password" name="newPassword" value={passwords.newPassword} onChange={handleChange(setPasswords)} type="password" />
              <InputField label="Confirm New Password" name="confirmPassword" value={passwords.confirmPassword} onChange={handleChange(setPasswords)} type="password" />
              <button type="submit" className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700">
                Update Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;