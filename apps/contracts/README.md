# Eldrichain Smart Contracts

Solidity smart contracts for the Eldrichain dApp, deployed on EVM-compatible chains.

## Contract Overview

**`Eldrichain.sol`** - Upgradeable using UUPS proxy pattern

**Features:**

- Dynamic creature ranges (owner can add more creatures)
- Owner can upgrade contract logic without data loss
- Can add new features in future versions
- Can renounce ownership for full immutability when ready

\*\*📖 See [ADDING_CREATURES.md](../../docs/ADDING_CREATURES.md) for how to expand your collection.

## Prerequisites

- Node.js 22.14.0 (managed via nvm - `.nvmrc` file included)
- Yarn package manager
- A crypto wallet (MetaMask recommended)
- Testnet ETH for deployment (Sepolia, Polygon, Arbitrum, Base, etc.)

## Installation

```bash
# Install correct Node.js version (from .nvmrc)
nvm install
nvm use

# From root directory
yarn install
```

## Quick Commands

All commands can be run from the root directory:

```bash
yarn contracts compile      # Compile contracts
yarn contracts test         # Run test suite
yarn contracts deploy       # Deploy to network
yarn contracts upgrade      # Upgrade existing deployment
yarn contracts add-creatures # Sync creature data
yarn contracts lint         # Lint TypeScript
yarn contracts format       # Format code
```

## Configuration

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and fill in the required values:

```env
# Your deployment wallet's private key (NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# Sepolia RPC URL from Alchemy or Infura
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_api_key

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Getting Required Credentials

**Private Key:**

- Export from MetaMask: Settings > Security & Privacy > Reveal Private Key
- ⚠️ **NEVER share this or commit it to git!**
- ⚠️ **Use a separate wallet for development, not your main wallet!**

**Sepolia RPC URL:**

1. Sign up for free at [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/)
2. Create a new app/project
3. Select "Sepolia" as the network
4. Copy the HTTP endpoint URL

**Sepolia ETH:**

- Use a faucet: https://sepoliafaucet.com/
- Or: https://www.alchemy.com/faucets/ethereum-sepolia
- You'll need ~0.01 ETH for deployment

**Etherscan API Key:**

1. Create account at https://etherscan.io/
2. Go to API Keys section
3. Create a new API key (free)

## Compile Contracts

Compile the Solidity contracts:

```bash
# From root
yarn contracts compile

# Or from apps/contracts
yarn compile
```

This generates:

- `/artifacts` - Compiled contract bytecode and ABIs
- `/typechain-types` - TypeScript type definitions

## Run Tests

Run the test suite:

```bash
# From root
yarn contracts test

# Or from apps/contracts
yarn test
```

Tests verify:

- Contract deployment and initialization
- Summoning mechanics and UTC day-based cooldown
- Random creature generation (70% common, 25% rare, 4.5% epic, 0.5% deity)
- User collection tracking
- Event emissions
- Upgradeability (UUPS proxy pattern)

## Code Quality

The project includes automated code quality tools:

```bash
yarn lint        # Run ESLint
yarn lint:fix    # Auto-fix linting issues
yarn format      # Format code with Prettier
yarn format:check # Check formatting
```

All code is validated in CI via GitHub Actions on every push.

## Deploy Contract

### Step 1: Fund Your Wallet

Ensure your deployment wallet has Sepolia ETH:

- Check your wallet address
- Visit a Sepolia faucet and request test ETH
- Verify the ETH arrived in your wallet

### Step 2: Deploy the Contract

```bash
# From root
yarn contracts deploy

# Or from apps/contracts
yarn deploy
```

This will:

1. Compile the contract
2. Deploy to your configured network (from `DEFAULT_NETWORK` in `.env`)
3. Output the deployed contract address

**Save the contract address!** You'll need it for the frontend.

Example output:

```
Deploying Eldrichain contract...
Eldrichain deployed to: 0x1234567890abcdef1234567890abcdef12345678

Save this address to your .env file in apps/web:
NEXT_PUBLIC_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

### Step 3: Verify on Etherscan

Verify your contract on Etherscan for transparency:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

Replace `<CONTRACT_ADDRESS>` with your deployed address.

