import { NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db'
import { getCurrentUser } from '@/lib/user'
import { v4 as uuidv4 } from 'uuid'

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
      const values: any[] = [id]
      let permissionJoin = ''
      let permissionWhere = ''

      if (user.role !== 'director') {
        permissionJoin = ' LEFT JOIN project_assignments pa ON pa.project_id = p.id AND pa.user_id = ? '
        permissionWhere = ' AND pa.user_id IS NOT NULL '
        values.push(user.id)
      }

      const rows: any[] = await query(
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
        ${permissionJoin}
        WHERE p.id = ?
        ${permissionWhere}
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
    const values: any[] = []
    let permissionJoin = ''
    let permissionWhere = ''
    if (user.role !== 'director') {
      permissionJoin = ' INNER JOIN project_assignments pa ON pa.project_id = p.id AND pa.user_id = ? '
      values.push(user.id)
    }

    const rows: any[] = await query(
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
      ${permissionJoin}
      ${permissionWhere}
      ORDER BY p.created_at DESC
      `,
      values
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
    console.log('🚀 Starting project creation...')
    
    const user = await getCurrentUser()
    console.log('👤 User:', user ? `${user.id} (${user.role})` : 'null')
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!['director', 'project_engineer', 'project_manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    console.log('📋 Request body:', JSON.stringify(body, null, 2))

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

    console.log('🔄 Starting transaction...')
    const created = await transaction(async (connection) => {
      // Insert project WITHOUT specifying ID (let database auto-increment)
      const [projectResult] = await connection.execute(
        `
        INSERT INTO projects
        (contract_no, contract_name, district_id, start_date, completion_date, contract_sum, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
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

      // Get the auto-generated project ID
      const projectId = (projectResult as any).insertId
      console.log('✅ Project inserted with ID:', projectId)

      await connection.execute(
        `
        INSERT INTO project_assignments (project_id, user_id, assigned_by)
        VALUES (?, ?, ?)
        `,
        [projectId, user.id, user.id]
      )

      console.log(`📦 Processing ${sections.length} sections...`)
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
        console.log(`  ✅ Section ${i + 1} inserted with ID:`, sectionId)

        const trades = section.trades || []
        console.log(`    Processing ${trades.length} trades...`)
        
        for (let j = 0; j < trades.length; j++) {
          const trade = trades[j]
          if (!trade.name) {
            console.log(`    Trade ${j + 1}: skipped (no name)`)
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
          console.log(`    ✅ Trade ${j + 1} inserted:`, trade.name)
        }
      }

      return projectId
    })

    console.log('✨ Project created successfully with ID:', created)
    return NextResponse.json(
      { success: true, id: created },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ CREATE PROJECT ERROR:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    
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
    console.log('PUT /api/projects called');
    
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    console.log('User:', user);

    const id = new URL(request.url).searchParams.get('id')
    console.log('Project ID:', id);
    
    const body = await request.json()
    console.log('Request body:', body);

    if (!id) {
      return NextResponse.json({ error: 'Missing project id' }, { status: 400 })
    }

    const {
      contract_no,
      contract_name,
      district_id,
      start_date,
      completion_date,
      contract_sum,
      sections = [],
    } = body

    if (!contract_no || !contract_name || !district_id || !start_date || !completion_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user can edit this project
    // Directors can edit any project, project engineers can only edit projects in pending_approval status
    const projectResult = await query('SELECT status FROM projects WHERE id = ?', [id])
    if (!projectResult.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    const project = projectResult[0]
    console.log('Project status:', project.status);
    
    const canEdit = user.role === 'director' || 
                   (user.role === 'project_engineer' && project.status === 'pending_approval')
    
    if (!canEdit) {
      return NextResponse.json({ error: 'Not authorized to edit this project' }, { status: 403 })
    }

    // Update project details
    console.log('Updating project with ID:', id);
    await query(
      `UPDATE projects 
       SET contract_no = ?, contract_name = ?, district_id = ?, 
           start_date = ?, completion_date = ?, contract_sum = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        contract_no,
        contract_name,
        district_id,
        start_date,
        completion_date,
        Number(contract_sum),
        id
      ]
    )
    console.log('Project updated successfully');

    // First, get existing sections and trades to identify what needs to be deleted
    const existingSections = await query(
      `SELECT id FROM project_sections WHERE project_id = ?`,
      [id]
    )
    
    const existingSectionIds = existingSections.map((s: any) => String(s.id));
    const incomingSectionIds = sections.filter(s => s.id).map(s => String(s.id));
    
    console.log('Existing section IDs:', existingSectionIds);
    console.log('Incoming section IDs:', incomingSectionIds);
    
    // Delete sections that are no longer in the form
    const sectionsToDelete = existingSectionIds.filter(
      existingId => !incomingSectionIds.includes(existingId)
    );
    
    console.log('Sections to delete:', sectionsToDelete);
    
    if (sectionsToDelete.length > 0) {
      const placeholders = sectionsToDelete.map(() => '?').join(',');
      await query(
        `DELETE FROM project_sections WHERE id IN (${placeholders}) AND project_id = ?`,
        [...sectionsToDelete, id]
      );
      console.log('Deleted sections:', sectionsToDelete);
    }

    // Update and create sections
    for (const section of sections) {
      if (section.id) {
        // Update existing section - FIXED: Convert empty string to null
        console.log('Updating section with ID:', section.id);
        await query(
          `UPDATE project_sections 
           SET section_name = ?, house_type = ?
           WHERE id = ? AND project_id = ?`,
          [section.name, section.house_type || null, section.id, id]
        )
      } else {
        // Create new section - FIXED: removed array destructuring & convert empty string to null
        console.log('Creating new section:', section.name);
        const sectionResult: any = await query(
          `INSERT INTO project_sections (project_id, section_name, house_type)
           VALUES (?, ?, ?)`,
          [id, section.name, section.house_type || null]
        )
        section.id = sectionResult.insertId
        console.log('Created section with ID:', section.id);
      }

      // Get existing trades for this section to identify what needs to be deleted
      if (section.id) {
        const existingTrades = await query(
          `SELECT id FROM trades WHERE section_id = ?`,
          [section.id]
        )
        
        const existingTradeIds = existingTrades.map((t: any) => String(t.id));
        const incomingTradeIds = (section.trades || []).filter(t => t.id).map(t => String(t.id));
        
        console.log(`Section ${section.id} - Existing trade IDs:`, existingTradeIds);
        console.log(`Section ${section.id} - Incoming trade IDs:`, incomingTradeIds);
        
        // Delete trades that are no longer in the form
        const tradesToDelete = existingTradeIds.filter(
          existingId => !incomingTradeIds.includes(existingId)
        );
        
        console.log(`Section ${section.id} - Trades to delete:`, tradesToDelete);
        
        if (tradesToDelete.length > 0) {
          const placeholders = tradesToDelete.map(() => '?').join(',');
          await query(
            `DELETE FROM trades WHERE id IN (${placeholders}) AND section_id = ?`,
            [...tradesToDelete, section.id]
          );
          console.log(`Section ${section.id} - Deleted trades:`, tradesToDelete);
        }
      }

      // Update trades for this section
      for (const trade of section.trades || []) {
        if (trade.id) {
          // Update existing trade
          console.log(`Updating trade with ID: ${trade.id} in section ${section.id}`);
          await query(
            `UPDATE trades 
             SET trade_name = ?, amount = ?
             WHERE id = ? AND section_id = ?`,
            [trade.name, Number(trade.amount), trade.id, section.id]
          )
        } else {
          // Create new trade
          console.log(`Creating new trade: ${trade.name} in section ${section.id}`);
          await query(
            `INSERT INTO trades (section_id, trade_name, amount)
             VALUES (?, ?, ?)`,
            [section.id, trade.name, Number(trade.amount)]
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
      console.log('Deleted orphaned trades from deleted sections');
    }
    
    console.log('Project update completed successfully');
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('UPDATE PROJECT ERROR:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error));
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