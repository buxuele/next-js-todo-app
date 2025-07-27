// Environment variable validation for production deployment

interface EnvConfig {
  name: string;
  required: boolean;
  description: string;
  defaultValue?: string;
  validator?: (value: string) => boolean;
}

const envConfig: EnvConfig[] = [
  {
    name: "DATABASE_URL",
    required: true,
    description: "PostgreSQL database connection string",
    validator: (value) =>
      value.startsWith("postgres://") || value.startsWith("postgresql://"),
  },
  {
    name: "NODE_ENV",
    required: false,
    description: "Node.js environment",
    defaultValue: "development",
    validator: (value) => ["development", "production", "test"].includes(value),
  },
  {
    name: "NEXTAUTH_SECRET",
    required: false,
    description: "NextAuth.js secret for JWT encryption",
  },
  {
    name: "NEXTAUTH_URL",
    required: false,
    description: "NextAuth.js canonical URL",
    validator: (value) =>
      value.startsWith("http://") || value.startsWith("https://"),
  },
  {
    name: "VERCEL_URL",
    required: false,
    description: "Vercel deployment URL (automatically set by Vercel)",
  },
];

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
  invalid: string[];
}

export function validateEnvironmentVariables(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const config of envConfig) {
    const value = process.env[config.name];

    // Check if required variable is missing
    if (config.required && !value) {
      missing.push(config.name);
      errors.push(
        `Missing required environment variable: ${config.name} - ${config.description}`
      );
      continue;
    }

    // Skip validation if variable is not set and not required
    if (!value && !config.required) {
      if (config.defaultValue) {
        warnings.push(
          `Using default value for ${config.name}: ${config.defaultValue}`
        );
      }
      continue;
    }

    // Validate the value if validator is provided
    if (value && config.validator && !config.validator(value)) {
      invalid.push(config.name);
      errors.push(`Invalid value for ${config.name}: ${config.description}`);
    }
  }

  // Additional validations
  if (process.env.NODE_ENV === "production") {
    // In production, warn about missing optional but recommended variables
    const recommendedVars = ["NEXTAUTH_SECRET", "NEXTAUTH_URL"];
    for (const varName of recommendedVars) {
      if (!process.env[varName]) {
        warnings.push(
          `Recommended environment variable missing in production: ${varName}`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missing,
    invalid,
  };
}

export function logValidationResults(results: ValidationResult): void {
  if (results.isValid) {
    console.log("✅ Environment validation passed");
  } else {
    console.error("❌ Environment validation failed");
  }

  if (results.errors.length > 0) {
    console.error("\n🚨 Errors:");
    results.errors.forEach((error) => console.error(`  - ${error}`));
  }

  if (results.warnings.length > 0) {
    console.warn("\n⚠️  Warnings:");
    results.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  if (results.missing.length > 0) {
    console.error("\n📋 Missing required variables:");
    results.missing.forEach((missing) => console.error(`  - ${missing}`));
  }

  if (results.invalid.length > 0) {
    console.error("\n🔧 Invalid values:");
    results.invalid.forEach((invalid) => console.error(`  - ${invalid}`));
  }
}

// Utility function to get environment info
export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV || "development",
    isProduction: process.env.NODE_ENV === "production",
    isDevelopment: process.env.NODE_ENV === "development",
    isVercel: !!process.env.VERCEL,
    vercelUrl: process.env.VERCEL_URL,
    databaseConfigured: !!process.env.DATABASE_URL,
    timestamp: new Date().toISOString(),
  };
}
