'use server';

import { query } from '@/lib/db';

export async function getDistricts() {
  try {
    const districts: any[] = await query('SELECT * FROM districts ORDER BY name');
    return { success: true, data: districts };
  } catch (error) {
    console.error('Error fetching districts:', error);
    return { success: false, error: 'Failed to fetch districts' };
  }
}