import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/dashboard/header"
import { ReportsView } from "@/components/reports/reports-view"

export default async function ReportsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single()

  // Fetch districts
  const { data: districts } = await supabase.from("districts").select("*").order("name")

  // Fetch all projects with progress data
  const { data: projects } = await supabase
    .from("projects")
    .select(`
      *,
      district:districts(id, name, code),
      creator:profiles(full_name),
      sections:project_sections(
        *,
        trades(*)
      )
    `)
    .order("created_at", { ascending: false })

  // Fetch progress data for calculating overall progress
  const { data: progressReports } = await supabase
    .from("progress_reports")
    .select(`
      *,
      trade_progress(*)
    `)
    .order("report_no", { ascending: false })

  // Fetch document counts per project
  const { data: documentCounts } = await supabase.from("documents").select("project_id, document_type")

  return (
    <div className="min-h-screen">
      <Header title="Reports" subtitle="View comprehensive project reports and analytics" />
      <div className="p-6">
        <ReportsView
          districts={districts || []}
          projects={projects || []}
          progressReports={progressReports || []}
          documentCounts={documentCounts || []}
          userRole={profile?.role || "viewer"}
        />
      </div>
    </div>
  )
}
