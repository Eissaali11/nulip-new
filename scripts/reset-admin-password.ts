/**
 * Script to reset admin password
 * Run with: npx tsx scripts/reset-admin-password.ts
 */

import 'dotenv/config';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../server/utils/password';

async function resetAdminPassword() {
  try {
    console.log('🔐 Resetting admin password...\n');

    // Hash the new password
    const newPassword = 'admin123';
    const hashedPassword = await hashPassword(newPassword);

    // Update admin user password
    const result = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.username, 'admin'))
      .returning({ id: users.id, username: users.username });

    if (result.length > 0) {
      console.log('✅ Password reset successful!');
      console.log(`   User: ${result[0].username}`);
      console.log(`   New Password: ${newPassword}`);
      console.log('\n📝 You can now login with:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('❌ Admin user not found. Creating new admin user...');
      
      // Create admin user if not exists
      const [newUser] = await db
        .insert(users)
        .values({
          username: 'admin',
          email: 'admin@company.com',
          password: hashedPassword,
          fullName: 'مدير النظام',
          city: 'الرياض',
          role: 'admin',
          isActive: true,
        })
        .returning({ id: users.id, username: users.username });

      console.log('✅ Admin user created!');
      console.log(`   Username: ${newUser.username}`);
      console.log(`   Password: ${newPassword}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();
