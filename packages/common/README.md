# @eldritchain/common

Shared constants, types, and utilities for the Eldritchain monorepo.

## Purpose

Single source of truth for:

- Creature ID ranges and rarity constants
- Rarity calculation logic
- Network configurations (viem chains)
- Environment variable validation
- Shared TypeScript types
- Utility functions

## Usage

```typescript
import {
  creatureRanges,
  getCreatureRarity,
  isValidCreatureId,
  getNetwork,
  assertEnv,
  type Rarity,
  type NetworkName,
} from "@eldritchain/common";

// Get rarity from creature ID
const rarity = getCreatureRarity(1601); // "deity"

// Check if ID is valid
const valid = isValidCreatureId(1601); // true

// Access ranges
console.log(creatureRanges.deity.base); // 1600
console.log(creatureRanges.deity.max); // 1649

// Get network configuration
const network = getNetwork("polygonAmoy");
console.log(network.chain.id); // 80002
console.log(network.chain.rpcUrls); // RPC URLs from viem

// Validate environment variables
const port = assertEnvInt(process.env.PORT, "PORT");
const address = assertEnvAddress(process.env.CONTRACT, "CONTRACT");
```

## Exported Constants

### `creatureRanges`

```typescript
{
  common: { base: 0, max: 999, namespaceSize: 1000 },
  rare: { base: 1000, max: 1499, namespaceSize: 500 },
  epic: { base: 1500, max: 1599, namespaceSize: 100 },
  deity: { base: 1600, max: 1649, namespaceSize: 50 },
}
```

### `rarityTiers`

```typescript
["common", "rare", "epic", "deity"];
```

## Exported Functions

### Creature Functions

**`getCreatureRarity(creatureId: number): Rarity`**  
Determines rarity tier based on creature ID.

**`isValidCreatureId(creatureId: number): boolean`**  
Checks if a creature ID is within valid ranges.

**`getRarityDropRate(rarity: Rarity): number`**  
Returns the drop rate percentage for a rarity tier.

### Environment Validation

**`assertEnv(value: string | undefined, name: string): string`**  
Asserts that a required environment variable exists.

**`assertEnvInt(value: string | undefined, name: string): number`**  
Parses and validates a required integer environment variable.

**`assertEnvBigInt(value: string | undefined, name: string): bigint`**  
Parses and validates a required bigint environment variable.

**`assertEnvAddress(value: string | undefined, name: string): `0x${string}``**  
Validates a required Ethereum address (0x... format, 42 characters).

Example usage:

```typescript
import { assertEnv, assertEnvAddress } from "@eldritchain/common";

const config = {
  contractAddress: assertEnvAddress(process.env.CONTRACT_ADDRESS, "CONTRACT_ADDRESS"),
  apiKey: assertEnv(process.env.API_KEY, "API_KEY"),
};
// Throws clear error if variables are missing or invalid
```

## Exported Types

- `Rarity` - Union type of rarity tiers
- `UserCollection` - User collection data structure
- `SummonEvent` - Summon event data
- `LeaderboardEntry` - Leaderboard entry structure

## Development

```bash
# Build
yarn build

# Watch mode (for development)
yarn dev
```
