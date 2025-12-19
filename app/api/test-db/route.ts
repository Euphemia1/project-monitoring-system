import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Test the database connection by querying the districts table
    const districts = await query('SELECT * FROM districts LIMIT 5');
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      districts: districts
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}