import { getCreatureRarity } from "@eldritchain/common";
import mongoose from "mongoose";
import { createPublicClient, http, parseAbiItem, type Log } from "viem";
import { indexerConfig } from "../config.indexer";
import { IndexerState, SummonEvent } from "../db/models";

const contractAbi = [
  parseAbiItem(
    "event CreatureSummoned(address indexed summoner, uint16 indexed creatureId, uint16 level, uint256 timestamp)"
  ),
];

const publicClient = createPublicClient({
  transport: http(indexerConfig.contract.rpcUrl),
});

/** Process a single CreatureSummoned event within a transaction */
async function processEventInTransaction(log: Log, session: mongoose.ClientSession): Promise<void> {
  const { args, blockNumber, transactionHash } = log as Log & {
    args: { summoner: string; creatureId: bigint; level: bigint; timestamp: bigint };
    blockNumber: bigint;
    transactionHash: string;
  };

  if (!args?.summoner || args?.creatureId === undefined || !transactionHash) {
    console.warn("⚠️ Invalid event args, skipping:", {
      transactionHash,
      blockNumber,
      args: args
        ? {
            summoner: args.summoner,
            creatureId: args.creatureId,
            level: args.level,
            timestamp: args.timestamp,
          }
        : null,
    });
    return; // Skip malformed events (shouldn't happen with valid contracts)
  }

  const address = args.summoner.toLowerCase();
  const creatureId = Number(args.creatureId);
  const level = Number(args.level);
  const timestamp = new Date(Number(args.timestamp) * 1000);
  const rarity = getCreatureRarity(creatureId);

  // Check if already processed (idempotency)
  const exists = await SummonEvent.findOne({ transactionHash }).session(session);
  if (exists) {
    console.log(`⏭️  Skipping duplicate: ${transactionHash}`);
    return;
  }

  try {
    // Insert summon event within transaction
    await SummonEvent.create(
      [
        {
          address,
          creatureId,
          rarity,
          level,
          timestamp,
          blockNumber: blockNumber.toString(),
          transactionHash,
        },
      ],
      { session }
    );
  } catch (error) {
    console.error(`❌ Database insert failed for ${transactionHash}:`, {
      error: error instanceof Error ? error.message : String(error),
      address,
      creatureId,
      rarity,
      level,
      timestamp: timestamp.toISOString(),
      blockNumber: blockNumber.toString(),
      transactionHash,
    });
    throw error; // Re-throw to trigger transaction rollback
  }
}

/** Fetch and process events from a single block range within a transaction */
async function processSingleChunkInTransaction(
  fromBlock: bigint,
  toBlock: bigint,
  session: mongoose.ClientSession
): Promise<void> {
  try {
    const logs = await publicClient.getLogs({
      address: indexerConfig.contract.address,
      event: contractAbi[0],
      fromBlock,
      toBlock,
    });

    if (logs.length === 0) {
      return; // No events to process
    }

    // Process all events within the transaction
    for (const log of logs) {
      await processEventInTransaction(log, session);
    }
  } catch (error) {
    console.error(`❌ Failed to process chunk ${fromBlock}-${toBlock}:`, {
      error: error instanceof Error ? error.message : String(error),
      fromBlock: fromBlock.toString(),
      toBlock: toBlock.toString(),
      contractAddress: indexerConfig.contract.address,
    });
    throw error; // Re-throw to trigger transaction rollback
  }
}

/** Fetch and process events from a block range with transactions */
async function processBlockRange(fromBlock: bigint, toBlock: bigint): Promise<void> {
  // Use MongoDB transaction for atomic processing + state update
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Process events in this block range
      await processSingleChunkInTransaction(fromBlock, toBlock, session);

      // Update state after successful processing
      await IndexerState.findOneAndUpdate(
        {},
        {
          lastProcessedBlock: toBlock.toString(),
          updatedAt: new Date(),
        },
        { upsert: true, session }
      );
    });
  } catch (error) {
    console.error(
      `❌ Block range failed (blocks ${fromBlock}-${toBlock}):`,
      error instanceof Error ? error.message : String(error)
    );
    throw error; // Re-throw to trigger retry
  } finally {
    await session.endSession();
  }
}

/** Main indexer loop */
export async function startEventListener(): Promise<void> {
  console.log("🚀 Starting event listener...");
  console.log(`📍 Contract: ${indexerConfig.contract.address}`);
  console.log(
    `🌐 Network: ${indexerConfig.contract.networkName} (Chain ID: ${indexerConfig.contract.chainId})`
  );
  console.log(`🔗 RPC: ${indexerConfig.contract.rpcUrl}`);

  // Get initial last processed block for logging
  const initialState = await IndexerState.findOne();
  const initialLastBlock = initialState?.lastProcessedBlock
    ? BigInt(initialState.lastProcessedBlock.toString())
    : indexerConfig.startBlock;

  console.log(`⏮️  Starting from block ${initialLastBlock}\n`);

  // Poll for new blocks every POLL_INTERVAL
  setInterval(async () => {
    try {
      // Get current last processed block from database
      const state = await IndexerState.findOne();
      const lastBlock = state?.lastProcessedBlock
        ? BigInt(state.lastProcessedBlock.toString())
        : indexerConfig.startBlock;

      const latestBlock = await publicClient.getBlockNumber();

      if (latestBlock > lastBlock) {
        // Process up to maxBlocksPerPoll blocks at a time
        const fromBlock = lastBlock + 1n;
        const blocksToProcess = latestBlock - lastBlock;
        const maxBlocksPerPoll = BigInt(indexerConfig.maxBlocksPerPoll);
        const blocksThisPoll =
          blocksToProcess > maxBlocksPerPoll ? maxBlocksPerPoll : blocksToProcess;
        const toBlock = lastBlock + blocksThisPoll;

        await processBlockRange(fromBlock, toBlock);
      }
    } catch (error) {
      console.error("❌ Error in event listener (will retry next interval):", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }, indexerConfig.pollInterval);

  console.log("✅ Event listener started\n");
}
