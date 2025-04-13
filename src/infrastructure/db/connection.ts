import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Initialize the connection pool with better error handling
let pool;

try {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not defined');
    throw new Error('DATABASE_URL environment variable is not defined');
  }
  
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  // Add event listener for connection errors to prevent app crashes
  pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
    // Don't crash the server on connection errors, but log them
  });
  
  console.log('Database connection pool initialized');
} catch (error) {
  console.error('Failed to initialize database connection:', error);
  // Create a dummy pool that will throw clearer errors when used
  pool = {
    query: () => {
      throw new Error('Database connection failed. Check DATABASE_URL and ensure database is running.');
    },
    connect: () => {
      throw new Error('Database connection failed. Check DATABASE_URL and ensure database is running.');
    }
  } as any;
}

// Create a Drizzle instance
export const db = drizzle(pool);

// Export the pool for direct access
export { pool }; 