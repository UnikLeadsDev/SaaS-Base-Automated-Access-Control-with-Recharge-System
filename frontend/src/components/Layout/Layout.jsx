import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
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
  Receipt,
  Calculator
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Loan Forms', href: '/forms', icon: FileText },
    { name: 'Wallet', href: '/wallet', icon: Wallet },
    { name: 'Billing', href: '/billing', icon: Calculator },
    { name: 'Receipt', href: '/receipt', icon: Receipt }, 
    { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
    { name: 'Support', href: '/support', icon: HelpCircle },

  ];

  if (user?.role === 'admin') {
    navigation.push({ name: 'Admin Panel', href: '/admin', icon: Settings });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent navigation={navigation} currentPath={location.pathname} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent navigation={navigation} currentPath={location.pathname} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
  <button
    className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
    onClick={() => setSidebarOpen(true)}
  >
    <Menu className="h-6 w-6" />
  </button>
  <div className="flex-1 px-4 flex justify-between items-center">
    <h1 className="text-lg font-semibold text-gray-800">SaaS Base</h1>
    <div className="flex items-center space-x-4">
      <button className="bg-white p-1 rounded-full text-gray-400 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        <Bell className="h-6 w-6" />
      </button>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">{user?.name}</span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 capitalize">
          {user?.role}
        </span>
        <button
          onClick={handleLogout}
          className="bg-white p-1 rounded-full text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
 </div>


        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({ navigation, currentPath }) => (
  <div className="flex flex-col h-full pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
    {/* Branding */}
    <div className="flex items-center justify-center px-4 mb-6">
      <h2 className="text-2xl font-bold text-indigo-600 tracking-tight">SaaS Base</h2>
    </div>

    {/* Navigation */}
    <nav className="flex-1 px-3 space-y-2">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.href;

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

            {/* Optional label (e.g., "New") */}
            {item.name === 'Editor' && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                New
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  </div>
);



export default Layout;