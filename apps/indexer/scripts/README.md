# MongoDB Replica Set Initialization Script

This script initializes a MongoDB replica set to enable transaction support for the indexer.

## Prerequisites

- MongoDB running with `--replSet rs0` flag
- Node.js installed
- MongoDB driver installed (`npm install mongodb`)

## Coolify config

https://rufatmammadli.medium.com/how-to-deploy-mongodb-replica-set-on-coolify-3e4bf06cecd0

Custom MongoDB Configuration:
```yml
replication:
 replSetName: "rs0"
security:
  authorization: enabled
  keyFile: /tmp/keyfile-mongo/keyfile-mongo-0
  ```

## Quick Start

### Using .env file (Recommended)
```bash
# Create .env file with your MongoDB connection URI
echo "MONGODB_URI=mongodb://your-username:your-password@your-host:27017/admin" >> .env

# Run the script
node scripts/init-replica-set.js
```

### Using environment variables
```bash
# For local development
node scripts/init-replica-set.js

# For Docker/containerized environments
MONGODB_URI=mongodb://mongodb:27017/admin node scripts/init-replica-set.js
```

## Environment Variables

You can customize the connection using these environment variables:

- `MONGODB_URI` - MongoDB connection URI (default: mongodb://localhost:27017/admin)
- `REPLICA_SET_NAME` - Replica set name (default: rs0)

## Examples

### Local Development
```bash
# Default settings (localhost:27017)
node scripts/init-replica-set.js
```

### Docker Environment
```bash
MONGODB_URI=mongodb://mongodb:27017/admin node scripts/init-replica-set.js
```

### Using .env file
```bash
# Create .env file
cat > .env << EOF
MONGODB_URI=mongodb://username:password@your-mongodb-host:27017/admin
REPLICA_SET_NAME=rs0
EOF

# Run the script
node scripts/init-replica-set.js
```

## What the Scripts Do

1. **Check if replica set is already initialized**
2. **Initialize replica set if needed** with the specified host
3. **Wait for initialization to complete**
4. **Test transaction support**
5. **Provide detailed status information**

## Troubleshooting

### Common Issues

1. **"mongosh not found"**
   - Install MongoDB Shell: https://docs.mongodb.com/mongodb-shell/install/

2. **"replica set not initialized"**
   - Make sure MongoDB is running with `--replSet rs0` flag

3. **"Connection refused"**
   - Check if MongoDB is running and accessible
   - Verify host and port settings

4. **"Authentication failed"**
   - Check username and password
   - Ensure user has admin privileges

### Verification

After running the script, you can verify the replica set is working:

```javascript
// Connect to MongoDB
mongosh

// Check replica set status
rs.status()

// Test transaction support
const session = db.getMongo().startSession()
session.endSession()
console.log("Transactions supported!")
```

## Next Steps

Once the replica set is initialized:

1. **Update your indexer** to use transactions
2. **Restart your indexer** to enable transaction support
3. **Monitor logs** for any transaction-related errors

The indexer will now have better data consistency and atomic operations! 🎉
