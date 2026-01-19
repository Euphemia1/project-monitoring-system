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
      SELECT u.id, u.name, u.email, u.role, u.phone, u.is_active, d.name as district_name
      FROM users u
      LEFT JOIN districts d ON u.district_id = d.id
      ORDER BY u.name
      `,
    )

    return NextResponse.json(
      rows.map((r) => ({
        id: String(r.id),
        name: r.name,
        email: r.email,
        role: r.role,
        phone: r.phone,
        is_active: Boolean(r.is_active),
        district: r.district_name
      })),
    )
  } catch (error) {
    console.error("GET /api/users error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (user.role !== "director") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const body = await request.json()
    const { id, role, is_active } = body

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Don't allow changing one's own role or deactivating oneself
    if (String(id) === String(user.id)) {
      return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 })
    }

    const updates: string[] = []
    const values: any[] = []

    if (role) {
      updates.push("role = ?")
      values.push(role)
    }

    if (typeof is_active !== "undefined") {
      updates.push("is_active = ?")
      values.push(is_active)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 })
    }

    values.push(id)
    await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PATCH /api/users error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
