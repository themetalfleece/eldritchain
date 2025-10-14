import { startApiServer } from "./api/server";
import { connectDatabase } from "./db/connection";
import { startEventListener } from "./indexer/event-listener";

async function main() {
  console.log("🎮 Eldritchain Indexer Starting...\n");

  // Connect to MongoDB
  await connectDatabase();

  // Start event listener
  await startEventListener();

  // Start API server
  await startApiServer();

  console.log("✅ All systems operational!\n");
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  process.exit(0);
});

// Start the application
main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
