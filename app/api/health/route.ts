import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Health check endpoint to verify the application is running correctly
 * GET /api/health
 */
export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check required environment variables
    const requiredEnvVars = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    };

    const allEnvVarsPresent = Object.values(requiredEnvVars).every(Boolean);

    if (!allEnvVarsPresent) {
      return NextResponse.json(
        {
          status: 'warning',
          message: 'Application is running but some environment variables are missing',
          database: 'connected',
          environment: requiredEnvVars,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: 'ok',
        message: 'Application is healthy',
        database: 'connected',
        environment: 'configured',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
