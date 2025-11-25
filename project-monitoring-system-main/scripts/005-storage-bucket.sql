-- Create storage bucket for project documents
-- Note: This creates the bucket configuration - actual bucket creation happens in Supabase dashboard

-- Storage policies for the project-documents bucket
-- These should be applied after creating the bucket in Supabase dashboard

-- Policy: Authenticated users can view documents
-- CREATE POLICY "Authenticated users can view documents"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'project-documents' AND auth.role() = 'authenticated');

-- Policy: Authorized users can upload documents
-- CREATE POLICY "Authorized users can upload documents"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'project-documents' 
--   AND auth.role() = 'authenticated'
--   AND (
--     EXISTS (
--       SELECT 1 FROM profiles 
--       WHERE id = auth.uid() 
--       AND role IN ('director', 'project_engineer', 'project_manager')
--     )
--   )
-- );

-- For now, we'll use public URLs since file storage is simulated
-- In production, you would configure actual Supabase Storage buckets
