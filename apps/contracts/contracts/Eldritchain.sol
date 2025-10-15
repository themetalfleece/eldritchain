// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Eldritchain is Initializable, UUPSUpgradeable, OwnableUpgradeable {
  // Fixed ID namespaces per rarity tier (proportional to drop rates)
  // Using uint16 since max ID is 1649 (uint16 max = 65535)

  // Common namespace: 0-999 (1000 IDs) - 70% drop rate
  uint16 public constant COMMON_BASE = 0;
  uint16 public commonLast; // Last ID in use (e.g., 59 for 60 creatures)

  // Rare namespace: 1000-1499 (500 IDs) - 25% drop rate
  uint16 public constant RARE_BASE = 1000;
  uint16 public rareLast; // Last ID in use (e.g., 1019 for 20 creatures)

  // Epic namespace: 1500-1599 (100 IDs) - 4.5% drop rate
  uint16 public constant EPIC_BASE = 1500;
  uint16 public epicLast; // Last ID in use (e.g., 1511 for 12 creatures)

  // Deity namespace: 1600-1649 (50 IDs) - 0.5% drop rate
  uint16 public constant DEITY_BASE = 1600;
  uint16 public deityLast; // Last ID in use (e.g., 1604 for 5 creatures)

  // User data: address => creature ID => level
  // Using uint16 for level: max 65535 (180 years of daily summons)
  mapping(address => mapping(uint16 => uint16)) public userCreatures;

  // Last summon timestamp per user
  mapping(address => uint256) public lastSummonTime;

  // Events
  event CreatureSummoned(
    address indexed summoner,
    uint16 indexed creatureId,
    uint16 level,
    uint256 timestamp
  );

  event CreaturesAdded(uint16 commonLast, uint16 rareLast, uint16 epicLast, uint16 deityLast);

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize() public initializer {
    __Ownable_init(msg.sender);
    __UUPSUpgradeable_init();

    // Set initial last IDs (optimized gacha distribution: 60/20/12/5)
    commonLast = 59; // 60 creatures (0-59)
    rareLast = 1019; // 20 creatures (1000-1019)
    epicLast = 1511; // 12 creatures (1500-1511)
    deityLast = 1604; // 5 creatures (1600-1604)
  }

  // Helper: Get UTC day number from timestamp
  function getCurrentDay(uint256 timestamp) internal pure returns (uint256) {
    return timestamp / 86400; // 86400 seconds = 1 day
  }

  // Helper: get count from base and last
  function commonCount() public view returns (uint16) {
    return commonLast - COMMON_BASE + 1;
  }

  function rareCount() public view returns (uint16) {
    return rareLast - RARE_BASE + 1;
  }

  function epicCount() public view returns (uint16) {
    return epicLast - EPIC_BASE + 1;
  }

  function deityCount() public view returns (uint16) {
    return deityLast - DEITY_BASE + 1;
  }

  // Allow owner to add creatures (can only increase, not decrease)
  function addCreatures(
    uint16 _commonLast,
    uint16 _rareLast,
    uint16 _epicLast,
    uint16 _deityLast
  ) external onlyOwner {
    require(_commonLast >= commonLast, "Cannot reduce common creatures");
    require(_rareLast >= rareLast, "Cannot reduce rare creatures");
    require(_epicLast >= epicLast, "Cannot reduce epic creatures");
    require(_deityLast >= deityLast, "Cannot reduce deity creatures");

    require(_commonLast < RARE_BASE, "Common exceeds namespace (0-999)");
    require(_rareLast >= RARE_BASE && _rareLast < EPIC_BASE, "Rare must be in 1000-1499");
    require(_epicLast >= EPIC_BASE && _epicLast < DEITY_BASE, "Epic must be in 1500-1599");
    require(_deityLast >= DEITY_BASE && _deityLast < 1650, "Deity must be in 1600-1649");

    commonLast = _commonLast;
    rareLast = _rareLast;
    epicLast = _epicLast;
    deityLast = _deityLast;

    emit CreaturesAdded(_commonLast, _rareLast, _epicLast, _deityLast);
  }

  function canSummon(address user) public view returns (bool) {
    // First summon is always allowed
    if (lastSummonTime[user] == 0) return true;

    // Check if current day (UTC) is different from last summon day
    return getCurrentDay(block.timestamp) > getCurrentDay(lastSummonTime[user]);
  }

  function getNextSummonTime(address user) public view returns (uint256) {
    // First summon is always available
    if (lastSummonTime[user] == 0) return block.timestamp;

    // Calculate start of next UTC day
    uint256 lastSummonDay = getCurrentDay(lastSummonTime[user]);
    uint256 nextDay = lastSummonDay + 1;
    uint256 nextDayStart = nextDay * 86400;

    // If we're already past that, return current time
    return nextDayStart > block.timestamp ? nextDayStart : block.timestamp;
  }

  function getLastSummonTime(address user) public view returns (uint256) {
    return lastSummonTime[user];
  }

  // Get user's collection across all namespaces
  function getUserCollection(
    address user
  ) public view returns (uint16[] memory creatureIds, uint16[] memory levels) {
    uint256 count = 0;

    // Count owned creatures in each namespace
    for (uint16 i = COMMON_BASE; i <= commonLast; i++) {
      if (userCreatures[user][i] > 0) count++;
    }
    for (uint16 i = RARE_BASE; i <= rareLast; i++) {
      if (userCreatures[user][i] > 0) count++;
    }
    for (uint16 i = EPIC_BASE; i <= epicLast; i++) {
      if (userCreatures[user][i] > 0) count++;
    }
    for (uint16 i = DEITY_BASE; i <= deityLast; i++) {
      if (userCreatures[user][i] > 0) count++;
    }

    // Populate arrays
    creatureIds = new uint16[](count);
    levels = new uint16[](count);

    uint256 index = 0;

    for (uint16 i = COMMON_BASE; i <= commonLast; i++) {
      if (userCreatures[user][i] > 0) {
        creatureIds[index] = i;
        levels[index] = userCreatures[user][i];
        index++;
      }
    }

    for (uint16 i = RARE_BASE; i <= rareLast; i++) {
      if (userCreatures[user][i] > 0) {
        creatureIds[index] = i;
        levels[index] = userCreatures[user][i];
        index++;
      }
    }

    for (uint16 i = EPIC_BASE; i <= epicLast; i++) {
      if (userCreatures[user][i] > 0) {
        creatureIds[index] = i;
        levels[index] = userCreatures[user][i];
        index++;
      }
    }

    for (uint16 i = DEITY_BASE; i <= deityLast; i++) {
      if (userCreatures[user][i] > 0) {
        creatureIds[index] = i;
        levels[index] = userCreatures[user][i];
        index++;
      }
    }

    return (creatureIds, levels);
  }

  function summon() external returns (uint16) {
    require(canSummon(msg.sender), "Cannot summon yet. Please wait for cooldown.");

    // Generate pseudo-random number
    uint256 randomValue = uint256(
      keccak256(
        abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, blockhash(block.number - 1))
      )
    );

    // Determine rarity tier (use basis points: 10000 = 100%)
    uint256 rarityRoll = randomValue % 10000;
    uint16 creatureId;

    // Gas normalization: Execute all paths to ensure consistent gas usage
    // This prevents attackers from predicting rarity based on gas estimation

    // Calculate all possible creature IDs (but only use the correct one)
    uint16 deityId = 0;
    uint16 epicId = 0;
    uint16 rareId = 0;
    uint16 commonId = 0;

    // Deity path (0.5%)
    {
      uint16 range = deityCount();
      require(range > 0, "No deity creatures available");
      uint256 deityRandom = uint256(keccak256(abi.encodePacked(randomValue, "deity")));
      uint16 index = uint16(deityRandom % range);
      deityId = DEITY_BASE + index;
    }

    // Epic path (4.5%)
    {
      uint16 range = epicCount();
      require(range > 0, "No epic creatures available");
      uint256 epicRandom = uint256(keccak256(abi.encodePacked(randomValue, "epic")));
      uint16 index = uint16(epicRandom % range);
      epicId = EPIC_BASE + index;
    }

    // Rare path (25%)
    {
      uint16 range = rareCount();
      require(range > 0, "No rare creatures available");
      uint256 rareRandom = uint256(keccak256(abi.encodePacked(randomValue, "rare")));
      uint16 index = uint16(rareRandom % range);
      rareId = RARE_BASE + index;
    }

    // Common path (70%)
    {
      uint16 range = commonCount();
      require(range > 0, "No common creatures available");
      uint256 commonRandom = uint256(keccak256(abi.encodePacked(randomValue, "common")));
      uint16 index = uint16(commonRandom % range);
      commonId = COMMON_BASE + index;
    }

    // Select the correct creature ID based on rarity roll
    // Use a lookup approach to ensure completely uniform gas usage
    // All operations execute regardless of outcome
    uint16[4] memory creatureIds = [deityId, epicId, rareId, commonId];
    uint16[4] memory conditions = [
      uint16(rarityRoll < 50 ? 1 : 0),
      uint16(rarityRoll >= 50 && rarityRoll < 500 ? 1 : 0),
      uint16(rarityRoll >= 500 && rarityRoll < 3000 ? 1 : 0),
      uint16(rarityRoll >= 3000 ? 1 : 0)
    ];

    // Calculate weighted sum (only one condition will be 1, others 0)
    creatureId =
      creatureIds[0] * conditions[0] +
      creatureIds[1] * conditions[1] +
      creatureIds[2] * conditions[2] +
      creatureIds[3] * conditions[3];

    // Increment creature level
    userCreatures[msg.sender][creatureId]++;
    uint16 newLevel = userCreatures[msg.sender][creatureId];

    // Update last summon timestamp
    lastSummonTime[msg.sender] = block.timestamp;

    // Emit event
    emit CreatureSummoned(msg.sender, creatureId, newLevel, block.timestamp);

    return creatureId;
  }

  function getCreatureLevel(address user, uint16 creatureId) public view returns (uint16) {
    return userCreatures[user][creatureId];
  }

  // Required by UUPSUpgradeable
  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
