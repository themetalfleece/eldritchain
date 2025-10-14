# UTC Day System

## How It Works

Eldritchain uses **UTC calendar days** instead of a 24-hour cooldown.

### Traditional 24-Hour Cooldown ❌

```
Summon at 11:00 PM → Must wait until 11:00 PM next day
```

### UTC Day System ✅

```
Summon at 11:59 PM → Can summon at 12:01 AM (2 minutes later!)
```

## Benefits

**For Players:**

- ✅ More flexible timing
- ✅ Feels like a true "daily" mechanic
- ✅ Can summon twice in <24 hours if done near midnight

**For Developer:**

- ✅ Simpler logic (`day1 != day2`)
- ✅ Fair across all timezones (UTC as reference)
- ✅ No timezone complexity

## How Days Are Calculated

```solidity
function getCurrentDay(uint256 timestamp) internal pure returns (uint256) {
  return timestamp / 86400; // 86400 seconds = 1 day
}

function canSummon(address user) public view returns (bool) {
  if (lastSummonTime[user] == 0) return true;
  return getCurrentDay(block.timestamp) > getCurrentDay(lastSummonTime[user]);
}
```

**Example:**

- Timestamp 86399 (Day 0, 23:59:59 UTC)
- Timestamp 86400 (Day 1, 00:00:00 UTC)
- Days are different → Can summon! ✅

## Frontend Timer

The countdown shows time until next UTC midnight:

```typescript
// In SummonButton.component.tsx
const nextSummonTime = await contract.getNextSummonTime(address);
// Returns timestamp of next UTC day start
```

Display: "Next summon in: 2h 13m 47s" (until midnight UTC)

## Use Cases

**Strategy 1: Early Bird**

- Summon at 12:01 AM every day
- Consistent schedule

**Strategy 2: Night Owl**

- Summon at 11:59 PM
- If you miss it, summon at 12:01 AM (same session!)

**Strategy 3: Flexible**

- Summon anytime during the day
- Next summon available at next UTC midnight

## Timezone Considerations

**All summons use UTC**, not local time:

- Player in PST (UTC-8): Summon resets at 4:00 PM local time
- Player in JST (UTC+9): Summon resets at 9:00 AM local time
- Player in UTC: Summon resets at midnight

**Everyone gets the same number of summons**, just at different local times. Fair!

## Edge Cases

**What if I summon at exactly midnight UTC?**

- You're starting a new day, so it counts for that day
- Can summon again next midnight

**What if blockchain time is off?**

- Blockchain uses consensus time
- Generally accurate within ~15 seconds
- Doesn't affect fairness (all users use same blockchain time)

**Can I game the system?**

- No! Block timestamps are set by validators
- You can't manipulate when a block is mined
- Random number uses multiple block parameters

## Comparison: 24h vs UTC Day

| Feature         | 24-Hour Cooldown | UTC Day System                            |
| --------------- | ---------------- | ----------------------------------------- |
| Min wait time   | Always 24 hours  | As little as 1 second                     |
| Max wait time   | 24 hours         | ~48 hours (if summon just after midnight) |
| Average wait    | 24 hours         | ~12 hours                                 |
| User experience | Strict           | Flexible                                  |
| Timezone fair   | Yes              | Yes                                       |
| Implementation  | Simple           | Slightly more complex                     |

**We chose UTC Day for better UX!** ✅

## Future: Timezone Support?

Could add timezone preferences, but adds complexity:

- More gas (store timezone per user)
- More contract logic
- Privacy concerns (timezone reveals location)

**UTC is simpler and fair for everyone.** 🌍
