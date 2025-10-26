#!/usr/bin/env node

/**
 * MongoDB Configuration Diagnostic Script
 * 
 * This script helps diagnose MongoDB replica set configuration issues.
 * 
 * Usage:
 *   node scripts/check-mongodb-config.js
 */

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

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

async function checkMongoDBConfig() {
  const client = new MongoClient(config.uri);
  const hostDisplay = extractHostFromUri(config.uri);

  console.log('🔍 MongoDB Configuration Diagnostic');
  console.log('===================================');
  console.log(`📡 Connecting to: ${hostDisplay}`);
  console.log(`🔧 Expected replica set name: ${config.replicaSetName}`);
  console.log('');

  try {
    // Connect to MongoDB
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const adminDb = client.db('admin');

    // Check ismaster command
    console.log('📊 Checking MongoDB status...');
    try {
      const ismaster = await adminDb.command({ ismaster: 1 });
      console.log('✅ ismaster command successful');
      console.log('📋 MongoDB Status:');
      console.log(`   - Version: ${ismaster.version || 'Unknown'}`);
      console.log(`   - Replica Set Name: ${ismaster.setName || 'None (standalone)'}`);
      console.log(`   - Is Primary: ${ismaster.ismaster || false}`);
      console.log(`   - Is Secondary: ${ismaster.secondary || false}`);
      console.log(`   - Replica Set Members: ${ismaster.hosts ? ismaster.hosts.length : 0}`);

      if (ismaster.setName) {
        console.log(`✅ MongoDB is configured for replica set: ${ismaster.setName}`);
        if (ismaster.setName === config.replicaSetName) {
          console.log(`✅ Replica set name matches expected: ${config.replicaSetName}`);
        } else {
          console.log(`⚠️  Replica set name mismatch! Expected: ${config.replicaSetName}, Found: ${ismaster.setName}`);
        }
      } else {
        console.log('❌ MongoDB is NOT configured for replica sets');
        console.log('💡 This means MongoDB was not started with --replSet flag');
      }

    } catch (error) {
      console.log('❌ Failed to run ismaster command:', error.message);
    }

    // Check if we can get replica set status
    console.log('');
    console.log('📊 Checking replica set status...');
    try {
      const status = await adminDb.command({ replSetGetStatus: 1 });
      console.log('✅ Replica set status available');
      console.log(`📋 Replica Set Status:`);
      console.log(`   - Set Name: ${status.set}`);
      console.log(`   - Members: ${status.members.length}`);
      console.log(`   - Primary: ${status.members.find(m => m.stateStr === 'PRIMARY')?.name || 'None'}`);
      console.log(`   - State: ${status.myState === 1 ? 'Primary' : status.myState === 2 ? 'Secondary' : 'Other'}`);
    } catch (error) {
      console.log('❌ Replica set status not available:', error.message);
      if (error.message.includes('not running with --replSet')) {
        console.log('💡 This confirms MongoDB was not started with --replSet flag');
      }
    }

    // Test transaction support
    console.log('');
    console.log('🧪 Testing transaction support...');
    try {
      const session = client.startSession();
      await session.endSession();
      console.log('✅ Transaction support is available!');
    } catch (error) {
      console.log('❌ Transaction support not available:', error.message);
    }

  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('💡 Make sure MongoDB is running and accessible');
  } finally {
    await client.close();
  }

  console.log('');
  console.log('🔧 Troubleshooting Recommendations:');
  console.log('');

  if (config.uri.includes('localhost') || config.uri.includes('127.0.0.1')) {
    console.log('📋 For local MongoDB:');
    console.log('   1. Stop MongoDB');
    console.log('   2. Start with: mongod --replSet rs0 --port 27017');
    console.log('   3. Or add to mongod.conf:');
    console.log('      replication:');
    console.log('        replSetName: "rs0"');
  } else {
    console.log('📋 For remote MongoDB (Coolify/Cloud):');
    console.log('   1. Check your MongoDB deployment configuration');
    console.log('   2. Ensure --replSet rs0 is set in startup parameters');
    console.log('   3. Check MongoDB logs for startup errors');
    console.log('   4. Verify the replica set name matches your configuration');
  }

  console.log('');
  console.log('✅ Diagnostic completed');
}

// Run the script
if (require.main === module) {
  checkMongoDBConfig().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { checkMongoDBConfig };
