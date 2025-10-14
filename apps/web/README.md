# Eldritchain Web App

Next.js frontend for the Eldritchain decentralized creature summoning dApp.

## Prerequisites

- Node.js 22.14.0 (managed via nvm - `.nvmrc` file included)
- Yarn package manager
- Deployed Eldritchain smart contract (Sepolia, Mainnet, Polygon, Arbitrum, Base, etc.)
- WalletConnect Project ID (optional)

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
yarn web dev           # Start dev server
yarn web build         # Build for production
yarn web start         # Run production server
yarn web lint          # Lint code
yarn web lint:fix      # Auto-fix linting issues
yarn web format        # Format code
```

## Configuration

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

2. Edit `.env.local` and fill in the required values:

```env
# Contract Address (REQUIRED)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678

# WalletConnect Project ID (REQUIRED)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Network (REQUIRED)
# Options: "polygonAmoy" | "polygon" | "sepolia" | "mainnet"
NEXT_PUBLIC_NETWORK=polygonAmoy

# Indexer API URL (OPTIONAL - for leaderboard)
# Leave empty to hide leaderboard
NEXT_PUBLIC_INDEXER_API_URL=http://localhost:3001
```

### Getting Required Credentials

**Contract Address (Required):**

- Deploy the contract first (see `apps/contracts/README.md`)
- Copy the address from the deployment output
- Or find it on [Sepolia Etherscan](https://sepolia.etherscan.io/)
- Add to `.env.local` as `NEXT_PUBLIC_CONTRACT_ADDRESS`

**WalletConnect Project ID (Required):**

1. Visit https://cloud.walletconnect.com/
2. Sign up for a free account
3. Create a new project
4. Copy the Project ID
5. Add to `.env.local` as `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

**Network Selection:**

Simply set `NEXT_PUBLIC_NETWORK` to:

