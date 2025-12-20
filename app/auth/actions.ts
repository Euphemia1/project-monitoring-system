'use server';

import { query } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';
import bcrypt from 'bcrypt';

export async function getDistricts() {
  try {
    const districts: any[] = await query('SELECT * FROM districts ORDER BY name');
    return { success: true, data: districts };
  } catch (error) {
    console.error('Error fetching districts:', error);
    return { success: false, error: 'Failed to fetch districts' };
  }
}

export async function loginAction(email: string, password: string) {
  try {
    const result = await authenticateUser(email, password);
    if (!result) {
      return { success: false, error: "Invalid email or password" };
    }
    return { success: true, token: result.token, user: result.user };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An error occurred" 
    };
  }
}

export async function signUpAction(formData: {
  name: string;
  email: string;
  password: string;
  role: string;
  district_id?: number;
}) {
  try {
    // Check if user already exists
    const existingUser: any[] = await query(
      'SELECT * FROM users WHERE email = ?',
      [formData.email]
    );

    if (existingUser.length > 0) {
      return { success: false, error: 'Email already registered' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(formData.password, 10);

    // Insert new user
    const result: any = await query(
      'INSERT INTO users (name, email, password, role, district_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [formData.name, formData.email, hashedPassword, formData.role, formData.district_id || null]
    );

    return { 
      success: true, 
      message: 'Account created successfully! Please wait for admin approval.',
      userId: result.insertId 
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create account" 
    };
  }
}