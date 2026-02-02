/**
 * Script to list all item types in database
 */

import 'dotenv/config';
import { db } from '../server/db';
import { itemTypes } from '../shared/schema';

async function listItemTypes() {
  try {
    console.log('Fetching item types from database...\n');
    
    const types = await db.select().from(itemTypes);
    
    console.log('=== Item Types in Database ===\n');
    types.forEach(t => {
      console.log(`ID: ${t.id}`);
      console.log(`  nameAr: ${t.nameAr}`);
      console.log(`  nameEn: ${t.nameEn}`);
      console.log(`  isActive: ${t.isActive}`);
      console.log('---');
    });
    
    console.log(`\nTotal: ${types.length} item types`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listItemTypes();
