import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const warehouseId = '8e7102f4-b3b7-492c-98eb-0d4cd6bb7314';
  
  console.log('=== Debug Transfer Issue ===\n');
  
  // Get item type for جوي
  const jaweResult = await pool.query(
    `SELECT * FROM item_types WHERE name_ar = 'جوي' OR name_en ILIKE '%jawe%'`
  );
  
  console.log('--- Jawe Item Type ---');
  if (jaweResult.rows[0]) {
    const jawe = jaweResult.rows[0];
    console.log('ID:', jawe.id);
    console.log('Name AR:', jawe.name_ar);
    console.log('Name EN:', jawe.name_en);
    console.log('ID includes dash?:', jawe.id.includes('-'));
  }
  
  // Check what entries exist
  console.log('\n--- Warehouse Entries with Full IDs ---');
  const entriesResult = await pool.query(
    `SELECT e.item_type_id, e.boxes, e.units, t.name_ar, t.name_en 
     FROM warehouse_inventory_entries e 
     LEFT JOIN item_types t ON e.item_type_id = t.id 
     WHERE e.warehouse_id = $1`,
    [warehouseId]
  );
  
  entriesResult.rows.forEach(e => {
    console.log(`ID: ${e.item_type_id}`);
    console.log(`   Name: ${e.name_ar} (${e.name_en})`);
    console.log(`   Stock: ${e.boxes} boxes, ${e.units} units`);
    console.log(`   ID includes dash?: ${e.item_type_id.includes('-')}`);
    console.log('');
  });
  
  await pool.end();
}

check().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
