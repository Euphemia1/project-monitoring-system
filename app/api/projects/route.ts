// app/api/projects/route.ts
import { NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db'
import { getCurrentUser } from '@/lib/user'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (id) {
      const rows: any[] = await query(
        `SELECT p.id, p.contract_no, p.contract_name, p.district_id, p.start_date, p.completion_date, p.contract_sum, p.status, p.created_by, p.created_at, p.updated_at, d.name as district_name, d.code as district_code, COALESCE(u.name, u.full_name, u.email) as creator_full_name FROM projects p LEFT JOIN districts d ON d.id = p.district_id LEFT JOIN users u ON u.id = p.created_by WHERE p.id = ? LIMIT 1`,
        [id]
      )

      if (!rows.length) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      const r = rows[0]
      const project = {
        id: r.id?.toString?.() ?? String(r.id),
        contract_no: r.contract_no,
        contract_name: r.contract_name,
        district_id: r.district_id?.toString?.() ?? String(r.district_id),
        status: r.status,
        start_date: r.start_date,
        completion_date: r.completion_date,
        contract_sum: Number(r.contract_sum),
        created_at: r.created_at,
        updated_at: r.updated_at,
        district: r.district_id
          ? {
              id: r.district_id?.toString?.() ?? String(r.district_id),
              name: r.district_name,
              code: r.district_code,
            }
          : null,
        creator: r.created_by
          ? {
              id: r.created_by?.toString?.() ?? String(r.created_by),
              full_name: r.creator_full_name,
            }
          : null,
      }
const sections: any[] = await query('SELECT id, project_id, section_name, house_type, created_at FROM project_sections WHERE project_id = ? ORDER BY id ASC', [id])

      const sectionIds = sections.map((s) => s.id)
      let trades: any[] = []
      if (sectionIds.length > 0) {
        const placeholders = sectionIds.map(() => '?').join(',')
        trades = await query(`SELECT id, section_id, trade_name, amount, created_at FROM trades WHERE section_id IN (${placeholders}) ORDER BY id ASC`, sectionIds)
      }

      const sectionsWithTrades = sections.map((s) => ({
        id: s.id?.toString?.() ?? String(s.id),
        project_id: s.project_id?.toString?.() ?? String(s.project_id),
        section_name: s.section_name,
        house_type: s.house_type,
        created_at: s.created_at,
        trades: trades
          .filter((t) => t.section_id === s.id)
          .map((t) => ({
            id: t.id?.toString?.() ?? String(t.id),
            section_id: t.section_id?.toString?.() ?? String(t.section_id),
            trade_name: t.trade_name,
            amount: Number(t.amount),
            created_at: t.created_at,
          })),
      }))

      return NextResponse.json({ project, sections: sectionsWithTrades })
    }

    const rows: any[] = await query(
      `SELECT p.id, p.contract_no, p.contract_name, p.district_id, p.start_date, p.completion_date, p.contract_sum, p.status, p.created_by, p.created_at, p.updated_at, d.name as district_name, d.code as district_code, COALESCE(u.name, u.full_name, u.email) as creator_full_name FROM projects p LEFT JOIN districts d ON d.id = p.district_id LEFT JOIN users u ON u.id = p.created_by ORDER BY p.created_at DESC`
    )

    const projects = rows.map((r) => ({
      id: r.id?.toString?.() ?? String(r.id),
      contract_no: r.contract_no,
      contract_name: r.contract_name,
      district_id: r.district_id?.toString?.() ?? String(r.district_id),
      status: r.status,
      start_date: r.start_date,
      completion_date: r.completion_date,
      contract_sum: Number(r.contract_sum),
      created_at: r.created_at,
      updated_at: r.updated_at,
      district: r.district_id
        ? {
            id: r.district_id?.toString?.() ?? String(r.district_id),
            name: r.district_name,
            code: r.district_code,
          }
        : null,
      creator: r.created_by
        ? {
            id: r.created_by?.toString?.() ?? String(r.created_by),
            full_name: r.creator_full_name,
          }
        : null,
    }))

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (user.role !== 'director' && user.role !== 'project_engineer') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const {
      contract_no,
      contract_name,
      district_id,
      start_date,
      completion_date,
      contract_sum,
      status = 'pending_approval',
      sections = []
    } = await request.json()

    if (!contract_no || !contract_name || !district_id || !start_date || !completion_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const createdBy = user.id

    const created = await transaction(async (connection) => {
      const [projectResult]: any = await connection.execute(
        `INSERT INTO projects (contract_no, contract_name, district_id, start_date, completion_date, contract_sum, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contract_no,
          contract_name,
          district_id,
          start_date,
          completion_date,
          Number(contract_sum ?? 0),
          status,
          createdBy,
        ]
      )

      
      const projectId = projectResult.insertId

      for (const section of sections || []) {
        const sectionName = section?.name || section?.section_name || 'Section'
        const houseType = section?.house_type || section?.houseType || null

        const [sectionResult]: any = await connection.execute(
          `INSERT INTO project_sections (project_id, section_name, house_type) VALUES (?, ?, ?)`,
          [projectId, sectionName, houseType]
        )

        const sectionId = sectionResult.insertId
        const trades = Array.isArray(section?.trades) ? section.trades : []

        for (const trade of trades) {
          const tradeName = trade?.name || trade?.trade_name || trade?.tradeName
          const amount = Number(trade?.amount ?? 0)
          if (!tradeName) continue
          await connection.execute(
            `INSERT INTO trades (section_id, trade_name, amount) VALUES (?, ?, ?)`,
            [sectionId, tradeName, amount]
          )
        }
      }

      return { id: projectId }
    })

    return NextResponse.json({ id: created.id?.toString?.() ?? String(created.id) })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}


export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (user.role !== 'director') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing project id' }, { status: 400 })
    }

    await query('DELETE FROM projects WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing project id' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({} as any))
    const status = body?.status as string | undefined
    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 })
    }

    // Only director can approve projects
    if (status === 'approved' && user.role !== 'director') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await query('UPDATE projects SET status = ? WHERE id = ?', [status, id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}