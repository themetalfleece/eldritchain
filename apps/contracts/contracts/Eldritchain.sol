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

  // Commit-reveal scheme data
  struct Commitment {
    bytes32 hash; // Hash of the committed random value
    uint256 commitTimestamp; // When the commit was made
    uint256 targetBlockNumber; // Block number that's commitBlockDelay blocks ahead
    bool isRevealed; // Whether the commitment has been revealed
  }

  mapping(address => Commitment) public commitments;

  // Commit-reveal configuration
  uint256 public commitBlockDelay; // Number of blocks to wait before revealing (default: 5)

  // Events
  event CreatureSummoned(address indexed summoner, uint16 indexed creatureId, uint16 level, uint256 timestamp);

  event CreaturesAdded(uint16 commonLast, uint16 rareLast, uint16 epicLast, uint16 deityLast);

  event RandomCommitted(address indexed user, bytes32 indexed hash, uint256 commitTimestamp, uint256 targetBlockNumber);

  event RandomRevealed(address indexed user, uint256 randomValue, uint256 timestamp);

  event CommitBlockDelayUpdated(uint256 oldDelay, uint256 newDelay);

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

    // Set initial commit-reveal block delay
    commitBlockDelay = 5;
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
  function addCreatures(uint16 _commonLast, uint16 _rareLast, uint16 _epicLast, uint16 _deityLast) external onlyOwner {
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

  // Set the commit-reveal block delay (owner only)
  function setCommitBlockDelay(uint256 _newDelay) external onlyOwner {
    require(_newDelay > 0, "Block delay must be greater than 0");
    require(_newDelay <= 64, "Block delay cannot exceed 64 blocks");

    uint256 oldDelay = commitBlockDelay;
    commitBlockDelay = _newDelay;

    emit CommitBlockDelayUpdated(oldDelay, _newDelay);
  }

  // Get user's collection across all namespaces
  function getUserCollection(address user) public view returns (uint16[] memory creatureIds, uint16[] memory levels) {
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

  function getNextSummonTime(address user) public view returns (uint256) {
    // First summon is always available
    if (lastSummonTime[user] == 0) return block.timestamp;

    if (canCommit(user)) {
      return block.timestamp;
    }

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

  function canCommit(address user) public view returns (bool) {
    // User has summoned today -> can't commit
    if (lastSummonTime[user] != 0) {
      if (getCurrentDay(block.timestamp) <= getCurrentDay(lastSummonTime[user])) {
        return false;
      }
    }

    Commitment memory commitment = commitments[user];

    // No commitment -> can commit
    if (commitment.hash == bytes32(0)) return true;

    // Commitment from different day -> can commit
    if (getCurrentDay(block.timestamp) != getCurrentDay(commitment.commitTimestamp)) {
      return true;
    }

    return false;
  }

  // Commit a random value for the commit-reveal scheme
  function commitRandom(bytes32 hash) external {
    require(canCommit(msg.sender), "Cannot commit. Please wait for cooldown or complete current commitment.");

    // Prevent zero hash commitments (security measure)
    require(hash != bytes32(0), "Cannot commit zero hash");

    // Store the commitment with target block commitBlockDelay blocks ahead
    commitments[msg.sender] = Commitment({
      hash: hash,
      commitTimestamp: block.timestamp,
      targetBlockNumber: block.number + commitBlockDelay,
      isRevealed: false
    });

    emit RandomCommitted(msg.sender, hash, block.timestamp, block.number + commitBlockDelay);
  }

  // Get commitment details for a user
  function getCommitment(address user) public view returns (Commitment memory) {
    return commitments[user];
  }

  function canSummon(address user) public view returns (bool) {
    Commitment memory commitment = commitments[user];

    // Must not already be revealed
    if (commitment.isRevealed) return false;

    // Check if commitment is valid for the day (includes existence, same day, and 255 block check)
    if (!isCommitmentValidForDay(user)) return false;

    // Target block must be available (block.number >= targetBlockNumber)
    if (block.number < commitment.targetBlockNumber) return false;

    return true;
  }

  // Check if a commitment is valid for the current day (not expired)
  function isCommitmentValidForDay(address user) public view returns (bool) {
    Commitment memory commitment = commitments[user];

    // Must have a commitment (hash not zero)
    if (commitment.hash == bytes32(0)) return false;

    // Must be within the same day as commit
    if (getCurrentDay(block.timestamp) != getCurrentDay(commitment.commitTimestamp)) return false;

    // Target block must not be more than 256 blocks ago (blockhash limitation)
    // Only check this if the target block has been mined
    if (block.number >= commitment.targetBlockNumber) {
      if (block.number - commitment.targetBlockNumber > 255) return false;
    }

    return true;
  }

  function summon(uint256 randomValue) external returns (uint16) {
    // Check if user can summon (has valid commitment and timing)
    require(canSummon(msg.sender), "Cannot summon. Must commit first and wait for target block.");

    Commitment storage commitment = commitments[msg.sender];

    // Verify the revealed random value matches the committed hash
    bytes32 computedHash = keccak256(abi.encodePacked(randomValue));
    require(computedHash == commitment.hash, "Invalid random value. Must match committed hash.");

    // Mark commitment as revealed
    commitment.isRevealed = true;

    // Generate final random value using committed value, target block hash, and prevrandao
    bytes32 targetBlockHash = blockhash(commitment.targetBlockNumber);
    uint256 finalRandom = uint256(
      keccak256(abi.encodePacked(randomValue, targetBlockHash, block.prevrandao, msg.sender, block.timestamp))
    );

    // Determine rarity tier (use basis points: 10000 = 100%)
    uint256 rarityRoll = finalRandom % 10000;
    uint16 creatureId;

    // Simplified rarity selection with fresh randomness for each tier
    if (rarityRoll < 50) {
      // Deity (0.5%)
      uint16 range = deityCount();
      require(range > 0, "No deity creatures available");
      uint256 deityRandom = uint256(keccak256(abi.encodePacked(finalRandom, "deity")));
      uint16 index = uint16(deityRandom % range);
      creatureId = DEITY_BASE + index;
    } else if (rarityRoll < 500) {
      // Epic (4.5%)
      uint16 range = epicCount();
      require(range > 0, "No epic creatures available");
      uint256 epicRandom = uint256(keccak256(abi.encodePacked(finalRandom, "epic")));
      uint16 index = uint16(epicRandom % range);
      creatureId = EPIC_BASE + index;
    } else if (rarityRoll < 3000) {
      // Rare (25%)
      uint16 range = rareCount();
      require(range > 0, "No rare creatures available");
      uint256 rareRandom = uint256(keccak256(abi.encodePacked(finalRandom, "rare")));
      uint16 index = uint16(rareRandom % range);
      creatureId = RARE_BASE + index;
    } else {
      // Common (70%)
      uint16 range = commonCount();
      require(range > 0, "No common creatures available");
      uint256 commonRandom = uint256(keccak256(abi.encodePacked(finalRandom, "common")));
      uint16 index = uint16(commonRandom % range);
      creatureId = COMMON_BASE + index;
    }

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
