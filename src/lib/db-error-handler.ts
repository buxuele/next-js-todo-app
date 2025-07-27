import { Prisma } from "@prisma/client";

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = "DatabaseError";
  }
}

export function handleDatabaseError(error: unknown): never {
  console.error("Database operation failed:", error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        throw new DatabaseError("A record with this data already exists");
      case "P2025":
        throw new DatabaseError("Record not found");
      case "P2003":
        throw new DatabaseError("Foreign key constraint failed");
      case "P2014":
        throw new DatabaseError("Invalid ID provided");
      default:
        throw new DatabaseError(`Database error: ${error.message}`);
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    throw new DatabaseError("Unknown database error occurred");
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    throw new DatabaseError("Database connection panic");
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    throw new DatabaseError("Failed to initialize database connection");
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new DatabaseError("Invalid data provided to database");
  }

  throw new DatabaseError("Unexpected database error", error);
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      // Only retry on connection errors
      if (
        error instanceof Prisma.PrismaClientUnknownRequestError ||
        error instanceof Prisma.PrismaClientInitializationError
      ) {
        console.warn(
          `Database operation failed, retrying (${attempt}/${maxRetries})...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        continue;
      }

      // Don't retry on validation or known errors
      throw error;
    }
  }

  throw lastError;
}
