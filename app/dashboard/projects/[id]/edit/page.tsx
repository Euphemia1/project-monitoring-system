"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { CreateProjectForm } from "@/components/projects/create-project-form"
import type { District, Project, ProjectSection, Trade } from "@/lib/types"

import React from 'react'

interface PageProps {
  params: Promise<{ id: string }>
}

type ProjectApiResponse = {
  project: Project & {
    district?: { id: string; name: string; code: string } | null
    creator?: { id: string; full_name: string; email?: string; role?: string } | null
  }
  sections: (ProjectSection & { trades: Trade[] })[]
}

export default function EditProjectPage({ params }: PageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projectData, setProjectData] = useState<ProjectApiResponse | null>(null)
  const [userRole, setUserRole] = useState<string>('viewer')
  const [districts, setDistricts] = useState<District[]>([])
  
  useEffect(() => {
    const load = async () => {
      try {
        // Get user role from localStorage
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('user')
          if (!raw) {
            router.push('/auth/login')
            return
          }
          const user = JSON.parse(raw)
          setUserRole(user?.role || 'viewer')
        }

        // Get the resolved params
        const resolvedParams = await params;
        
        // Fetch districts
        const districtsRes = await fetch('/api/districts', {
          credentials: 'include',
          cache: 'no-store'
        })
        if (districtsRes.ok) {
          const districtsData = await districtsRes.json()
          setDistricts(districtsData)
        }

        // Fetch project data
        const res = await fetch(`/api/projects?id=${encodeURIComponent(resolvedParams.id)}`, {
          credentials: 'include',
          cache: 'no-store'
        })

        if (!res.ok) {
          throw new Error('Failed to load project')
        }

        const data: ProjectApiResponse = await res.json()
        setProjectData(data)
      } catch (e) {
        console.error('Failed to load project:', e)
        setError(e instanceof Error ? e.message : 'Failed to load project')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [params, router])

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E87A1E] border-t-transparent" />
        </div>
      </div>
    )
  }

  if (error || !projectData) {
    return (
      <div className="min-h-screen p-6">
        <div className="text-red-500">{error || 'Project not found'}</div>
      </div>
    )
  }

  // Check if user has permission to edit this project
  const canEdit = userRole === 'director' || 
                 (userRole === 'project_engineer' && projectData.project.status === 'pending_approval')

  if (!canEdit) {
    return (
      <div className="min-h-screen p-6">
        <div className="text-red-500">You do not have permission to edit this project</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title={`Edit Project: ${projectData.project.contract_name}`} subtitle={`Contract No: ${projectData.project.contract_no}`} />
      <div className="p-6">
        <CreateProjectForm 
          districts={districts}
          initialProjectData={projectData.project}
          initialSectionsData={projectData.sections}
          isEditing={true}
          projectId={projectData.project.id}
        />
      </div>
    </div>
  )
}