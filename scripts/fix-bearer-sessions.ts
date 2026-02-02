/**
 * Script to fix bearer_sessions table structure
 */

import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function fixTable() {
  const client = await pool.connect();
  try {
    console.log('🔧 Dropping old bearer_sessions table...');
    await client.query('DROP TABLE IF EXISTS bearer_sessions');
    
    console.log('🔧 Creating new bearer_sessions table with correct structure...');
    await client.query(`
      CREATE TABLE bearer_sessions (
        token VARCHAR(255) PRIMARY KEY,
        "userId" VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        username VARCHAR(255) NOT NULL,
        "regionId" VARCHAR(255),
        expiry BIGINT NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('🔧 Creating index...');
    await client.query('CREATE INDEX idx_bearer_sessions_expiry ON bearer_sessions(expiry)');
    
    console.log('✅ bearer_sessions table fixed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixTable();
