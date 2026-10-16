import { db } from '../config/database.js';

/**
 * Script to safely update the primary owner account to kairamakeuppalace@gmail.com
 * and ensure its role is super_admin (Owner Account).
 *
 * Usage:
 *   node src/scripts/updateOwnerAccount.js [optional_email]
 */
async function updateOwner() {
  const targetEmail = (process.argv[2] || 'kairamakeuppalace@gmail.com').toLowerCase().trim();
  console.log(`\n🔍 Searching for primary system account to set as Owner...`);

  try {
    // 1. Try finding existing super_admin or admin
    let user = await db('users')
      .whereIn('role', ['super_admin', 'admin'])
      .orderBy('id', 'asc')
      .first();

    // If none found by role, grab the earliest registered user
    if (!user) {
      user = await db('users').orderBy('id', 'asc').first();
    }

    if (!user) {
      console.error('❌ Error: No user account found in database.');
      process.exit(1);
    }

    console.log(`📌 Found target user account:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.first_name} ${user.last_name || ''}`.trim());
    console.log(`   Current Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);

    // Update user record
    await db('users')
      .where({ id: user.id })
      .update({
        email: targetEmail,
        role: 'super_admin',
        updated_at: db.fn.now(),
      });

    // Also sync linked staff_member if present
    await db('staff_members')
      .where({ user_id: user.id })
      .update({
        email: targetEmail,
        updated_at: db.fn.now(),
      })
      .catch(() => {});

    console.log(`\n✅ SUCCESS! Primary Owner Account successfully configured:`);
    console.log(`   Email: ${targetEmail}`);
    console.log(`   Role: super_admin (Displays as "Owner Account" in Sidebar)`);
    console.log(`\nYou can now log in using this email address.\n`);
  } catch (error) {
    console.error('❌ Error updating owner account:', error.message);
  } finally {
    await db.destroy();
    process.exit(0);
  }
}

updateOwner();
