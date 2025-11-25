import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/dashboard/header"
import { CreateProjectForm } from "@/components/projects/create-project-form"

export default async function NewProjectPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single()

  // Only directors and project engineers can create projects
  if (profile?.role !== "director" && profile?.role !== "project_engineer") {
    redirect("/dashboard/projects")
  }

  const { data: districts } = await supabase.from("districts").select("*").order("name")

  return (
    <div className="min-h-screen">
      <Header title="Create New Project" subtitle="Fill in the project details below" />
      <div className="p-6">
        <CreateProjectForm districts={districts || []} userId={user?.id || ""} />
      </div>
    </div>
  )
}
