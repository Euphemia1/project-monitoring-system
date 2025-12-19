"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { Building2, FileText, ClipboardList, TrendingUp, Eye, Printer, MapPin, Banknote } from "lucide-react"
import type { District, Project, ProjectSection, Trade, ProgressReport, TradeProgress, UserRole } from "@/lib/types"

interface ReportsViewProps {
  districts: District[]
  projects: (Project & {
    district: District
    creator: { full_name: string }
    sections: (ProjectSection & { trades: Trade[] })[]
  })[]
  progressReports: (ProgressReport & { trade_progress: TradeProgress[] })[]
  documentCounts: { project_id: string; document_type: string }[]
  userRole: UserRole
}

export function ReportsView({ districts, projects, progressReports, documentCounts, userRole }: ReportsViewProps) {
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all")
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  const filteredProjects = projects.filter((p) => selectedDistrict === "all" || p.district_id === selectedDistrict)

  // Calculate project statistics
  const projectStats = useMemo(() => {
    return filteredProjects.map((project) => {
      const projectReports = progressReports.filter((r) => r.project_id === project.id)
      const latestReport = projectReports[0]

      // Calculate total contract sum and completed amount
      let totalCompleted = 0
      if (latestReport?.trade_progress) {
        totalCompleted = latestReport.trade_progress.reduce((sum, tp) => sum + Number(tp.amount_completed), 0)
      }

      const progressPercentage = project.contract_sum > 0 ? (totalCompleted / project.contract_sum) * 100 : 0

      // Document counts for this project
      const projectDocs = documentCounts.filter((d) => d.project_id === project.id)
      const docsByType = projectDocs.reduce(
        (acc, d) => {
          acc[d.document_type] = (acc[d.document_type] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      return {
        ...project,
        reportsCount: projectReports.length,
        progressPercentage,
        totalCompleted,
        documentsCount: projectDocs.length,
        docsByType,
      }
    })
  }, [filteredProjects, progressReports, documentCounts])

  // District summary
  const districtSummary = useMemo(() => {
    return districts
      .map((district) => {
        const districtProjects = projectStats.filter((p) => p.district_id === district.id)
        const totalContractSum = districtProjects.reduce((sum, p) => sum + Number(p.contract_sum), 0)
        const totalCompleted = districtProjects.reduce((sum, p) => sum + p.totalCompleted, 0)
        const avgProgress =
          districtProjects.length > 0
            ? districtProjects.reduce((sum, p) => sum + p.progressPercentage, 0) / districtProjects.length
            : 0

        return {
          ...district,
          projectCount: districtProjects.length,
          totalContractSum,
          totalCompleted,
          avgProgress,
        }
      })
      .filter((d) => d.projectCount > 0)
  }, [districts, projectStats])

  // Overall statistics
  const overallStats = useMemo(() => {
    const totalProjects = filteredProjects.length
    const totalContractSum = filteredProjects.reduce((sum, p) => sum + Number(p.contract_sum), 0)
    const totalCompleted = projectStats.reduce((sum, p) => sum + p.totalCompleted, 0)
    const avgProgress =
      totalProjects > 0 ? projectStats.reduce((sum, p) => sum + p.progressPercentage, 0) / totalProjects : 0
    const totalDocuments = documentCounts.filter((d) => filteredProjects.some((p) => p.id === d.project_id)).length
    const totalReports = progressReports.filter((r) => filteredProjects.some((p) => p.id === r.project_id)).length

    return {
      totalProjects,
      totalContractSum,
      totalCompleted,
      avgProgress,
      totalDocuments,
      totalReports,
    }
  }, [filteredProjects, projectStats, documentCounts, progressReports])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZM", {
      style: "currency",
      currency: "ZMW",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-ZM", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

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

  const selectedProjectData = selectedProject ? projectStats.find((p) => p.id === selectedProject) : null

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select District" />
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
              </div>
            </div>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#E87A1E]/10">
                <Building2 className="h-6 w-6 text-[#E87A1E]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold text-foreground">{overallStats.totalProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Banknote className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Contract Value</p>
                <p className="text-xl font-bold text-foreground font-mono">
                  {formatCurrency(overallStats.totalContractSum)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Progress</p>
                <p className="text-2xl font-bold text-foreground">{overallStats.avgProgress.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold text-foreground">{overallStats.totalDocuments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="summary">Project Summary</TabsTrigger>
          <TabsTrigger value="district">By District</TabsTrigger>
          <TabsTrigger value="progress">Progress Reports</TabsTrigger>
          <TabsTrigger value="documents">Document Index</TabsTrigger>
        </TabsList>

        {/* Project Summary Tab */}
        <TabsContent value="summary">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Project Summary Report</CardTitle>
              <CardDescription>
                Overview of all projects{" "}
                {selectedDistrict !== "all" && `in ${districts.find((d) => d.id === selectedDistrict)?.name}`}
              </CardDescription>
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
                      <TableHead className="font-semibold text-center">Progress</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectStats.map((project) => (
                      <TableRow key={project.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{project.contract_no}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{project.contract_name}</TableCell>
                        <TableCell>{project.district?.name}</TableCell>
                        <TableCell>{formatDate(project.start_date)}</TableCell>
                        <TableCell>{formatDate(project.completion_date)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(Number(project.contract_sum))}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={project.progressPercentage} className="h-2 w-16" />
                            <span className="text-sm font-mono w-12">{project.progressPercentage.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusBadge(project.status)}>
                            {project.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Link href={`/dashboard/projects/${project.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* District Summary Tab */}
        <TabsContent value="district">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">District Summary Report</CardTitle>
              <CardDescription>Projects and progress by district</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {districtSummary.map((district) => (
                  <Card key={district.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-foreground text-lg">{district.name}</h4>
                          <p className="text-sm text-muted-foreground">{district.code}</p>
                        </div>
                        <Badge variant="outline" className="bg-[#E87A1E]/10 text-[#E87A1E] border-[#E87A1E]/20">
                          {district.projectCount} Projects
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Contract Value</span>
                          <span className="font-mono font-medium text-foreground">
                            {formatCurrency(district.totalContractSum)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Amount Completed</span>
                          <span className="font-mono font-medium text-emerald-600">
                            {formatCurrency(district.totalCompleted)}
                          </span>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Average Progress</span>
                            <span className="font-medium text-foreground">{district.avgProgress.toFixed(1)}%</span>
                          </div>
                          <Progress value={district.avgProgress} className="h-2" />
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4 bg-transparent"
                        onClick={() => setSelectedDistrict(district.id)}
                      >
                        View District Projects
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {districtSummary.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="mx-auto h-12 w-12 mb-3 opacity-20" />
                  <p>No projects found in any district</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Reports Tab */}
        <TabsContent value="progress">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Progress Reports Index</CardTitle>
              <CardDescription>All progress reports across projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Report #</TableHead>
                      <TableHead className="font-semibold">Project</TableHead>
                      <TableHead className="font-semibold">District</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {progressReports
                      .filter((r) => filteredProjects.some((p) => p.id === r.project_id))
                      .map((report) => {
                        const project = projects.find((p) => p.id === report.project_id)
                        return (
                          <TableRow key={report.id} className="hover:bg-muted/30">
                            <TableCell>
                              <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                #{report.report_no}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-foreground">{project?.contract_name}</p>
                                <p className="text-sm text-muted-foreground">{project?.contract_no}</p>
                              </div>
                            </TableCell>
                            <TableCell>{project?.district?.name}</TableCell>
                            <TableCell>{formatDate(report.report_date)}</TableCell>
                            <TableCell className="text-center">
                              <Link href={`/dashboard/progress/${report.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4 mr-1" /> View
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </div>

              {progressReports.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="mx-auto h-12 w-12 mb-3 opacity-20" />
                  <p>No progress reports available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Index Tab */}
        <TabsContent value="documents">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Document Index</CardTitle>
              <CardDescription>Summary of documents by project and type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Project</TableHead>
                      <TableHead className="font-semibold text-center">Contract Docs</TableHead>
                      <TableHead className="font-semibold text-center">Site Docs</TableHead>
                      <TableHead className="font-semibold text-center">Correspondence</TableHead>
                      <TableHead className="font-semibold text-center">IPCs</TableHead>
                      <TableHead className="font-semibold text-center">Total</TableHead>
                      <TableHead className="font-semibold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectStats.map((project) => {
                      const contractDocs =
                        (project.docsByType.contract_documentation || 0) +
                        (project.docsByType.bills_of_quantities || 0) +
                        (project.docsByType.drawings || 0) +
                        (project.docsByType.internal_approvals || 0)
                      const siteDocs =
                        (project.docsByType.site_instruction || 0) +
                        (project.docsByType.site_inspection_report || 0) +
                        (project.docsByType.site_meeting_minutes || 0)
                      const correspondence =
                        (project.docsByType.incoming_correspondence || 0) +
                        (project.docsByType.outgoing_correspondence || 0) +
                        (project.docsByType.internal_correspondence || 0)
                      const ipcs = project.docsByType.interim_payment_certificate || 0

                      return (
                        <TableRow key={project.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{project.contract_name}</p>
                              <p className="text-sm text-muted-foreground">{project.contract_no}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{contractDocs || "-"}</TableCell>
                          <TableCell className="text-center">{siteDocs || "-"}</TableCell>
                          <TableCell className="text-center">{correspondence || "-"}</TableCell>
                          <TableCell className="text-center">{ipcs || "-"}</TableCell>
                          <TableCell className="text-center font-semibold">{project.documentsCount}</TableCell>
                          <TableCell className="text-center">
                            <Link href={`/dashboard/projects/${project.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
