import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Health check endpoint to verify the application is running correctly
 * Checks:
 * - API is responding
 * - Database connection is working
 * - Environment variables are set
 */
export async function GET() {
  const checks: Record<string, { status: string; message?: string }> = {};
  let allHealthy = true;

  // Check environment variables
  checks.env = {
    status: 'checking',
  };
  const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
  
  if (missingVars.length > 0) {
    checks.env = {
      status: 'error',
      message: `Missing env vars: ${missingVars.join(', ')}`,
    };
    allHealthy = false;
  } else {
    checks.env = { status: 'ok' };
  }

  // Check database connection
  checks.database = {
    status: 'checking',
  };
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok' };
  } catch (err: unknown) {
    checks.database = {
      status: 'error',
      message: err instanceof Error ? err.message : 'Database connection failed',
    };
    allHealthy = false;
  }

  // Check if we can query the User table (migrations ran)
  checks.migrations = {
    status: 'checking',
  };
  
  try {
    await prisma.user.count();
    checks.migrations = { status: 'ok' };
  } catch (err: unknown) {
    checks.migrations = {
      status: 'error',
      message: 'User table not found - migrations may not have run',
    };
    allHealthy = false;
  }

  const status = allHealthy ? 200 : 503;
  
  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'unknown',
    },
    { status }
  );
}
