# Network Configuration

Eldritchain uses a config-based network system. Switch networks by changing one environment variable!

## Quick Network Switch

Edit `apps/web/.env.local`:

```env
# Just change this one line!
NEXT_PUBLIC_NETWORK=sepolia  # or "mainnet"
```

That's it! Network details (RPC URLs, chain IDs, explorers) are predefined in `apps/web/src/config/networks.config.ts`.

## Built-in Networks

### Sepolia Testnet (Default)

```env
NEXT_PUBLIC_NETWORK=sepolia
```

- **Chain ID**: 11155111
- **RPC**: https://ethereum-sepolia-rpc.publicnode.com (free public RPC)
- **Explorer**: https://sepolia.etherscan.io
- **Faucet**: https://sepoliafaucet.com/

### Ethereum Mainnet

```env
NEXT_PUBLIC_NETWORK=mainnet
```

- **Chain ID**: 1
- **RPC**: Uses default mainnet RPC from viem
- **Explorer**: https://etherscan.io

## Adding More Networks

To add support for additional networks (Polygon, Arbitrum, Base, etc.):

1. Edit `apps/web/src/config/networks.config.ts`:

```typescript
import { polygon, arbitrum, base } from "viem/chains";

export const networks = {
  mainnet: { ... },
  sepolia: { ... },
  
  // Add new networks
  polygon: {
    chain: polygon,
    isTestnet: false,
  },
  
  arbitrum: {
    chain: arbitrum,
    isTestnet: false,
  },
  
  base: {
    chain: base,
    isTestnet: false,
  },
} as const;
```

2. Update your `.env.local`:

```env
NEXT_PUBLIC_NETWORK=polygon
```

That's it! All chain details come from [viem's built-in chains](https://viem.sh/docs/chains/introduction.html).

## Custom RPC Endpoints

To override the default RPC (e.g., use your own Alchemy/Infura key):

```typescript
// apps/web/src/config/networks.config.ts
export const networks = {
  mainnet: {
    chain: {
      ...mainnet,
      rpcUrls: {
        default: {
          http: ["https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"],
        },
      },
    },
    isTestnet: false,
  },
} as const;
```

## Multi-Chain Deployment

To deploy on multiple chains:

1. Deploy contract to each chain (see `apps/contracts/README.md`)
2. Save each contract address
3. Switch networks in web app by changing `.env.local`:

```bash
# For Sepolia deployment
NEXT_PUBLIC_CONTRACT_ADDRESS=0xSepoliaAddress...
NEXT_PUBLIC_NETWORK=sepolia

# For Mainnet deployment
NEXT_PUBLIC_CONTRACT_ADDRESS=0xMainnetAddress...
NEXT_PUBLIC_NETWORK=mainnet
```

## Gas Costs Comparison

| Network          | Deploy  | Per Summon |
| ---------------- | ------- | ---------- |
| Ethereum Mainnet | $50-200 | $5-20      |
| Polygon          | < $1    | < $0.05    |
| Arbitrum/Base    | $1-5    | $0.10-0.50 |
| Sepolia Testnet  | Free    | Free       |

## RPC Providers

Sepolia uses a free public RPC by default. For mainnet and other networks, consider getting API keys from:

- [Alchemy](https://www.alchemy.com/) (recommended)
- [Infura](https://infura.io/)
- [PublicNode](https://ethereum-sepolia-rpc.publicnode.com) (free public RPCs)

## Available Chains in Viem

Viem provides built-in configurations for 100+ chains. See the [full list](https://viem.sh/docs/chains/introduction.html):

- Ethereum (mainnet, sepolia, holesky, goerli)
- Layer 2s (Arbitrum, Optimism, Base, zkSync)
- Alt L1s (Polygon, Avalanche, BNB Chain)
- And many more!

Simply import them and add to `networks.config.ts`.
