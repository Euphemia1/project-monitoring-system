-- Row Level Security Policies for Project Monitoring System

-- Enable RLS on all tables
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Districts: Everyone can view
CREATE POLICY "Districts are viewable by everyone" ON districts
  FOR SELECT USING (true);

-- Profiles policies
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Projects policies
CREATE POLICY "Projects are viewable by authenticated users" ON projects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Directors and Project Engineers can create projects" ON projects
  FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) IN ('director', 'project_engineer')
  );

CREATE POLICY "Creators can update their own projects before approval" ON projects
  FOR UPDATE USING (
    created_by = auth.uid() AND status = 'pending_approval'
  );

CREATE POLICY "Directors can approve and update any project" ON projects
  FOR UPDATE USING (
    get_user_role(auth.uid()) = 'director'
  );

-- Project sections policies
CREATE POLICY "Sections are viewable by authenticated users" ON project_sections
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Project creators can manage sections" ON project_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_sections.project_id 
      AND (projects.created_by = auth.uid() OR get_user_role(auth.uid()) = 'director')
    )
  );

-- Trades policies
CREATE POLICY "Trades are viewable by authenticated users" ON trades
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Project creators can manage trades" ON trades
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_sections ps
      JOIN projects p ON p.id = ps.project_id
      WHERE ps.id = trades.section_id 
      AND (p.created_by = auth.uid() OR get_user_role(auth.uid()) = 'director')
    )
  );

-- Progress reports policies
CREATE POLICY "Progress reports are viewable by authenticated users" ON progress_reports
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Project managers can create progress reports" ON progress_reports
  FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) IN ('project_manager', 'director', 'project_engineer')
  );

CREATE POLICY "Creators can update their own progress reports" ON progress_reports
  FOR UPDATE USING (
    created_by = auth.uid() OR get_user_role(auth.uid()) = 'director'
  );

-- Trade progress policies
CREATE POLICY "Trade progress is viewable by authenticated users" ON trade_progress
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage trade progress through reports" ON trade_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM progress_reports pr
      WHERE pr.id = trade_progress.progress_report_id 
      AND (pr.created_by = auth.uid() OR get_user_role(auth.uid()) = 'director')
    )
  );

-- Documents policies
CREATE POLICY "Documents are viewable by authenticated users" ON documents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authorized users can upload documents" ON documents
  FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) IN ('director', 'project_engineer', 'project_manager')
  );

CREATE POLICY "Uploaders can update their own unlocked documents" ON documents
  FOR UPDATE USING (
    uploaded_by = auth.uid() AND is_locked = false
  );

CREATE POLICY "Directors can update any document" ON documents
  FOR UPDATE USING (
    get_user_role(auth.uid()) = 'director'
  );
