import bcrypt from 'bcryptjs';
import { db } from '../config/database.js';
import { env } from '../config/env.js';

async function resetPassword() {
  const newPassword = process.argv[2] || process.env.ADMIN_PASSWORD || 'LuxeAdmin@2026!';
  const adminEmail = process.argv[3] || process.env.ADMIN_EMAIL || 'admin@kairamakeover.salontime.co.in';

  if (!newPassword || newPassword.length < 6) {
    console.error('❌ Password must be at least 6 characters long.');
    process.exit(1);
  }

  try {
    const user = await db('users')
      .where({ email: adminEmail })
      .orWhere({ role: 'admin' })
      .first();

    if (!user) {
      console.error(`❌ Admin user not found with email: ${adminEmail}`);
      process.exit(1);
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await db('users')
      .where({ id: user.id })
      .update({
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_expires: null,
        updated_at: db.fn.now(),
      });

    console.log(`✅ Success! Password updated for admin: ${user.email}`);
    console.log(`🔑 New Password: ${newPassword}`);
  } catch (error) {
    console.error('❌ Error updating password:', error.message);
  } finally {
    await db.destroy();
    process.exit(0);
  }
}

resetPassword();
