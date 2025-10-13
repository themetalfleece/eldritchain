# Creature ID System

## Proportional Namespaces

Each tier has a namespace **proportional to its drop rate**:

| ID Range  | Rarity | Size | Drop% | Current Usage  | Available |
| --------- | ------ | ---- | ----- | -------------- | --------- |
| 0-999     | Common | 1000 | 70%   | 60 (0-59)      | 940 more  |
| 1000-1499 | Rare   | 500  | 25%   | 20 (1000-1019) | 480 more  |
| 1500-1599 | Epic   | 100  | 4.5%  | 12 (1500-1511) | 88 more   |
| 1600-1649 | Deity  | 50   | 0.5%  | 5 (1600-1604)  | 45 more   |

**Max ID: 1649** (fits in uint16, saves gas!)

## Why Proportional Sizes?

**Common (1000 IDs):**

- Highest drop rate (70%)
- Most variety needed
- Players collect many

**Rare (500 IDs):**

- Medium drop rate (25%)
- Half the space of commons (~proportional to relative drop rate)

**Epic (100 IDs):**

- Low drop rate (4.5%)
- Smaller space, still room to expand

**Deity (50 IDs):**

- Ultra-rare (0.5%)
- Small space for exclusive creatures
- Still room for 10x expansion (5 → 50)

## Adding Creatures

### Before (Equal namespaces) ❌

```
All tiers: 1000 IDs each = wasteful for rare tiers
```

### After (Proportional namespaces) ✅

```
Common: 1000 IDs  ← Biggest, most variety
Rare:   500 IDs   ← Half of common
Epic:   100 IDs   ← Appropriate for rarity
Deity:  50 IDs    ← Small but sufficient
```

## Smart Sync Script

The `add-creatures.ts` script automatically reads `creatures.data.ts`:

```bash
# Just add creatures to the data file, then run:
yarn add-creatures
```

**It will:**

1. Parse all creatures from data file
2. Find highest ID per tier
3. Compare with contract state
4. Update contract if needed
5. Show exactly what was added

**No more manual ID tracking!** 🎉

## Contract Variables (Optimized)

```solidity
uint16 public constant COMMON_BASE = 0;    // Fixed
uint16 public commonLast = 59;              // Last ID in use

// Count calculated: last - base + 1
function commonCount() public view returns (uint16) {
  return commonLast - COMMON_BASE + 1;  // 59 - 0 + 1 = 60
}
```

**Storage savings:**

- ✅ Only stores `BASE` (constant) and `Last` (1 variable)
- ✅ Count calculated on-demand (free)
- ✅ uint16 everywhere (~20% gas savings vs uint256)

## Level Storage (uint16)

```solidity
mapping(address => mapping(uint16 => uint16)) public userCreatures;
```

**Why uint16 for levels?**

- 1 summon per day
- Max 65,535 summons = 179 years of daily play
- Saves gas on every summon!

## Example: Adding Creatures

**Step 1:** Add to `creatures.data.ts`:

```typescript
{ id: 60, name: "Llama", rarity: "common", description: "..." },
{ id: 61, name: "Alpaca", rarity: "common", description: "..." },
{ id: 1020, name: "Cheetah", rarity: "rare", description: "..." },
```

**Step 2:** Run sync:

```bash
yarn add-creatures
```

**Output:**

```
Creatures found in data file:
  Common: 62 creatures (highest ID: 61)
  Rare: 21 creatures (highest ID: 1020)

Updating contract...
✅ Contract updated!

Creatures added:
  +2 commons (60-61)
  +1 rare (1020)
```

**That's it!** No manual ID management. The script figures it out! 🚀
