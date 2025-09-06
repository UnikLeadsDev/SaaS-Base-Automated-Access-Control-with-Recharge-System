// Quick test script to verify admin access
// Run this in browser console after logging in

const testAdminAccess = async () => {
  const token = localStorage.getItem('token');
  const userEmail = localStorage.getItem('userEmail');
  
  console.log('Token:', token ? 'exists' : 'missing');
  console.log('User Email:', userEmail);
  console.log('Is Admin Email:', userEmail?.toLowerCase().includes('admin'));
  
  try {
    const response = await fetch('http://localhost:5000/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-email': userEmail
      }
    });
    
    console.log('Admin Stats Response:', response.status);
    const data = await response.json();
    console.log('Data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run the test
testAdminAccess();