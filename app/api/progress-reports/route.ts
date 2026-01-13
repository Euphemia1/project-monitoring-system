import { NextResponse } from "next/server"
import { query, transaction } from "@/lib/db"
import { getCurrentUser } from "@/lib/user"

export const runtime = "nodejs"

async function canAccessProject(user: any, projectId: string): Promise<boolean> {
  if (!user) return false
  // Allow all staff roles to access all projects
  return ["director", "project_engineer", "project_manager"].includes(user.role)
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    const projectId = url.searchParams.get("project_id")

    if (id) {
      const reportRows: any[] = await query(
        `
        SELECT pr.id, pr.project_id, pr.report_no, pr.report_date, pr.description, pr.created_by,
               p.contract_no, p.contract_name, p.contract_sum,
               d.name AS district_name,
               u.name AS creator_name, u.email AS creator_email, u.role AS creator_role
        FROM progress_reports pr
        INNER JOIN projects p ON p.id = pr.project_id
        LEFT JOIN districts d ON d.id = p.district_id
        LEFT JOIN users u ON u.id = pr.created_by
        WHERE pr.id = ?
        LIMIT 1
        `,
        [id],
      )

      if (!reportRows.length) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }

      const r = reportRows[0]
      // Project access check removed to allow staff-wide visibility

      const tradeProgress: any[] = await query(
        `
        SELECT tp.id, tp.progress_report_id, tp.trade_id, tp.progress_percentage, tp.amount_completed, tp.created_at,
               t.trade_name, t.amount,
               ps.id AS section_id, ps.section_name, ps.house_type
        FROM trade_progress tp
        INNER JOIN trades t ON t.id = tp.trade_id
        INNER JOIN project_sections ps ON ps.id = t.section_id
        WHERE tp.progress_report_id = ?
        ORDER BY ps.created_at ASC, t.created_at ASC
        `,
        [id],
      )

      const documents: any[] = await query(
        `
        SELECT d.id, d.project_id, d.progress_report_id, d.document_type, d.title, d.url, d.file_name, d.size,
               d.uploaded_by, d.uploaded_at,
               u.name AS uploader_name
        FROM documents d
        LEFT JOIN users u ON u.id = d.uploaded_by
        WHERE d.progress_report_id = ?
        ORDER BY d.uploaded_at DESC
        `,
        [id],
      )

      const report = {
        id: String(r.id),
        project_id: String(r.project_id),
        report_no: Number(r.report_no),
        report_date: r.report_date,
        description: r.description,
        created_by: String(r.created_by),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        project: {
          id: String(r.project_id),
          contract_no: r.contract_no,
          contract_name: r.contract_name,
          contract_sum: Number(r.contract_sum),
          district: { name: r.district_name },
        },
        creator: { full_name: r.creator_name, email: r.creator_email, role: r.creator_role },
      }

      const mappedTradeProgress = tradeProgress.map((tp) => ({
        id: String(tp.id),
        progress_report_id: String(tp.progress_report_id),
        trade_id: String(tp.trade_id),
        progress_percentage: Number(tp.progress_percentage),
        amount_completed: Number(tp.amount_completed),
        created_at: tp.created_at,
        trade: {
          id: String(tp.trade_id),
          trade_name: tp.trade_name,
          amount: Number(tp.amount),
          section: {
            id: String(tp.section_id),
            project_id: String(r.project_id),
            section_name: tp.section_name,
            house_type: tp.house_type,
            created_at: tp.created_at,
          },
        },
      }))

      const mappedDocuments = documents.map((d) => ({
        id: String(d.id),
        project_id: String(d.project_id),
        progress_report_id: d.progress_report_id ? String(d.progress_report_id) : null,
        document_type: d.document_type,
        title: d.title,
        file_url: d.url,
        file_name: d.file_name,
        file_size: d.size,
        uploaded_by: String(d.uploaded_by),
        created_at: d.uploaded_at,
        is_locked: false,
        uploader: { full_name: d.uploader_name },
      }))

      return NextResponse.json({ report, tradeProgress: mappedTradeProgress, documents: mappedDocuments })
    }

    if (!projectId) {
      return NextResponse.json({ error: "Missing project_id" }, { status: 400 })
    }

    // Project access check removed to allow staff-wide visibility

    const rows: any[] = await query(
      `
      SELECT pr.id, pr.project_id, pr.report_no, pr.report_date, pr.description, pr.created_by, pr.created_at, pr.updated_at,
             u.name AS creator_name
      FROM progress_reports pr
      LEFT JOIN users u ON u.id = pr.created_by
      WHERE pr.project_id = ?
      ORDER BY pr.report_no DESC
      `,
      [projectId],
    )

    return NextResponse.json(
      rows.map((pr) => ({
        id: String(pr.id),
        project_id: String(pr.project_id),
        report_no: Number(pr.report_no),
        report_date: pr.report_date,
        description: pr.description,
        created_by: String(pr.created_by),
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        creator: pr.creator_name ? { full_name: pr.creator_name } : null,
      })),
    )
  } catch (error) {
    console.error("GET /api/progress-reports error:", error)
    return NextResponse.json({ error: "Failed to fetch progress reports" }, { status: 500 })
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

    const body = await request.json()

    const projectId = String(body?.project_id || "").trim()
    const reportNo = Number(body?.report_no)
    const reportDate = String(body?.report_date || "").trim()
    const description = String(body?.description || "").trim()
    const tradeProgress = Array.isArray(body?.trade_progress) ? body.trade_progress : []

    if (!projectId || !reportDate || !Number.isFinite(reportNo)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const allowed = await canAccessProject(user, projectId)
    if (!allowed) {
      return NextResponse.json({ error: "Not authorized for this project" }, { status: 403 })
    }

    const created = await transaction(async (connection) => {
      const [result] = await connection.execute(
        `
        INSERT INTO progress_reports (project_id, report_no, report_date, description, created_by)
        VALUES (?, ?, ?, ?, ?)
        `,
        [Number(projectId), reportNo, reportDate, description || null, Number(user.id)],
      )

      const progressReportId = (result as any).insertId

      const entries = tradeProgress
        .filter((tp: any) => Number(tp?.progress_percentage) > 0)
        .map((tp: any) => [
          progressReportId,
          Number(tp.trade_id),
          Number(tp.progress_percentage),
          Number(tp.amount_completed),
        ])

      if (entries.length) {
        const valuesSql = entries.map(() => "(?, ?, ?, ?)").join(",")
        const flat = entries.flat()
        await connection.execute(
          `
          INSERT INTO trade_progress (progress_report_id, trade_id, progress_percentage, amount_completed)
          VALUES ${valuesSql}
          `,
          flat,
        )
      }

      await connection.execute(
        `
        UPDATE projects
        SET status = 'in_progress'
        WHERE id = ? AND status = 'approved'
        `,
        [Number(projectId)],
      )

      return progressReportId
    })

    return NextResponse.json({ success: true, id: created }, { status: 201 })
  } catch (error) {
    console.error("POST /api/progress-reports error:", error)
    return NextResponse.json({ error: "Failed to create progress report" }, { status: 500 })
  }
}
