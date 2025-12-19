import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Plus, Eye, ClipboardList } from "lucide-react"

export default async function ProgressPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single()

  // Fetch all progress reports with project info
  const { data: reports } = await supabase
    .from("progress_reports")
    .select(`
      *,
      project:projects(id, contract_no, contract_name, district:districts(name)),
      creator:profiles(full_name)
    `)
    .order("created_at", { ascending: false })

  // Fetch projects for the dropdown (only approved/in_progress)
  const { data: projects } = await supabase
    .from("projects")
    .select("id, contract_no, contract_name")
    .in("status", ["approved", "in_progress"])
    .order("contract_name")

  const canAddProgress =
    profile?.role === "project_manager" || profile?.role === "director" || profile?.role === "project_engineer"

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-ZM", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen">
      <Header title="Progress Tracking" subtitle="Monitor project progress reports" />

      <div className="p-6 space-y-6">
        {/* Quick Actions */}
        {canAddProgress && projects && projects.length > 0 && (
          <Card className="border-border bg-[#E87A1E]/5">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">Add Progress Report</h3>
                  <p className="text-sm text-muted-foreground">Select a project to add a new progress report</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {projects.slice(0, 3).map((project) => (
                    <Link key={project.id} href={`/dashboard/progress/new?project=${project.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#E87A1E] text-[#E87A1E] hover:bg-[#E87A1E] hover:text-white bg-transparent"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        {project.contract_no}
                      </Button>
                    </Link>
                  ))}
                  {projects.length > 3 && (
                    <Link href="/dashboard/progress/new">
                      <Button variant="outline" size="sm">
                        View All Projects
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Reports Table */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">All Progress Reports</CardTitle>
              {canAddProgress && (
                <Link href="/dashboard/progress/new">
                  <Button className="bg-[#E87A1E] text-white hover:bg-[#D16A0E]">
                    <Plus className="mr-2 h-4 w-4" /> New Report
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {reports && reports.length > 0 ? (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Report #</TableHead>
                      <TableHead className="font-semibold">Project</TableHead>
                      <TableHead className="font-semibold">District</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Created By</TableHead>
                      <TableHead className="font-semibold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map(
                      (report: {
                        id: string
                        report_no: number
                        report_date: string
                        project: { id: string; contract_no: string; contract_name: string; district: { name: string } }
                        creator: { full_name: string }
                      }) => (
                        <TableRow key={report.id} className="hover:bg-muted/30">
                          <TableCell>
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                              #{report.report_no}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{report.project?.contract_name}</p>
                              <p className="text-sm text-muted-foreground">{report.project?.contract_no}</p>
                            </div>
                          </TableCell>
                          <TableCell>{report.project?.district?.name}</TableCell>
                          <TableCell>{formatDate(report.report_date)}</TableCell>
                          <TableCell>{report.creator?.full_name}</TableCell>
                          <TableCell className="text-center">
                            <Link href={`/dashboard/progress/${report.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-1" /> View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardList className="mx-auto h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-1">No progress reports yet</h3>
                <p className="text-sm mb-4">Start tracking project progress by creating your first report</p>
                {canAddProgress && (
                  <Link href="/dashboard/progress/new">
                    <Button className="bg-[#E87A1E] text-white hover:bg-[#D16A0E]">
                      <Plus className="mr-2 h-4 w-4" /> Create First Report
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
