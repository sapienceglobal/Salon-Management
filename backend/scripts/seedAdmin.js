import { db, closeConnection } from '../src/config/database.js';
import bcrypt from 'bcryptjs';
import { logger } from '../src/config/logger.js';

async function seedAdmin() {
  try {
    logger.info('Starting Admin Seeding Process...');

    const adminEmail = 'admin@salon.com';
    const adminPassword = 'Admin@12345';

    // 1. Check if business exists, if not create a default one
    let business = await db('businesses').first();
    let businessId;

    if (!business) {
      logger.info('No business found. Creating default business...');
      const [id] = await db('businesses').insert({
        name: 'Salon Pro Headquarters',
        address: '123 Beauty Ave, Style City',
        phone: '+1234567890',
        email: 'contact@salonpro.com',
        website: 'www.salonpro.com',
      });
      businessId = id;
    } else {
      businessId = business.id;
    }

    // 2. Check if admin user already exists
    const existingAdmin = await db('users').where({ email: adminEmail }).first();

    if (existingAdmin) {
      logger.info(`Admin already exists with email: ${adminEmail}`);
      
      // Update password just in case
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await db('users').where({ id: existingAdmin.id }).update({
        password_hash: hashedPassword,
        role: 'super_admin'
      });
      logger.info('Updated existing admin password to default.');
    } else {
      // 3. Create new super_admin
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await db('users').insert({
        business_id: businessId,
        first_name: 'System',
        last_name: 'Admin',
        email: adminEmail,
        password_hash: hashedPassword,
        role: 'super_admin',
        is_active: true
      });
      logger.info('Successfully created new Super Admin!');
    }

    console.log('\n=============================================');
    console.log('✅ ADMIN CREDENTIALS GENERATED SUCCESSFULLY!');
    console.log('---------------------------------------------');
    console.log(`📧 Email:    ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('=============================================\n');

  } catch (error) {
    logger.error('Failed to seed admin:', error);
  } finally {
    await closeConnection();
    process.exit(0);
  }
}

seedAdmin();
