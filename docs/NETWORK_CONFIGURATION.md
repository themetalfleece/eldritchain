# Network Configuration

Switch between any EVM chain by changing `.env` files only - no code changes needed!

## Quick Network Switch

Edit `apps/web/.env`:

```env
NEXT_PUBLIC_CHAIN_ID=<chain_id>
NEXT_PUBLIC_CHAIN_NAME=<network_name>
NEXT_PUBLIC_RPC_URL=<your_rpc_url>
NEXT_PUBLIC_BLOCK_EXPLORER_URL=<explorer_url>
NEXT_PUBLIC_NATIVE_CURRENCY_NAME=<currency_name>
NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL=<currency_symbol>
NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS=18
```

Edit `apps/contracts/.env`:

```env
DEFAULT_NETWORK=<network_name>
<NETWORK_NAME>_RPC_URL=<your_rpc_url>
```

## Pre-Configured Networks

### Sepolia Testnet (Default)

```env
# Web App (.env)
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_CHAIN_NAME=Sepolia
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://sepolia.etherscan.io
NEXT_PUBLIC_NATIVE_CURRENCY_NAME=Sepolia ETH
NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL=SepoliaETH
NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS=18

# Contracts (.env)
DEFAULT_NETWORK=sepolia
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

**Get test ETH:** https://sepoliafaucet.com/

### Ethereum Mainnet

```env
# Web App (.env)
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_CHAIN_NAME=Ethereum
NEXT_PUBLIC_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://etherscan.io
NEXT_PUBLIC_NATIVE_CURRENCY_NAME=Ether
NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL=ETH
NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS=18

# Contracts (.env)
DEFAULT_NETWORK=mainnet
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Polygon

```env
# Web App (.env)
NEXT_PUBLIC_CHAIN_ID=137
NEXT_PUBLIC_CHAIN_NAME=Polygon
NEXT_PUBLIC_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://polygonscan.com
NEXT_PUBLIC_NATIVE_CURRENCY_NAME=MATIC
NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL=MATIC
NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS=18

# Contracts (.env)
DEFAULT_NETWORK=polygon
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

**Lower gas fees than Ethereum!**

### Arbitrum One

```env
# Web App (.env)
NEXT_PUBLIC_CHAIN_ID=42161
NEXT_PUBLIC_CHAIN_NAME=Arbitrum One
NEXT_PUBLIC_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://arbiscan.io
NEXT_PUBLIC_NATIVE_CURRENCY_NAME=Ether
NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL=ETH
NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS=18

# Contracts (.env)
DEFAULT_NETWORK=arbitrum
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY
ARBISCAN_API_KEY=your_arbiscan_api_key
```

**Layer 2 with low fees!**

### Base

```env
# Web App (.env)
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_CHAIN_NAME=Base
NEXT_PUBLIC_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://basescan.org
NEXT_PUBLIC_NATIVE_CURRENCY_NAME=Ether
NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL=ETH
NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS=18

# Contracts (.env)
DEFAULT_NETWORK=base
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
BASESCAN_API_KEY=your_basescan_api_key
```

**Coinbase's L2 network!**

### Local Development (Hardhat/Anvil)

```env
# Web App (.env)
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_CHAIN_NAME=Localhost
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_BLOCK_EXPLORER_URL=
NEXT_PUBLIC_NATIVE_CURRENCY_NAME=Ether
NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL=ETH
NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS=18

# Contracts (.env)
DEFAULT_NETWORK=localhost
```

**Start local node:**

```bash
cd apps/contracts
yarn hardhat node
```

## Adding Custom Network

1. Get chain info from [ChainList](https://chainlist.org/)
2. Add network to `apps/contracts/hardhat.config.ts`
3. Update both `.env` files with chain details
4. Deploy: `yarn deploy`

## RPC Providers

Get free API keys:

- [Alchemy](https://www.alchemy.com/) (recommended)
- [Infura](https://infura.io/)

## Gas Costs

| Network          | Deploy  | Per Summon |
| ---------------- | ------- | ---------- |
| Ethereum Mainnet | $50-200 | $5-20      |
| Polygon          | < $1    | < $0.05    |
| Arbitrum/Base    | $1-5    | $0.10-0.50 |
| Testnet          | FREE    | FREE       |

**Recommendation:** Use Polygon or Base for low costs!

## Troubleshooting

**Wrong network?** Switch in your wallet to match `.env` config

**RPC errors?** Check your RPC URL is correct and accessible

**Transaction fails?** Ensure you have native tokens for gas

**More help:** Check [ChainList](https://chainlist.org/) for network details