- `polygonAmoy` - Polygon Amoy testnet (recommended for testing - cheap gas!)
- `polygon` - Polygon mainnet (recommended for production - $0.01-0.05 per transaction)
- `sepolia` - Ethereum Sepolia testnet (free, uses [public RPC](https://ethereum-sepolia-rpc.publicnode.com))
- `mainnet` - Ethereum mainnet (expensive - $2-10 per transaction)

Network configurations are predefined in `@eldritchain/common`. To add more networks, edit `packages/common/src/config/networks.ts`.

**Indexer API (Optional):**

Set `NEXT_PUBLIC_INDEXER_API_URL` to enable the leaderboard feature:

- Local development: `http://localhost:3001`
- Production: Your deployed indexer URL
- Leave empty to hide the leaderboard

**After adding/changing env vars, restart the dev server!**

## Development

Run the development server:

```bash
# From root
yarn web dev

# Or from apps/web
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Development Workflow

1. Connect your wallet (MetaMask or other Web3 wallet)
2. Ensure you're on the correct network (Polygon Amoy testnet by default)
3. Get test POL from [Polygon faucet](https://faucet.polygon.technology/)
   - Note: Polygon uses POL for gas (not MATIC - they migrated in 2024)
   - Your wallet might still show "MATIC" as the symbol, but it's actually POL
4. Click "Summon Creature" button
5. Confirm transaction in wallet
6. Wait for transaction confirmation
7. See your new creature appear in the collection

## Building for Production

Create an optimized production build:

```bash
# From root
yarn web build

# Or from apps/web
yarn build
```

Run the production server:

```bash
# From root
yarn web start

# Or from apps/web
yarn start
```

## Docker Deployment 🐳

### Build Docker Image

From the **repository root**, build the image:

```bash
docker build -f apps/web/Dockerfile -t eldritchain-web:latest .
```

### Run with Docker

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddress \
  -e NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_wc_project_id \
  -e NEXT_PUBLIC_NETWORK=polygonAmoy \
  -e NEXT_PUBLIC_INDEXER_API_URL=https://your-indexer-url.com \
  eldritchain-web:latest
```

Start the service:

```bash
docker compose up -d
```

### Docker Image Details

- **Base**: Node.js 22.14.0 Alpine (~50MB base)
- **Multi-stage build**: Optimized for production
- **Size**: ~200MB (includes Next.js standalone output)
- **Port**: 3000

### Pushing to Docker Hub

```bash
# Tag image
docker tag eldritchain-web:latest your-username/eldritchain-web:latest

# Push to Docker Hub
docker push your-username/eldritchain-web:latest
```

## Code Quality

The project includes automated code quality tools:

```bash
# From root
yarn web lint        # Run ESLint (Next.js)
yarn web lint:fix    # Auto-fix linting issues
yarn web format      # Format code with Prettier
yarn web format:check # Check formatting

# Or from apps/web
yarn lint
yarn lint:fix
yarn format
yarn format:check
```

All code is validated in CI via GitHub Actions on every push.

## Project Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── globals.css             # Global styles
│   │   ├── layout.tsx              # Root layout with providers
│   │   ├── page.tsx                # Main homepage
│   │   └── page.styles.ts          # Homepage styles
│   ├── components/
│   │   ├── Collection.component.tsx   # Display user's creatures
│   │   ├── Collection.styles.ts       # Collection component styles
│   │   ├── CreatureCard.component.tsx # Individual creature card
│   │   ├── CreatureCard.styles.ts     # Card component styles
│   │   ├── Providers.component.tsx    # Wagmi/React Query providers
│   │   ├── SummonButton.component.tsx # Summon button with cooldown
│   │   └── SummonButton.styles.ts     # Button component styles
│   ├── config/
│   │   ├── contract.config.ts      # Contract ABI and address
│   │   └── wagmi.config.ts         # Wagmi configuration
│   ├── data/
│   │   ├── creatures.data.ts       # TypeScript types and exports
│   │   └── creatures.json          # All 97 creature definitions (JSON)
│   └── lib/
│       └── env.config.ts           # Environment variable validation
├── .env.example                    # Environment variables template
├── .nvmrc                          # Node.js version (22.14.0)
├── next.config.js                 # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS configuration
└── package.json
```

## Features

### Wallet Connection

- Connect with MetaMask, WalletConnect, and other Web3 wallets
- Automatic network detection and switching
- Persistent connection across page reloads

### Daily Summoning

- Summon one creature per UTC day (resets at midnight UTC, not 24-hour cooldown)
- Real-time countdown timer showing next available summon with UTC datetime
- Transaction status feedback (pending, confirming, success)
- Disabled state when already summoned today

### Creature Collection

- Grid display of all owned creatures
- Color-coded rarity badges (Common, Rare, Epic, Deity)
- Creature descriptions and levels
- Automatic refresh after summoning

### Responsive Design

- Mobile-first design approach
- Works on phones, tablets, and desktops
- Optimized layouts for different screen sizes

## Styling

The app uses Tailwind CSS with a dark theme:

**Color Scheme:**

- Common: Gray (#9CA3AF)
- Rare: Blue (#60A5FA)
- Epic: Purple (#C084FC)
- Deity: Gold (#FBBF24)

**Fonts:**

- System fonts (Arial, Helvetica, sans-serif)

To customize styling, edit:

- `src/app/globals.css` - Global styles
- `tailwind.config.ts` - Tailwind configuration

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project on [Vercel](https://vercel.com/)
3. Set environment variables in Vercel dashboard
4. Deploy!

### Deploy to Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- AWS Amplify
- Cloudflare Pages
- Self-hosted with `npm run build && npm run start`

## Troubleshooting

**Hydration warning in dev console:**

- This is often caused by browser extensions (ad blockers, cookie managers, etc.)
- Test in incognito mode to verify it's extension-related
- **This won't affect production users** - it's a dev-only warning
- To disable the warning, you can add `suppressHydrationWarning` to the `<html>` tag in `layout.tsx`

**Wallet won't connect:**

- Ensure you have a Web3 wallet installed (MetaMask, etc.)
- Check WalletConnect Project ID is configured
- Try refreshing the page

**Wrong network message:**

- Open your wallet
- Switch to your configured network (check `.env.local` for `NEXT_PUBLIC_CHAIN_NAME`)
- If the network isn't listed in your wallet, add it manually using the settings from your `.env.local` file

**Summon button is disabled:**

- Check if you've already summoned today (resets at midnight UTC)
- Verify you have testnet ETH for gas fees
- Ensure contract address is correctly configured
- Check the countdown timer for when you can summon next

**Collection doesn't load:**

- Verify contract address in `.env` is correct
- Check you're connected to Sepolia network
- Try refreshing the page

**Transaction fails:**

- Ensure you have enough Sepolia ETH for gas
- Check you're not on cooldown
- Verify contract is deployed and accessible

**"Invalid contract address" or "Missing env variable" error:**

- Contract address must start with "0x"
- Verify address matches deployed contract
- Check for typos in `.env.local` file
- **Restart the dev server** after changing environment variables
- Hard refresh browser (Ctrl+Shift+R)

## Development Tips

### Testing Locally

1. Use the same wallet address across browser sessions
2. Speed up time using Hardhat's local network (for testing)
3. Keep browser console open to see transaction logs

### Debugging

Enable React DevTools and Wagmi DevTools:

```typescript
// In Providers.tsx, wrap with:
<WagmiProvider config={config}>
  {/* Your app */}
</WagmiProvider>
```

### Performance

- Contract reads are cached by React Query
- Collection refetches after successful summons
- Countdown timer updates every second

## Technologies Used

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety (ES2020 target for BigInt support)
- **Tailwind CSS**: Utility-first styling with best practices
- **Wagmi v2**: React hooks for Ethereum
- **Viem**: TypeScript Ethereum library
- **RainbowKit**: Wallet connection UI
- **React Query**: Data fetching and caching
- **ESLint & Prettier**: Code quality and formatting with enforced rules

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Viem Documentation](https://viem.sh/)

## Support

Having issues? Check:

1. Environment variables are set correctly
2. Contract is deployed on Sepolia
3. Wallet is connected to Sepolia network
4. You have Sepolia ETH for gas fees

For contract-related issues, see `apps/contracts/README.md`.
