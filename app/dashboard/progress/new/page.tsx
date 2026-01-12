import { redirect } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { CreateProgressForm } from "@/components/progress/create-progress-form"
import { getCurrentUser } from "@/lib/user"
import { query } from "@/lib/db"

interface PageProps {
  searchParams: Promise<{ project?: string }>
}

export default async function NewProgressPage({ searchParams }: PageProps) {
  const { project: projectId } = await searchParams
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Only authorized users can create progress reports
  if (!["project_manager", "director", "project_engineer"].includes(user.role || "")) {
    redirect("/dashboard/progress")
  }

  // Fetch approved/in_progress projects
  const projectValues: any[] = []
  let projectsSql = `
    SELECT p.id, p.contract_no, p.contract_name, d.name AS district_name
    FROM projects p
    LEFT JOIN districts d ON d.id = p.district_id
    WHERE p.status IN ('approved','in_progress')
  `

  if (user.role !== "director") {
    projectsSql += ` AND EXISTS (SELECT 1 FROM project_assignments pa WHERE pa.project_id = p.id AND pa.user_id = ?) `
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

  // If project ID is provided, fetch its sections and trades
  let selectedProject = null
  let sections = null
  let latestReportNo = 0

  if (projectId) {
    const projectRows: any[] = await query(
      `
      SELECT p.id, p.contract_no, p.contract_name, p.contract_sum, p.status,
             d.name AS district_name
      FROM projects p
      LEFT JOIN districts d ON d.id = p.district_id
      WHERE p.id = ?
      LIMIT 1
      `,
      [projectId],
    )

    selectedProject = projectRows.length
      ? {
          id: String(projectRows[0].id),
          contract_no: projectRows[0].contract_no,
          contract_name: projectRows[0].contract_name,
          contract_sum: Number(projectRows[0].contract_sum || 0),
          status: projectRows[0].status,
          district: projectRows[0].district_name ? { name: projectRows[0].district_name } : null,
        }
      : null

    const sectionRows: any[] = await query(
      `
      SELECT ps.id, ps.project_id, ps.section_name, ps.house_type, ps.created_at
      FROM project_sections ps
      WHERE ps.project_id = ?
      ORDER BY ps.created_at ASC
      `,
      [projectId],
    )

    const tradeRows: any[] = sectionRows.length
      ? await query(
          `
          SELECT t.id, t.section_id, t.trade_name, t.amount, t.created_at
          FROM trades t
          WHERE t.section_id IN (${sectionRows.map(() => "?").join(",")})
          `,
          sectionRows.map((s: any) => s.id),
        )
      : ([] as any[])

    sections = sectionRows.map((s: any) => ({
      id: String(s.id),
      project_id: String(s.project_id),
      section_name: s.section_name,
      house_type: s.house_type,
      created_at: s.created_at,
      trades: (tradeRows as any[])
        .filter((t: any) => String(t.section_id) === String(s.id))
        .map((t: any) => ({
          id: String(t.id),
          section_id: String(t.section_id),
          trade_name: t.trade_name,
          amount: Number(t.amount),
          created_at: t.created_at,
        })),
    }))

    const latestRows: any[] = await query(
      `
      SELECT report_no
      FROM progress_reports
      WHERE project_id = ?
      ORDER BY report_no DESC
      LIMIT 1
      `,
      [projectId],
    )

    latestReportNo = latestRows.length ? Number(latestRows[0].report_no) : 0
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Create Progress Report"
        subtitle={selectedProject ? `For: ${selectedProject.contract_name}` : "Select a project to add progress"}
      />
      <div className="p-6">
        <CreateProgressForm
          projects={projects || []}
          selectedProject={selectedProject as any}
          sections={sections || []}
          nextReportNo={latestReportNo + 1}
          userId={user.id?.toString?.() || ""}
        />
      </div>
    </div>
  )
}
