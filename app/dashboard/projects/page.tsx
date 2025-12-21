"use server"

import { Header } from "@/components/dashboard/header"
import { ProjectsTable } from "@/components/projects/projects-table"
import { query } from "@/lib/db"

interface Project {
  id: string
  contract_no: string
  contract_name: string
  status: string
  start_date: string
  completion_date: string
  contract_sum: number
  district_id: string
  district: {
    id: string
    name: string
    code: string
  }
  creator: {
    id: string
    full_name: string
  }
}

export default async function ProjectsPage() {
  try {
    // Fetch projects with related data
    const projects = await query(`
      SELECT 
        p.*,
        d.id as district_id,
        d.name as district_name,
        d.code as district_code,
        u.id as creator_id,
        u.name as creator_name
      FROM projects p
      LEFT JOIN districts d ON p.district_id = d.id
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `)

    // Fetch all districts for the filter
    const districts = await query(`
      SELECT * FROM districts ORDER BY name
    `)

    // Transform the data to match the expected format
    const formattedProjects = (Array.isArray(projects) ? projects : []).map(project => ({
      ...project,
      district: {
        id: project.district_id,
        name: project.district_name,
        code: project.district_code
      },
      creator: {
        id: project.creator_id,
        full_name: project.creator_name
      }
    }))

    // Get user role from session
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const userRole = user?.role || 'viewer'

    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Header
          title="Projects"
          description="Manage all construction projects"
        />
        <ProjectsTable 
          projects={formattedProjects} 
          districts={Array.isArray(districts) ? districts : []} 
          userRole={userRole}
        />
      </div>
    )
  } catch (error) {
    console.error('Error loading projects:', error)
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Header
          title="Projects"
          description="Error loading projects"
        />
        <div className="text-red-500">Failed to load projects. Please try again later.</div>
      </div>
    )
  }
}