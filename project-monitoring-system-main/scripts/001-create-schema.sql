-- Project Monitoring System Database Schema
-- For Construction Company in Zambia

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Districts table (10 Zambian districts)
CREATE TABLE districts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(10) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles enum
CREATE TYPE user_role AS ENUM ('director', 'project_engineer', 'project_manager', 'viewer');

-- Users/Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  district_id UUID REFERENCES districts(id),
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_no VARCHAR(50) NOT NULL UNIQUE,
  contract_name VARCHAR(255) NOT NULL,
  district_id UUID NOT NULL REFERENCES districts(id),
  start_date DATE NOT NULL,
  completion_date DATE NOT NULL,
  contract_sum DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_approval',
  created_by UUID NOT NULL REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project sections (trades with amounts)
CREATE TABLE project_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  section_name VARCHAR(100) NOT NULL,
  house_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trades within sections
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES project_sections(id) ON DELETE CASCADE,
  trade_name VARCHAR(100) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress reports
CREATE TABLE progress_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_no INTEGER NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, report_no)
);

-- Trade progress entries
CREATE TABLE trade_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  progress_report_id UUID NOT NULL REFERENCES progress_reports(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES trades(id),
  progress_percentage DECIMAL(5, 2) NOT NULL CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  amount_completed DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document types enum
CREATE TYPE document_type AS ENUM (
  'contract_documentation',
  'bills_of_quantities',
  'drawings',
  'internal_approvals',
  'site_instruction',
  'site_inspection_report',
  'site_meeting_minutes',
  'incoming_correspondence',
  'outgoing_correspondence',
  'interim_payment_certificate',
  'internal_correspondence',
  'progress_report_attachment'
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  progress_report_id UUID REFERENCES progress_reports(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_projects_district ON projects(district_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_progress_reports_project ON progress_reports(project_id);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_reports_updated_at BEFORE UPDATE ON progress_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
