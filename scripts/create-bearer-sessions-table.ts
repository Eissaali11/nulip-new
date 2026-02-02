/**
 * Script to create bearer_sessions table
 * Run with: npx tsx scripts/create-bearer-sessions-table.ts
 */

import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function createTable() {
  try {
    console.log('🔧 Creating bearer_sessions table...\n');
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bearer_sessions (
        token VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        expiry TIMESTAMP NOT NULL
      )
    `);
    
    console.log('✅ Table created!');
    
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_bearer_sessions_expiry ON bearer_sessions(expiry)`);
    
    console.log('✅ Index created!');
    console.log('\n🎉 bearer_sessions table is ready!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTable();
