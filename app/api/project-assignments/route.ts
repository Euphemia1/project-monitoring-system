import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/user"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const url = new URL(request.url)
    const projectId = String(url.searchParams.get("project_id") || "").trim()

    if (!projectId) {
      return NextResponse.json({ error: "Missing project_id" }, { status: 400 })
    }

    // Only allow viewing assignments if user can access project
    if (user.role !== "director") {
      const access: any[] = await query(
        "SELECT 1 FROM project_assignments WHERE project_id = ? AND user_id = ? LIMIT 1",
        [projectId, user.id],
      )
      if (!access.length) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 })
      }
    }

    const rows: any[] = await query(
      `
      SELECT pa.user_id, u.name, u.email, u.role, pa.assigned_at, pa.assigned_by
      FROM project_assignments pa
      INNER JOIN users u ON u.id = pa.user_id
      WHERE pa.project_id = ?
      ORDER BY u.name
      `,
      [projectId],
    )

    return NextResponse.json(
      rows.map((r) => ({
        user_id: String(r.user_id),
        name: r.name,
        email: r.email,
        role: r.role,
        assigned_at: r.assigned_at,
        assigned_by: r.assigned_by ? String(r.assigned_by) : null,
      })),
    )
  } catch (error) {
    console.error("GET /api/project-assignments error:", error)
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (user.role !== "director") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const body = await request.json()
    const projectId = String(body?.project_id || "").trim()
    const userId = String(body?.user_id || "").trim()

    if (!projectId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await query(
      `
      INSERT INTO project_assignments (project_id, user_id, assigned_by)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE assigned_by = VALUES(assigned_by), assigned_at = CURRENT_TIMESTAMP
      `,
      [Number(projectId), Number(userId), Number(user.id)],
    )

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("POST /api/project-assignments error:", error)
    return NextResponse.json({ error: "Failed to assign user" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (user.role !== "director") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const url = new URL(request.url)
    const projectId = String(url.searchParams.get("project_id") || "").trim()
    const userId = String(url.searchParams.get("user_id") || "").trim()

    if (!projectId || !userId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    await query("DELETE FROM project_assignments WHERE project_id = ? AND user_id = ?", [projectId, userId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/project-assignments error:", error)
    return NextResponse.json({ error: "Failed to unassign user" }, { status: 500 })
  }
}
