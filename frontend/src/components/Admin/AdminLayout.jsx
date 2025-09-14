import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Activity, Users, Shield, Monitor, Calendar, DollarSign, Key,
  Bell, Clock, LogOut, Menu, X
} from "lucide-react";

const AdminLayout = ({ activeTab, setActiveTab, children }) => {
  const { user, logout } = useAuth();
  const [dateTime, setDateTime] = useState(new Date());
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const tabs = [
    { id: "dashboard", name: "Dashboard", icon: Activity },
    { id: "users", name: "Users", icon: Users },
    { id: "security", name: "Security", icon: Shield },
    { id: "sessions", name: "Sessions", icon: Monitor },
    { id: "subscriptions", name: "Subscriptions", icon: Calendar },
    { id: "revenue", name: "Revenue", icon: DollarSign },
    { id: "api-keys", name: "API Keys", icon: Key },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const interval = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* --- Sidebar for larger screens --- */}
      <div className="hidden sm:flex w-60 bg-white border-r border-gray-200 flex-col overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center justify-center py-4 border-b">
          <img
            src="/src/assets/Unik leads png.png"
            alt="Unik Leads"
            className="h-10 w-auto"
          />
        </div>

        {/* Navigation */}
        <nav className="flex flex-col space-y-1 p-3 flex-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? "bg-indigo-50 text-indigo-600 font-semibold border-r-4 border-indigo-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-r-4 border-transparent"
                } flex items-center gap-3 px-3 py-2 text-sm rounded-md text-left`}
              >
                <Icon className="h-5 w-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* --- Mobile Sidebar Overlay --- */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex sm:hidden">
          <div className="w-60 bg-white border-r border-gray-200 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <img
                src="/src/assets/Unik leads png.png"
                alt="Unik Leads"
                className="h-8 w-auto"
              />
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-600 hover:text-red-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-col space-y-1 p-3 flex-1 overflow-y-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSidebarOpen(false); // close after select
                    }}
                    className={`${
                      activeTab === tab.id
                        ? "bg-indigo-50 text-indigo-600 font-semibold border-r-4 border-indigo-500"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-r-4 border-transparent"
                    } flex items-center gap-3 px-3 py-2 text-sm rounded-md text-left`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
          {/* Dim background */}
          <div
            onClick={() => setSidebarOpen(false)}
            className="flex-1 bg-black bg-opacity-30"
          />
        </div>
      )}

      {/* --- Main Content --- */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex justify-between items-center bg-white border-b border-gray-200 h-16 px-4">
          {/* Left: Mobile Menu + Date/Time */}
          <div className="flex items-center space-x-4">
            {/* Mobile toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="sm:hidden p-2 text-gray-600 hover:text-indigo-600"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Date & Time */}
            <div className="hidden sm:flex items-center space-x-6 text-sm text-gray-700 font-medium">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4 text-indigo-500" />
                <span>{dateTime.toLocaleDateString("en-GB")}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4 text-indigo-500" />
                <span>
                  {dateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Admin Info */}
          <div className="hidden md:block bg-blue-50 border border-blue-200 rounded-lg p-2">
            <div className="flex items-center gap-2 text-blue-800 text-sm">
              <Shield className="h-5 w-5" />
              <span className="font-medium">
                Admin Dashboard - {user?.email} ({user?.role})
              </span>
            </div>
          </div>

          {/* Right: Wallet, Notifications, User, Logout */}
          <div className="flex items-center space-x-3">
            {/* Wallet (hidden on mobile) */}
            <div className="hidden sm:block bg-indigo-50 text-indigo-700 font-semibold px-3 py-1 rounded-lg text-sm">
              ₹ 0.00
            </div>

            {/* Notification */}
            <button className="hidden sm:block p-1 rounded-full text-gray-400 hover:text-indigo-500">
              <Bell className="h-5 w-5" />
            </button>

            {/* User Info */}
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 capitalize">
                {user?.role}
              </span>
            </div>

            {/* Mobile initials */}
            <div className="sm:hidden bg-indigo-100 text-indigo-700 font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">
              {user?.name?.charAt(0) || "U"}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-1 rounded-full text-gray-400 hover:text-red-500"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
