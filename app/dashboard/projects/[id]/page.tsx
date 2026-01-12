"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { ProjectDetails } from "@/components/projects/project-details"
import type { Project, ProjectSection, Trade, UserRole, Document, ProgressReport, Profile } from "@/lib/types"

import React from 'react'

interface PageProps {
  params: Promise<{ id: string }>
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
  const [documents, setDocuments] = useState<Document[]>([])
  const [progressReports, setProgressReports] = useState<ProgressReport[]>([])

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

        // Get the resolved params
        const resolvedParams = await params;
        
        const res = await fetch(`/api/projects?id=${encodeURIComponent(resolvedParams.id)}`, {
          credentials: 'include',
          cache: 'no-store'
        })

        if (!res.ok) {
          throw new Error('Failed to load project')
        }

        const data: ProjectApiResponse = await res.json()
        setProject(data.project)
        setSections(data.sections || [])

        const makeProfile = (fullName: string, createdAt: string): Profile => ({
          id: "0",
          email: "",
          full_name: fullName,
          role: "viewer",
          district_id: null,
          phone: null,
          created_at: createdAt,
          updated_at: createdAt,
        })

        // Load documents for this project
        const docsRes = await fetch(`/api/documents?project_id=${encodeURIComponent(resolvedParams.id)}`, {
          credentials: 'include',
          cache: 'no-store'
        })
        if (docsRes.ok) {
          const docs = await docsRes.json()
          const mappedDocs = (Array.isArray(docs) ? docs : []).map((d: any) => ({
            id: String(d.id),
            project_id: String(d.project_id),
            progress_report_id: d.progress_report_id ? String(d.progress_report_id) : null,
            document_type: d.document_type,
            title: d.title,
            description: d.description || undefined,
            file_url: d.url,
            file_name: d.file_name,
            file_size: typeof d.size === 'number' ? d.size : null,
            uploaded_by: String(d.uploaded_by),
            action_required: d.action_required || undefined,
            action_assignee_id: d.action_assignee_id ? String(d.action_assignee_id) : undefined,
            action_status: d.action_status || undefined,
            action_response: d.action_response || undefined,
            is_locked: Boolean(d.is_locked),
            created_at: d.uploaded_at,
            uploader: makeProfile(d.uploader_name || 'System', d.uploaded_at),
          }))
          setDocuments(mappedDocs)
        }

        // Load progress reports for this project
        const reportsRes = await fetch(`/api/progress-reports?project_id=${encodeURIComponent(resolvedParams.id)}`, {
          credentials: 'include',
          cache: 'no-store'
        })
        if (reportsRes.ok) {
          const reports = await reportsRes.json()
          const mappedReports = (Array.isArray(reports) ? reports : []).map((r: any) => ({
            id: String(r.id),
            project_id: String(r.project_id),
            report_no: Number(r.report_no),
            report_date: r.report_date,
            description: r.description || null,
            created_by: String(r.created_by),
            created_at: r.created_at,
            updated_at: r.updated_at,
            creator: makeProfile(r.creator?.full_name || "System", r.created_at),
          }))
          setProgressReports(mappedReports)
        }
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
          progressReports={progressReports as any}
          documents={documents as any}
          userRole={userRole}
          userId={userId}
        />
      </div>
    </div>
  )
}
