import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/user';

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { full_name, phone, district_id } = await request.json();

    // Update user profile
    await query(
      `UPDATE users 
       SET name = ?, phone = ?, district_id = ?, updated_at = NOW() 
       WHERE id = ?`,
      [full_name, phone || null, district_id || null, user.id]
    );

    // Return updated user profile
    const updatedUsers = await query(
      `SELECT u.id, u.email, u.name, u.role, u.district_id, u.phone, u.created_at, u.updated_at, 
              d.id as district_id, d.name as district_name, d.code as district_code 
       FROM users u 
       LEFT JOIN districts d ON u.district_id = d.id 
       WHERE u.id = ? AND u.is_active = TRUE`,
      [user.id]
    );

    if (updatedUsers.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = updatedUsers[0];
    
    const profile = {
      id: updatedUser.id.toString(),
      email: updatedUser.email,
      full_name: updatedUser.name,
      role: updatedUser.role,
      district_id: updatedUser.district_id,
      phone: updatedUser.phone,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at,
      district: updatedUser.district_id ? {
        id: updatedUser.district_id.toString(),
        name: updatedUser.district_name,
        code: updatedUser.district_code,
        created_at: new Date().toISOString()
      } : undefined
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}