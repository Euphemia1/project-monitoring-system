// app/api/auth/revoke-token/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    await query('UPDATE users SET auth_token = NULL WHERE id = ?', [userId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to revoke token' },
      { status: 500 }
    );
  }
}