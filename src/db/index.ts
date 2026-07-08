import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from './schema';

const { Pool } = pkg;

export const databaseUrl = process.env.DATABASE_URL || "";
export const isDbConfigured = Boolean(
  databaseUrl && 
  !databaseUrl.includes("localhost") && 
  !databaseUrl.includes("127.0.0.1") &&
  !databaseUrl.includes("user:password")
);

export const pool = new Pool({
  connectionString: databaseUrl || "postgres://localhost:5432/ahr_perfumes",
  // Set short timeout if we suspect it might fail
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const db = drizzle(pool, { schema });

