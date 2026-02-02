/**
 * Reset database - drop all tables and recreate
 */
import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const { Pool } = pg;

async function resetDatabase() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('🗑️  Dropping all existing tables...');
    
    // Get all table names
    const result = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    if (result.rows.length > 0) {
      console.log(`Found ${result.rows.length} existing tables`);
      
      // Drop all tables
      for (const row of result.rows) {
        await pool.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`);
        console.log(`  ✅ Dropped table: ${row.tablename}`);
      }
    } else {
      console.log('No existing tables found');
    }
    
    console.log('\n📂 Reading migration file...');
    const migrationPath = join(process.cwd(), 'migrations', '0000_glossy_hercules.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    
    console.log('🚀 Creating all tables...');
    await pool.query(sql);
    
    console.log('\n✅ Migration applied successfully!');
    console.log('📊 Database tables created:');
    console.log('  - inventory_items');
    console.log('  - inventory_requests');
    console.log('  - item_types');
    console.log('  - received_devices');
    console.log('  - regions');
    console.log('  - stock_movements');
    console.log('  - supervisor_technicians');
    console.log('  - supervisor_warehouses');
    console.log('  - system_logs');
    console.log('  - technician_fixed_inventories');
    console.log('  - technician_fixed_inventory_entries');
    console.log('  - technician_moving_inventory_entries');
    console.log('  - technicians_inventory');
    console.log('  - transactions');
    console.log('  - users');
    console.log('  - warehouse_inventory');
    console.log('  - warehouse_inventory_entries');
    console.log('  - warehouse_transfers');
    console.log('  - warehouses');
    console.log('  - withdrawn_devices');
    
    console.log('\n🎉 Database is ready!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();
