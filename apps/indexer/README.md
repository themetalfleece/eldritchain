# Eldritchain Indexer

Backend service that indexes blockchain events and provides a high-performance leaderboard API using Fastify.

## Features

- 🔍 **Event Indexer** - Listens to `CreatureSummoned` events
- 📊 **Leaderboard** - Ranks users by deity → epic → rare → common counts
- 🗄️ **MongoDB** - Stores individual summon events
- ⚡ **Fastify API** - High-performance REST API
- 🐳 **Docker** - Easy MongoDB setup
- 📜 **Event Sourcing** - Complete summon history with idempotent processing

## Prerequisites

- Node.js 22.14.0 (specified in `.nvmrc`)
- Yarn package manager
- MongoDB (via Docker or external service)

## Quick Start

### 1. Install Node.js Version

```bash
# Use the exact Node.js version
nvm install
nvm use
```

### 2. Start MongoDB

```bash
cd apps/indexer
docker compose up -d
```

This starts MongoDB on port 27017.

### 3. Install Dependencies

```bash
yarn install
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your contract address and configuration:

```env
CONTRACT_ADDRESS=0xYourContractAddress
NETWORK=polygonAmoy

# IMPORTANT: Set START_BLOCK to your contract deployment block
# This avoids scanning millions of empty blocks
START_BLOCK=12345678  # Replace with your deployment block number
```

**💡 Pro Tip:** Always set `START_BLOCK` to your contract's deployment block! This avoids scanning millions of empty blocks.

**How to find your deployment block:**

1. Go to your contract on the block explorer (e.g., https://amoy.polygonscan.com/address/0xYourAddress)
2. Click on the contract creation transaction
3. Note the block number
4. Set `START_BLOCK=<that_block_number>` in your `.env`

**Examples:**

```env
# If deployed at block 77678611 on mainnet
START_BLOCK=77678611

# If deployed at block 5000000 on Polygon Amoy
START_BLOCK=5000000

# For Coolify or other managed MongoDB, use authSource=admin for root user
MONGODB_URI=mongodb://root:PASSWORD@HOST:27017/eldritchain?authSource=admin&directConnection=true
```

### 5. Run the Indexer

You can run both services together or separately:

**Option A: Run Both Together (Monolithic)**

```bash
# Development (with hot reload)
yarn dev

# Production
yarn build
yarn start
```

**Option B: Run Separately (Recommended for Production)**

This allows you to scale each service independently and restart them without affecting each other.

```bash
# Development - Terminal 1: API Server
yarn dev:api

# Development - Terminal 2: Event Indexer
yarn dev:indexer

# Production - Process 1: API Server
yarn build
yarn start:api

# Production - Process 2: Event Indexer
yarn build
yarn start:indexer
```

**💡 Why separate processes?**

- Scale API and indexer independently
- Restart indexer without affecting API
- Better resource allocation
- Easier debugging and monitoring

## Docker Deployment 🐳

### Build Docker Images

From the **repository root**, build the images:

```bash
# Build API image
docker build -f apps/indexer/Dockerfile.api -t eldritchain-api:latest .

# Build Indexer image
docker build -f apps/indexer/Dockerfile.indexer -t eldritchain-indexer:latest .
```

### Run with Docker Compose

Create a `docker-compose.prod.yml`:

```yaml
version: "3.8"

services:
  mongodb:
    image: mongo:7
    container_name: eldritchain-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: your_secure_password
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  api:
    image: eldritchain-api:latest
    container_name: eldritchain-api
    restart: unless-stopped
    depends_on:
      - mongodb
    environment:
      CONTRACT_ADDRESS: "0xYourContractAddress"
      NETWORK: "polygonAmoy"
      START_BLOCK: "12345678"
      MONGODB_URI: "mongodb://admin:your_secure_password@mongodb:27017/eldritchain?authSource=admin"
      PORT: "3001"
    ports:
      - "3001:3001"

  indexer:
    image: eldritchain-indexer:latest
    container_name: eldritchain-indexer
    restart: unless-stopped
    depends_on:
      - mongodb
    environment:
      CONTRACT_ADDRESS: "0xYourContractAddress"
      NETWORK: "polygonAmoy"
      START_BLOCK: "12345678"
      MONGODB_URI: "mongodb://admin:your_secure_password@mongodb:27017/eldritchain?authSource=admin"

volumes:
  mongodb_data:
```

Start all services:

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Using Pre-built Images

If pushing to Docker Hub:

```bash
# Tag images
docker tag eldritchain-api:latest your-username/eldritchain-api:latest
docker tag eldritchain-indexer:latest your-username/eldritchain-indexer:latest

# Push to Docker Hub
docker push your-username/eldritchain-api:latest
docker push your-username/eldritchain-indexer:latest

