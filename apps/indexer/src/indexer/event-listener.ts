import { getCreatureRarity } from "@eldritchain/common";
import { createPublicClient, http, parseAbiItem, type Log } from "viem";
import { config } from "../config";
import { IndexerState, SummonEvent } from "../db/models";

const contractAbi = [
  parseAbiItem(
    "event CreatureSummoned(address indexed summoner, uint16 indexed creatureId, uint16 level, uint256 timestamp)"
  ),
];

const publicClient = createPublicClient({
  transport: http(config.contract.rpcUrl),
});

/** Process a single CreatureSummoned event */
async function processEvent(log: Log): Promise<void> {
  const { args, blockNumber, transactionHash } = log as Log & {
    args: { summoner: string; creatureId: bigint; level: bigint; timestamp: bigint };
    blockNumber: bigint;
    transactionHash: string;
  };
  if (!args?.summoner || args?.creatureId === undefined || !transactionHash) {
    console.warn("Invalid event args:", log);
    return;
  }

  const address = args.summoner.toLowerCase();
  const creatureId = Number(args.creatureId);
  const level = Number(args.level);
  const timestamp = new Date(Number(args.timestamp) * 1000);
  const rarity = getCreatureRarity(creatureId);

  // Check if already processed (idempotency)
  const exists = await SummonEvent.findOne({ transactionHash });
  if (exists) {
    console.log(`⏭️  Skipping duplicate: ${transactionHash}`);
    return;
  }

  // Insert summon event
  await SummonEvent.create({
    address,
    creatureId,
    rarity,
    level,
    timestamp,
    blockNumber: blockNumber.toString(),
    transactionHash,
  });

  console.log(`📦 Processed: ${address} summoned ${rarity} #${creatureId} (level ${level})`);
}

/** Fetch and process events from a block range */
async function processBlockRange(fromBlock: bigint, toBlock: bigint): Promise<void> {
  console.log(`🔍 Scanning blocks ${fromBlock} → ${toBlock}...`);

  const logs = await publicClient.getLogs({
    address: config.contract.address,
    event: contractAbi[0],
    fromBlock,
    toBlock,
  });

  console.log(`📝 Found ${logs.length} events`);

  for (const log of logs) {
    await processEvent(log);
  }

  // Update indexer state
  await IndexerState.findOneAndUpdate(
    {},
    {
      lastProcessedBlock: toBlock.toString(),
      updatedAt: new Date(),
    },
    { upsert: true }
  );
}

/** Main indexer loop */
export async function startEventListener(): Promise<void> {
  console.log("🚀 Starting event listener...");
  console.log(`📍 Contract: ${config.contract.address}`);
  console.log(`🌐 Network: ${config.contract.networkName} (Chain ID: ${config.contract.chainId})`);
  console.log(`🔗 RPC: ${config.contract.rpcUrl}`);

  // Get last processed block or start from config
  const state = await IndexerState.findOne();
  let lastBlock = state?.lastProcessedBlock
    ? BigInt(state.lastProcessedBlock.toString())
    : config.indexer.startBlock;

  console.log(`⏮️  Starting from block ${lastBlock}\n`);

  // Initial catch-up scan
  const currentBlock = await publicClient.getBlockNumber();
  if (lastBlock < currentBlock) {
    console.log("⚡ Catching up with historical events...");
    await processBlockRange(lastBlock, currentBlock);
    lastBlock = currentBlock;
  }

  // Poll for new blocks
  setInterval(async () => {
    try {
      const latestBlock = await publicClient.getBlockNumber();

      if (latestBlock > lastBlock) {
        await processBlockRange(lastBlock + 1n, latestBlock);
        lastBlock = latestBlock;
      }
    } catch (error) {
      console.error("❌ Error in event listener:", error);
    }
  }, config.indexer.pollInterval);

  console.log("✅ Event listener started\n");
}
