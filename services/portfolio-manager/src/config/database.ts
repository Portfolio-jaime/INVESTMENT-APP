import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/trii_dev',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.log('Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

// Helper function to test connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database connection test successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

// Helper function for transactions
export const withTransaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
