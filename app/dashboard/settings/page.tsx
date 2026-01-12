import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/user"
import { query } from "@/lib/db"
import { Header } from "@/components/dashboard/header"
import { SettingsForm } from "@/components/settings/settings-form"

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile with district information
  const profileResult = await query(
    `SELECT u.id, u.email, u.name, u.role, u.district_id, u.phone, u.created_at, u.updated_at,
            d.id as district_id, d.name as district_name, d.code as district_code
     FROM users u
     LEFT JOIN districts d ON u.district_id = d.id
     WHERE u.id = ?`,
    [user.id]
  )

  const profile = profileResult.length > 0 ? {
    ...profileResult[0],
    full_name: profileResult[0].name,
    district: profileResult[0].district_id ? {
      id: profileResult[0].district_id.toString(),
      name: profileResult[0].district_name,
      code: profileResult[0].district_code,
      created_at: new Date().toISOString()
    } : null
  } : null

  // Get all districts
  const districtsResult = await query(
    `SELECT id, name, code, created_at FROM districts ORDER BY name`
  )

  const districts = districtsResult.map(d => ({
    id: d.id.toString(),
    name: d.name,
    code: d.code,
    created_at: d.created_at
  }))

  return (
    <div className="min-h-screen">
      <Header title="Settings" subtitle="Manage your account settings" />
      <div className="p-6">
        <SettingsForm profile={profile} districts={districts || []} userEmail={user.email || ""} />
      </div>
    </div>
  )
}
