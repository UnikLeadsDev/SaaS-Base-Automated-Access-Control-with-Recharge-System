import { useState, useEffect, Profiler } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWallet } from "../../context/WalletContext";

import { useAuth } from '../../context/AuthContext';
import { 
  User,
  Home, 
  FileText, 
  Wallet, 
  CreditCard, 
  HelpCircle, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  IndianRupee,
  Calculator,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { balance } = useWallet();

 

  // Date & Time state
  const [dateTime, setDateTime] = useState(new Date());
  

  useEffect(() => {
    
    const interval = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

 let navigation = [];

if (user?.role === 'admin') {
  navigation = [
    { name: 'Admin Panel', href: '/admin', icon: Settings },
    // { name: 'Profile Settings', href: '/profile', icon: User },
    // { name: 'Support', href: '/support', icon: HelpCircle },
  ];
} else {
  navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { 
      name: 'Products', 
      icon: FileText, 
      isDropdown: true,
      subItems: [
        { name: 'Loan Forms', href: '/forms' }
      ]
    },
    { name: 'Wallet', href: '/wallet', icon: Wallet },
    { name: 'Billing', href: '/billing', icon: Calculator },
    { name: 'Receipt', href: '/receipt', icon: IndianRupee }, 
    { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
    { name: 'Profile Settings', href: '/profile', icon: User },
    { name: 'Support', href: '/support', icon: HelpCircle },
  ];
}


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

 return (
  <div className="h-screen flex overflow-hidden bg-gray-100">
    {/* Mobile sidebar */}
    <div
      className={`fixed inset-0 flex z-40 md:hidden transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div
        className="fixed inset-0 bg-gray-600 bg-opacity-75"
        onClick={() => setSidebarOpen(false)}
      />
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-lg">
        <div className="absolute top-0 right-0 -mr-12 pt-2">
          <button
            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>
        <SidebarContent 
          navigation={navigation} 
          currentPath={location.pathname}
          productsOpen={productsOpen}
          setProductsOpen={setProductsOpen}
          user={user}
        />
      </div>
    </div>

    {/* Desktop sidebar */}
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <SidebarContent 
          navigation={navigation} 
          currentPath={location.pathname}
          productsOpen={productsOpen}
          setProductsOpen={setProductsOpen}
          user={user}
        />
      </div>
    </div>

    {/* Main content */}
    <div className="flex flex-col w-0 flex-1 overflow-hidden">
      {/* Top bar */}
      <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
        {/* Sidebar toggle button on mobile */}
        <button
          className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Main top bar content */}
        <div className="flex-1 px-2 sm:px-4 flex justify-between items-center">
          {/* Left: Date/Time */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-700 font-medium bg-gray-50 px-2 sm:px-3 py-1 rounded-lg shadow-sm space-y-1 sm:space-y-0">
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

          {/* Right: Wallet, Bell, User Info, Logout */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Wallet Button */}
            <button
              onClick={() => navigate("/wallet")}
              className="flex items-center space-x-1 sm:space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium shadow-sm transition"
            >
              <Wallet className="h-4 w-4" />
              <span>₹ {balance?.toFixed(2) || "0.00"}</span>
            </button>

            {/* Notification */}
            <button className="bg-white p-1 rounded-full text-gray-400 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <Bell className="h-5 w-5" />
            </button>

            {/* User Info */}
            <div className="hidden sm:flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 capitalize">
                {user?.role}
              </span>
            </div>

            {/* Mobile: Just initials */}
            <div className="sm:hidden bg-indigo-100 text-indigo-700 font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">
              {user?.name?.charAt(0) || "U"}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="bg-white p-1 rounded-full text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Page content */}
      <main className="flex-1 relative overflow-y-auto focus:outline-none">
        <div className="py-2 px-2 sm:py-4 sm:px-4">
          <div className="max-w-7xl mx-auto pb-16 sm:pb-20">
            {children}
          </div>
        </div>
      </main>
    </div>
  </div>
);

};

const SidebarContent = ({ navigation, currentPath, productsOpen, setProductsOpen, user }) => (
  <div className="flex flex-col h-full pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
    {/* Branding */}
    <div className="flex items-center justify-center px-4 mb-6">
      <img 
        src="/src/assets/Unik leads png.png" 
        alt="Unik Leads" 
        className="h-20 w-auto"
      />
    </div>

    {/* Navigation */}
    <nav className="flex-1 px-3 space-y-2">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.href;

        if (item.isDropdown) {
          return (
            <div key={item.name}>
              <button
                onClick={() => setProductsOpen(!productsOpen)}
                className="group flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                <div className="flex items-center">
                  <Icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-indigo-400" />
                  {item.name}
                </div>
                {productsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {productsOpen && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.name}
                      to={subItem.href}
                      className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                        currentPath === subItem.href
                          ? 'bg-indigo-100 text-indigo-900 font-semibold shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.name}
            to={item.href}
            className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-indigo-100 text-indigo-900 font-semibold shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center">
              <Icon
                className={`mr-3 h-5 w-5 transition-colors duration-150 ${
                  isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-indigo-400'
                }`}
              />
              {item.name}
            </div>
          </Link>
        );
      })}
    </nav>
  </div>
);

export default Layout;
