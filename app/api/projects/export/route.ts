import { NextResponse } from "next/server"
import { query, querySingle } from "@/lib/db"
import { getCurrentUser } from "@/lib/user"
import path from "path"
import { readFile } from "fs/promises"
import AdmZip from "adm-zip"

export const runtime = "nodejs"

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }

        const url = new URL(request.url)
        const projectId = url.searchParams.get("id")

        if (!projectId) {
            return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
        }

        // Check permissions
        // Allow director, project_manager, project_engineer
        if (!["director", "project_manager", "project_engineer"].includes(user.role)) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 })
        }

        // Fetch all project data
        const [
            project,
            sections,
            trades,
            progressReports,
            documents
        ] = await Promise.all([
            // Project Details
            querySingle('SELECT * FROM projects WHERE id = ?', [projectId]),

            // Sections
            query('SELECT * FROM project_sections WHERE project_id = ?', [projectId]),

            // Trades (joined via sections)
            query('SELECT t.* FROM trades t JOIN project_sections s ON t.section_id = s.id WHERE s.project_id = ?', [projectId]),

            // Progress Reports
            query('SELECT * FROM progress_reports WHERE project_id = ?', [projectId]),

            // Documents
            query('SELECT * FROM documents WHERE project_id = ?', [projectId])
        ])

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }

        // Create JSON data object
        const projectData = {
            project,
            sections: (sections as any[]).map(s => ({
                ...s,
                trades: (trades as any[]).filter(t => t.section_id === s.id)
            })),
            progressReports,
            documents,
            exportedAt: new Date().toISOString(),
            exportedBy: user.full_name
        }

        // Initialize ZIP
        const zip = new AdmZip()

        // Add JSON data
        zip.addFile("project_data.json", Buffer.from(JSON.stringify(projectData, null, 2), "utf8"))

        // Add Documents
        const documentsList = documents as any[]
        // Group documents by folder structure if possible, or just flat 'documents/'
        // We will use 'documents/document_type/filename' structure for better organization

        for (const doc of documentsList) {
            if (!doc.url) continue;

            try {
                // doc.url is like "/uploads/documents/535/filename.ext"
                // We need to resolve this to absolute path on server
                // remove leading slash
                const relativePath = doc.url.startsWith('/') ? doc.url.slice(1) : doc.url
                const absolutePath = path.join(process.cwd(), 'public', relativePath)

                const fileContent = await readFile(absolutePath)

                // Organize by document type in the zip
                const typeFolder = doc.document_type || 'other'
                const zipPath = `documents/${typeFolder}/${doc.original_name || doc.file_name}`

                zip.addFile(zipPath, fileContent)
            } catch (err) {
                console.error(`Failed to add file ${doc.file_name} to zip:`, err)
                // Add a placeholder text file noting the missing file
                zip.addFile(
                    `documents/MISSING_FILES_LOG.txt`,
                    Buffer.from(`Could not locate file: ${doc.file_name} (ID: ${doc.id})\n`, "utf8")
                )
            }
        }

        const zipBuffer = zip.toBuffer()

        const filename = `project-${project.contract_no || projectId}-archive.zip`

        return new NextResponse(zipBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        })

    } catch (error) {
        console.error("Export error:", error)
        return NextResponse.json({ error: "Export failed" }, { status: 500 })
    }
}
