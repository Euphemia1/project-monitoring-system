"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Plus, Trash2, Building2 } from "lucide-react"

interface District {
  id: string
  name: string
  code: string
}

interface CreateProjectFormProps {
  districts: District[]
  userId: string
}

interface Section {
  id: string
  name: string
  houseType: string
  trades: { id: string; name: string; amount: string }[]
}

const DEFAULT_TRADES = [
  "Substructure",
  "Concrete",
  "Blockwork",
  "Roofing",
  "Plastering",
  "Flooring",
  "Electrical",
  "Plumbing",
  "Painting",
  "Carpentry",
]

export function CreateProjectForm({ districts, userId }: CreateProjectFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Project Details
  const [contractNo, setContractNo] = useState("")
  const [contractName, setContractName] = useState("")
  const [districtId, setDistrictId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [completionDate, setCompletionDate] = useState("")
  const [description, setDescription] = useState("")

  // Sections with Trades
  const [sections, setSections] = useState<Section[]>([
    {
      id: crypto.randomUUID(),
      name: "Section 1",
      houseType: "Houses Type A",
      trades: [
        { id: crypto.randomUUID(), name: "Substructure", amount: "" },
        { id: crypto.randomUUID(), name: "Concrete", amount: "" },
        { id: crypto.randomUUID(), name: "Blockwork", amount: "" },
      ],
    },
  ])

  const addSection = () => {
    setSections([
      ...sections,
      {
        id: crypto.randomUUID(),
        name: `Section ${sections.length + 1}`,
        houseType: "",
        trades: [{ id: crypto.randomUUID(), name: "", amount: "" }],
      },
    ])
  }

  const removeSection = (sectionId: string) => {
    if (sections.length > 1) {
      setSections(sections.filter((s) => s.id !== sectionId))
    }
  }

  const updateSection = (sectionId: string, field: string, value: string) => {
    setSections(sections.map((s) => (s.id === sectionId ? { ...s, [field]: value } : s)))
  }

  const addTrade = (sectionId: string) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              trades: [...s.trades, { id: crypto.randomUUID(), name: "", amount: "" }],
            }
          : s,
      ),
    )
  }

  const removeTrade = (sectionId: string, tradeId: string) => {
    setSections(
      sections.map((s) => (s.id === sectionId ? { ...s, trades: s.trades.filter((t) => t.id !== tradeId) } : s)),
    )
  }

  const updateTrade = (sectionId: string, tradeId: string, field: string, value: string) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              trades: s.trades.map((t) => (t.id === tradeId ? { ...t, [field]: value } : t)),
            }
          : s,
      ),
    )
  }

  const calculateContractSum = () => {
    return sections.reduce((total, section) => {
      const sectionTotal = section.trades.reduce((sum, trade) => {
        return sum + (Number.parseFloat(trade.amount) || 0)
      }, 0)
      return total + sectionTotal
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Create the project
      const projectData = {
        contract_no: contractNo,
        contract_name: contractName,
        description,
        district_id: districtId,
        start_date: startDate,
        completion_date: completionDate,
        contract_sum: calculateContractSum(),
        status: "pending_approval",
        created_by: userId,
        sections: sections.map(section => ({
          name: section.name,
          house_type: section.houseType,
          trades: section.trades
            .filter(t => t.name && t.amount)
            .map(trade => ({
              name: trade.name,
              amount: parseFloat(trade.amount) || 0
            }))
        }))
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create project')
      }

      const project = await response.json()
      window.alert('Project created successfully')

      router.push(`/dashboard/projects/${project.id}`)
      router.refresh()
    } catch (err) {
      console.error('Error creating project:', err)
      setError(err instanceof Error ? err.message : "Failed to create project")
      window.alert('Failed to create project. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ... rest of the component remains the same until the return statement
  // The JSX part of the component can remain exactly the same
  // since we're only changing the data handling logic

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Project Particulars */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Building2 className="h-5 w-5 text-[#E87A1E]" />
            Project Particulars
          </CardTitle>
          <CardDescription>Basic project information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contractNo">Contract Number *</Label>
              <Input
                id="contractNo"
                value={contractNo}
                onChange={(e) => setContractNo(e.target.value)}
                placeholder="e.g., CON-2024-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractName">Contract Name *</Label>
              <Input
                id="contractName"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                placeholder="e.g., Housing Project Phase 1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Project Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter project description..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="district">District *</Label>
              <Select value={districtId} onValueChange={setDistrictId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="completionDate">Completion Date *</Label>
              <Input
                id="completionDate"
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Sections with Trades */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Trades with Amounts</CardTitle>
              <CardDescription>Define project sections and their associated trades</CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={addSection}>
              <Plus className="mr-2 h-4 w-4" /> Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {sections.map((section, sectionIndex) => (
            <div key={section.id} className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="grid gap-4 sm:grid-cols-2 flex-1 mr-4">
                  <div className="space-y-2">
                    <Label>Section Name</Label>
                    <Input
                      value={section.name}
                      onChange={(e) => updateSection(section.id, "name", e.target.value)}
                      placeholder="Section name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>House Type</Label>
                    <Input
                      value={section.houseType}
                      onChange={(e) => updateSection(section.id, "houseType", e.target.value)}
                      placeholder="e.g., Houses Type M"
                    />
                  </div>
                </div>
                {sections.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeSection(section.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Trades Table */}
              <div className="rounded-lg border border-border overflow-hidden bg-card">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-2 text-left text-sm font-medium text-foreground">Trade</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-foreground">Amount (GHS)</th>
                      <th className="px-4 py-2 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.trades.map((trade, tradeIndex) => (
                      <tr key={trade.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-2">
                          <Select
                            value={trade.name}
                            onValueChange={(v) => updateTrade(section.id, trade.id, "name", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select trade" />
                            </SelectTrigger>
                            <SelectContent>
                              {DEFAULT_TRADES.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={trade.amount}
                            onChange={(e) => updateTrade(section.id, trade.id, "amount", e.target.value)}
                            placeholder="0.00"
                            className="text-right"
                          />
                        </td>
                        <td className="px-4 py-2">
                          {section.trades.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => removeTrade(section.id, trade.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/50">
                      <td className="px-4 py-2 font-medium text-foreground">Section Total</td>
                      <td className="px-4 py-2 text-right font-mono font-semibold text-foreground">
                        {new Intl.NumberFormat("en-GH", {
                          style: "currency",
                          currency: "GHS",
                        }).format(section.trades.reduce((sum, t) => sum + (Number.parseFloat(t.amount) || 0), 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 bg-transparent"
                onClick={() => addTrade(section.id)}
              >
                <Plus className="mr-2 h-3 w-3" /> Add Trade
              </Button>
            </div>
          ))}

          {/* Contract Sum */}
          <div className="rounded-lg bg-[#E87A1E]/10 p-4 border border-[#E87A1E]/20">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">Total Contract Sum</span>
              <span className="text-2xl font-bold text-[#E87A1E] font-mono">
                {new Intl.NumberFormat("en-GH", {
                  style: "currency",
                  currency: "GHS",
                }).format(calculateContractSum())}
              </span>
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
        <Button 
          type="submit" 
          className="bg-[#E87A1E] text-white hover:bg-[#D16A0E]" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Project...
            </>
          ) : (
            "Create Project"
          )}
        </Button>
      </div>
    </form>
  )
}