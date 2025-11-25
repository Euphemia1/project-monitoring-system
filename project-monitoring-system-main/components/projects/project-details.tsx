"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
} from "lucide-react"
import Link from "next/link"
import type { Project, ProjectSection, ProgressReport, Document, Trade, UserRole } from "@/lib/types"

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

  const canApprove = userRole === "director" && project.status === "pending_approval"
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
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("projects")
        .update({
          status: "approved",
          approved_by: userId,
          approved_at: new Date().toISOString(),
        })
        .eq("id", project.id)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Failed to approve project:", error)
    } finally {
      setIsApproving(false)
    }
  }

  const calculateTotalProgress = () => {
    // This would calculate based on all trade progress across all reports
    // For now, return a placeholder
    return 0
  }

  const statusInfo = getStatusBadge(project.status)

  const groupedDocuments = documents.reduce(
    (acc, doc) => {
      if (!acc[doc.document_type]) {
        acc[doc.document_type] = []
      }
      acc[doc.document_type].push(doc)
      return acc
    },
    {} as Record<string, typeof documents>,
  )

  return (
    <div className="space-y-6">
      {/* Project Overview Card */}
      <Card className="border-border">
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">District</p>
                    <p className="font-medium text-foreground">{project.district?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium text-foreground">{formatDate(project.start_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completion</p>
                    <p className="font-medium text-foreground">{formatDate(project.completion_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created By</p>
                    <p className="font-medium text-foreground">{project.creator?.full_name}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Contract Sum</p>
                <p className="text-3xl font-bold text-[#E87A1E] font-mono">{formatCurrency(project.contract_sum)}</p>
              </div>

              <div className="flex gap-2">
                {canApprove && (
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Project
                      </>
                    )}
                  </Button>
                )}
                {canAddProgress && (
                  <Link href={`/dashboard/progress/new?project=${project.id}`}>
                    <Button className="bg-[#E87A1E] text-white hover:bg-[#D16A0E]">
                      <Plus className="mr-2 h-4 w-4" /> Add Progress
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="sections" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="sections">Sections & Trades</TabsTrigger>
          <TabsTrigger value="progress">Progress Reports ({progressReports.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
        </TabsList>

        {/* Sections & Trades Tab */}
        <TabsContent value="sections" className="space-y-4">
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
                  {Object.entries(groupedDocuments).map(([type, docs]) => (
                    <div key={type}>
                      <h4 className="mb-3 text-sm font-semibold text-foreground capitalize">
                        {type.replace(/_/g, " ")}
                      </h4>
                      <div className="space-y-2">
                        {docs.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50"
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
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4 mr-1" /> Download
                              </Button>
                            </a>
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
