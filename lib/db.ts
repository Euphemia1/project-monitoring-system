import mysql from 'mysql2/promise';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Force IPv4 by using 127.0.0.1 instead of localhost
const host = process.env.MYSQL_HOST || 'localhost';

// If host is 'localhost', replace with 127.0.0.1 to force IPv4
const resolvedHost = host === 'localhost' ? '127.0.0.1' : host;

const pool = mysql.createPool({
  host: resolvedHost,  // Use 127.0.0.1 instead of localhost
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'project_monitoring',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Explicitly force IPv4
  family: 4,
  // Add connection timeout
  connectTimeout: 10000,
  // Add charset
  charset: 'utf8mb4',
});

// Test connection on startup
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully to host:', connection.config.host);
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('Connection details:', {
      host: resolvedHost,
      user: process.env.MYSQL_USER,
      database: process.env.MYSQL_DATABASE
    });
  });

export async function query<T extends RowDataPacket[][] | RowDataPacket[] | ResultSetHeader>(
  sql: string,
  values?: any[]
): Promise<T> {
  console.log('🔍 Executing query:', sql.substring(0, 100));
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(sql, values);
    return rows as T;
  } catch (error) {
    console.error('❌ Query error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export default pool;