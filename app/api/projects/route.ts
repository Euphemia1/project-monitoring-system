import { NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db'
import { getCurrentUser } from '@/lib/user'
import { v4 as uuidv4 } from 'uuid'

/* ===========================
   GET PROJECTS
=========================== */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    // ---------------------------
    // SINGLE PROJECT
    // ---------------------------
    if (id) {
      const rows: any[] = await query(
        `
        SELECT 
          p.id, p.contract_no, p.contract_name, p.district_id,
          p.start_date, p.completion_date, p.contract_sum, p.status,
          p.created_by, p.created_at, p.updated_at,
          d.name AS district_name, d.code AS district_code,
          COALESCE(u.name, u.full_name, u.email) AS creator_full_name
        FROM projects p
        LEFT JOIN districts d ON d.id = p.district_id
        LEFT JOIN users u ON u.id = p.created_by
        WHERE p.id = ?
        LIMIT 1
        `,
        [id]
      )

      if (!rows.length) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      const r = rows[0]

      const project = {
        id: String(r.id),
        contract_no: r.contract_no,
        contract_name: r.contract_name,
        district_id: String(r.district_id),
        status: r.status,
        start_date: r.start_date,
        completion_date: r.completion_date,
        contract_sum: Number(r.contract_sum),
        created_at: r.created_at,
        updated_at: r.updated_at,
        district: r.district_id
          ? { id: String(r.district_id), name: r.district_name, code: r.district_code }
          : null,
        creator: r.created_by
          ? { id: String(r.created_by), full_name: r.creator_full_name }
          : null,
      }

      const sections: any[] = await query(
        `SELECT id, project_id, section_name, house_type, created_at
         FROM project_sections
         WHERE project_id = ?
         ORDER BY created_at ASC`,
        [id]
      )

      let trades: any[] = []
      if (sections.length) {
        const placeholders = sections.map(() => '?').join(',')
        trades = await query(
          `SELECT id, section_id, trade_name, amount, created_at
           FROM trades
           WHERE section_id IN (${placeholders})`,
          sections.map(s => s.id)
        )
      }

      const sectionsWithTrades = sections.map(s => ({
        id: String(s.id),
        project_id: String(s.project_id),
        section_name: s.section_name,
        house_type: s.house_type,
        created_at: s.created_at,
        trades: trades
          .filter(t => t.section_id === s.id)
          .map(t => ({
            id: String(t.id),
            section_id: String(t.section_id),
            trade_name: t.trade_name,
            amount: Number(t.amount),
            created_at: t.created_at,
          })),
      }))

      return NextResponse.json({ project, sections: sectionsWithTrades })
    }

    // ---------------------------
    // ALL PROJECTS
    // ---------------------------
    const rows: any[] = await query(
      `
      SELECT 
        p.id, p.contract_no, p.contract_name, p.district_id,
        p.start_date, p.completion_date, p.contract_sum, p.status,
        p.created_by, p.created_at, p.updated_at,
        d.name AS district_name, d.code AS district_code,
        COALESCE(u.name, u.full_name, u.email) AS creator_full_name
      FROM projects p
      LEFT JOIN districts d ON d.id = p.district_id
      LEFT JOIN users u ON u.id = p.created_by
      ORDER BY p.created_at DESC
      `
    )

    const projects = rows.map(r => ({
      id: String(r.id),
      contract_no: r.contract_no,
      contract_name: r.contract_name,
      status: r.status,
      start_date: r.start_date,
      completion_date: r.completion_date,
      contract_sum: Number(r.contract_sum),
      created_at: r.created_at,
      updated_at: r.updated_at,
      district: r.district_id
        ? { id: String(r.district_id), name: r.district_name, code: r.district_code }
        : null,
      creator: r.created_by
        ? { id: String(r.created_by), full_name: r.creator_full_name }
        : null,
    }))

    return NextResponse.json(projects)
  } catch (error) {
    console.error('GET PROJECTS ERROR:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

/* ===========================
   CREATE PROJECT
=========================== */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!['director', 'project_engineer', 'project_manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()

    const {
      contract_no,
      contract_name,
      district_id,
      start_date,
      completion_date,
      contract_sum = 0,
      status = 'pending_approval',
      sections = [],
    } = body

    if (!contract_no || !contract_name || !district_id || !start_date || !completion_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const created = await transaction(async (connection) => {
      const projectId = uuidv4()

      await connection.execute(
        `
        INSERT INTO projects
        (id, contract_no, contract_name, district_id, start_date, completion_date, contract_sum, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          projectId,
          contract_no,
          contract_name,
          district_id,
          start_date,
          completion_date,
          Number(contract_sum),
          status,
          user.id,
        ]
      )

      for (const section of sections) {
        const sectionId = uuidv4()

        await connection.execute(
          `
          INSERT INTO project_sections (id, project_id, section_name, house_type)
          VALUES (?, ?, ?, ?)
          `,
          [
            sectionId,
            projectId,
            section.name || 'Section',
            section.house_type || section.houseType || null,
          ]
        )

        for (const trade of section.trades || []) {
          if (!trade.name) continue

          await connection.execute(
            `
            INSERT INTO trades (id, section_id, trade_name, amount)
            VALUES (?, ?, ?, ?)
            `,
            [
              uuidv4(),
              sectionId,
              trade.name,
              Number(trade.amount ?? 0),
            ]
          )
        }
      }

      return projectId
    })

    return NextResponse.json(
      { success: true, id: created },
      { status: 201 }
    )
  } catch (error) {
    console.error('CREATE PROJECT ERROR:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}

/* ===========================
   DELETE PROJECT
=========================== */
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'director') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const id = new URL(request.url).searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing project id' }, { status: 400 })
    }

    await query('DELETE FROM projects WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE PROJECT ERROR:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}

/* ===========================
   UPDATE PROJECT STATUS
=========================== */
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const id = new URL(request.url).searchParams.get('id')
    const { status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    if (status === 'approved' && user.role !== 'director') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await query('UPDATE projects SET status = ? WHERE id = ?', [status, id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('UPDATE PROJECT ERROR:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}
