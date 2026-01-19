
"use client"

import { useState, useMemo } from "react"
import {
    FolderIcon,
    FileTextIcon,
    SearchIcon,
    PlusIcon,
    FilterIcon,
    DownloadIcon,
    CalendarIcon,
    MessageSquareIcon,
    ChevronRightIcon,
    LayoutGridIcon,
    ListIcon,
    InfoIcon,
    UserIcon,
    ClockIcon,
    CheckCircle2Icon,
    AlertCircleIcon
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Document, DocumentType, UserRole, Project } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { UploadDocumentForm } from "./upload-document-form"

interface EFilingInterfaceProps {
    initialProjects: any[]
    initialDocuments: any[]
    users: any[]
    userRole: UserRole
    userId: string
}

const CATEGORIES = [
    {
        id: "precontract",
        name: "Precontract documents",
        icon: FolderIcon,
        types: ["precontract_document"]
    },
    {
        id: "contract",
        name: "Contract Document",
        icon: FileTextIcon,
        types: ["contract_record_details", "contract_documentation", "contract_document", "contract_documents", "bills_of_quantities", "drawings", "internal_approvals"]
    },
    {
        id: "correspondence",
        name: "Correspondence",
        icon: MessageSquareIcon,
        types: ["incoming_correspondence", "incoming_correspondence_main", "outgoing_correspondence", "outgoing_correspondence_main", "internal_correspondence", "internal_memos"]
    },
    {
        id: "interim-payment",
        name: "Interim Payment files",
        icon: FileTextIcon,
        types: ["interim_payment_certificate", "remeasurements", "remeasurements_main", "interim_valuations_certificate", "interim_valuations_certificate_main"]
    },
    {
        id: "site-meetings",
        name: "Site Meetings",
        icon: CalendarIcon,
        types: ["site_instruction", "site_inspection_report", "site_meeting_minutes", "site_meeting_minutes_main", "contractors_reports", "contractors_reports_main"]
    },
    {
        id: "variation",
        name: "Variation Account",
        icon: FileTextIcon,
        types: ["variation_measurement", "measurement_of_variations"]
    },
    {
        id: "final-account",
        name: "Final Account Records",
        icon: FileTextIcon,
        types: ["final_account_remeasurement", "remeasurement_main"]
    },
    {
        id: "contract-admin",
        name: "Contract Administration",
        icon: InfoIcon,
        types: ["delays_disruptions_records"]
    },
    {
        id: "reports",
        name: "Reports",
        icon: FileTextIcon,
        types: ["progress_report_attachment", "all_reports"]
    },
]

