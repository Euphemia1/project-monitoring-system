"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Plus, Search, Download, Filter, Folder, Calendar, User } from "lucide-react"
import type { Document, DocumentType, UserRole, ActionStatus } from "@/lib/types"

interface DocumentsViewProps {
  documents: (Document & {
    project: { id: string; contract_no: string; contract_name: string; district: { name: string } }
    progress_report: { id: string; report_no: number } | null
    uploader: { full_name: string }
  })[]
  projects: { id: string; contract_no: string; contract_name: string }[]
  userRole: UserRole
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  precontract_document: "Precontract Document",
  contract_record_details: "Contract Record Details",
  contract_documentation: "Contract Documentation",
  contract_document: "Contract Document",
  contract_documents: "Contract Documents",
  bills_of_quantities: "Bills of Quantities",
  drawings: "Drawings",
  internal_approvals: "Internal Approvals",
  site_instruction: "Site Instructions",
  site_inspection_report: "Site Inspection Reports",
  site_meeting_minutes: "Site Meeting Minutes",
  site_meeting_minutes_main: "Site Meeting Minutes (Main)",
  contractors_reports: "Contractor's Reports",
  contractors_reports_main: "Contractor's Reports (Main)",
  incoming_correspondence: "Incoming Correspondence",
  incoming_correspondence_main: "Incoming Correspondence (Main)",
  outgoing_correspondence: "Outgoing Correspondence",
  outgoing_correspondence_main: "Outgoing Correspondence (Main)",
  internal_correspondence: "Internal Correspondence",
  internal_memos: "Internal Memos",
  interim_payment_certificate: "Interim Payment Certificates",
  remeasurements: "Remeasurements",
  remeasurements_main: "Remeasurements (Main)",
  interim_valuations_certificate: "Interim Valuations & Certificate",
  interim_valuations_certificate_main: "Interim Valuations & Certificate (Main)",
  variation_measurement: "Variation Measurement",
  measurement_of_variations: "Measurement of Variations",
  final_account_remeasurement: "Final Account Remeasurement",
  remeasurement_main: "Remeasurement (Main)",
  delays_disruptions_records: "Delays & Disruptions Records",
  progress_report_attachment: "Progress Report Attachments",
  all_reports: "All Type of Reports",
  how_to_use_filling_system: "How to use the Filling System",
  other_report: "Other Report",
}

const DOCUMENT_CATEGORIES = [
  { key: "all", label: "All Documents" },
  {
    key: "precontract",
    label: "Precontract",
    types: ["precontract_document"],
  },
  {
    key: "contract",
    label: "Contract Docs",
    types: ["contract_record_details", "contract_documentation", "contract_document", "contract_documents", "bills_of_quantities", "drawings", "internal_approvals"],
  },
  {
    key: "correspondence",
    label: "Correspondence",
    types: ["incoming_correspondence", "incoming_correspondence_main", "outgoing_correspondence", "outgoing_correspondence_main", "internal_correspondence", "internal_memos"],
  },
  {
    key: "interim-payment",
    label: "Interim Payment",
    types: ["interim_payment_certificate", "remeasurements", "remeasurements_main", "interim_valuations_certificate", "interim_valuations_certificate_main"],
  },
  {
    key: "site",
    label: "Site Documents",
    types: ["site_instruction", "site_inspection_report", "site_meeting_minutes", "site_meeting_minutes_main", "contractors_reports", "contractors_reports_main"],
  },
  {
    key: "variation",
    label: "Variation Account",
    types: ["variation_measurement", "measurement_of_variations"],
  },
  {
    key: "final-account",
    label: "Final Account",
    types: ["final_account_remeasurement", "remeasurement_main"],
  },
  {
    key: "contract-admin",
    label: "Contract Administration",
    types: ["delays_disruptions_records"],
  },
  {
    key: "reports",
    label: "Reports",
    types: ["progress_report_attachment", "all_reports"],
  },
  {
    key: "system-docs",
    label: "System Documentation",
    types: ["how_to_use_filling_system"],
  },
  {
    key: "other",
    label: "Other",
    types: ["other_report"],
  },
]