Once verified, users can view your contract source code on Etherscan.

## Managing Upgradeable Version

### Adding New Creatures (Auto-Sync!)

**Step 1:** Add creatures to `apps/web/src/data/creatures.json`

**Step 2:** Run the sync script:

```bash
# Set PROXY_ADDRESS in .env, then from root:
yarn contracts add-creatures

# Or from apps/contracts:
yarn add-creatures
```

The script **automatically reads your JSON data file**, finds the highest IDs, and updates the contract to match!

**See [ADDING_CREATURES.md](../../docs/ADDING_CREATURES.md) for details.**

## Contract Details

### Eldrichain.sol

Main contract with the following functions:

**Write Functions:**

- `summon()` - Summon a random creature (once per UTC day) → returns uint16
- `addCreatures(commonLast, rareLast, epicLast, deityLast)` - Owner: Expand creature counts

**Read Functions:**

- `canSummon(address user)` - Check if user can summon
- `getUserCollection(address user)` - Get all creatures (returns uint16[] IDs, uint256[] levels)
- `getNextSummonTime(address user)` - Get timestamp of next available summon
- `getCreatureLevel(address user, uint16 creatureId)` - Get level of specific creature
- `commonCount()`, `rareCount()`, `epicCount()`, `deityCount()` - Current creature counts (calculated)
- `commonLast`, `rareLast`, `epicLast`, `deityLast` - Last ID in use for each tier

**Events:**

- `CreatureSummoned(address summoner, uint16 creatureId, uint256 level, uint256 timestamp)`
- `CreaturesAdded(uint16 commonLast, uint16 rareLast, uint16 epicLast, uint16 deityLast)`

### Rarity Tiers & ID Namespaces

The contract uses **proportional namespaces** for each tier:

- Common: 0-999 (1000 IDs, using 0-59) - 70% drop rate
- Rare: 1000-1499 (500 IDs, using 1000-1019) - 25% drop rate
- Epic: 1500-1599 (100 IDs, using 1500-1511) - 4.5% drop rate
- Deity: 1600-1649 (50 IDs, using 1600-1604) - 0.5% drop rate

**Optimizations:**

- ✅ Proportional sizes (more space where needed)
- ✅ uint16 for IDs and levels (~30% gas savings vs uint256)
- ✅ Levels max 65,535 (180 years of daily summons)
- ✅ Stores only `BASE` + `Last`, count calculated on-demand
- ✅ Each tier independent (add to one, others unaffected)

### Randomness

The contract generates pseudo-random numbers using:

- `block.timestamp` - Time of block
- `block.prevrandao` - Random beacon from consensus
- `msg.sender` - User's address
- `blockhash(block.number - 1)` - Previous block's hash

This prevents users from manipulating outcomes by choosing specific timestamps or transaction ordering.

⚠️ **Note:** This is suitable for a game but NOT for high-value applications. For production with real value, use Chainlink VRF or similar oracle-based randomness.

## Gas Costs

Approximate gas costs on Sepolia (will vary with network conditions):

- Contract deployment: ~1,000,000 gas
- First summon: ~100,000 gas
- Subsequent summons: ~50,000-80,000 gas
- Reading collection: Free (view function)

## Troubleshooting

**"Insufficient funds" error:**

- Get more Sepolia ETH from a faucet
- Check you're connected to Sepolia network

**"Cannot summon yet" error:**

- You've already summoned today (resets at midnight UTC, not 24 hours)
- Check `getNextSummonTime()` to see when you can summon again (returns start of next UTC day)

**Deployment fails:**

- Verify your `.env` file is configured correctly
- Check your private key is valid (without "0x" prefix)
- Ensure RPC URL is correct and accessible

**Contract verification fails:**

- Wait a few minutes after deployment
- Ensure you're using the exact contract address
- Check your Etherscan API key is valid

## Development Workflow

1. Make changes to `contracts/Eldrichain.sol`
2. Run tests: `yarn test`
3. Compile: `yarn compile`
4. Deploy to testnet: `yarn deploy`
5. Verify on Etherscan
6. Update contract address in web app's `.env`

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Sepolia Testnet Info](https://sepolia.dev/)
- [Etherscan Sepolia](https://sepolia.etherscan.io/)
