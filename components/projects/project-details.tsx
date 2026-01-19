"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Calendar,
  MapPin,
  User,
  CheckCircle,
  Clock,
  FileText,
  ClipboardList,
  Plus,
  Eye,
  Download,
  Loader2,
  AlertTriangle,
  Pencil,
  X,
  PieChart as PieChartIcon,
} from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import Link from "next/link"
import type { Project, ProjectSection, ProgressReport, Document, Trade, UserRole } from "@/lib/types"

const COLORS = ["#E87A1E", "#3b82f6", "#10b981", "#8b5cf6", "#f43f5e", "#f59e0b", "#06b6d4"]

interface ProjectDetailsProps {
  project: Project & {
    district: { name: string }
    creator: { id: string; full_name: string; email: string; role: string }
    approver?: { id: string; full_name: string } | null
  }
  sections: (ProjectSection & { trades: Trade[] })[]
  progressReports: (ProgressReport & { creator: { full_name: string } })[]
  documents: (Document & { uploader: { full_name: string } })[]
  userRole: UserRole
  userId: string
}

export function ProjectDetails({
  project,
  sections,
  progressReports,
  documents,
  userRole,
  userId,
}: ProjectDetailsProps) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showEFiling, setShowEFiling] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const canApprove = userRole === "director" && project.status === "pending_approval"
  const canChangeStatus = userRole === "director"
  const canEditProject = userRole === "director" ||
    (userRole === "project_engineer" && project.status === "pending_approval")
  const canAddProgress =
    (userRole === "project_manager" || userRole === "director" || userRole === "project_engineer") &&
    project.status !== "pending_approval"

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZM", {
      style: "currency",
      currency: "ZMW",
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-ZM", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, { bg: string; icon: React.ReactNode }> = {
      pending_approval: { bg: "bg-amber-100 text-amber-800 border-amber-200", icon: <Clock className="h-3 w-3" /> },
      approved: { bg: "bg-blue-100 text-blue-800 border-blue-200", icon: <CheckCircle className="h-3 w-3" /> },
      in_progress: {
        bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: <ClipboardList className="h-3 w-3" />,
      },
      completed: { bg: "bg-gray-100 text-gray-800 border-gray-200", icon: <CheckCircle className="h-3 w-3" /> },
      on_hold: { bg: "bg-red-100 text-red-800 border-red-200", icon: <AlertTriangle className="h-3 w-3" /> },
    }
    return statusStyles[status] || statusStyles.pending_approval
  }

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      const res = await fetch(`/api/projects?id=${encodeURIComponent(project.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'approved' })
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to approve project')
      }

      router.refresh()
    } catch (error) {
      console.error("Failed to approve project:", error)
      window.alert(error instanceof Error ? error.message : 'Failed to approve project')
    } finally {
      setIsApproving(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === project.status) return;

    const ok = window.confirm(`Change project status to ${newStatus.replace('_', ' ')}?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/projects?id=${encodeURIComponent(project.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update project status');
      }

      // Update the page without full refresh to show real-time changes
      window.location.reload();
    } catch (error) {
      console.error("Failed to update project status:", error);
      window.alert(error instanceof Error ? error.message : 'Failed to update project status');
    }
  }

  const calculateTotalProgress = () => {
    // This would calculate based on all trade progress across all reports
    // For now, return a placeholder
    return 0
  }

  const statusInfo = getStatusBadge(project.status)

  const EFILING_GROUPS: {
    key: string
    label: string
    children?: { key: string; label: string; types: string[] }[]
    types?: string[]
  }[] = [
      { key: "precontract", label: "Precontract documents", types: ["precontract_document"] },
      {
        key: "contract",
        label: "Contract Document",
        children: [
          { key: "contract-record", label: "Contract Record details", types: ["contract_record_details"] },
          { key: "contract-docs", label: "Contract documents", types: ["contract_documentation", "contract_document", "contract_documents"] },
        ],
      },
      {
        key: "correspondence",
        label: "Correspondence",
        children: [
          { key: "incoming", label: "Incoming", types: ["incoming_correspondence", "incoming_correspondence_main"] },
          { key: "outgoing", label: "Outgoing", types: ["outgoing_correspondence", "outgoing_correspondence_main"] },
          { key: "internal", label: "Internal memos", types: ["internal_memos", "internal_correspondence"] },
        ],
      },
      {
        key: "interim",
        label: "Interim Payment files",
        children: [
          { key: "remeasurements", label: "Remeasurements", types: ["remeasurements", "remeasurements_main", "remeasurement_main"] },
          { key: "interim-valuations", label: "Interim Valuations & Certificate", types: ["interim_payment_certificate", "interim_valuations_certificate", "interim_valuations_certificate_main"] },
        ],
      },
      {
        key: "site-meetings",
        label: "Site Meetings",
        children: [
          { key: "contractors-reports", label: "Contractors Reports", types: ["contractors_reports", "contractors_reports_main"] },
          { key: "site-minutes", label: "Site Meeting Minutes", types: ["site_meeting_minutes", "site_meeting_minutes_main"] },
        ],
      },
      {
        key: "variation",
        label: "Variation Account",
        children: [{ key: "measurement-variations", label: "Measurement of variations", types: ["variation_measurement", "measurement_of_variations"] }],
      },
      {
        key: "final-account",
        label: "Final Account Records",
        children: [{ key: "final-remeasure", label: "Remeasurement", types: ["final_account_remeasurement"] }],
      },
      {
        key: "contract-admin",
        label: "Contract Administration",
        children: [{ key: "delays", label: "Delays & Disruptions records", types: ["delays_disruptions_records"] }],
      },
      { key: "reports", label: "Reports", types: ["all_reports", "progress_report_attachment", "other_report"] },
      { key: "howto", label: "How to use the Filling system", types: ["how_to_use_filling_system"] },
    ]

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("en-ZM", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderEFilingLeaf = (leaf: { key: string; label: string; types: string[] }) => {
    const leafDocs = documents.filter((d) => leaf.types.includes(d.document_type as any))

    return (
      <details key={leaf.key} className="rounded-lg border border-border">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground">
          {leaf.label} ({leafDocs.length})
        </summary>
        <div className="p-4 pt-2">
          {leafDocs.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>File name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Action response</TableHead>
                    <TableHead className="text-center">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leafDocs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell>{formatDateTime(doc.created_at)}</TableCell>
                      <TableCell className="max-w-[240px] truncate">{doc.description || "-"}</TableCell>
                      <TableCell className="max-w-[160px] truncate">{doc.action_assignee?.name || doc.action_assignee_id || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{doc.action_response || doc.action_status || "-"}</TableCell>
                      <TableCell className="text-center">
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No files</div>
          )}
        </div>
      </details>
    )
  }

  return (
    <div className="space-y-6 print-container">
      <Button
        onClick={() => setShowEFiling(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 rounded-l-lg bg-[#E87A1E] text-white hover:bg-[#D16A0E]"
      >
        <FileText className="mr-2 h-4 w-4" /> eFiling System
      </Button>

      {showEFiling && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowEFiling(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-5xl bg-background shadow-xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border p-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Project Monitoring and Filling System</h2>
                  <p className="text-sm text-muted-foreground">{project.contract_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/documents/upload?project=${project.id}`}>
                    <Button size="sm" className="bg-[#E87A1E] text-white hover:bg-[#D16A0E]">
                      <Plus className="mr-2 h-4 w-4" /> Upload File
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => setShowEFiling(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {EFILING_GROUPS.map((g) => {
                    if (g.children?.length) {
                      return (
                        <details key={g.key} className="rounded-lg border border-border">
                          <summary className="cursor-pointer px-4 py-3 font-semibold text-foreground">{g.label}</summary>
                          <div className="space-y-3 p-4 pt-2">
                            {g.children.map(renderEFilingLeaf)}
                          </div>
                        </details>
                      )
                    }

                    return renderEFilingLeaf({
                      key: g.key,
                      label: g.label,
                      types: g.types || [],
                    })
                  })}

                  <details className="rounded-lg border border-border">
                    <summary className="cursor-pointer px-4 py-3 font-semibold text-foreground">Users</summary>
                    <div className="p-4 pt-2 text-sm text-foreground space-y-2">
                      <div>Admin</div>
                      <div>Project Manager</div>
                      <div>Site Engineers</div>
                      <div className="pt-2 text-muted-foreground">
                        The user will be given access to load file and delete file from the system.
                      </div>
                      <div className="text-muted-foreground">
                        Whenever a new file is loaded the user will be expected to: add a file name, comment, and assign action.
                      </div>
                      <div className="text-muted-foreground">
                        The system should keep record of when the file was loaded, who loaded the file, time and date.
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="print-logo no-print">
        <h1 className="text-2xl font-bold text-center text-[#E87A1E]">Project Monitoring System</h1>
        <p className="text-center text-gray-600">Project Report</p>
      </div>
      {/* Project Overview Card */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={`${statusInfo.bg} flex items-center gap-1`}>
                  {statusInfo.icon}
                  {project.status.replace("_", " ")}
                </Badge>
                {project.is_locked && <Badge variant="secondary">Locked</Badge>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">District</p>
                    <p className="font-medium text-foreground">{project.district?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Start Date</p>
                    <p className="font-medium text-foreground">{formatDate(project.start_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Completion</p>
                    <p className="font-medium text-foreground">{formatDate(project.completion_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Created By</p>
                    <p className="font-medium text-foreground">{project.creator?.full_name}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Contract Sum</p>
                <p className="text-3xl font-bold text-[#E87A1E] font-mono">{formatCurrency(project.contract_sum)}</p>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                {canChangeStatus && (
                  <select
                    value={project.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E87A1E]"
                  >
                    <option value="pending_approval">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                )}
                {canApprove && (
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Approve
                  </Button>
                )}
                {canEditProject && (
                  <Link href={`/dashboard/projects/${project.id}/edit`}>
                    <Button variant="outline" className="border-[#E87A1E] text-[#E87A1E] hover:bg-[#E87A1E]/10">
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </Button>
                  </Link>
                )}
                <div className="relative" ref={exportMenuRef}>
                  <Button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="bg-gray-800 text-white hover:bg-gray-900"
                  >
                    <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden divide-y divide-gray-100">
                      <div className="py-2">
                        <button
                          onClick={() => {
                            window.print();
                            setShowExportMenu(false);
                          }}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                        >
                          <FileText className="h-4 w-4 text-orange-500" />
                          Print Report
                        </button>
                        <button
                          onClick={() => {
                            const data = {
                              project,
                              sections,
                              documents,
                              progressReports,
                              exportedAt: new Date().toISOString()
                            };
                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `project-${project.contract_no}-data.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                            setShowExportMenu(false);
                          }}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                        >
                          <Download className="h-4 w-4 text-blue-500" />
                          Download JSON Package
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-l-4 border-l-[#E87A1E]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Sections</p>
              <h3 className="text-2xl font-bold">{sections.length}</h3>
            </div>
            <div className="p-2 bg-orange-50 rounded-full">
              <ClipboardList className="h-5 w-5 text-[#E87A1E]" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Trades</p>
              <h3 className="text-2xl font-bold">{sections.reduce((acc, s) => acc + s.trades.length, 0)}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-full">
              <CheckCircle className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Progress Reports</p>
              <h3 className="text-2xl font-bold">{progressReports.length}</h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-full">
              <FileText className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-purple-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Documents</p>
              <h3 className="text-2xl font-bold">{documents.length}</h3>
            </div>
            <div className="p-2 bg-purple-50 rounded-full">
              <FileText className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sections" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="sections">Sections & Trades</TabsTrigger>
          <TabsTrigger value="progress">Reports ({progressReports.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
            {[
              ...progressReports.map(r => ({ ...r, timelineType: 'report', date: r.report_date })),
              ...documents.map(d => ({ ...d, timelineType: 'document', date: d.created_at }))
            ]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((item, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    {item.timelineType === 'report' ? (
                      <ClipboardList className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-[#E87A1E]" />
                    )}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[45%] p-4 rounded border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-900">
                        {item.timelineType === 'report' ? `Progress Report #${(item as any).report_no}` : (item as any).title}
                      </div>
                      <time className="font-mono text-xs text-[#E87A1E] font-semibold">{formatDate(item.date)}</time>
                    </div>
                    <div className="text-slate-500 text-sm mb-2">
                      {item.timelineType === 'report' ? (item as any).description : `Uploaded to ${(item as any).document_type?.replace(/_/g, ' ')}`}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                        {item.timelineType === 'report' ? (item as any).creator?.full_name : (item as any).uploader?.full_name}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            {progressReports.length === 0 && documents.length === 0 && (
              <div className="pl-12 py-4 text-muted-foreground text-sm">No timeline activity yet.</div>
            )}
          </div>
        </TabsContent>

        {/* Sections & Trades Tab */}
        <TabsContent value="sections" className="space-y-6">
          {sections.length > 0 ? (
            <>
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Budget Distribution by Section</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sections.map(s => ({
                          name: s.section_name,
                          value: s.trades.reduce((sum, t) => sum + Number(t.amount), 0)
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sections.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
                    {sections.map((s, index) => (
                      <div key={s.id} className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="truncate">{s.section_name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {sections.map((section) => (
                <Card key={section.id} className="border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg text-foreground">{section.section_name}</CardTitle>
                        {section.house_type && <CardDescription>{section.house_type}</CardDescription>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Section Total</p>
                        <p className="text-xl font-bold text-foreground font-mono">
                          {formatCurrency(section.trades.reduce((sum, t) => sum + Number(t.amount), 0))}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Trade</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.trades.map((trade) => (
                          <TableRow key={trade.id}>
                            <TableCell className="font-medium">{trade.trade_name}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(Number(trade.amount))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground">No sections or trades defined for this project.</p>
            </div>
          )}
        </TabsContent>

        {/* Progress Reports Tab */}
        <TabsContent value="progress">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">Progress Reports</CardTitle>
                {canAddProgress && (
                  <Link href={`/dashboard/progress/new?project=${project.id}`}>
                    <Button size="sm" className="bg-[#E87A1E] text-white hover:bg-[#D16A0E]">
                      <Plus className="mr-2 h-4 w-4" /> New Report
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {progressReports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Report No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {progressReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">#{report.report_no}</TableCell>
                        <TableCell>{formatDate(report.report_date)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{report.description || "-"}</TableCell>
                        <TableCell>{report.creator?.full_name}</TableCell>
                        <TableCell className="text-center">
                          <Link href={`/dashboard/progress/${report.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="mx-auto h-12 w-12 mb-3 opacity-20" />
                  <p>No progress reports yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">Project Documents</CardTitle>
                <Link href={`/dashboard/documents/upload?project=${project.id}`}>
                  <Button size="sm" className="bg-[#E87A1E] text-white hover:bg-[#D16A0E]">
                    <Plus className="mr-2 h-4 w-4" /> Upload Document
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(
                    documents.reduce((acc, doc) => {
                      const type = doc.document_type || "other";
                      if (!acc[type]) acc[type] = [];
                      acc[type].push(doc);
                      return acc;
                    }, {} as Record<string, Document[]>)
                  ).map(([type, docs]) => (
                    <div key={type}>
                      <h4 className="mb-3 text-sm font-semibold text-foreground capitalize">
                        {type.replace(/_/g, " ")}
                      </h4>
                      <div className="space-y-2">
                        {docs.map((doc: any) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E87A1E]/10">
                                <FileText className="h-5 w-5 text-[#E87A1E]" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{doc.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {doc.uploader?.full_name} • {formatDate(doc.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" className="text-[#E87A1E] hover:text-[#E87A1E] hover:bg-[#E87A1E]/10">
                                  <Eye className="h-4 w-4 mr-1" /> View
                                </Button>
                              </a>
                              <a href={doc.file_url} download={doc.file_name}>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4 mr-1" /> Download
                                </Button>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-3 opacity-20" />
                  <p>No documents uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
