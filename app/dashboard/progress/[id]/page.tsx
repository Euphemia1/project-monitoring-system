import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/dashboard/header"
import { ProgressReportDetails } from "@/components/progress/progress-report-details"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProgressReportPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch the progress report with all related data
  const { data: report, error } = await supabase
    .from("progress_reports")
    .select(`
      *,
      project:projects(
        id, 
        contract_no, 
        contract_name, 
        contract_sum,
        district:districts(name)
      ),
      creator:profiles(full_name, email, role)
    `)
    .eq("id", id)
    .single()

  if (error || !report) {
    notFound()
  }

  // Fetch trade progress with trade details
  const { data: tradeProgress } = await supabase
    .from("trade_progress")
    .select(`
      *,
      trade:trades(
        id,
        trade_name,
        amount,
        section:project_sections(section_name, house_type)
      )
    `)
    .eq("progress_report_id", id)

  // Fetch documents attached to this report
  const { data: documents } = await supabase
    .from("documents")
    .select(`
      *,
      uploader:profiles(full_name)
    `)
    .eq("progress_report_id", id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen">
      <Header title={`Progress Report #${report.report_no}`} subtitle={report.project?.contract_name || ""} />
      <div className="p-6">
        <ProgressReportDetails
          report={report}
          tradeProgress={tradeProgress || []}
          documents={documents || []}
          userRole={profile?.role || "viewer"}
          userId={user.id}
        />
      </div>
    </div>
  )
}
