# Eldrichain

A decentralized daily creature summoning dApp built on Ethereum. Summon a random creature once per day and build your collection of common animals, rare predators, epic Lovecraftian monsters, and legendary eldritch deities.

## 📚 Documentation

- **[Quick Start](docs/QUICKSTART.md)** - Get up and running in 10 minutes
- **[UTC Day System](docs/UTC_DAY_SYSTEM.md)** - Once per day resets at midnight UTC (not 24h cooldown!)
- **[Network Configuration](docs/NETWORK_CONFIGURATION.md)** - Switch between chains (Mainnet, Polygon, etc.)
- **[Adding Creatures](docs/ADDING_CREATURES.md)** - Auto-sync script reads your data file
- **[ID System](docs/ID_SYSTEM.md)** - Proportional namespaces explained
- **[Gacha Distribution](docs/GACHA_DISTRIBUTION.md)** - Why 97 creatures is optimal
- **[Testing Guide](docs/TESTING.md)** - How to test your deployment

## Project Overview

Eldrichain is a blockchain-based game where users can:

- Summon one creature per UTC day (resets at midnight UTC, not 24h cooldown)
- Collect 97 unique creatures across 4 rarity tiers
- Level up creatures by summoning them multiple times
- View their entire collection on-chain

### Rarity Distribution (Optimized for Gacha)

- **Common (70%)**: 60 creatures - IDs 0-59 (namespace: 0-999, 1000 slots)
- **Rare (25%)**: 20 creatures - IDs 1000-1019 (namespace: 1000-1499, 500 slots)
- **Epic (4.5%)**: 12 creatures - IDs 1500-1511 (namespace: 1500-1599, 100 slots)
- **Deity (0.5%)**: 5 creatures - IDs 1600-1604 (namespace: 1600-1649, 50 slots)

**Total: 97 creatures** with proportional namespace sizes! Auto-sync script reads your data file and updates the contract automatically. See [ID System](docs/ID_SYSTEM.md) and [Adding Creatures](docs/ADDING_CREATURES.md).

## Architecture

This is a monorepo containing two main applications:

```
eldrichain/
├── apps/
│   ├── contracts/   # Solidity smart contracts (Hardhat)
│   └── web/         # Next.js frontend (React + Wagmi)
├── package.json     # Root workspace configuration
└── README.md        # This file
```

### Technology Stack

**Smart Contracts:**

- Solidity 0.8.24
- Hardhat for development and deployment
- Upgradeable (UUPS proxy pattern)
- Network-agnostic (Sepolia, Mainnet, Polygon, Arbitrum, Base, etc.)

**Frontend:**

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS for styling
- Wagmi v2 + Viem for blockchain interaction
- RainbowKit for wallet connection

**Code Quality:**

- ESLint + Prettier for consistent formatting
- Enforced curly braces and best practices
- GitHub Actions CI for automated testing
- Runs on every push: lint, format check, contract tests, and build

## Getting Started

### Prerequisites

- Node.js 22.14.0 (install via nvm, see below)
- Yarn package manager
- A wallet with Sepolia testnet ETH
- WalletConnect Project ID (get from https://cloud.walletconnect.com/)

**Node.js Setup (with nvm):**

```bash
# Install Node.js version specified in .nvmrc
nvm install
nvm use
```

The project includes `.nvmrc` files in the root and both apps to ensure consistent Node.js versions across development and CI.

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd eldrichain
```

2. Copy `.env.example` files and configure your environment:

```bash
# Contracts environment
cp apps/contracts/.env.example apps/contracts/.env
# Edit apps/contracts/.env with your private key and RPC URLs

# Web app environment (Next.js requires .env.local, not .env)
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local with your contract address and RPC URL
```

3. Install dependencies:

```bash
yarn install
```

## Quick Commands

The monorepo uses workspace shortcuts for easy command execution:

```bash
# Web app
yarn web dev           # Start dev server
yarn web build         # Build for production
yarn web lint          # Lint code

# Contracts
yarn contracts compile      # Compile Solidity
yarn contracts test         # Run tests
yarn contracts deploy       # Deploy to network

# Root (affects all workspaces)
yarn lint              # Lint all packages
yarn lint:fix          # Auto-fix linting issues
yarn format            # Format all code
```

## Detailed Setup

3. Set up the contracts:

```bash
cd apps/contracts
yarn install
cp .env.example .env
# Edit .env with your private key and RPC URL
```

4. Set up the web app:

```bash
cd ../web
yarn install
cp .env.example .env
# Edit .env with contract address and WalletConnect ID
```

## Development

### Deploy Smart Contract

See detailed instructions in [apps/contracts/README.md](apps/contracts/README.md)

```bash
# From root directory
yarn contracts compile
yarn contracts test
yarn contracts deploy
```

### Run Frontend

See detailed instructions in [apps/web/README.md](apps/web/README.md)

```bash
# From root directory
yarn web dev
```

Visit http://localhost:3000

## Smart Contract Features

### Daily Summon System

**Once per UTC day** (not 24-hour cooldown):

- Summon at 11:59 PM → Can summon again at 12:01 AM! ✅
- Based on calendar days, not time since last summon
- Fair for all timezones using UTC as reference

### Anti-Spoofing Measures

The contract uses multiple sources of randomness to prevent manipulation:

- `block.timestamp` - Current block time
- `block.prevrandao` - Random value from consensus
- `msg.sender` - User's address
- `blockhash(block.number - 1)` - Previous block hash

This makes it computationally infeasible for users to manipulate their summon results.

### On-Chain Data

The contract stores:

- User creature collection (mapping of creature ID to level)
- Last summon timestamp per user
- Rarity tier ranges as constants

The contract does **NOT** store:

- Creature names, descriptions, or metadata (stored in frontend for gas efficiency)

## Project Structure

### `/apps/contracts`

- `contracts/Eldrichain.sol` - Main smart contract
- `scripts/deploy.ts` - Deployment script
- `test/Eldrichain.test.ts` - Contract tests
- `hardhat.config.ts` - Hardhat configuration

### `/apps/web`

- `src/app/` - Next.js pages
- `src/components/` - React components
- `src/config/` - Contract ABI and Wagmi configuration
- `src/data/` - Creature metadata (141 creatures)

## Contributing

This is a personal project, but feel free to fork and modify it for your own use!

## License

MIT License - feel free to use this code for your own projects.

## Support

If you encounter issues:

1. Check that you have Sepolia ETH in your wallet
2. Verify your `.env` files are configured correctly
3. Ensure you're connected to Sepolia network in your wallet
4. Check that 24 hours have passed since your last summon

## Acknowledgments

- Lovecraftian creature concepts inspired by H.P. Lovecraft's works
- Built with modern Web3 tooling (Wagmi, RainbowKit, Viem)
- Deployed on Ethereum Sepolia testnet
