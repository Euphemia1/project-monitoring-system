-- Project Monitoring System Database Schema for MySQL
-- For Construction Company in Zambia

-- Create database
CREATE DATABASE IF NOT EXISTS project_monitoring;
USE project_monitoring;

-- Districts table (10 Zambian districts)
CREATE TABLE districts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(10) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User roles table
CREATE TABLE user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT
);

-- Users/Profiles table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  district_id INT,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES user_roles(id),
  FOREIGN KEY (district_id) REFERENCES districts(id)
);

-- Projects table
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contract_no VARCHAR(50) NOT NULL UNIQUE,
  contract_name VARCHAR(255) NOT NULL,
  district_id INT NOT NULL,
  start_date DATE NOT NULL,
  completion_date DATE NOT NULL,
  contract_sum DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_approval',
  created_by INT NOT NULL,
  approved_by INT,
  approved_at TIMESTAMP NULL,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (district_id) REFERENCES districts(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Project sections (trades with amounts)
CREATE TABLE project_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  section_name VARCHAR(100) NOT NULL,
  house_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Trades within sections
CREATE TABLE trades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_id INT NOT NULL,
  trade_name VARCHAR(100) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (section_id) REFERENCES project_sections(id) ON DELETE CASCADE
);

-- Progress reports
CREATE TABLE progress_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  report_no INT NOT NULL,
  report_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  description TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_project_report (project_id, report_no),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Trade progress entries
CREATE TABLE trade_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  progress_report_id INT NOT NULL,
  trade_id INT NOT NULL,
  progress_percentage DECIMAL(5, 2) NOT NULL CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  amount_completed DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (progress_report_id) REFERENCES progress_reports(id) ON DELETE CASCADE,
  FOREIGN KEY (trade_id) REFERENCES trades(id)
);

-- Document types table
CREATE TABLE document_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

-- Documents table
CREATE TABLE documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  progress_report_id INT,
  document_type_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INT,
  uploaded_by INT NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (progress_report_id) REFERENCES progress_reports(id) ON DELETE CASCADE,
  FOREIGN KEY (document_type_id) REFERENCES document_types(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Indexes for better performance
CREATE INDEX idx_projects_district ON projects(district_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_progress_reports_project ON progress_reports(project_id);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_type ON documents(document_type_id);
CREATE INDEX idx_users_role ON users(role_id);

-- Insert default roles
INSERT INTO user_roles (name, description) VALUES
  ('director', 'Director with full access'),
  ('project_engineer', 'Project Engineer with project creation and management access'),
  ('project_manager', 'Project Manager with progress reporting access'),
  ('viewer', 'Viewer with read-only access');

-- Insert document types
INSERT INTO document_types (name, description) VALUES
  ('contract_documentation', 'Contract Documentation'),
  ('bills_of_quantities', 'Bills of Quantities'),
  ('drawings', 'Drawings'),
  ('internal_approvals', 'Internal Approvals'),
  ('site_instruction', 'Site Instruction'),
  ('site_inspection_report', 'Site Inspection Report'),
  ('site_meeting_minutes', 'Site Meeting Minutes'),
  ('incoming_correspondence', 'Incoming Correspondence'),
  ('outgoing_correspondence', 'Outgoing Correspondence'),
  ('interim_payment_certificate', 'Interim Payment Certificate'),
  ('internal_correspondence', 'Internal Correspondence'),
  ('progress_report_attachment', 'Progress Report Attachment');

-- Insert districts
INSERT INTO districts (name, code) VALUES
  ('Lusaka', 'LSK'),
  ('Ndola', 'NDL'),
  ('Kitwe', 'KTW'),
  ('Kabwe', 'KBW'),
  ('Chingola', 'CHG'),
  ('Livingstone', 'LVS'),
  ('Mufulira', 'MFL'),
  ('Luanshya', 'LNS'),
  ('Chipata', 'CPT'),
  ('Kasama', 'KSM');