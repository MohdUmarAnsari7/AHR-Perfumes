import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from './schema';

const { Pool } = pkg;

const cleanEnvVar = (val: string | undefined): string => {
  if (!val) return "";
  let clean = val;
  if (clean.startsWith('"') && clean.endsWith('"')) {
    clean = clean.slice(1, -1);
  }
  if (clean.startsWith("'") && clean.endsWith("'")) {
    clean = clean.slice(1, -1);
  }
  return clean.trim();
};

const rawDatabaseUrl = cleanEnvVar(process.env.DATABASE_URL);

// Automatically rewrite the direct Supabase URL to the IPv4 pooler URL
// to bypass IPv6 connection limitations on platforms like Render.
const getProcessedDatabaseUrl = (url: string): string => {
  if (!url) return url;
  if (url.includes('db.yedgouajxymuasmyzlpd.supabase.co')) {
    console.log("[DB Config] Automatically patching direct IPv6 connection to IPv4 pooler (aws-1-ap-southeast-1)...");
    return url
      .replace('db.yedgouajxymuasmyzlpd.supabase.co:5432', 'aws-1-ap-southeast-1.pooler.supabase.com:6543')
      .replace('postgresql://postgres:', 'postgres://postgres.yedgouajxymuasmyzlpd:')
      .replace('postgres://postgres:', 'postgres://postgres.yedgouajxymuasmyzlpd:');
  }
  return url;
};

export const databaseUrl = getProcessedDatabaseUrl(rawDatabaseUrl);

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

