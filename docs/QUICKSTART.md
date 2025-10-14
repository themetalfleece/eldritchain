# Eldritchain Quick Start Guide

Get up and running with Eldritchain in 10 minutes!

## Step 1: Install Dependencies (2 min)

```bash
# Install root dependencies
yarn install

# Install contract dependencies
cd apps/contracts
yarn install

# Install web dependencies
cd ../web
yarn install
cd ../..
```

## Step 2: Set Up Smart Contract (3 min)

```bash
cd apps/contracts

# Copy environment template
cp .env.example .env

# Edit .env and add:
# - Your wallet's private key (use a test wallet!)
# - Sepolia RPC URL from Alchemy or Infura
# - Etherscan API key (optional, for verification)
```

Get Sepolia ETH from a faucet:

- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

## Step 3: Deploy Contract (2 min)

```bash
# Compile contract
yarn compile

# Run tests (optional but recommended)
yarn test

# Deploy (network from .env DEFAULT_NETWORK)
yarn deploy
```

**Save the contract address!** You'll see output like:

```
Eldritchain deployed to: 0x1234567890abcdef1234567890abcdef12345678
```

## Step 4: Set Up Web App (2 min)

```bash
cd ../web

# Copy environment template
cp .env.example .env.local

# Edit .env.local and add:
# - Contract address from Step 3
# - WalletConnect Project ID (get from https://cloud.walletconnect.com/)
# - Network: "sepolia" for testnet or "mainnet" for production
```

Example `.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_NETWORK=polygonAmoy
```

**Getting Test Tokens:**
- **Polygon Amoy**: Get test POL from https://faucet.polygon.technology/
- **Sepolia**: Get test ETH from https://sepoliafaucet.com/

Note: Polygon uses **POL** for gas (not MATIC). Your wallet might still show "MATIC" during the transition period.

## Step 5: Run the App! (1 min)

```bash
yarn dev
```

Open http://localhost:3000 in your browser!

## Usage

1. Connect your wallet (click "Connect Wallet" button)
2. Make sure you're on the correct network
3. Click "Summon Creature" button
4. Approve the transaction in your wallet
5. Wait for confirmation
6. See your new creature!
7. Come back tomorrow (next UTC day) to summon again!

## Troubleshooting

**Contract deployment fails:**

- Check you have Sepolia ETH in your wallet
- Verify your `.env` file in `apps/contracts`
- Make sure private key is correct (without "0x" prefix)

**Can't connect wallet:**

- Install MetaMask or another Web3 wallet
- Get a WalletConnect Project ID from https://cloud.walletconnect.com/
- Add it to `apps/web/.env.local`

**Summon button disabled:**

- Wait until next UTC day (resets at midnight UTC)
- Make sure you have gas tokens
- Check you're connected to correct network

## Next Steps

- Deploy to production (see README.md)
- Customize the UI (edit `apps/web/src/app/page.tsx`)
- Add more creatures (edit `apps/web/src/data/creatures.ts`)
- Modify game mechanics (edit `apps/contracts/contracts/Eldritchain.sol`)

Happy summoning! 🎮✨
