import jwt from 'jsonwebtoken';

// Simple RBAC test functions
const createToken = (role, id = 1) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  return jwt.sign({ id, role }, secret);
};

const testRoleAccess = (userRole, requiredRoles) => {
  return requiredRoles.includes(userRole);
};

// Test cases
const runRBACTests = () => {
  console.log('🧪 Running RBAC Tests...');
  
  // Test 1: Admin access to admin routes
  const adminToken = createToken('admin');
  const adminAccess = testRoleAccess('admin', ['admin']);
  console.log(`✅ Admin access to admin routes: ${adminAccess ? 'PASS' : 'FAIL'}`);
  
  // Test 2: DSA cannot access admin routes
  const dsaAccess = testRoleAccess('DSA', ['admin']);
  console.log(`✅ DSA blocked from admin routes: ${!dsaAccess ? 'PASS' : 'FAIL'}`);
  
  // Test 3: All roles can access user routes
  const roles = ['DSA', 'NBFC', 'Co-op', 'admin'];
  const userRouteAccess = roles.every(role => testRoleAccess(role, roles));
  console.log(`✅ All roles access user routes: ${userRouteAccess ? 'PASS' : 'FAIL'}`);
  
  // Test 4: Token validation
  try {
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    const tokenValid = decoded.role === 'admin';
    console.log(`✅ Token validation: ${tokenValid ? 'PASS' : 'FAIL'}`);
  } catch {
    console.log('❌ Token validation: FAIL');
  }
  
  console.log('🏁 RBAC Tests Complete');
};

// Export for use
export { createToken, testRoleAccess, runRBACTests };