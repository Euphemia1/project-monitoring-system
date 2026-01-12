import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/user"

export const runtime = "nodejs"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (user.role !== "director") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const rows: any[] = await query(
      `
      SELECT id, name, email, role
      FROM users
      WHERE is_active = TRUE
      ORDER BY name
      `,
    )

    return NextResponse.json(
      rows.map((r) => ({
        id: String(r.id),
        name: r.name,
        email: r.email,
        role: r.role,
      })),
    )
  } catch (error) {
    console.error("GET /api/users error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
