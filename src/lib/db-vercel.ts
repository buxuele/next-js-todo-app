import { PrismaClient } from "@prisma/client";

// Optimized Prisma client for Vercel serverless functions
const createPrismaClient = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

// Global variable to store the Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a single instance of Prisma client
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// In development, store the client globally to prevent multiple instances
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Optimized connection management for serverless
export async function connectToDatabase() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

// Graceful disconnection
export async function disconnectFromDatabase() {
  try {
    await prisma.$disconnect();
    console.log("✅ Database disconnected successfully");
  } catch (error) {
    console.error("❌ Database disconnection failed:", error);
  }
}

// Health check function for API routes
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "healthy", timestamp: new Date().toISOString() };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
}

// Connection warming for cold starts
export async function warmConnection() {
  try {
    // Simple query to warm up the connection
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Connection warming failed:", error);
    return false;
  }
}
