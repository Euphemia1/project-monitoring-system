import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/dashboard/header"
import { CreateProgressForm } from "@/components/progress/create-progress-form"

interface PageProps {
  searchParams: Promise<{ project?: string }>
}

export default async function NewProgressPage({ searchParams }: PageProps) {
  const { project: projectId } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single()

  // Only authorized users can create progress reports
  if (!["project_manager", "director", "project_engineer"].includes(profile?.role || "")) {
    redirect("/dashboard/progress")
  }

  // Fetch approved/in_progress projects
  const { data: projects } = await supabase
    .from("projects")
    .select(`
      id, 
      contract_no, 
      contract_name,
      district:districts(name)
    `)
    .in("status", ["approved", "in_progress"])
    .order("contract_name")

  // If project ID is provided, fetch its sections and trades
  let selectedProject = null
  let sections = null
  let latestReportNo = 0

  if (projectId) {
    const { data: projectData } = await supabase
      .from("projects")
      .select(`
        *,
        district:districts(name)
      `)
      .eq("id", projectId)
      .single()

    selectedProject = projectData

    const { data: sectionsData } = await supabase
      .from("project_sections")
      .select(`
        *,
        trades(*)
      `)
      .eq("project_id", projectId)
      .order("created_at")

    sections = sectionsData

    // Get the latest report number for this project
    const { data: latestReport } = await supabase
      .from("progress_reports")
      .select("report_no")
      .eq("project_id", projectId)
      .order("report_no", { ascending: false })
      .limit(1)
      .single()

    latestReportNo = latestReport?.report_no || 0
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
          selectedProject={selectedProject}
          sections={sections || []}
          nextReportNo={latestReportNo + 1}
          userId={user?.id || ""}
        />
      </div>
    </div>
  )
}
