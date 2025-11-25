"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Upload, FileText, X, CheckCircle } from "lucide-react"
import type { DocumentType } from "@/lib/types"

interface UploadDocumentFormProps {
  projects: { id: string; contract_no: string; contract_name: string; district: { name: string } | null }[]
  progressReports: { id: string; report_no: number; report_date: string }[]
  selectedProjectId: string
  selectedReportId: string
  userId: string
}

const DOCUMENT_TYPES: { value: DocumentType; label: string; category: string }[] = [
  { value: "contract_documentation", label: "Contract Documentation", category: "Contract" },
  { value: "bills_of_quantities", label: "Bills of Quantities", category: "Contract" },
  { value: "drawings", label: "Drawings", category: "Contract" },
  { value: "internal_approvals", label: "Internal Approvals", category: "Contract" },
  { value: "site_instruction", label: "Site Instruction", category: "Site" },
  { value: "site_inspection_report", label: "Site Inspection Report", category: "Site" },
  { value: "site_meeting_minutes", label: "Site Meeting Minutes", category: "Site" },
  { value: "incoming_correspondence", label: "Incoming Correspondence", category: "Correspondence" },
  { value: "outgoing_correspondence", label: "Outgoing Correspondence", category: "Correspondence" },
  { value: "interim_payment_certificate", label: "Interim Payment Certificate", category: "Payments" },
  { value: "internal_correspondence", label: "Internal Correspondence", category: "Correspondence" },
  { value: "progress_report_attachment", label: "Progress Report Attachment", category: "Progress" },
]

export function UploadDocumentForm({
  projects,
  progressReports,
  selectedProjectId,
  selectedReportId,
  userId,
}: UploadDocumentFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [projectId, setProjectId] = useState(selectedProjectId)
  const [reportId, setReportId] = useState(selectedReportId)
  const [documentType, setDocumentType] = useState<DocumentType>("contract_documentation") // Updated default value
  const [title, setTitle] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!title) {
        // Auto-fill title from filename
        setTitle(file.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  const handleProjectChange = (id: string) => {
    setProjectId(id)
    setReportId("")
    router.push(`/dashboard/documents/upload?project=${id}`)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !projectId || !documentType || !title) {
      setError("Please fill in all required fields and select a file")
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `documents/${projectId}/${fileName}`

      const { error: uploadError } = await supabase.storage.from("project-documents").upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage.from("project-documents").getPublicUrl(filePath)

      // Create document record
      const { error: dbError } = await supabase.from("documents").insert({
        project_id: projectId,
        progress_report_id: reportId || null,
        document_type: documentType,
        title,
        file_url: urlData.publicUrl,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        uploaded_by: userId,
      })

      if (dbError) throw dbError

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard/documents")
        router.refresh()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="max-w-2xl border-border">
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Upload Successful!</h3>
          <p className="text-muted-foreground">Redirecting to documents...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Project & Report Selection */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Document Details</CardTitle>
          <CardDescription>Select the project and document type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select value={projectId} onValueChange={handleProjectChange}>
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

            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type *</Label>
              <Select value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(
                    DOCUMENT_TYPES.reduce(
                      (acc, type) => {
                        if (!acc[type.category]) acc[type.category] = []
                        acc[type.category].push(type)
                        return acc
                      },
                      {} as Record<string, typeof DOCUMENT_TYPES>,
                    ),
                  ).map(([category, types]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{category}</div>
                      {types.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {progressReports.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="report">Link to Progress Report (Optional)</Label>
              <Select value={reportId} onValueChange={setReportId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a progress report" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific report</SelectItem>
                  {progressReports.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      Report #{r.report_no} - {new Date(r.report_date).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Document Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Upload File</CardTitle>
          <CardDescription>Drag and drop or click to select a file</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              selectedFile
                ? "border-emerald-300 bg-emerald-50"
                : "border-border hover:border-[#E87A1E] hover:bg-[#E87A1E]/5"
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            />

            {selectedFile ? (
              <div className="space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <FileText className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                  }}
                >
                  <X className="mr-1 h-4 w-4" /> Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Drop your file here or click to browse</p>
                  <p className="text-sm text-muted-foreground">Supports PDF, Word, Excel, and image files</p>
                </div>
              </div>
            )}
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
          disabled={isLoading || !selectedFile}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
