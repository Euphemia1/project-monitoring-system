import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/dashboard/header"
import { SettingsForm } from "@/components/settings/settings-form"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, district:districts(*)")
    .eq("id", user.id)
    .single()

  const { data: districts } = await supabase.from("districts").select("*").order("name")

  return (
    <div className="min-h-screen">
      <Header title="Settings" subtitle="Manage your account settings" />
      <div className="p-6">
        <SettingsForm profile={profile} districts={districts || []} userEmail={user.email || ""} />
      </div>
    </div>
  )
}
