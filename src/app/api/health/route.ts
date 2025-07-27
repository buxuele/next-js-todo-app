import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db-vercel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/health - Health check endpoint
export async function GET() {
  const startTime = Date.now();

  try {
    // Check database health
    const dbHealth = await checkDatabaseHealth();

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Determine overall health status
    const isHealthy = dbHealth.status === "healthy";

    const healthData = {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "unknown",
      database: dbHealth,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
    };

    return NextResponse.json(healthData, {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        error: error instanceof Error ? error.message : "Unknown error",
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "unknown",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Content-Type": "application/json",
        },
      }
    );
  }
}
