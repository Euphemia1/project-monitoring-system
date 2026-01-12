"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Search, Filter } from "lucide-react";
import type { Document, DocumentType } from "@/lib/types";

interface CorrespondenceReportProps {
  documents: (Document & {
    project: { id: string; contract_no: string; contract_name: string; district: { name: string } }
    progress_report: { id: string; report_no: number } | null
    uploader: { full_name: string }
  })[];
}

export function CorrespondenceReport({ documents }: CorrespondenceReportProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [documentType, setDocumentType] = useState<string>("all");

  // Filter correspondence documents only
  const correspondenceDocs = documents.filter(doc => 
    doc.document_type.includes('correspondence') || 
    doc.document_type.includes('memos')
  );

  const filteredDocs = correspondenceDocs.filter((doc) => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.action_required?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.action_assignee_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDateFrom = !dateFrom || new Date(doc.created_at) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(doc.created_at) <= new Date(dateTo);
    const matchesType = documentType === "all" || doc.document_type === documentType;

    return matchesSearch && matchesDateFrom && matchesDateTo && matchesType;
  });

  const getActionStatusBadge = (status: string | undefined) => {
    if (!status) return <Badge variant="secondary">Pending</Badge>;
    
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-yellow-500">In Progress</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    const labels: Record<DocumentType, string> = {
      precontract_document: "Precontract Document",
      contract_record_details: "Contract Record Details",
      contract_documentation: "Contract Documentation",
      contract_document: "Contract Document",
      contract_documents: "Contract Documents",
      bills_of_quantities: "Bills of Quantities",
      drawings: "Drawings",
      internal_approvals: "Internal Approvals",
      site_instruction: "Site Instruction",
      site_inspection_report: "Site Inspection Report",
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
      interim_payment_certificate: "Interim Payment Certificate",
      remeasurements: "Remeasurements",
      remeasurements_main: "Remeasurements (Main)",
      interim_valuations_certificate: "Interim Valuations & Certificate",
      interim_valuations_certificate_main: "Interim Valuations & Certificate (Main)",
      variation_measurement: "Variation Measurement",
      measurement_of_variations: "Measurement of Variations",
      final_account_remeasurement: "Final Account Remeasurement",
      remeasurement_main: "Remeasurement (Main)",
      delays_disruptions_records: "Delays & Disruptions Records",
      progress_report_attachment: "Progress Report Attachment",
      all_reports: "All Type of Reports",
      how_to_use_filling_system: "How to use the Filling System",
      other_report: "Other Report",
    };
    
    return labels[type] || type;
  };

  const exportToCSV = () => {
    const headers = [
      "File Name",
      "Date",
      "Comment",
      "Action",
      "Assignee",
      "Status",
      "Project"
    ];

    const csvContent = [
      headers.join(","),
      ...filteredDocs.map(doc => [
        `"${doc.title.replace(/"/g, '""')}"`,
        new Date(doc.created_at).toLocaleString(),
        `"${doc.description?.replace(/"/g, '""') || ''}"`,
        `"${doc.action_required?.replace(/"/g, '""') || ''}"`,
        `"${doc.action_assignee_id?.replace(/"/g, '""') || ''}"`,
        doc.action_status || 'pending',
        `"${doc.project?.contract_no.replace(/"/g, '""') || ''}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `correspondence-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Correspondence Report</CardTitle>
          <p className="text-muted-foreground">
            Track all incoming and outgoing correspondence with actions and status
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by file name, action, assignee..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="docType">Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger id="docType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Correspondence</SelectItem>
                    <SelectItem value="incoming_correspondence">Incoming</SelectItem>
                    <SelectItem value="outgoing_correspondence">Outgoing</SelectItem>
                    <SelectItem value="internal_correspondence">Internal</SelectItem>
                    <SelectItem value="internal_memos">Internal Memos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={exportToCSV} className="bg-[#E87A1E] text-white hover:bg-[#D16A0E]">
                <Download className="mr-2 h-4 w-4" />
                Export to CSV
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">File Name</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#E87A1E]" />
                          {doc.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(doc.created_at).toLocaleString("en-ZM", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        {doc.description || "-"}
                      </TableCell>
                      <TableCell>
                        {doc.action_required || "-"}
                      </TableCell>
                      <TableCell>
                        {doc.action_assignee_id || "-"}
                      </TableCell>
                      <TableCell>
                        {getActionStatusBadge(doc.action_status)}
                      </TableCell>
                      <TableCell>
                        {doc.project?.contract_no || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No correspondence documents found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}