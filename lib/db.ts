import mysql from 'mysql2/promise';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

console.log('🔍 Production DB Config:', {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT,
  nodeEnv: process.env.NODE_ENV
});

const pool = mysql.createPool({
  // For Hostinger, use 'localhost' - it connects via socket internally
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  
  // IMPORTANT: Hostinger shared hosting doesn't support SSL for localhost connections
  // Remove SSL for local connections
  ssl: undefined,
  
  // Enable socket path for better connection
  socketPath: process.env.NODE_ENV === 'production' ? '/var/lib/mysql/mysql.sock' : undefined,
  
  // Connection settings optimized for Hostinger
  waitForConnections: true,
  connectionLimit: 5, // Reduce for shared hosting
  queueLimit: 0,
  connectTimeout: 10000,
  charset: 'utf8mb4',
  timezone: '+00:00',
  
  // Enable keep-alive
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test connection with better error handling
pool.getConnection()
  .then(async (connection) => {
    try {
      const [rows] = await connection.execute('SELECT 1 as connected, DATABASE() as db');
      console.log('✅ Database connected successfully!');
      console.log('📊 Database:', rows[0].db);
      console.log('🔗 Connection ID:', connection.threadId);
    } catch (error) {
      console.error('❌ Test query failed:', error);
    } finally {
      connection.release();
    }
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('Error code:', err.code);
    console.error('Stack:', err.stack);
    
    // Provide specific troubleshooting tips for Hostinger
    if (err.code === 'ECONNREFUSED') {
      console.log('💡 Troubleshooting:');
      console.log('1. Check if MySQL is running in your Hostinger account');
      console.log('2. Verify database name matches exactly: u754414236_efilling');
      console.log('3. Check password special characters (try without @ if issues)');
    }
  });

export async function query<T extends RowDataPacket[][] | RowDataPacket[] | ResultSetHeader>(
  sql: string,
  values?: any[]
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    // Log queries in development only
    if (process.env.NODE_ENV !== 'production') {
      console.log('📝 Query:', sql.substring(0, 150));
    }
    
    const [rows] = await connection.execute(sql, values);
    return rows as T;
  } catch (error) {
    console.error('❌ Query error:', error);
    console.error('Failed query:', sql);
    throw error;
  } finally {
    connection.release();
  }
}

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