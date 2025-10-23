import { connectDatabase } from "./db/connection";
import { startEventListener } from "./indexer/event-listener";

async function main() {
  console.log("🔍 Eldritchain Event Indexer Starting...\n");

  // Connect to MongoDB
  await connectDatabase();

  // Start event listener
  await startEventListener();

  console.log("✅ Event Indexer operational!\n");
}

// Graceful shutdown is handled within the event listener loop

// Start the application
main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
