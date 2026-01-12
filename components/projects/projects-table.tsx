"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Plus, Search, Filter, Pencil, Trash2 } from "lucide-react"
import type { Project, District, UserRole } from "@/lib/types"

interface ProjectsTableProps {
  projects: (Project & {
    district: { id: string; name: string; code: string }
    creator: { id: string; full_name: string }
  })[]
  districts: District[]
  userRole: UserRole
  onProjectUpdated?: () => void
}

export function ProjectsTable({ projects, districts, userRole, onProjectUpdated }: ProjectsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)

  const canCreateProject = userRole === "director" || userRole === "project_engineer"
  const canEditProject = userRole === "director" || userRole === "project_engineer" || userRole === "project_manager"
  const canDeleteProject = userRole === "director"
  const canChangeStatus = userRole === "director"

  const handleDelete = async (projectId: string) => {
    const ok = window.confirm('Delete this project? This cannot be undone.')
    if (!ok) return

    try {
      setDeletingProjectId(projectId)
      const res = await fetch(`/api/projects?id=${encodeURIComponent(projectId)}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to delete project')
      }

      onProjectUpdated?.()
    } catch (e) {
      console.error('Delete project failed:', e)
      alert(e instanceof Error ? e.message : 'Failed to delete project')
    } finally {
      setDeletingProjectId(null)
    }
  }

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    if (!projectId || !newStatus) return;
    
    const ok = window.confirm(`Change project status to ${newStatus.replace('_', ' ')}?`);
    if (!ok) return;
    
    try {
      const res = await fetch(`/api/projects?id=${encodeURIComponent(projectId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update project status');
      }

      onProjectUpdated?.();
    } catch (error) {
      console.error("Failed to update project status:", error);
      alert(error instanceof Error ? error.message : 'Failed to update project status');
    }
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.contract_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.contract_no.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDistrict = selectedDistrict === "all" || project.district_id === selectedDistrict
    const matchesStatus = selectedStatus === "all" || project.status === selectedStatus
    return matchesSearch && matchesDistrict && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending_approval: "bg-amber-100 text-amber-800 border-amber-200",
      approved: "bg-blue-100 text-blue-800 border-blue-200",
      in_progress: "bg-emerald-100 text-emerald-800 border-emerald-200",
      completed: "bg-gray-100 text-gray-800 border-gray-200",
      on_hold: "bg-red-100 text-red-800 border-red-200",
    }
    return statusStyles[status] || "bg-gray-100 text-gray-800"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZM", {
      style: "currency",
      currency: "ZMW",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-ZM", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">All Projects</CardTitle>
          {canCreateProject && (
            <Link href="/dashboard/projects/new">
              <Button className="bg-[#E87A1E] text-white hover:bg-[#D16A0E]">
                <Plus className="mr-2 h-4 w-4" /> Create Project
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by contract name or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
              <SelectTrigger className="w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="District" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_approval">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Contract No</TableHead>
                <TableHead className="font-semibold">Contract Name</TableHead>
                <TableHead className="font-semibold">District</TableHead>
                <TableHead className="font-semibold">Start Date</TableHead>
                <TableHead className="font-semibold">Completion</TableHead>
                <TableHead className="font-semibold text-right">Contract Sum</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <TableRow key={project.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{project.contract_no}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{project.contract_name}</TableCell>
                    <TableCell>{project.district?.name}</TableCell>
                    <TableCell>{formatDate(project.start_date)}</TableCell>
                    <TableCell>{formatDate(project.completion_date)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(project.contract_sum)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadge(project.status)}>
                        {project.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/dashboard/projects/${project.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </Link>

                        {canEditProject && (
                          <Link href={`/dashboard/projects/${project.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4 mr-1" /> Edit
                            </Button>
                          </Link>
                        )}

                        {canChangeStatus && (
                          <select
                            value={project.status}
                            onChange={(e) => handleStatusChange(project.id, e.target.value)}
                            className="text-xs px-2 py-1 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#E87A1E]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="pending_approval">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="in_progress">In Progress</option>
                            <option value="on_hold">On Hold</option>
                            <option value="completed">Completed</option>
                          </select>
                        )}

                        {canDeleteProject && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDelete(project.id)}
                            disabled={deletingProjectId === project.id}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {deletingProjectId === project.id ? 'Deleting…' : 'Delete'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No projects found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredProjects.length} of {projects.length} projects
        </div>
      </CardContent>
    </Card>
  )
}
