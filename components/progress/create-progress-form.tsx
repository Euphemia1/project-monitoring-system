"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Loader2, ClipboardList, Building2 } from "lucide-react"
import type { Project, ProjectSection, Trade } from "@/lib/types"

interface CreateProgressFormProps {
  projects: { id: string; contract_no: string; contract_name: string; district: { name: string } | null }[]
  selectedProject: Project | null
  sections: (ProjectSection & { trades: Trade[] })[]
  nextReportNo: number
  userId: string
}

interface TradeProgress {
  tradeId: string
  tradeName: string
  amount: number
  progressPercentage: number
  amountCompleted: number
}

export function CreateProgressForm({
  projects,
  selectedProject,
  sections,
  nextReportNo,
  userId,
}: CreateProgressFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedProjectId, setSelectedProjectId] = useState(selectedProject?.id || "")
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0])
  const [description, setDescription] = useState("")
  const [tradeProgress, setTradeProgress] = useState<TradeProgress[]>([])

  // Initialize trade progress when sections change
  useEffect(() => {
    if (sections.length > 0) {
      const progress: TradeProgress[] = []
      sections.forEach((section) => {
        section.trades.forEach((trade) => {
          progress.push({
            tradeId: trade.id,
            tradeName: trade.trade_name,
            amount: Number(trade.amount),
            progressPercentage: 0,
            amountCompleted: 0,
          })
        })
      })
      setTradeProgress(progress)
    }
  }, [sections])

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId)
    router.push(`/dashboard/progress/new?project=${projectId}`)
  }

  const handleProgressChange = (tradeId: string, percentage: number) => {
    setTradeProgress((prev) =>
      prev.map((tp) =>
        tp.tradeId === tradeId
          ? {
              ...tp,
              progressPercentage: percentage,
              amountCompleted: (tp.amount * percentage) / 100,
            }
          : tp,
      ),
    )
  }

  const calculateTotals = () => {
    const totalAmount = tradeProgress.reduce((sum, tp) => sum + tp.amount, 0)
    const totalCompleted = tradeProgress.reduce((sum, tp) => sum + tp.amountCompleted, 0)
    const overallProgress = totalAmount > 0 ? (totalCompleted / totalAmount) * 100 : 0
    return { totalAmount, totalCompleted, overallProgress }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZM", {
      style: "currency",
      currency: "ZMW",
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // Create the progress report
      const { data: report, error: reportError } = await supabase
        .from("progress_reports")
        .insert({
          project_id: selectedProjectId,
          report_no: nextReportNo,
          report_date: reportDate,
          description: description || null,
          created_by: userId,
        })
        .select()
        .single()

      if (reportError) throw reportError

      // Create trade progress entries
      const progressEntries = tradeProgress
        .filter((tp) => tp.progressPercentage > 0)
        .map((tp) => ({
          progress_report_id: report.id,
          trade_id: tp.tradeId,
          progress_percentage: tp.progressPercentage,
          amount_completed: tp.amountCompleted,
        }))

      if (progressEntries.length > 0) {
        const { error: progressError } = await supabase.from("trade_progress").insert(progressEntries)

        if (progressError) throw progressError
      }

      // Update project status to in_progress if it was approved
      await supabase
        .from("projects")
        .update({ status: "in_progress" })
        .eq("id", selectedProjectId)
        .eq("status", "approved")

      router.push(`/dashboard/progress/${report.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create progress report")
    } finally {
      setIsLoading(false)
    }
  }

  const { totalAmount, totalCompleted, overallProgress } = calculateTotals()

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Project Selection */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Building2 className="h-5 w-5 text-[#E87A1E]" />
            Select Project
          </CardTitle>
          <CardDescription>Choose the project to add progress for</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select value={selectedProjectId} onValueChange={handleProjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.contract_no} - {p.contract_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProject && (
              <div className="space-y-2">
                <Label>District</Label>
                <Input value={selectedProject.district?.name || ""} disabled />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Report Details - Only show if project is selected */}
      {selectedProject && sections.length > 0 && (
        <>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <ClipboardList className="h-5 w-5 text-[#E87A1E]" />
                Report Details
              </CardTitle>
              <CardDescription>Progress Report No. {nextReportNo}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="reportNo">Report Number</Label>
                  <Input id="reportNo" value={nextReportNo} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportDate">Report Date *</Label>
                  <Input
                    id="reportDate"
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any notes or observations about this progress report..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Trade Progress */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Trade Progress</CardTitle>
              <CardDescription>Set the progress percentage for each trade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sections.map((section) => (
                <div key={section.id} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground">{section.section_name}</h4>
                    {section.house_type && (
                      <span className="text-sm text-muted-foreground">({section.house_type})</span>
                    )}
                  </div>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-4 py-2 text-left text-sm font-medium text-foreground">Trade</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-foreground">Amount</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-foreground w-48">Progress %</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-foreground">Amount Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.trades.map((trade) => {
                          const tp = tradeProgress.find((p) => p.tradeId === trade.id)
                          return (
                            <tr key={trade.id} className="border-b border-border last:border-0">
                              <td className="px-4 py-3 font-medium text-foreground">{trade.trade_name}</td>
                              <td className="px-4 py-3 text-right font-mono text-foreground">
                                {formatCurrency(Number(trade.amount))}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <Slider
                                    value={[tp?.progressPercentage || 0]}
                                    onValueChange={([value]) => handleProgressChange(trade.id, value)}
                                    max={100}
                                    step={5}
                                    className="flex-1"
                                  />
                                  <span className="w-12 text-right font-mono text-sm text-foreground">
                                    {tp?.progressPercentage || 0}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">
                                {formatCurrency(tp?.amountCompleted || 0)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="rounded-lg bg-[#E87A1E]/10 p-4 border border-[#E87A1E]/20">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Contract</p>
                    <p className="text-xl font-bold text-foreground font-mono">{formatCurrency(totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Completed</p>
                    <p className="text-xl font-bold text-emerald-600 font-mono">{formatCurrency(totalCompleted)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Progress</p>
                    <p className="text-xl font-bold text-[#E87A1E] font-mono">{overallProgress.toFixed(1)}%</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-[#E87A1E] transition-all duration-300"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && <div className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#E87A1E] text-white hover:bg-[#D16A0E]" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Report...
                </>
              ) : (
                "Save Progress Report"
              )}
            </Button>
          </div>
        </>
      )}

      {/* No project selected message */}
      {!selectedProject && (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardList className="mx-auto h-16 w-16 mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-1">Select a Project</h3>
            <p className="text-sm">Choose a project from the dropdown above to add progress</p>
          </CardContent>
        </Card>
      )}
    </form>
  )
}
