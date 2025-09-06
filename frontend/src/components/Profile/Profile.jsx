import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../../config/api";

const Profile = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [company, setCompany] = useState({
    company_name: "",
    industry: "",
    country: "",
    state: "",
    zipcode: "",
    city: "",
    address: "",
    gst_no: "",
    pan_no:"",
    website: "",
    logo_url: "",
  });

  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/profile/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProfile({
          name: res.data.user?.name || "",
          email: res.data.user?.email || "",
          phone: res.data.user?.mobile || "",
        });

        // setCompany({
        //   company_name: res.data.company?.company_name || "",
        //   industry: res.data.company?.industry || "",
        //   country: res.data.company?.country || "",
        //   state: res.data.company?.state || "",
        //   zipcode: res.data.company?.pincode || "",
        //   city: res.data.company?.city || "",
        //   address: res.data.company?.address || "",
        //   gst_no: res.data.company?.gstin || "",
        //   pan_no: res.data.company?.pan || "",
        //   website: res.data.company?.website || "",
        //   logo_url: res.data.company?.logo_url || "",
        // });
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

  // Handlers
  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompany((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      const payload = {
        company_name: company.company_name,
        industry: company.industry,
        address: company.address,
        city: company.city,
        state: company.state,
        pincode: company.zipcode,
        gstin: company.gst_no,
        pan: company.pan_no,
        website: company.website,
        logo_url: company.logo_url,
        email: profile.email,
        phone: profile.phone,
      };

      const res = await axios.post(
        `${API_BASE_URL}/profile/profile/company`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Profile saved successfully!");
      console.log("Saved:", res.data);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile!");
    }
  };


   // Update Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      const payload = {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword,
      };

      const res = await axios.post(
        `${API_BASE_URL}/profile/update-password`,
   
     payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Password upadted Sucessfully",res.data.message);
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Error updating password:", error);
      alert(
        error.response?.data?.message || "Failed to update password!"
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-semibold mb-6">Profile</h1>

      <form
        onSubmit={handleSaveProfile}
        className="grid grid-cols-1 md:grid-cols-2 gap-10"
      >
        {/* Company Details */}
        <div>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">
            Company Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Company Name</label>
              <input
                type="text"
                name="company_name"
                value={company.company_name}
                onChange={handleCompanyChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Industry</label>
              <input
                type="text"
                name="industry"
                value={company.industry}
                onChange={handleCompanyChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Country</label>
                <input
                  type="text"
                  name="country"
                  value={company.country}
                  onChange={handleCompanyChange}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">State</label>
                <input
                  type="text"
                  name="state"
                  value={company.state}
                  onChange={handleCompanyChange}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Zipcode</label>
                <input
                  type="text"
                  name="zipcode"
                  value={company.zipcode}
                  onChange={handleCompanyChange}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">City</label>
                <input
                  type="text"
                  name="city"
                  value={company.city}
                  onChange={handleCompanyChange}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Address</label>
              <textarea
                name="address"
                value={company.address}
                onChange={handleCompanyChange}
                rows="3"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">GST No.</label>
              <input
                type="text"
                name="gst_no"
                value={company.gst_no}
                onChange={handleCompanyChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">PAN No.</label>
              <input
                type="text"
                name="pan_no"
                value={company.pan_no}
                onChange={handleCompanyChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Website</label>
              <input 
                type="text"
                name="website"
                value={company.website}
                onChange={handleCompanyChange}
                className="w-full border rounded-md px-3 py-2"
                />
            </div>
            <div>
                <label className="block mb-1 text-sm font-medium">Logo URL</label>
                <input
                  type="text"
                  name="logo_url"
                  value={company.logo_url}
                  onChange={handleCompanyChange}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>

            
          </div>
        </div>

        {/* User Details + Password */}
        <div>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">
            User Details
          </h2>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block mb-1 text-sm font-medium">Username</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                className="w-full border rounded-md px-3 py-2"
                disabled
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Phone</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Old Password</label>
              <input
                type="password"
                name="oldPassword"
                value={passwords.oldPassword}
                onChange={handlePasswordChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Re-enter New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div className="flex gap-4 mt-4">
              <button
                type="submit"
                onClick={handleUpdatePassword}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
