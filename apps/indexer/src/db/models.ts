import mongoose from "mongoose";
import { type Rarity, rarityTiers } from "@eldritchain/common";

/** Individual summon event */
export interface ISummonEvent {
  address: string;
  creatureId: number;
  rarity: Rarity;
  level: number;
  timestamp: Date;
  blockNumber: bigint;
  transactionHash: string;
}

const summonEventSchema = new mongoose.Schema<ISummonEvent>(
  {
    address: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    creatureId: {
      type: Number,
      required: true,
    },
    rarity: {
      type: String,
      required: true,
      enum: rarityTiers,
      index: true,
    },
    level: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    blockNumber: {
      type: String,
      required: true,
      get: (v: string) => BigInt(v),
      set: (v: bigint) => v.toString(),
    },
    transactionHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
summonEventSchema.index({ address: 1, timestamp: -1 }); // User history
summonEventSchema.index({ rarity: 1, timestamp: -1 }); // Rarity-based queries
summonEventSchema.index({ address: 1, rarity: 1 }); // User's creatures by rarity

export const SummonEvent = mongoose.model<ISummonEvent>("SummonEvent", summonEventSchema);

/** Indexer state tracking */
export interface IIndexerState {
  lastProcessedBlock: bigint;
  updatedAt: Date;
}

const indexerStateSchema = new mongoose.Schema<IIndexerState>({
  lastProcessedBlock: {
    type: String,
    required: true,
    get: (v: string) => BigInt(v),
    set: (v: bigint) => v.toString(),
  },
  updatedAt: { type: Date, default: Date.now },
});

export const IndexerState = mongoose.model<IIndexerState>("IndexerState", indexerStateSchema);
