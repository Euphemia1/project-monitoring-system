import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Profile, District } from '@/lib/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Verify a password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate a JWT token
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify a JWT token
export async function verifyToken(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

// Authenticate a user with email and password
export async function authenticateUser(email: string, password: string): Promise<{ token: string; user: Profile } | null> {
  try {
    // Get user from database
    const users: any[] = await query(
      'SELECT id, email, name, role, district_id, phone, created_at, updated_at, password FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      return null;
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    
    return {
      token,
      user: userWithoutPassword
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Register a new user
// Force recompilation
export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  role: string,
  districtId: string | null,
  phone: string | null
): Promise<{ token: string; user: Omit<Profile, 'district'> } | null> {
  try {
    // Check if user already exists
    const existingUsers: any[] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert new user
    const result: any = await query(
      `INSERT INTO users (email, password, name, role, district_id, phone, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [email, hashedPassword, fullName, role, districtId, phone]
    );

    const userId = result.insertId;

    // Use the role directly since it's stored in the users table
    const roleName = role;

    // Create user object
    const user = {
      id: userId.toString(),
      email,
      full_name: fullName,
      role: roleName,
      district_id: districtId,
      phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Generate token
    const token = generateToken(userId.toString());

    return {
      token,
      user
    };
  } catch (error) {
    console.error('Registration error:', error);
    return null;
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<Profile | null> {
  try {
    const users: any[] = await query(
      `SELECT u.id, u.email, u.name, u.role, u.district_id, u.phone, u.created_at, u.updated_at, d.id as district_id, d.name as district_name, d.code as district_code FROM users u LEFT JOIN districts d ON u.district_id = d.id WHERE u.id = ? AND u.is_active = TRUE`,
      [userId]
    );

    if (users.length === 0) {
      return null;
    }

    const user = users[0];
    
    const profile: Profile = {
      id: user.id.toString(),
      email: user.email,
      full_name: user.name,
      role: user.role,
      district_id: user.district_id,
      phone: user.phone,
      created_at: user.created_at,
      updated_at: user.updated_at,
      district: user.district_id ? {
        id: user.district_id.toString(),
        name: user.district_name,
        code: user.district_code,
        created_at: new Date().toISOString()
      } : undefined
    };

    return profile;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}