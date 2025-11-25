import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/dashboard/header"
import { ProjectDetails } from "@/components/projects/project-details"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch project with all related data
  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      *,
      district:districts(*),
      creator:profiles!projects_created_by_fkey(id, full_name, email, role),
      approver:profiles!projects_approved_by_fkey(id, full_name)
    `)
    .eq("id", id)
    .single()

  if (error || !project) {
    notFound()
  }

  // Fetch sections with trades
  const { data: sections } = await supabase
    .from("project_sections")
    .select(`
      *,
      trades(*)
    `)
    .eq("project_id", id)
    .order("created_at")

  // Fetch progress reports
  const { data: progressReports } = await supabase
    .from("progress_reports")
    .select(`
      *,
      creator:profiles(full_name)
    `)
    .eq("project_id", id)
    .order("report_no", { ascending: false })

  // Fetch documents grouped by type
  const { data: documents } = await supabase
    .from("documents")
    .select(`
      *,
      uploader:profiles(full_name)
    `)
    .eq("project_id", id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen">
      <Header title={project.contract_name} subtitle={`Contract No: ${project.contract_no}`} />
      <div className="p-6">
        <ProjectDetails
          project={project}
          sections={sections || []}
          progressReports={progressReports || []}
          documents={documents || []}
          userRole={profile?.role || "viewer"}
          userId={user.id}
        />
      </div>
    </div>
  )
}
