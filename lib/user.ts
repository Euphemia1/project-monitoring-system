import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getUserById } from '@/lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await getUserById(decoded.userId);
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}