export function DocumentsView({ documents, projects, userRole }: DocumentsViewProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const canUpload = ["director", "project_engineer", "project_manager"].includes(userRole)

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProject = selectedProject === "all" || doc.project_id === selectedProject

    let matchesCategory = true
    if (selectedCategory !== "all") {
      const category = DOCUMENT_CATEGORIES.find((c) => c.key === selectedCategory)
      if (category?.types) {
        matchesCategory = category.types.includes(doc.document_type)
      }
    }

    return matchesSearch && matchesProject && matchesCategory
  })

  // Group documents by type
  const groupedDocuments = filteredDocuments.reduce(
    (acc, doc) => {
      if (!acc[doc.document_type]) {
        acc[doc.document_type] = []
      }
      acc[doc.document_type].push(doc)
      return acc
    },
    {} as Record<string, typeof filteredDocuments>,
  )

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-ZM", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const handleUpdateActionStatus = async (documentId: string, status: ActionStatus) => {
    try {
      const res = await fetch("/api/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ document_id: documentId, action_status: status }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Failed to update action status")
      }

      router.refresh()
    } catch (e) {
      console.error("Error updating action status:", e)
    }
  }

  const getDocTypeIcon = (type: DocumentType) => {
    const colors: Record<string, string> = {
      contract_documentation: "bg-blue-100 text-blue-600",
      bills_of_quantities: "bg-green-100 text-green-600",
      drawings: "bg-purple-100 text-purple-600",
      internal_approvals: "bg-amber-100 text-amber-600",
      site_instruction: "bg-orange-100 text-orange-600",
      site_inspection_report: "bg-red-100 text-red-600",
      site_meeting_minutes: "bg-cyan-100 text-cyan-600",
      incoming_correspondence: "bg-indigo-100 text-indigo-600",
      outgoing_correspondence: "bg-pink-100 text-pink-600",
      interim_payment_certificate: "bg-emerald-100 text-emerald-600",
      internal_correspondence: "bg-slate-100 text-slate-600",
      progress_report_attachment: "bg-rose-100 text-rose-600",
    }
    return colors[type] || "bg-gray-100 text-gray-600"
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.contract_no}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {canUpload && (
              <Link href="/dashboard/documents/upload">
                <Button className="bg-[#E87A1E] text-white hover:bg-[#D16A0E]">
                  <Plus className="mr-2 h-4 w-4" /> Upload Document
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="bg-muted flex-wrap h-auto gap-1 p-1">
          {DOCUMENT_CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.key} value={cat.key} className="text-xs sm:text-sm">
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {Object.keys(groupedDocuments).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedDocuments).map(([type, docs]) => (
                <Card key={type} className="border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${getDocTypeIcon(type as DocumentType)}`}
                      >
                        <Folder className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-foreground">
                          {DOCUMENT_TYPE_LABELS[type as DocumentType] || type}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{docs.length} document(s)</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {docs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E87A1E]/10">
                              <FileText className="h-5 w-5 text-[#E87A1E]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground truncate">{doc.title}</p>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span className="truncate">{doc.project?.contract_no}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {doc.uploader?.full_name}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(doc.created_at)}
                                </span>
                                {doc.action_required && (
                                  <>
                                    <span>•</span>
                                    <span className="text-orange-600">
                                      Action: {doc.action_required}
                                    </span>
                                  </>
                                )}
                                {doc.action_assignee_id && (
                                  <>
                                    <span>•</span>
                                    <span className="text-blue-600">
                                      Assignee: {doc.action_assignee_id}
                                    </span>
                                  </>
                                )}
                                {doc.action_status && (
                                  <>
                                    <span>•</span>
                                    <span className={`
                                      ${doc.action_status === 'completed' ? 'text-green-600' : 
                                        doc.action_status === 'in_progress' ? 'text-yellow-600' : 
                                        'text-red-600'}
                                    `}>
                                      Status: {doc.action_status}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.is_locked && (
                              <Badge variant="secondary" className="text-xs">
                                Locked
                              </Badge>
                            )}
                            <div className="flex items-center gap-2">
                              {doc.action_required && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleUpdateActionStatus(doc.id, 'completed')}
                                  className="text-xs"
                                >
                                  Mark Complete
                                </Button>
                              )}
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border">
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="mx-auto h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-1">No documents found</h3>
                <p className="text-sm mb-4">
                  {searchTerm || selectedProject !== "all"
                    ? "Try adjusting your search filters"
                    : "Upload your first document to get started"}
                </p>
                {canUpload && (
                  <Link href="/dashboard/documents/upload">
                    <Button className="bg-[#E87A1E] text-white hover:bg-[#D16A0E]">
                      <Plus className="mr-2 h-4 w-4" /> Upload Document
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Document Stats */}
      <Card className="border-border bg-muted/30">
        <CardContent className="p-4">
          <div className="flex flex-wrap justify-center gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{documents.length}</p>
              <p className="text-sm text-muted-foreground">Total Documents</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{new Set(documents.map((d) => d.project_id)).size}</p>
              <p className="text-sm text-muted-foreground">Projects with Docs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{Object.keys(groupedDocuments).length}</p>
              <p className="text-sm text-muted-foreground">Document Types</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
