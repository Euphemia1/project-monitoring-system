import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/user';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get total projects count
    const totalProjectsResult = await query('SELECT COUNT(*) as count FROM projects');
    const totalProjects = totalProjectsResult[0]?.count || 0;

    // Get pending projects count - only for non-directors
    let pendingProjects = 0;
    if (user.role !== 'director') {
      const pendingProjectsResult = await query('SELECT COUNT(*) as count FROM projects WHERE status = ?', ['pending_approval']);
      pendingProjects = pendingProjectsResult[0]?.count || 0;
    }
    // For directors, we don't show pending as a separate category, so it remains 0

    // Get active projects count
    const activeProjectsResult = await query('SELECT COUNT(*) as count FROM projects WHERE status = ?', ['in_progress']);
    const activeProjects = activeProjectsResult[0]?.count || 0;

    // Get total documents count
    const totalDocumentsResult = await query('SELECT COUNT(*) as count FROM documents');
    const totalDocuments = totalDocumentsResult[0]?.count || 0;

    // Get recent projects - filter based on user role
    let recentProjectsQuery = `SELECT p.*, d.name as district_name, u.name as creator_name 
       FROM projects p 
       LEFT JOIN districts d ON p.district_id = d.id 
       LEFT JOIN users u ON p.created_by = u.id `
    
    // Directors see all projects, others see only their district projects
    if (user.role !== 'director') {
      recentProjectsQuery += ` WHERE p.district_id = ? `
    }
    
    recentProjectsQuery += ` ORDER BY p.created_at DESC LIMIT 5`
    
    const recentProjectsResult = await query(
      recentProjectsQuery,
      user.role !== 'director' && user.district_id ? [user.district_id] : []
    );

    const recentProjects = recentProjectsResult.map(project => ({
      id: project.id.toString(),
      contract_no: project.contract_no,
      contract_name: project.contract_name,
      status: project.status,
      start_date: project.start_date,
      completion_date: project.completion_date,
      contract_sum: Number(project.contract_sum),
      created_at: project.created_at,
      district_name: project.district_name,
      creator_name: project.creator_name
    }));

    // Get recent reports - filter based on user role
    let recentReportsQuery = `SELECT pr.*, p.contract_name as project_contract_name, u.name as creator_name 
       FROM progress_reports pr 
       LEFT JOIN projects p ON pr.project_id = p.id 
       LEFT JOIN users u ON pr.created_by = u.id 
       LEFT JOIN projects proj ON pr.project_id = proj.id `
    
    // Directors see all reports, others see only reports from their district
    if (user.role !== 'director') {
      recentReportsQuery += ` WHERE proj.district_id = ? `
    }
    
    recentReportsQuery += ` ORDER BY pr.created_at DESC LIMIT 5`
    
    const recentReportsResult = await query(
      recentReportsQuery,
      user.role !== 'director' && user.district_id ? [user.district_id] : []
    );

    const recentReports = recentReportsResult.map(report => ({
      id: report.id.toString(),
      project_id: report.project_id,
      report_no: report.report_no,
      report_date: report.report_date,
      description: report.description,
      created_at: report.created_at,
      status: report.status,
      project_contract_name: report.project_contract_name,
      creator_name: report.creator_name
    }));

    return NextResponse.json({
      totalProjects,
      pendingProjects,
      activeProjects,
      totalDocuments,
      recentProjects,
      recentReports
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}

