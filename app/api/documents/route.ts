import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/user"
import path from "path"
import { mkdir, writeFile } from "fs/promises"
import crypto from "crypto"

export const runtime = "nodejs"

async function canAccessProject(user: any, projectId: string): Promise<boolean> {
  if (!user) return false
  if (user.role === "director") return true

  const rows: any[] = await query(
    "SELECT 1 FROM project_assignments WHERE project_id = ? AND user_id = ? LIMIT 1",
    [projectId, user.id],
  )
  return rows.length > 0
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const url = new URL(request.url)
    const projectId = url.searchParams.get("project_id")

    const values: any[] = []
    const where: string[] = []

    let accessJoin = ""
    if (user.role !== "director") {
      accessJoin = " INNER JOIN project_assignments pa ON pa.project_id = d.project_id AND pa.user_id = ? "
      values.push(user.id)
    }

    if (projectId) {
      where.push("d.project_id = ?")
      values.push(projectId)
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""

    const rows: any[] = await query(
      `
      SELECT
        d.id,
        d.project_id,
        d.progress_report_id,
        d.document_type,
        d.title,
        d.description,
        d.url,
        d.file_name,
        d.size,
        d.uploaded_by,
        d.uploaded_at,
        d.status,
        d.action_required,
        d.action_assignee_id,
        d.action_status,
        d.action_response,
        d.is_locked,
        u.name AS uploader_name,
        p.contract_no AS project_contract_no,
        p.contract_name AS project_contract_name
      FROM documents d
      LEFT JOIN users u ON u.id = d.uploaded_by
      LEFT JOIN projects p ON p.id = d.project_id
      ${accessJoin}
      ${whereSql}
      ORDER BY d.uploaded_at DESC
      `,
      values,
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error("GET /api/documents error:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!["project_manager", "director", "project_engineer"].includes(user.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const formData = await request.formData()

    const projectId = String(formData.get("project_id") || "").trim()
    const progressReportIdRaw = String(formData.get("progress_report_id") || "").trim()
    const documentType = String(formData.get("document_type") || "").trim()
    const title = String(formData.get("title") || "").trim()
    const description = String(formData.get("description") || "").trim()
    const actionRequired = String(formData.get("action_required") || "").trim()
    const actionAssigneeRaw = String(formData.get("action_assignee_id") || "").trim()

    const file = formData.get("file")

    if (!projectId || !documentType || !title || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const hasAccess = await canAccessProject(user, projectId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Not authorized for this project" }, { status: 403 })
    }

    const fileExt = path.extname(file.name)
    const storedName = `${Date.now()}-${crypto.randomUUID()}${fileExt}`

    const uploadDir = path.join(process.cwd(), "public", "uploads", "documents", projectId)
    await mkdir(uploadDir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(uploadDir, storedName), buffer)

    const publicUrl = `/uploads/documents/${projectId}/${storedName}`

    const progressReportId = progressReportIdRaw ? Number(progressReportIdRaw) : null
    const actionAssigneeId = actionAssigneeRaw ? Number(actionAssigneeRaw) : null

    const result: any = await query(
      `
      INSERT INTO documents (
        project_id,
        progress_report_id,
        document_type,
        title,
        description,
        url,
        file_name,
        size,
        uploaded_by,
        status,
        action_required,
        action_assignee_id,
        action_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, 'pending')
      `,
      [
        Number(projectId),
        progressReportId,
        documentType,
        title,
        description || null,
        publicUrl,
        file.name,
        file.size,
        Number(user.id),
        actionRequired || null,
        actionAssigneeId,
      ],
    )

    return NextResponse.json({ success: true, id: result.insertId, url: publicUrl }, { status: 201 })
  } catch (error) {
    console.error("POST /api/documents error:", error)
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
  }
}
