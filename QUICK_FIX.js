// Run this in your browser console to fix admin access
localStorage.setItem('userEmail', 'admin@demo.com');
localStorage.setItem('userName', 'Admin User');
localStorage.setItem('token', 'mock_jwt_token_' + Date.now());

// Reload the page
location.reload();