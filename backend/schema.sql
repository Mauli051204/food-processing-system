-- =========================================================
-- DATABASE: food_processing_db
-- =========================================================
CREATE DATABASE IF NOT EXISTS food_processing_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE food_processing_db;

-- =========================================================
-- ROLES
-- =========================================================
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,  -- ADMIN, VENDOR, PURCHASE, TECH, PRODUCTION
    description VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================================
-- USERS (extends Django auth_user via OneToOne, but kept here for full schema clarity)
-- =========================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,   -- FALSE until admin approves (except admin)
    is_approved BOOLEAN DEFAULT FALSE,
    is_staff BOOLEAN DEFAULT FALSE,
    is_superuser BOOLEAN DEFAULT FALSE,
    last_login DATETIME NULL,
    date_joined DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- =========================================================
-- VENDOR PROFILES
-- =========================================================
CREATE TABLE vendor_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(255) NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by INT NULL,
    approved_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vendorprofile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_vendorprofile_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- VENDOR REQUESTS (vendor registration approval workflow)
-- =========================================================
CREATE TABLE vendor_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    status ENUM('PENDING', 'ACCEPTED', 'REJECTED') DEFAULT 'PENDING',
    reviewed_by INT NULL,
    remarks VARCHAR(255) NULL,
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,
    CONSTRAINT fk_vendorreq_vendor FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_vendorreq_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- UPLOADED FILES (raw CSV/XLSX from vendor)
-- =========================================================
CREATE TABLE uploaded_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type ENUM('CSV', 'XLSX') NOT NULL,
    file_size INT NOT NULL,
    status ENUM('UPLOADED', 'SENT_TO_PURCHASE', 'PROCESSED') DEFAULT 'UPLOADED',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_uploadedfile_vendor FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- MATERIALS (raw, parsed from uploaded file, pending purchase review)
-- =========================================================
CREATE TABLE materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uploaded_file_id INT NOT NULL,
    vendor_id INT NOT NULL,
    material_code VARCHAR(100) NOT NULL,   -- Material ID
    material_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    cost DECIMAL(12,2) NOT NULL,
    supplier VARCHAR(255) NOT NULL,
    expiry_date DATE NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    edited_quantity DECIMAL(12,2) NULL,
    edited_cost DECIMAL(12,2) NULL,
    reviewed_by INT NULL,
    reviewed_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_material_file FOREIGN KEY (uploaded_file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE,
    CONSTRAINT fk_material_vendor FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_material_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- APPROVED MATERIALS (sent to Tech team)
-- =========================================================
CREATE TABLE approved_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    material_id INT NOT NULL,
    final_quantity DECIMAL(12,2) NOT NULL,
    final_cost DECIMAL(12,2) NOT NULL,
    approved_by INT NULL,
    sent_to_tech BOOLEAN DEFAULT FALSE,
    txt_generated BOOLEAN DEFAULT FALSE,
    approved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_approvedmat_material FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    CONSTRAINT fk_approvedmat_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- REJECTED MATERIALS
-- =========================================================
CREATE TABLE rejected_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    material_id INT NOT NULL,
    reason VARCHAR(500) NULL,
    rejected_by INT NULL,
    rejected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rejectedmat_material FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    CONSTRAINT fk_rejectedmat_rejector FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- ENCRYPTED FILES (Tech team output)
-- =========================================================
CREATE TABLE encrypted_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    approved_material_id INT NOT NULL,
    original_csv_path VARCHAR(500) NOT NULL,
    original_txt_path VARCHAR(500) NOT NULL,
    encrypted_txt_path VARCHAR(500) NOT NULL,
    aes_key_id INT NULL,
    generated_by INT NULL,
    status ENUM('ENCRYPTED', 'KEY_REQUESTED', 'KEY_SHARED', 'DECRYPTED', 'DOWNLOADED') DEFAULT 'ENCRYPTED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_encfile_approvedmat FOREIGN KEY (approved_material_id) REFERENCES approved_materials(id) ON DELETE CASCADE,
    CONSTRAINT fk_encfile_generator FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- AES KEYS
-- =========================================================
CREATE TABLE aes_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    encrypted_file_id INT NOT NULL,
    key_value_encrypted TEXT NOT NULL,   -- AES key itself stored encrypted (e.g. wrapped with server secret)
    iv VARCHAR(32) NOT NULL,             -- hex-encoded IV
    generated_by INT NULL,
    sent_to_admin BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_aeskey_encfile FOREIGN KEY (encrypted_file_id) REFERENCES encrypted_files(id) ON DELETE CASCADE,
    CONSTRAINT fk_aeskey_generator FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

ALTER TABLE encrypted_files
    ADD CONSTRAINT fk_encfile_aeskey FOREIGN KEY (aes_key_id) REFERENCES aes_keys(id) ON DELETE RESTRICT;

-- =========================================================
-- KEY REQUESTS (Production -> Admin)
-- =========================================================
CREATE TABLE key_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    encrypted_file_id INT NOT NULL,
    requested_by INT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    approved_by INT NULL,
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME NULL,
    CONSTRAINT fk_keyreq_encfile FOREIGN KEY (encrypted_file_id) REFERENCES encrypted_files(id) ON DELETE CASCADE,
    CONSTRAINT fk_keyreq_requester FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_keyreq_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(500) NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- VENDOR_REGISTERED, APPROVAL, UPLOAD, ENCRYPTION, KEY_REQUEST, etc.
    is_read BOOLEAN DEFAULT FALSE,
    related_object_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- AUDIT LOGS
-- =========================================================
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    role VARCHAR(50) NULL,
    action VARCHAR(255) NOT NULL,
    description VARCHAR(500) NULL,
    ip_address VARCHAR(45) NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auditlog_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- DOWNLOAD HISTORY
-- =========================================================
CREATE TABLE download_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    encrypted_file_id INT NOT NULL,
    downloaded_file_path VARCHAR(500) NOT NULL,
    downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_downloadhist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_downloadhist_encfile FOREIGN KEY (encrypted_file_id) REFERENCES encrypted_files(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- ENCRYPTION HISTORY
-- =========================================================
CREATE TABLE encryption_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    encrypted_file_id INT NOT NULL,
    action ENUM('ENCRYPTED', 'DECRYPTED') NOT NULL,
    performed_by INT NULL,
    performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_enchist_encfile FOREIGN KEY (encrypted_file_id) REFERENCES encrypted_files(id) ON DELETE CASCADE,
    CONSTRAINT fk_enchist_user FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- SEED DATA
-- =========================================================
INSERT INTO roles (name, description) VALUES
('ADMIN', 'System Administrator'),
('VENDOR', 'Raw material vendor'),
('PURCHASE', 'Purchase team member'),
('TECH', 'Tech team member'),
('PRODUCTION', 'Production team member');