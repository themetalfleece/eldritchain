# Testing Guide

## Smart Contract Tests

```bash
cd apps/contracts
yarn test                    # Run all tests
REPORT_GAS=true yarn test    # Show gas costs
```

## Local Development

```bash
# Terminal 1: Start local Hardhat node
npx hardhat node

# Terminal 2: Deploy locally (set DEFAULT_NETWORK=localhost in .env)
yarn deploy
```

## Frontend Testing

### Quick Checklist

**Basic Flow:**

1. Connect wallet
2. Summon creature
3. Check cooldown timer works
4. View collection displays correctly
5. Test on mobile

**Common Issues:**

- Wrong network? Switch in wallet
- No test ETH? Use faucet
- Transaction fails? Check gas + network

### Performance Targets

- Page load: < 2 seconds
- Wallet connect: < 1 second
- Contract reads: < 500ms
- Bundle size: < 200 KB

```bash
cd apps/web
yarn build  # Check bundle size
```

## Troubleshooting

**Contract:**

- Cannot summon → Wait until next UTC day (midnight UTC)
- Transaction fails → Check gas and network
- Collection not loading → Verify contract address

**Frontend:**

- Wallet won't connect → Check WalletConnect ID (optional but recommended)
- Wrong network → Switch in wallet to match `.env` config
- Slow loading → Check RPC provider

That's it! For detailed testing procedures, check the contract tests in `apps/contracts/test/`.