export function EFilingInterface({
    initialProjects,
    initialDocuments,
    users,
    userRole,
    userId
}: EFilingInterfaceProps) {
    const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("correspondence")
    const [searchQuery, setSearchQuery] = useState("")
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

    const filteredDocuments = useMemo(() => {
        return initialDocuments.filter(doc => {
            const matchesProject = selectedProjectId === "all" || doc.project_id === selectedProjectId

            const category = CATEGORIES.find(c => c.id === selectedCategoryId)
            const matchesCategory = category?.types.includes(doc.document_type) || false

            const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())

            return matchesProject && matchesCategory && matchesSearch
        })
    }, [initialDocuments, selectedProjectId, selectedCategoryId, searchQuery])

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-ZM", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600">Done</Badge>
            case 'in_progress':
                return <Badge className="bg-amber-500 hover:bg-amber-600">In Progress</Badge>
            case 'pending':
                return <Badge variant="outline" className="text-muted-foreground border-muted-foreground">Pending</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Top Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search files..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                        />
                    </div>
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger className="w-[240px] bg-gray-50/50 border-gray-200">
                            <SelectValue placeholder="All Projects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {initialProjects.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.contract_no} - {p.contract_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#E87A1E] text-white hover:bg-[#D16A0E] w-full md:w-auto">
                            <PlusIcon className="mr-2 h-4 w-4" /> Add New File
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>Upload New File to Project</DialogTitle>
                        </DialogHeader>
                        <UploadDocumentForm
                            projects={initialProjects}
                            progressReports={[]}
                            selectedProjectId={selectedProjectId === 'all' ? '' : selectedProjectId}
                            selectedReportId=""
                            userId={userId}
                            users={users}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Sidebar Categories */}
                <div className="md:col-span-3 space-y-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all group",
                                selectedCategoryId === cat.id
                                    ? "bg-[#E87A1E] text-white shadow-md shadow-[#E87A1E]/20"
                                    : "bg-white text-gray-700 hover:bg-gray-50 hover:text-[#E87A1E] border border-transparent hover:border-[#E87A1E]/20 shadow-sm"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <cat.icon className={cn(
                                    "h-5 w-5",
                                    selectedCategoryId === cat.id ? "text-white" : "text-[#E87A1E]"
                                )} />
                                <span>{cat.name}</span>
                            </div>
                            <ChevronRightIcon className={cn(
                                "h-4 w-4 opacity-0 transition-all",
                                selectedCategoryId === cat.id ? "opacity-100" : "group-hover:opacity-50"
                            )} />
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="md:col-span-9 space-y-4">
                    <Card className="border-border overflow-hidden shadow-sm">
                        <CardHeader className="bg-gray-50/50 border-b border-border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl">
                                        {CATEGORIES.find(c => c.id === selectedCategoryId)?.name}
                                    </CardTitle>
                                    <CardDescription>
                                        {filteredDocuments.length} files found for this category
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="bg-white">
                                        <LayoutGridIcon className="h-4 w-4 mr-2" /> Grid
                                    </Button>
                                    <Button variant="outline" size="sm" className="bg-white">
                                        <ListIcon className="h-4 w-4 mr-2" /> List
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50/30 border-b border-border">
                                            {selectedCategoryId === 'correspondence' ? (
                                                <>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Correspondence Details</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Direction</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">File Details</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Loaded</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Comment/Action</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action Response</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredDocuments.length > 0 ? (
                                            filteredDocuments.map((doc) => {
                                                if (selectedCategoryId === 'correspondence') {
                                                    // Correspondence View
                                                    let direction = "Internal";
                                                    let directionColor = "text-gray-500 bg-gray-100";

                                                    if (doc.document_type.includes('incoming')) {
                                                        direction = "Incoming";
                                                        directionColor = "text-emerald-600 bg-emerald-100";
                                                    } else if (doc.document_type.includes('outgoing')) {
                                                        direction = "Outgoing";
                                                        directionColor = "text-blue-600 bg-blue-100";
                                                    }

                                                    // Custom date format: 14th/ Jan 2025
                                                    const dateObj = new Date(doc.created_at);
                                                    const day = dateObj.getDate();
                                                    const suffix = ["th", "st", "nd", "rd"][(day % 10 > 3) ? 0 : (day % 100 - day % 10 !== 10) ? day % 10 : 0];
                                                    const month = dateObj.toLocaleString('en-US', { month: 'short' });
                                                    const year = dateObj.getFullYear();
                                                    const formattedDate = `${day}${suffix}/ ${month} ${year}`;

                                                    return (
                                                        <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#E87A1E]/10 group-hover:bg-[#E87A1E]/20 transition-colors">
                                                                        <MessageSquareIcon className="h-5 w-5 text-[#E87A1E]" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="font-semibold text-gray-900 truncate max-w-[300px]" title={doc.title}>
                                                                            {doc.title}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                                                                            {doc.file_name}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-medium text-gray-700">
                                                                {formattedDate}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <Badge variant="outline" className={`border-0 font-medium ${directionColor}`}>
                                                                    {direction}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <a
                                                                        href={doc.file_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                                                    >
                                                                        View
                                                                    </a>
                                                                    <a
                                                                        href={doc.file_url}
                                                                        download
                                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                                                    >
                                                                        <DownloadIcon className="h-4 w-4" />
                                                                    </a>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                }

                                                // Default View
                                                return (
                                                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#E87A1E]/10 group-hover:bg-[#E87A1E]/20 transition-colors">
                                                                    <FileTextIcon className="h-5 w-5 text-[#E87A1E]" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-semibold text-gray-900 truncate max-w-[200px]" title={doc.title}>
                                                                        {doc.title}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                                        {doc.project?.contract_no || 'No Project'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium underline decoration-[#E87A1E]/30">{formatDate(doc.created_at).split(',')[0]}</span>
                                                                <span className="text-xs text-muted-foreground">{formatDate(doc.created_at).split(',')[1]}</span>
                                                                <span className="text-[10px] flex items-center gap-1 mt-1 font-semibold text-gray-400 capitalize">
                                                                    <UserIcon className="h-2 w-2" /> {doc.uploader?.full_name || 'System'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {doc.action_required ? (
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-sm font-medium text-gray-800">{doc.action_required}</span>
                                                                    {doc.assignee_name && (
                                                                        <span className="text-[11px] text-[#E87A1E] flex items-center gap-1 font-bold">
                                                                            <ClockIcon className="h-3 w-3" /> Assign To: {doc.assignee_name} ({doc.assignee_role?.replace('_', ' ') || 'User'})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-gray-400 italic">No action required</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1.5">
                                                                {getStatusBadge(doc.action_status || 'pending')}
                                                                {doc.action_response && (
                                                                    <p className="text-xs text-gray-600 italic">"{doc.action_response}"</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <a
                                                                    href={doc.file_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                                                >
                                                                    View
                                                                </a>
                                                                <a
                                                                    href={doc.file_url}
                                                                    download
                                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                                                >
                                                                    <DownloadIcon className="h-4 w-4" />
                                                                </a>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="h-16 w-16 flex items-center justify-center rounded-full bg-gray-100">
                                                            <FileTextIcon className="h-8 w-8 text-gray-300" />
                                                        </div>
                                                        <h3 className="text-lg font-medium text-gray-900">No files found</h3>
                                                        <p className="text-sm text-muted-foreground">Try adjusting your project filter or category</p>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setIsUploadModalOpen(true)}
                                                            className="mt-2 border-[#E87A1E] text-[#E87A1E] hover:bg-[#E87A1E]/5"
                                                        >
                                                            Upload First File
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Summary Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="border-border shadow-sm border-l-4 border-l-[#E87A1E]">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-[#E87A1E]/10 flex items-center justify-center text-[#E87A1E]">
                                    <CheckCircle2Icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Completed Actions</p>
                                    <p className="text-2xl font-bold">{filteredDocuments.filter(d => d.action_status === 'completed').length}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-border shadow-sm border-l-4 border-l-amber-500">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                    <ClockIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Pending Actions</p>
                                    <p className="text-2xl font-bold">{filteredDocuments.filter(d => d.action_status === 'pending' || d.action_status === 'in_progress').length}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-border shadow-sm border-l-4 border-l-blue-500">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <AlertCircleIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Total Files</p>
                                    <p className="text-2xl font-bold">{filteredDocuments.length}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
