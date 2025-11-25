"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { Calendar, User, FileText, Plus, Download, Building2, ArrowLeft, Printer } from "lucide-react"
import type { ProgressReport, TradeProgress, Document, Trade, ProjectSection, UserRole } from "@/lib/types"

interface ProgressReportDetailsProps {
  report: ProgressReport & {
    project: {
      id: string
      contract_no: string
      contract_name: string
      contract_sum: number
      district: { name: string }
    }
    creator: { full_name: string; email: string; role: string }
  }
  tradeProgress: (TradeProgress & {
    trade: Trade & {
      section: ProjectSection
    }
  })[]
  documents: (Document & { uploader: { full_name: string } })[]
  userRole: UserRole
  userId: string
}

export function ProgressReportDetails({
  report,
  tradeProgress,
  documents,
  userRole,
  userId,
}: ProgressReportDetailsProps) {
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

  // Calculate totals
  const totalAmount = report.project.contract_sum
  const totalCompleted = tradeProgress.reduce((sum, tp) => sum + Number(tp.amount_completed), 0)
  const overallProgress = totalAmount > 0 ? (totalCompleted / totalAmount) * 100 : 0

  // Group progress by section
  const progressBySection = tradeProgress.reduce(
    (acc, tp) => {
      const sectionName = tp.trade?.section?.section_name || "Other"
      if (!acc[sectionName]) {
        acc[sectionName] = {
          section: tp.trade?.section,
          trades: [],
        }
      }
      acc[sectionName].trades.push(tp)
      return acc
    },
    {} as Record<string, { section: ProjectSection | null; trades: typeof tradeProgress }>,
  )

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <Link href={`/dashboard/projects/${report.project.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
          <Link href={`/dashboard/documents/upload?project=${report.project.id}&report=${report.id}`}>
            <Button size="sm" className="bg-[#E87A1E] text-white hover:bg-[#D16A0E]">
              <Plus className="mr-2 h-4 w-4" />
              Attach File
            </Button>
          </Link>
        </div>
      </div>

      {/* Report Overview */}
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 mb-2">
                  Report #{report.report_no}
                </Badge>
                <h2 className="text-xl font-bold text-foreground">{report.project.contract_name}</h2>
                <p className="text-muted-foreground">{report.project.contract_no}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">District:</span>
                  <span className="font-medium text-foreground">{report.project.district?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium text-foreground">{formatDate(report.report_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created by:</span>
                  <span className="font-medium text-foreground">{report.creator?.full_name}</span>
                </div>
              </div>

              {report.description && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-foreground">{report.description}</p>
                </div>
              )}
            </div>

            {/* Progress Summary */}
            <div className="rounded-lg bg-[#E87A1E]/10 p-4 border border-[#E87A1E]/20">
              <h3 className="font-semibold text-foreground mb-4">Progress Summary</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-bold text-[#E87A1E]">{overallProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-3" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Contract Sum</p>
                    <p className="text-lg font-bold text-foreground font-mono">{formatCurrency(totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Completed</p>
                    <p className="text-lg font-bold text-emerald-600 font-mono">{formatCurrency(totalCompleted)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trade Progress Details */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Trade Progress Details</CardTitle>
          <CardDescription>Breakdown of progress by section and trade</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(progressBySection).map(([sectionName, data]) => (
            <div key={sectionName}>
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-semibold text-foreground">{sectionName}</h4>
                {data.section?.house_type && (
                  <span className="text-sm text-muted-foreground">({data.section.house_type})</span>
                )}
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-2 text-left text-sm font-medium text-foreground">Trade</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-foreground">Original Amount</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-foreground">Progress</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-foreground">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trades.map((tp) => (
                      <tr key={tp.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium text-foreground">{tp.trade?.trade_name}</td>
                        <td className="px-4 py-3 text-right font-mono text-foreground">
                          {formatCurrency(Number(tp.trade?.amount || 0))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-24 h-2 rounded-full bg-gray-200 overflow-hidden">
                              <div className="h-full bg-[#E87A1E]" style={{ width: `${tp.progress_percentage}%` }} />
                            </div>
                            <span className="font-mono text-sm w-12 text-right text-foreground">
                              {Number(tp.progress_percentage).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">
                          {formatCurrency(Number(tp.amount_completed))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/50">
                      <td className="px-4 py-2 font-semibold text-foreground">Section Total</td>
                      <td className="px-4 py-2 text-right font-mono font-semibold text-foreground">
                        {formatCurrency(data.trades.reduce((sum, tp) => sum + Number(tp.trade?.amount || 0), 0))}
                      </td>
                      <td></td>
                      <td className="px-4 py-2 text-right font-mono font-semibold text-emerald-600">
                        {formatCurrency(data.trades.reduce((sum, tp) => sum + Number(tp.amount_completed), 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}

          {tradeProgress.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No trade progress recorded for this report</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attached Documents */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Attached Documents</CardTitle>
              <CardDescription>Files related to this progress report</CardDescription>
            </div>
            <Link href={`/dashboard/documents/upload?project=${report.project.id}&report=${report.id}`}>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Attach File
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => (
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-3 opacity-20" />
              <p>No documents attached to this report</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
