import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const warehouseId = '8e7102f4-b3b7-492c-98eb-0d4cd6bb7314';
  
  console.log('=== Checking Warehouse Inventory ===\n');
  
  // Check legacy inventory
  const legacyResult = await pool.query(
    'SELECT * FROM warehouse_inventory WHERE warehouse_id = $1',
    [warehouseId]
  );
  
  console.log('--- Legacy Inventory (warehouse_inventory table) ---');
  if (legacyResult.rows[0]) {
    const inv = legacyResult.rows[0];
    console.log('n950:', inv.n950_boxes, 'boxes,', inv.n950_units, 'units');
    console.log('i9000s:', inv.i9000s_boxes, 'boxes,', inv.i9000s_units, 'units');
    console.log('i9100:', inv.i9100_boxes, 'boxes,', inv.i9100_units, 'units');
    console.log('rollPaper:', inv.roll_paper_boxes, 'boxes,', inv.roll_paper_units, 'units');
    console.log('stickers:', inv.stickers_boxes, 'boxes,', inv.stickers_units, 'units');
    console.log('newBatteries:', inv.new_batteries_boxes, 'boxes,', inv.new_batteries_units, 'units');
    console.log('mobilySim:', inv.mobily_sim_boxes, 'boxes,', inv.mobily_sim_units, 'units');
    console.log('stcSim:', inv.stc_sim_boxes, 'boxes,', inv.stc_sim_units, 'units');
    console.log('zainSim:', inv.zain_sim_boxes, 'boxes,', inv.zain_sim_units, 'units');
    console.log('lebara:', inv.lebara_boxes, 'boxes,', inv.lebara_units, 'units');
  } else {
    console.log('No legacy inventory found');
  }
  
  // Check new entries
  console.log('\n--- Dynamic Inventory (warehouse_inventory_entries table) ---');
  const entriesResult = await pool.query(
    `SELECT e.*, t.name_ar, t.name_en 
     FROM warehouse_inventory_entries e 
     LEFT JOIN item_types t ON e.item_type_id = t.id 
     WHERE e.warehouse_id = $1`,
    [warehouseId]
  );
  
  console.log('Total entries:', entriesResult.rows.length);
  entriesResult.rows.forEach(e => {
    console.log(`${e.name_ar || e.item_type_id}: ${e.boxes} boxes, ${e.units} units`);
  });
  
  // Get all item types
  console.log('\n--- All Item Types ---');
  const typesResult = await pool.query('SELECT id, name_ar, name_en, is_active, is_visible FROM item_types ORDER BY sort_order');
  typesResult.rows.forEach(t => {
    console.log(`${t.id.substring(0, 8)}... - ${t.name_ar} (${t.name_en}) - Active: ${t.is_active}, Visible: ${t.is_visible}`);
  });
  
  await pool.end();
}

check().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
