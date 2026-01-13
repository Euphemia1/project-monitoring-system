import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/user"
import path from "path"
import { mkdir, writeFile } from "fs/promises"
import crypto from "crypto"

export const runtime = "nodejs"

async function canAccessProject(user: any, projectId: string): Promise<boolean> {
  if (!user) return false
  // Allow all staff roles to access all projects for actions
  return ["director", "project_engineer", "project_manager"].includes(user.role)
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
        d.created_at,
        d.status,
        d.action_required,
        d.action_assignee_id,
        d.action_status,
        d.action_response,
        d.is_locked,
        u.name AS uploader_name,
        p.contract_no AS project_contract_no,
        p.contract_name AS project_contract_name,
        au.name AS assignee_name,
        au.role AS assignee_role
      FROM documents d
      LEFT JOIN users u ON u.id = d.uploaded_by
      LEFT JOIN projects p ON p.id = d.project_id
      LEFT JOIN users au ON au.id = d.action_assignee_id
      ${whereSql}
      ORDER BY d.created_at DESC
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
    const parsedAssignee = actionAssigneeRaw ? Number(actionAssigneeRaw) : null
    const actionAssigneeId = typeof parsedAssignee === "number" && Number.isFinite(parsedAssignee) ? parsedAssignee : null

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

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const documentId = String(body?.document_id || "").trim()
    const actionStatus = String(body?.action_status || "").trim()
    const actionResponse = String(body?.action_response || "").trim()

    if (!documentId || !actionStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify access through project assignment
    const accessRows: any[] = await query(
      `
      SELECT d.project_id
      FROM documents d
      WHERE d.id = ?
      LIMIT 1
      `,
      [documentId],
    )

    if (!accessRows.length) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const projectId = String(accessRows[0].project_id)
    const hasAccess = await canAccessProject(user, projectId)
    if (!hasAccess) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    await query(
      `
      UPDATE documents
      SET action_status = ?, action_response = ?
      WHERE id = ?
      `,
      [actionStatus, actionResponse || null, documentId],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PATCH /api/documents error:", error)
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
  }
}
