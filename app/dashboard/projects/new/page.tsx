"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { CreateProjectForm } from "@/components/projects/create-project-form"

interface District {
  id: string
  name: string
  code: string
}

export default function NewProjectPage() {
  const router = useRouter()
  const [districts, setDistricts] = useState<District[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('viewer')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window === 'undefined') return

        const raw = localStorage.getItem('user')
        if (!raw) {
          router.push('/auth/login')
          return
        }

        const user = JSON.parse(raw)
        const role = user?.role || 'viewer'
        const id = user?.id || null

        setUserRole(role)
        setUserId(id)

        if (role !== 'director' && role !== 'project_engineer' && role !== 'project_manager') {
          router.push('/dashboard/projects')
          return
        }

        const res = await fetch('/api/districts', { credentials: 'include' })
        if (!res.ok) throw new Error('Failed to load districts')
        const data = await res.json()
        setDistricts(data)
      } catch (e) {
        console.error('Failed to initialize NewProjectPage:', e)
        setError(e instanceof Error ? e.message : 'Failed to load page')
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [router])

  return (
    <div className="min-h-screen">
      <Header title="Create New Project" subtitle="Fill in the project details below" />
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E87A1E] border-t-transparent" />
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : !userId ? (
          <div className="text-red-500">You must be logged in to create a project.</div>
        ) : (
         <CreateProjectForm districts={districts} />

        )}
      </div>
    </div>
  )
}
