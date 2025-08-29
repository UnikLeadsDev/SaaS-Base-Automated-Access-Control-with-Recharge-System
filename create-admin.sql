-- Create admin user
INSERT INTO users (name, email, password, role, status) 
VALUES ('Admin User', 'admin@saasbase.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active');

-- Password is 'password' (hashed with bcrypt)
-- You should change this after first login