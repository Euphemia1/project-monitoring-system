import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/dashboard/header"
import { UploadDocumentForm } from "@/components/documents/upload-document-form"

interface PageProps {
  searchParams: Promise<{ project?: string; report?: string }>
}

export default async function UploadDocumentPage({ searchParams }: PageProps) {
  const { project: projectId, report: reportId } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single()

  // Only authorized users can upload
  if (!["project_manager", "director", "project_engineer"].includes(profile?.role || "")) {
    redirect("/dashboard/documents")
  }

  // Fetch projects
  const { data: projects } = await supabase
    .from("projects")
    .select("id, contract_no, contract_name, district:districts(name)")
    .order("contract_name")

  // Fetch progress reports if project is selected
  let progressReports = null
  if (projectId) {
    const { data } = await supabase
      .from("progress_reports")
      .select("id, report_no, report_date")
      .eq("project_id", projectId)
      .order("report_no", { ascending: false })
    progressReports = data
  }

  return (
    <div className="min-h-screen">
      <Header title="Upload Document" subtitle="Add a new document to a project" />
      <div className="p-6">
        <UploadDocumentForm
          projects={projects || []}
          progressReports={progressReports || []}
          selectedProjectId={projectId || ""}
          selectedReportId={reportId || ""}
          userId={user?.id || ""}
        />
      </div>
    </div>
  )
}
