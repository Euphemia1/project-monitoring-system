"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"

interface Profile {
  id: string
  name: string
  email: string
  role: string
  district_id?: number
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/auth/login')
      return
    }

    try {
      const userData = JSON.parse(user)
      setProfile(userData)
    } catch (error) {
      console.error('Error parsing user data:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  if (loading || !profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E87A1E] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar profile={profile} />
      <main className="lg:pl-64 transition-all duration-300">{children}</main>
    </div>
  )
}