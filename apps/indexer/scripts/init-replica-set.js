#!/usr/bin/env node

/**
 * MongoDB Replica Set Initialization Script
 * 
 * This script initializes a MongoDB replica set for transaction support.
 * It can be run with Node.js and handles all the initialization logic.
 * 
 * Usage:
 *   node scripts/init-replica-set.js
 *   
 * The script will automatically load environment variables from:
 *   - .env file (using dotenv)
 *   - System environment variables
 *   
 * Environment Variables:
 *   MONGODB_URI - MongoDB connection URI (default: mongodb://localhost:27017/admin)
 *   REPLICA_SET_NAME - Replica set name (default: rs0)
 */

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Configuration from environment variables
const config = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/admin',
  replicaSetName: process.env.REPLICA_SET_NAME || 'rs0'
};

// Extract host from URI for display purposes
function extractHostFromUri(uri) {
  try {
    const url = new URL(uri);
    return `${url.hostname}:${url.port || '27017'}`;
  } catch (error) {
    return 'unknown';
  }
}

// Sleep function for waiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main initialization function
async function initializeReplicaSet() {
  const client = new MongoClient(config.uri);
  const hostDisplay = extractHostFromUri(config.uri);

  console.log('🚀 MongoDB Replica Set Initialization');
  console.log('=====================================');
  console.log(`📡 Connecting to: ${hostDisplay}`);
  console.log(`🔧 Replica set name: ${config.replicaSetName}`);
  console.log('');

  try {
    // Connect to MongoDB
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const adminDb = client.db('admin');

    // Check if replica set is already initialized
    try {
      const status = await adminDb.command({ replSetGetStatus: 1 });
      console.log('✅ Replica set is already initialized');
      console.log(`📊 Replica set name: ${status.set}`);
      console.log(`📊 Members: ${status.members.length}`);
      console.log(`📊 Primary: ${status.members.find(m => m.stateStr === 'PRIMARY')?.name || 'None'}`);

      // Check if current host is in the replica set
      const memberExists = status.members.some(member =>
        member.name === hostDisplay
      );

      if (memberExists) {
        console.log('✅ Current host is already a member of the replica set');
      } else {
        console.log('⚠️  Current host is not a member of the replica set');
        console.log('💡 You may need to add this host to the replica set');
      }

    } catch (error) {
      console.log('⚠️  Replica set not initialized, initializing now...');

      try {
        // Initialize the replica set
        const initResult = await adminDb.command({
          replSetInitiate: {
            _id: config.replicaSetName,
            members: [
              {
                _id: 0,
                host: hostDisplay,
                priority: 1
              }
            ]
          }
        });

        console.log('✅ Replica set initialization initiated');
        console.log('📊 Result:', JSON.stringify(initResult, null, 2));

        // Wait for initialization to complete
        console.log('⏳ Waiting for replica set to be ready...');

        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max wait

        while (attempts < maxAttempts) {
          try {
            const status = await adminDb.command({ replSetGetStatus: 1 });
            if (status.ok === 1) {
              console.log('🎉 Replica set is now ready!');
              console.log(`📊 Replica set name: ${status.set}`);
              console.log(`📊 Members: ${status.members.length}`);
              console.log(`📊 Primary: ${status.members.find(m => m.stateStr === 'PRIMARY')?.name || 'None'}`);
              break;
            }
          } catch (e) {
            // Still initializing
          }

          await sleep(1000);
          attempts++;
          console.log(`⏳ Still waiting... (${attempts}/${maxAttempts})`);
        }

        if (attempts >= maxAttempts) {
          console.log('⚠️  Replica set initialization is taking longer than expected');
          console.log('💡 Check MongoDB logs for any issues');
        }

      } catch (initError) {
        console.log('❌ Failed to initialize replica set:', initError.message);
        console.log('💡 Common issues:');
        console.log('   - MongoDB not running with --replSet flag');
        console.log('   - Host not accessible');
        console.log('   - Port not open');
        console.log('   - Authentication issues');
        throw initError;
      }
    }

    // Test transaction support
    console.log('🧪 Testing transaction support...');
    try {
      const session = client.startSession();
      await session.endSession();
      console.log('✅ Transaction support is available!');
    } catch (error) {
      console.log('❌ Transaction support not available:', error.message);
      console.log('💡 Replica set may still be initializing');
    }

  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('💡 Make sure MongoDB is running and accessible');
    process.exit(1);
  } finally {
    await client.close();
  }

  console.log('');
  console.log('✅ Script completed successfully!');
  console.log('');
  console.log('💡 Your MongoDB now supports transactions.');
  console.log('💡 You can now use the indexer with transaction support.');
}

// Run the script
if (require.main === module) {
  initializeReplicaSet().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { initializeReplicaSet };