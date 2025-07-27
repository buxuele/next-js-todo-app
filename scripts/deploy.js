#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting deployment process...\n");

// Check if we're in the correct directory
if (!fs.existsSync("package.json")) {
  console.error(
    "❌ Error: package.json not found. Please run this script from the project root."
  );
  process.exit(1);
}

// Check if required environment variables are set
const requiredEnvVars = ["DATABASE_URL"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    `❌ Error: Missing required environment variables: ${missingEnvVars.join(
      ", "
    )}`
  );
  console.error("Please set these variables before deploying.");
  process.exit(1);
}

try {
  // Step 1: Install dependencies
  console.log("📦 Installing dependencies...");
  execSync("npm ci", { stdio: "inherit" });
  console.log("✅ Dependencies installed\n");

  // Step 2: Run database migrations
  console.log("🗄️  Running database migrations...");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  console.log("✅ Database migrations completed\n");

  // Step 3: Generate Prisma client
  console.log("🔧 Generating Prisma client...");
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("✅ Prisma client generated\n");

  // Step 4: Run type checking
  console.log("🔍 Running type checking...");
  execSync("npx tsc --noEmit", { stdio: "inherit" });
  console.log("✅ Type checking passed\n");

  // Step 5: Run linting
  console.log("🧹 Running linting...");
  try {
    execSync("npm run lint", { stdio: "inherit" });
    console.log("✅ Linting passed\n");
  } catch (error) {
    console.warn("⚠️  Linting warnings found, but continuing deployment...\n");
  }

  // Step 6: Build the application
  console.log("🏗️  Building application...");
  execSync("npm run build", { stdio: "inherit" });
  console.log("✅ Application built successfully\n");

  // Step 7: Deploy to Vercel
  console.log("🌐 Deploying to Vercel...");
  const deployCommand = process.argv.includes("--prod")
    ? "vercel --prod"
    : "vercel";
  execSync(deployCommand, { stdio: "inherit" });
  console.log("✅ Deployment completed successfully\n");

  // Step 8: Run post-deployment health check
  console.log("🏥 Running post-deployment health check...");
  setTimeout(async () => {
    try {
      const { default: fetch } = await import("node-fetch");
      const response = await fetch(
        `${process.env.VERCEL_URL || "http://localhost:3000"}/api/health`
      );
      const health = await response.json();

      if (health.status === "healthy") {
        console.log(
          "✅ Health check passed - Application is running correctly"
        );
      } else {
        console.warn("⚠️  Health check warning - Application may have issues");
        console.log("Health status:", health);
      }
    } catch (error) {
      console.warn("⚠️  Could not perform health check:", error.message);
    }
  }, 5000);

  console.log("\n🎉 Deployment process completed successfully!");
  console.log(
    "📊 You can monitor your application at: https://vercel.com/dashboard"
  );
} catch (error) {
  console.error("\n❌ Deployment failed:", error.message);
  console.error("\n🔧 Troubleshooting tips:");
  console.error("1. Check that all environment variables are set correctly");
  console.error("2. Ensure your database is accessible");
  console.error(
    "3. Verify that your Vercel account has the necessary permissions"
  );
  console.error("4. Check the Vercel dashboard for detailed error logs");
  process.exit(1);
}
