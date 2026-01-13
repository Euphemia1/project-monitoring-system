import { redirect } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { UploadDocumentForm } from "@/components/documents/upload-document-form"
import { getCurrentUser } from "@/lib/user"
import { query } from "@/lib/db"

interface PageProps {
  searchParams: Promise<{ project?: string; report?: string }>
}

export default async function UploadDocumentPage({ searchParams }: PageProps) {
  const { project: projectId, report: reportId } = await searchParams
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Only authorized users can upload
  if (!["project_manager", "director", "project_engineer"].includes(user.role || "")) {
    redirect("/dashboard/documents")
  }

  const projectValues: any[] = []
  let projectsSql = `
    SELECT p.id, p.contract_no, p.contract_name, d.name AS district_name
    FROM projects p
    LEFT JOIN districts d ON d.id = p.district_id
  `

  if (user.role !== "director") {
    projectsSql += ` INNER JOIN project_assignments pa ON pa.project_id = p.id AND pa.user_id = ? `
    projectValues.push(user.id)
  }

  projectsSql += ` ORDER BY p.contract_name `

  const projectsRows: any[] = await query(projectsSql, projectValues)
  const projects = projectsRows.map((p) => ({
    id: String(p.id),
    contract_no: p.contract_no,
    contract_name: p.contract_name,
    district: p.district_name ? { name: p.district_name } : null,
  }))

  // Fetch progress reports if project is selected
  let progressReports: any[] = []
  if (projectId) {
    progressReports = (await query(
      `
      SELECT id, report_no, report_date
      FROM progress_reports
      WHERE project_id = ?
      ORDER BY report_no DESC
      `,
      [projectId],
    )) as any[]
  }

  // Fetch users for target assignment
  const users: any[] = await query("SELECT id, name, email, role FROM users WHERE is_active = 1 ORDER BY name", [])

  return (
    <div className="min-h-screen">
      <Header title="Upload Document" subtitle="Add a new document to a project" />
      <div className="p-6">
        <UploadDocumentForm
          projects={projects || []}
          progressReports={progressReports || []}
          selectedProjectId={projectId || ""}
          selectedReportId={reportId || ""}
          userId={user.id?.toString?.() || ""}
          users={users || []}
        />
      </div>
    </div>
  )
}
