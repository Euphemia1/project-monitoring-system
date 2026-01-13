import { NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db'
import { getCurrentUser } from '@/lib/user'

/* ===========================
   GET PROJECTS
=========================== */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    // ---------------------------
    // SINGLE PROJECT
    // ---------------------------
    if (id) {
      const values: any[] = []
      // Remove permission restriction for listing based on assignments
      // Everyone with 'view_projects' permission can see it
      // if (user.role !== 'director') {
      //   permissionJoin = ' LEFT JOIN project_assignments pa ON pa.project_id = p.id AND pa.user_id = ? '
      //   permissionWhere = ' AND pa.user_id IS NOT NULL '
      //   values.push(user.id)
      // }

      values.push(id)

      const rows: any[] = await query<any[]>(
        `
        SELECT 
          p.id, p.contract_no, p.contract_name, p.district_id,
          p.start_date, p.completion_date, p.contract_sum, p.status,
          p.created_by, p.created_at, p.updated_at,
          d.name AS district_name, d.code AS district_code,
          COALESCE(u.name, u.email) AS creator_full_name
        FROM projects p
        LEFT JOIN districts d ON d.id = p.district_id
        LEFT JOIN users u ON u.id = p.created_by
        WHERE p.id = ?
        LIMIT 1
        `,
        values
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

      const sections: any[] = await query<any[]>(
        `SELECT id, project_id, section_name, house_type, created_at
         FROM project_sections
         WHERE project_id = ?
         ORDER BY created_at ASC`,
        [id]
      )

      let trades: any[] = []
      if (sections.length) {
        const placeholders = sections.map(() => '?').join(',')
        trades = await query<any[]>(
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
          .filter(t => String(t.section_id) === String(s.id))
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
    // List all projects for all authenticated users
    // Role-based visibility is handled by RBAC on the frontend
    // and this endpoint returns projects for anyone authenticated

    const rows: any[] = await query<any[]>(
      `
      SELECT 
        p.id, p.contract_no, p.contract_name, p.district_id,
        p.start_date, p.completion_date, p.contract_sum, p.status,
        p.created_by, p.created_at, p.updated_at,
        d.name AS district_name, d.code AS district_code,
        COALESCE(u.name, u.email) AS creator_full_name
      FROM projects p
      LEFT JOIN districts d ON d.id = p.district_id
      LEFT JOIN users u ON u.id = p.created_by
      ORDER BY p.created_at DESC
      `,
      []
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
      description = '',
      contract_sum = 0,
      status = 'pending_approval',
      sections = [],
    } = body

    if (!contract_no || !contract_name || !district_id || !start_date || !completion_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const created = await transaction(async (connection) => {
      // Insert project WITHOUT specifying ID (let database auto-increment)
      const [projectResult] = await connection.execute(
        `
        INSERT INTO projects
        (contract_no, contract_name, description, district_id, start_date, completion_date, contract_sum, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          contract_no,
          contract_name,
          description || '',
          district_id,
          start_date,
          completion_date,
          Number(contract_sum),
          status,
          user.id,
        ]
      )

      // Get the auto-generated project ID
      const projectId = (projectResult as any).insertId

      await connection.execute(
        `
        INSERT INTO project_assignments (project_id, user_id, assigned_by)
        VALUES (?, ?, ?)
        `,
        [projectId, user.id, user.id]
      )

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i]

        // Insert section WITHOUT specifying ID
        const [sectionResult] = await connection.execute(
          `
          INSERT INTO project_sections (project_id, section_name, house_type)
          VALUES (?, ?, ?)
          `,
          [
            projectId,
            section.name || 'Section',
            section.house_type || section.houseType || null,
          ]
        )

        const sectionId = (sectionResult as any).insertId

        const trades = section.trades || []

        for (let j = 0; j < trades.length; j++) {
          const trade = trades[j]
          if (!trade.name) {
            continue
          }

          await connection.execute(
            `
            INSERT INTO trades (section_id, trade_name, amount)
            VALUES (?, ?, ?)
            `,
            [
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

    return NextResponse.json({
      error: 'Failed to create project',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
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
   UPDATE PROJECT
=========================== */
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const id = new URL(request.url).searchParams.get('id')
    const body = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing project id' }, { status: 400 })
    }

    const {
      contract_no,
      contract_name,
      description = '',
      district_id,
      start_date,
      completion_date,
      contract_sum = 0,
      sections = [],
    } = body

    if (!contract_no || !contract_name || !district_id || !start_date || !completion_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user can edit this project
    const projectResult = await query<any[]>('SELECT status FROM projects WHERE id = ?', [id])
    if (!projectResult.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = projectResult[0]

    const canEdit =
      user.role === 'director' ||
      user.role === 'project_manager' ||
      (user.role === 'project_engineer' && project.status === 'pending_approval')

    if (!canEdit) {
      return NextResponse.json({ error: 'Not authorized to edit this project' }, { status: 403 })
    }

    // Update project details
    await query(
      `UPDATE projects 
       SET contract_no = ?, contract_name = ?, description = ?, district_id = ?, 
           start_date = ?, completion_date = ?, contract_sum = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        contract_no || '',
        contract_name || '',
        description || '',
        district_id || null,
        start_date || null,
        completion_date || null,
        contract_sum !== undefined ? Number(contract_sum) : 0,
        id
      ]
    )

    // First, get existing sections and trades to identify what needs to be deleted
    const existingSections = await query<any[]>(
      `SELECT id FROM project_sections WHERE project_id = ?`,
      [id]
    )

    const existingSectionIds = existingSections.map((s: any) => String(s.id));
    const incomingSectionIds = sections.filter(s => s.id).map(s => String(s.id));

    // Delete sections that are no longer in the form
    const sectionsToDelete = existingSectionIds.filter(
      existingId => !incomingSectionIds.includes(existingId)
    );

    if (sectionsToDelete.length > 0) {
      const placeholders = sectionsToDelete.map(() => '?').join(',');
      await query(
        `DELETE FROM project_sections WHERE id IN (${placeholders}) AND project_id = ?`,
        [...sectionsToDelete, id]
      );
    }

    // Update and create sections
    for (const section of sections) {
      if (section.id) {
        // Update existing section - FIXED: Convert empty string to null
        await query(
          `UPDATE project_sections 
           SET section_name = ?, house_type = ?
           WHERE id = ? AND project_id = ?`,
          [section.name || 'Section', section.house_type || null, section.id, id]
        )
      } else {
        // Create new section - FIXED: removed array destructuring & convert empty string to null
        const sectionResult: any = await query(
          `INSERT INTO project_sections (project_id, section_name, house_type)
           VALUES (?, ?, ?)`,
          [id, section.name || 'Section', section.house_type || null]
        )
        section.id = sectionResult.insertId
      }

      // Get existing trades for this section to identify what needs to be deleted
      if (section.id) {
        const existingTrades = await query<any[]>(
          `SELECT id FROM trades WHERE section_id = ?`,
          [section.id]
        )

        const existingTradeIds = existingTrades.map((t: any) => String(t.id));
        const incomingTradeIds = (section.trades || []).filter((t: any) => t.id).map((t: any) => String(t.id));

        // Delete trades that are no longer in the form
        const tradesToDelete = existingTradeIds.filter(
          existingId => !incomingTradeIds.includes(existingId)
        );

        if (tradesToDelete.length > 0) {
          const placeholders = tradesToDelete.map(() => '?').join(',');
          await query(
            `DELETE FROM trades WHERE id IN (${placeholders}) AND section_id = ?`,
            [...tradesToDelete, section.id]
          );
        }
      }

      // Update trades for this section
      for (const trade of section.trades || []) {
        if (trade.id) {
          // Update existing trade
          await query(
            `UPDATE trades 
             SET trade_name = ?, amount = ?
             WHERE id = ? AND section_id = ?`,
            [trade.name || '', Number(trade.amount || 0), trade.id, section.id]
          )
        } else {
          // Create new trade
          await query(
            `INSERT INTO trades (section_id, trade_name, amount)
             VALUES (?, ?, ?)`,
            [section.id, trade.name || '', Number(trade.amount || 0)]
          )
        }
      }
    }

    // Additional cleanup: delete any trades in sections that were deleted
    // This handles cases where sections were removed from the form
    if (sectionsToDelete.length > 0) {
      const placeholders = sectionsToDelete.map(() => '?').join(',');
      await query(
        `DELETE FROM trades WHERE section_id IN (${placeholders})`,
        sectionsToDelete
      );
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('UPDATE PROJECT ERROR:', error)
    return NextResponse.json({ error: 'Failed to update project', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
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

    // Only directors can change project status to any value
    if (user.role !== 'director') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await query('UPDATE projects SET status = ? WHERE id = ?', [status, id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('UPDATE PROJECT ERROR:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}