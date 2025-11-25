import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/dashboard/header"
import { ProjectsTable } from "@/components/projects/projects-table"
import type { Project, Profile } from "@/lib/types"

export default async function ProjectsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single()

  const { data: projects } = await supabase
    .from("projects")
    .select(`
      *,
      district:districts(id, name, code),
      creator:profiles!projects_created_by_fkey(id, full_name)
    `)
    .order("created_at", { ascending: false })

  const { data: districts } = await supabase.from("districts").select("*").order("name")

  return (
    <div className="min-h-screen">
      <Header title="Projects" subtitle="Manage all construction projects" />
      <div className="p-6">
        <ProjectsTable
          projects={
            (projects || []) as (Project & {
              district: { id: string; name: string; code: string }
              creator: { id: string; full_name: string }
            })[]
          }
          districts={districts || []}
          userRole={profile?.role as Profile["role"]}
        />
      </div>
    </div>
  )
}
