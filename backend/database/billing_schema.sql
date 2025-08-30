-- Billing & Invoicing System Schema
USE saas_base;

-- Invoices table
CREATE TABLE invoices (
    invoice_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    gst_rate DECIMAL(5,2) DEFAULT 18.00,
    gst_amount DECIMAL(10,2) NOT NULL CHECK (gst_amount >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
    payment_terms VARCHAR(100) DEFAULT 'Net 30',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, invoice_date),
    INDEX idx_status (status),
    INDEX idx_invoice_number (invoice_number)
);

-- Invoice line items
CREATE TABLE invoice_items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    line_total DECIMAL(10,2) NOT NULL CHECK (line_total >= 0),
    item_type ENUM('form_submission', 'subscription', 'recharge', 'other') DEFAULT 'other',
    reference_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    INDEX idx_invoice_id (invoice_id)
);

-- Billing periods for recurring invoices
CREATE TABLE billing_periods (
    period_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_forms_basic INT DEFAULT 0,
    total_forms_realtime INT DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    invoice_id INT NULL,
    status ENUM('active', 'billed', 'closed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE SET NULL,
    INDEX idx_user_period (user_id, period_start, period_end),
    INDEX idx_status (status)
);

-- GST configuration
CREATE TABLE gst_config (
    config_id INT PRIMARY KEY AUTO_INCREMENT,
    gst_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    cgst_rate DECIMAL(5,2) NOT NULL DEFAULT 9.00,
    sgst_rate DECIMAL(5,2) NOT NULL DEFAULT 9.00,
    igst_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    effective_from DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default GST rates
INSERT INTO gst_config (gst_rate, cgst_rate, sgst_rate, igst_rate, effective_from) 
VALUES (18.00, 9.00, 9.00, 18.00, '2024-01-01');

-- Company details for invoicing
CREATE TABLE company_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    gstin VARCHAR(15),
    pan VARCHAR(10),
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default company details
INSERT INTO company_details (company_name, address, city, state, pincode, gstin, pan, email, phone) 
VALUES ('SaaS Base Solutions', '123 Business Park', 'Mumbai', 'Maharashtra', '400001', '27ABCDE1234F1Z5', 'ABCDE1234F', 'billing@saasbase.com', '+91-9876543210');