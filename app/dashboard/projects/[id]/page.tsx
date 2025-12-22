"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { ProjectDetails } from "@/components/projects/project-details"
import type { Project, ProjectSection, Trade, UserRole } from "@/lib/types"

interface PageProps {
  params: { id: string }
}

type ProjectApiResponse = {
  project: Project & {
    district?: { name: string } | null
    creator?: { id: string; full_name: string; email?: string; role?: string } | null
  }
  sections: (ProjectSection & { trades: Trade[] })[]
}

export default function ProjectPage({ params }: PageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<UserRole>('viewer')
  const [userId, setUserId] = useState<string>('')
  const [project, setProject] = useState<ProjectApiResponse['project'] | null>(null)
  const [sections, setSections] = useState<ProjectApiResponse['sections']>([])

  useEffect(() => {
    const load = async () => {
      try {
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('user')
          if (!raw) {
            router.push('/auth/login')
            return
          }

          const user = JSON.parse(raw)
          setUserRole((user?.role || 'viewer') as UserRole)
          setUserId(user?.id?.toString?.() ?? '')
        }

        const res = await fetch(`/api/projects?id=${encodeURIComponent(params.id)}`, {
          credentials: 'include',
          cache: 'no-store'
        })

        if (!res.ok) {
          throw new Error('Failed to load project')
        }

        const data: ProjectApiResponse = await res.json()
        setProject(data.project)
        setSections(data.sections || [])
      } catch (e) {
        console.error('Failed to load project:', e)
        setError(e instanceof Error ? e.message : 'Failed to load project')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [params.id, router])

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E87A1E] border-t-transparent" />
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen p-6">
        <div className="text-red-500">{error || 'Project not found'}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title={project.contract_name} subtitle={`Contract No: ${project.contract_no}`} />
      <div className="p-6">
        <ProjectDetails
          project={project as any}
          sections={sections}
          progressReports={[] as any}
          documents={[] as any}
          userRole={userRole}
          userId={userId}
        />
      </div>
    </div>
  )
}
