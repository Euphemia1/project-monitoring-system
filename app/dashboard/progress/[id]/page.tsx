import { notFound, redirect } from "next/navigation"
import { cookies } from "next/headers"
import { Header } from "@/components/dashboard/header"
import { ProgressReportDetails } from "@/components/progress/progress-report-details"
import { getCurrentUser } from "@/lib/user"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProgressReportPage({ params }: PageProps) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login")
  }

  const cookieStore = await cookies()
  const res = await fetch(`/api/progress-reports?id=${encodeURIComponent(id)}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      cookie: cookieStore.toString(),
    },
  })

  if (res.status === 404) {
    notFound()
  }

  if (!res.ok) {
    notFound()
  }

  const data = await res.json()
  const report = data?.report
  const tradeProgress = data?.tradeProgress || []
  const documents = data?.documents || []

  if (!report) {
    notFound()
  }

  return (
    <div className="min-h-screen">
      <Header title={`Progress Report #${report.report_no}`} subtitle={report.project?.contract_name || ""} />
      <div className="p-6">
        <ProgressReportDetails
          report={report}
          tradeProgress={tradeProgress || []}
          documents={documents || []}
          userRole={user.role || "viewer"}
          userId={user.id?.toString?.() || ""}
        />
      </div>
    </div>
  )
}
