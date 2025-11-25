import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/dashboard/header"
import { DocumentsView } from "@/components/documents/documents-view"
import type { Profile } from "@/lib/types"

export default async function DocumentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single()

  // Fetch all documents with project info
  const { data: documents } = await supabase
    .from("documents")
    .select(`
      *,
      project:projects(id, contract_no, contract_name, district:districts(name)),
      progress_report:progress_reports(id, report_no),
      uploader:profiles(full_name)
    `)
    .order("created_at", { ascending: false })

  // Fetch projects for filtering
  const { data: projects } = await supabase
    .from("projects")
    .select("id, contract_no, contract_name")
    .order("contract_name")

  return (
    <div className="min-h-screen">
      <Header title="Document Management" subtitle="Manage all project documents" />
      <div className="p-6">
        <DocumentsView
          documents={documents || []}
          projects={projects || []}
          userRole={profile?.role as Profile["role"]}
        />
      </div>
    </div>
  )
}
