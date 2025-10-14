import { startApiServer } from "./api/server";
import { connectDatabase } from "./db/connection";

async function main() {
  console.log("🌐 Eldritchain API Server Starting...\n");

  // Connect to MongoDB
  await connectDatabase();

  // Start API server
  await startApiServer();

  console.log("✅ API Server operational!\n");
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 API Server shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 API Server shutting down gracefully...");
  process.exit(0);
});

// Start the application
main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
