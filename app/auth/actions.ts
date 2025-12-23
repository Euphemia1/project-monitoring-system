'use server';

import { query } from '@/lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Get districts (if needed)
export async function getDistricts() {
  try {
    const districts: any[] = await query('SELECT * FROM districts ORDER BY name');
    return { success: true, data: districts };
  } catch (error) {
    console.error('Error fetching districts:', error);
    return { success: false, error: 'Failed to fetch districts' };
  }
}

// Login action
// Force recompilation
export async function loginAction(email: string, password: string) {
  try {
    // Fetch user by email who is active
    const users: any[] = await query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
    
    if (!users.length) return { success: false, error: 'Invalid email or password' };

    const user = users[0];

    // Compare password with hashed password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return { success: false, error: 'Invalid email or password' };

    // Create JWT token with user data
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name || user.email
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data with JWT token
    return {
      success: true,
      token: token,
      user: { 
        id: user.id, 
        name: user.name || user.email,
        email: user.email, 
        role: user.role
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Login failed' 
    };
  }
}
// Sign-up action
export async function signUpAction(formData: {
  name: string;
  email: string;
  password: string;
  role: string;
  district_id?: number | null;
  phone?: string | null;
}) {
  try {
    // Check if user already exists
    const existingUser: any[] = await query('SELECT * FROM users WHERE email = ?', [formData.email]);
    if (existingUser.length > 0) return { success: false, error: 'Email already registered' };

    // Hash password
    const hashedPassword = await bcrypt.hash(formData.password, 10);

    // Insert new user
    const result: any = await query(
      'INSERT INTO users (name, email, password, role, district_id, phone, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?, NOW(), 1)',
      [formData.name, formData.email, hashedPassword, formData.role, formData.district_id || null, formData.phone || null]
    );

    return { success: true, message: 'Account created successfully!', userId: result.insertId };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create account' };
  }
}