# Update docker-compose.prod.yml to use your images
# image: your-username/eldritchain-api:latest
# image: your-username/eldritchain-indexer:latest
```

### Docker Image Details

**Both images use:**

- Node.js 22.14.0 Alpine (small footprint)
- Multi-stage builds (optimized size)
- Production dependencies only
- Non-root user for security

**Image sizes:**

- API: ~150MB
- Indexer: ~150MB

## API Endpoints

### Health Check

```
GET /health
```

### Get Leaderboard

```
GET /api/leaderboard?limit=100
```

Aggregates user stats from all summon events and ranks them.

Response:

```json
{
  "success": true,
  "data": [
    {
      "address": "0x1234...",
      "totalSummons": 150,
      "deityCount": 5,
      "epicCount": 12,
      "rareCount": 38,
      "commonCount": 95,
      "lastSummonTime": "2024-10-14T12:00:00.000Z"
    }
  ],
  "count": 100
}
```

### Get User Stats

```
GET /api/user/:address
```

Aggregates stats for a specific user including their rank.

Response:

```json
{
  "success": true,
  "data": {
    "address": "0x1234...",
    "totalSummons": 150,
    "deityCount": 5,
    "epicCount": 12,
    "rareCount": 38,
    "commonCount": 95,
    "rank": 42,
    "lastSummonTime": "2024-10-14T12:00:00.000Z"
  }
}
```

### Get User Summon History

```
GET /api/user/:address/history?limit=50&skip=0
```

Returns paginated list of all summon events for a user.

Response:

```json
{
  "success": true,
  "data": [
    {
      "address": "0x1234...",
      "creatureId": 1601,
      "rarity": "deity",
      "level": 1,
      "timestamp": "2024-10-14T12:00:00.000Z",
      "blockNumber": "12345678",
      "transactionHash": "0xabc..."
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "skip": 0,
    "hasMore": true
  }
}
```

### Get Global Stats

```
GET /api/stats
```

Response:

```json
{
  "success": true,
  "data": {
    "totalUsers": 1247,
    "totalSummons": 45892,
    "topDeityCollector": {
      "address": "0x1234...",
      "deityCount": 15
    }
  }
}
```

## How It Works

1. **Event Listening**: Continuously polls the blockchain for `CreatureSummoned` events
2. **Data Processing**: Categorizes creatures by rarity (deity/epic/rare/common)
3. **Database Storage**: Stores each summon event as a separate document in MongoDB
4. **Real-time Aggregation**: API aggregates stats on-demand from events
5. **Idempotency**: Duplicate events are automatically skipped using transaction hash

### Data Model

Each summon is stored as an individual event:

```typescript
{
  address: "0x1234...",
  creatureId: 1601,
  rarity: "deity",
  level: 1,
  timestamp: Date,
  blockNumber: "12345678",
  transactionHash: "0xabc..."
}
```

**Benefits:**

- Complete summon history per user
- Time-series analytics capabilities
- Easy to rebuild aggregations
- Idempotent event processing

## Leaderboard Ranking

Users are ranked by:

1. **Deity count** (highest priority)
2. **Epic count** (if deity count is tied)
3. **Rare count** (if epic count is tied)
4. **Common count** (if rare count is tied)

## Configuration

Environment variables in `.env` (all REQUIRED):

| Variable           | Description                                          | Example                                        |
| ------------------ | ---------------------------------------------------- | ---------------------------------------------- |
| `MONGODB_URI`      | MongoDB connection string                            | `mongodb://localhost:27017/eldritchain`        |
| `CONTRACT_ADDRESS` | Smart contract address                               | `0x1234...` (42 chars starting with 0x)        |
| `NETWORK`          | Network name (auto-configures RPC and chain ID)      | `polygonAmoy`, `polygon`, `sepolia`, `mainnet` |
| `PORT`             | API server port                                      | `3001`                                         |
| `START_BLOCK`      | Block to start indexing from (use deployment block!) | `77678611` or `0`                              |
| `POLL_INTERVAL`    | Polling interval in ms                               | `12000` (12 seconds)                           |

**⚠️ All variables are required!** The app will fail to start with a clear error message if any are missing.

**Network configuration** is shared with the web app via `@eldritchain/common`. Setting `NETWORK=polygonAmoy` automatically configures the correct RPC URL and chain ID.

## Development

### View MongoDB Data

**Option 1: Command Line**

```bash
docker exec -it eldritchain-mongodb mongosh eldritchain
```

**Option 2: MongoDB Compass (Recommended)**

- Download [MongoDB Compass](https://www.mongodb.com/products/compass)
- Connect to `mongodb://localhost:27017/eldritchain`
- Visual interface for browsing data

### Stop MongoDB

```bash
docker compose down
```

### Reset Database

```bash
docker compose down -v  # Deletes all data
docker compose up -d
```

## Production Deployment

1. Use managed MongoDB (MongoDB Atlas, AWS DocumentDB)
2. Set `MONGODB_URI` to production database
3. Use a reliable RPC provider (Alchemy, Infura)
4. Deploy to cloud (Railway, Render, AWS, etc.)
5. Enable monitoring and logging

## Troubleshooting

**"Cannot connect to MongoDB"**

- Ensure Docker is running
- Run `docker compose up -d`
- Check `docker compose ps`

**"No events found"**

- Verify `CONTRACT_ADDRESS` is correct
- Check contract has been deployed and has summon events
- Ensure `NETWORK` is correct and accessible
- Check `START_BLOCK` - if set too high, you might be starting after all events

**"Events are delayed"**

- Adjust `POLL_INTERVAL` (lower = faster, but more RPC calls)
- Use WebSocket RPC for real-time updates

## Architecture

```
apps/indexer/
├── src/
│   ├── index.ts              # Main entry point
│   ├── config.ts             # Configuration
│   ├── db/
│   │   ├── connection.ts     # MongoDB connection
│   │   └── models.ts         # Mongoose models
│   ├── indexer/
│   │   └── event-listener.ts # Blockchain event listener
│   └── api/
│       └── server.ts         # Express API server
├── docker-compose.yml        # MongoDB setup (use: docker compose)
├── package.json
└── tsconfig.json
```
