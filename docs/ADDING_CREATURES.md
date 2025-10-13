# How to Add New Creatures

## Proportional ID Namespaces

Each tier has a namespace **proportional to its drop rate**:

- **Common: 0-999** (1000 IDs, 70% drops)
- **Rare: 1000-1499** (500 IDs, 25% drops)
- **Epic: 1500-1599** (100 IDs, 4.5% drops)
- **Deity: 1600-1649** (50 IDs, 0.5% drops)

**Benefits:**

- ✅ Namespace sizes match expected creature variety
- ✅ No wasted space for rare tiers
- ✅ Max ID 1649 (fits in uint16 for gas savings)
- ✅ Each tier is independent

## Adding Creatures (Auto-Sync!)

**Step 1: Add creatures to data file**

Edit `apps/web/src/data/creatures.data.ts`:

```typescript
// Add new creatures with sequential IDs
{ id: 60, name: "Llama", rarity: "common", description: "..." },
{ id: 61, name: "Alpaca", rarity: "common", description: "..." },
{ id: 1020, name: "Cheetah", rarity: "rare", description: "..." },
{ id: 1512, name: "Moon-Beast", rarity: "epic", description: "..." },
{ id: 1605, name: "Dagon", rarity: "deity", description: "..." },
```

**Step 2: Sync to contract**

```bash
cd apps/contracts
yarn add-creatures
```

**The script automatically:**

- ✅ Parses creatures from your data file
- ✅ Finds highest ID per tier
- ✅ Compares with contract state
- ✅ Updates contract if needed
- ✅ Shows exactly what was added

**Step 3: Redeploy frontend**

```bash
cd apps/web
yarn build
```

**That's it!** No manual ID tracking needed. 🎉

## Add to Specific Tier Only

Just add creatures to the data file for that tier:

```typescript
// Add 50 new commons (IDs 60-109)
{ id: 60, name: "Llama", rarity: "common", description: "..." },
{ id: 61, name: "Alpaca", rarity: "common", description: "..." },
// ... add up to ID 109

// Don't add to other tiers
```

Then run `yarn add-creatures` - only common tier will be updated!

**Each tier is completely independent!**

## Why This Design?

**Before (Sequential IDs):**

```
Add 10 commons → All subsequent tiers shift!
```

**After (Proportional Namespaces):**

```
Common: 0-999    (1000 IDs) ← Add here, others unaffected
Rare:   1000-1499 (500 IDs)  ← Independent!
Epic:   1500-1599 (100 IDs)  ← Independent!
Deity:  1600-1649 (50 IDs)   ← Independent!
```

**Plus:**

- ✅ uint16 for IDs and levels (gas efficient)
- ✅ Auto-sync script (no manual tracking)
- ✅ Proportional sizes (makes sense for each rarity)

## Security

Owner powers:

- Update creature counts (can only increase, not decrease)
- Upgrade contract logic

Owner cannot:

- Access user data
- Modify collections
- Bypass cooldowns

Recommendation: Use multi-sig wallet for owner key.
