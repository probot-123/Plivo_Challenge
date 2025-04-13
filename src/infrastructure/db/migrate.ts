import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const runMigration = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  // This will run migrations on the database, creating tables if they don't exist
  // and adding new columns if they're missing.
  console.log('Running migrations...');
  
  // Path is relative to where the script is executed from (project root)
  await migrate(db, { migrationsFolder: join(process.cwd(), 'drizzle') });
  
  console.log('Migrations completed successfully');

  await pool.end();
};

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 