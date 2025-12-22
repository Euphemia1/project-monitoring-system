import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const districts: any[] = await query('SELECT id, name, code, created_at FROM districts ORDER BY name')

    return NextResponse.json(
      districts.map((d) => ({
        id: d.id?.toString?.() ?? String(d.id),
        name: d.name,
        code: d.code,
        created_at: d.created_at,
      }))
    )
  } catch (error) {
    console.error('Error fetching districts:', error)
    return NextResponse.json({ error: 'Failed to fetch districts' }, { status: 500 })
  }
}
