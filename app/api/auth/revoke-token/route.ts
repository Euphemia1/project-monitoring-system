import { NextResponse } from 'next/server'

export async function POST() {
  // Token revocation is handled client-side by clearing cookies/localStorage.
  // This endpoint exists because the Sidebar calls it.
  return NextResponse.json({ success: true })
}
