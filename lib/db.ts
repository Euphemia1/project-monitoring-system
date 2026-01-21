import mysql from 'mysql2/promise';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'project_monitoring',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Force IPv4 connection
  family: 4,

});

// Helper function to execute queries
export async function query<T extends RowDataPacket[][] | RowDataPacket[] | ResultSetHeader>(
  sql: string,
  values?: any[]
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(sql, values);
    return rows as T;
  } finally {
    connection.release();
  }
}

// Helper function to execute multiple queries in a transaction
export async function transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export default pool;