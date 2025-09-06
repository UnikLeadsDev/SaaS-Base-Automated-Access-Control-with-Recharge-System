import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const AdminLogin = () => {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('admin123');
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Admin login successful');
    } catch (error) {
      toast.error('Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin Email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Login as Admin
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;