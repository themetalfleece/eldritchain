import { env } from "@/lib/env.config";

export const CONTRACT_ADDRESS = env.contractAddress;

export const CONTRACT_ABI = [
  {
    inputs: [],
    name: "summon",
    outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "canSummon",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserCollection",
    outputs: [
      { internalType: "uint16[]", name: "creatureIds", type: "uint16[]" },
      { internalType: "uint16[]", name: "levels", type: "uint16[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getNextSummonTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint16", name: "creatureId", type: "uint16" },
    ],
    name: "getCreatureLevel",
    outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "summoner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint16",
        name: "creatureId",
        type: "uint16",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "level",
        type: "uint16",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "CreatureSummoned",
    type: "event",
  },
] as const;
