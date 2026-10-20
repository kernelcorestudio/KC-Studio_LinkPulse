import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Auto-load root .env if process.loadEnvFile is available (Node 20.12+)
if (process.env.NODE_ENV !== 'test' && !process.execArgv.includes('--test') && typeof process.loadEnvFile === 'function') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const candidatePaths = [
    path.resolve(__dirname, '../../.env'), // repo root .env
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../.env'),
  ];
  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      try {
        process.loadEnvFile(envPath);
        break;
      } catch {
        // ignore parsing error
      }
    }
  }
}

const env = process.env;

if (!env.JWT_SECRET) {
  if (env.NODE_ENV === 'production' && !env.VERCEL) {
    console.error('FATAL: JWT_SECRET must be set in production');
    process.exit(1);
  }
  console.warn('[config] JWT_SECRET not set - using an insecure fallback secret');
}

export const config = {
  port: Number(env.PORT || 3001),
  // Base URL that serves short links (the redirect host), e.g. https://linkpulse.onrender.com
  baseUrl:
    env.BASE_URL ||
    (env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
      : env.VERCEL_URL
        ? `https://${env.VERCEL_URL}`
        : `http://localhost:${env.PORT || 3001}`),
  // Frontend origin(s) for CORS, comma separated
  clientOrigins: Array.from(
    new Set([
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://localhost:3001',
      'https://kcstudio-linkpluse.vercel.app',
      ...(env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
      ...(env.VERCEL_URL ? [`https://${env.VERCEL_URL}`] : []),
      ...(env.CLIENT_ORIGIN ? env.CLIENT_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean) : []),
    ]),
  ),
  databaseUrl: (env.NODE_ENV === 'test' || process.execArgv.includes('--test')) ? null : (env.DATABASE_URL || null), // absent => local SQLite fallback
  supabaseUrl: env.SUPABASE_URL || null,
  supabaseAnonKey: env.SUPABASE_ANON_KEY || null,
  supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || null,
  sqliteFile: env.SQLITE_FILE || (env.VERCEL ? '/tmp/linkpulse.db' : 'linkpulse.db'),
  jwtSecret: env.JWT_SECRET || 'dev-insecure-secret-change-me',
  // Salt used when hashing client IPs so raw IPs are never stored
  ipHashSalt: env.IP_HASH_SALT || env.JWT_SECRET || 'dev-insecure-salt',
  cookieSecure: env.COOKIE_SECURE === 'true' || Boolean(env.VERCEL),
};
