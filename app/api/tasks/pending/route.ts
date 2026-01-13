import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/user'

export async function GET() {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const tasks: any[] = await query(
            `
      SELECT 
        d.id,
        d.title,
        d.document_type,
        d.action_required,
        d.url,
        d.created_at as uploaded_at,
        p.contract_name as project_name,
        p.contract_no as project_contract_no,
        u.name as uploader_name
      FROM documents d
      LEFT JOIN projects p ON p.id = d.project_id
      LEFT JOIN users u ON u.id = d.uploaded_by
      WHERE d.action_assignee_id = ? AND d.action_status = 'pending'
      ORDER BY d.created_at DESC
      `,
            [user.id]
        )

        return NextResponse.json(tasks)
    } catch (error) {
        console.error('GET PENDING TASKS ERROR:', error)
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }
}
