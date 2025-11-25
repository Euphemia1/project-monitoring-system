import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  FolderKanbanIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  ClockIcon,
  ArrowRightIcon,
  Building2Icon,
} from "@/components/icons"
import type { Project } from "@/lib/types"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single()

  // Fetch statistics
  const { count: totalProjects } = await supabase.from("projects").select("*", { count: "exact", head: true })

  const { count: pendingProjects } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending_approval")

  const { count: activeProjects } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("status", "in_progress")

  const { count: totalDocuments } = await supabase.from("documents").select("*", { count: "exact", head: true })

  // Fetch recent projects
  const { data: recentProjects } = await supabase
    .from("projects")
    .select("*, district:districts(name), creator:profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(5)

  // Fetch recent progress reports
  const { data: recentReports } = await supabase
    .from("progress_reports")
    .select("*, project:projects(contract_name), creator:profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(5)

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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-ZM", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen">
      <Header title={`Welcome, ${profile?.full_name || "User"}`} subtitle="Here's an overview of your projects" />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Projects"
            value={totalProjects || 0}
            icon={<FolderKanbanIcon className="h-6 w-6" />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Pending Approval"
            value={pendingProjects || 0}
            icon={<ClockIcon className="h-6 w-6" />}
            subtitle="Awaiting director review"
          />
          <StatsCard
            title="Active Projects"
            value={activeProjects || 0}
            icon={<ClipboardCheckIcon className="h-6 w-6" />}
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard title="Total Documents" value={totalDocuments || 0} icon={<FileTextIcon className="h-6 w-6" />} />
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Projects */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">Recent Projects</CardTitle>
              <Link href="/dashboard/projects">
                <Button variant="ghost" size="sm" className="text-[#E87A1E]">
                  View All <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentProjects && recentProjects.length > 0 ? (
                recentProjects.map(
                  (project: Project & { district: { name: string }; creator: { full_name: string } }) => (
                    <Link
                      key={project.id}
                      href={`/dashboard/projects/${project.id}`}
                      className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E87A1E]/10">
                        <Building2Icon className="h-5 w-5 text-[#E87A1E]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{project.contract_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {project.contract_no} • {project.district?.name}
                        </p>
                      </div>
                      <Badge variant="outline" className={getStatusBadge(project.status)}>
                        {project.status.replace("_", " ")}
                      </Badge>
                    </Link>
                  ),
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderKanbanIcon className="mx-auto h-12 w-12 mb-3 opacity-20" />
                  <p>No projects yet</p>
                  {(profile?.role === "director" || profile?.role === "project_engineer") && (
                    <Link href="/dashboard/projects/new">
                      <Button className="mt-4 bg-[#E87A1E] text-white hover:bg-[#D16A0E]">Create First Project</Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Progress Reports */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">Recent Progress Reports</CardTitle>
              <Link href="/dashboard/progress">
                <Button variant="ghost" size="sm" className="text-[#E87A1E]">
                  View All <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentReports && recentReports.length > 0 ? (
                recentReports.map(
                  (report: {
                    id: string
                    report_no: number
                    report_date: string
                    project: { contract_name: string }
                    creator: { full_name: string }
                  }) => (
                    <div key={report.id} className="flex items-center gap-4 rounded-lg border border-border p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                        <ClipboardCheckIcon className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">Report #{report.report_no}</p>
                        <p className="text-sm text-muted-foreground truncate">{report.project?.contract_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{formatDate(report.report_date)}</p>
                        <p className="text-xs text-muted-foreground">{report.creator?.full_name}</p>
                      </div>
                    </div>
                  ),
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardCheckIcon className="mx-auto h-12 w-12 mb-3 opacity-20" />
                  <p>No progress reports yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
