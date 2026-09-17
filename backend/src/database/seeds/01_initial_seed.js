import bcrypt from 'bcryptjs';

/**
 * Seed: Create default business, admin user, and business settings.
 * Run with: npm run seed
 */
export async function seed(knex) {
  // Clear existing data (in reverse dependency order)
  await knex('notification_templates').del();
  await knex('customer_feedback').del();
  await knex('campaign_logs').del();
  await knex('campaigns').del();
  await knex('expenses').del();
  await knex('expense_categories').del();
  await knex('leads').del();
  await knex('staff_commissions').del();
  await knex('staff_attendance').del();
  await knex('reward_transactions').del();
  await knex('wallet_transactions').del();
  await knex('payments').del();
  await knex('invoice_items').del();
  await knex('invoices').del();
  await knex('appointment_services').del();
  await knex('appointments').del();
  await knex('customer_packages').del();
  await knex('customer_memberships').del();
  await knex('prepaid_plans').del();
  await knex('memberships').del();
  await knex('package_items').del();
  await knex('packages').del();
  await knex('customers').del();
  await knex('products').del();
  await knex('salon_services').del();
  await knex('service_categories').del();
  await knex('staff_working_hours').del();
  await knex('staff_members').del();
  await knex('service_rooms').del();
  await knex('commission_profiles').del();
  await knex('business_settings').del();
  await knex('refresh_tokens').del();
  await knex('audit_logs').del();
  await knex('users').del();
  await knex('businesses').del();

  // 1. Create default business
  const businessName = process.env.BUSINESS_NAME || 'Luxe Salon & Spa';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@luxesalon.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'LuxeAdmin@2026!';

  const [businessId] = await knex('businesses').insert({
    name: businessName,
    slug: businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    email: adminEmail,
    phone: '+919876543210',
    address: '123 Main Street, Sector 21',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    is_active: true,
  });

  // 2. Create admin user
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const [adminUserId] = await knex('users').insert({
    business_id: businessId,
    email: adminEmail,
    password_hash: passwordHash,
    first_name: 'Super',
    last_name: 'Admin',
    phone: '+919876543210',
    role: 'admin',
    is_active: true,
  });

  // 3. Create business settings
  await knex('business_settings').insert({
    business_id: businessId,
    tax_enabled: true,
    default_cgst: 9.00,
    default_sgst: 9.00,
    invoice_prefix: 'INV',
    invoice_counter: 1,
    reward_points_per_100: 10,
    reward_points_value: 1.00,
    appointment_slot_duration: 30,
    booking_advance_days: 30,
    sms_balance: 0,
    whatsapp_balance: 0,
    feedback_enabled: true,
    auto_feedback_after_visit: true,
    working_hours_start: '09:00:00',
    working_hours_end: '21:00:00',
    weekly_off_day: 1,
  });

  // 4. Create default service categories
  const [hairCatId] = await knex('service_categories').insert({
    business_id: businessId, name: 'Hair', sort_order: 1,
  });
  const [skinCatId] = await knex('service_categories').insert({
    business_id: businessId, name: 'Skin & Facial', sort_order: 2,
  });
  const [spaCatId] = await knex('service_categories').insert({
    business_id: businessId, name: 'Spa & Massage', sort_order: 3,
  });
  const [nailCatId] = await knex('service_categories').insert({
    business_id: businessId, name: 'Nails', sort_order: 4,
  });
  const [makeupCatId] = await knex('service_categories').insert({
    business_id: businessId, name: 'Makeup', sort_order: 5,
  });

  // 5. Create sample services
  await knex('salon_services').insert([
    { business_id: businessId, category_id: hairCatId, name: 'Haircut (Men)', duration_minutes: 30, price: 300, tax_percentage: 18, gender_target: 'male', sort_order: 1 },
    { business_id: businessId, category_id: hairCatId, name: 'Haircut (Women)', duration_minutes: 45, price: 500, tax_percentage: 18, gender_target: 'female', sort_order: 2 },
    { business_id: businessId, category_id: hairCatId, name: 'Hair Color', duration_minutes: 90, price: 1500, tax_percentage: 18, gender_target: 'unisex', sort_order: 3 },
    { business_id: businessId, category_id: hairCatId, name: 'Hair Spa', duration_minutes: 60, price: 1000, tax_percentage: 18, gender_target: 'unisex', sort_order: 4 },
    { business_id: businessId, category_id: hairCatId, name: 'Keratin Treatment', duration_minutes: 120, price: 5000, tax_percentage: 18, gender_target: 'unisex', sort_order: 5 },
    { business_id: businessId, category_id: skinCatId, name: 'Basic Facial', duration_minutes: 45, price: 800, tax_percentage: 18, gender_target: 'unisex', sort_order: 1 },
    { business_id: businessId, category_id: skinCatId, name: 'Gold Facial', duration_minutes: 60, price: 1500, tax_percentage: 18, gender_target: 'unisex', sort_order: 2 },
    { business_id: businessId, category_id: skinCatId, name: 'Cleanup', duration_minutes: 30, price: 500, tax_percentage: 18, gender_target: 'unisex', sort_order: 3 },
    { business_id: businessId, category_id: spaCatId, name: 'Full Body Massage', duration_minutes: 60, price: 2000, tax_percentage: 18, gender_target: 'unisex', sort_order: 1 },
    { business_id: businessId, category_id: spaCatId, name: 'Head Massage', duration_minutes: 30, price: 500, tax_percentage: 18, gender_target: 'unisex', sort_order: 2 },
    { business_id: businessId, category_id: nailCatId, name: 'Manicure', duration_minutes: 30, price: 400, tax_percentage: 18, gender_target: 'unisex', sort_order: 1 },
    { business_id: businessId, category_id: nailCatId, name: 'Pedicure', duration_minutes: 45, price: 500, tax_percentage: 18, gender_target: 'unisex', sort_order: 2 },
    { business_id: businessId, category_id: makeupCatId, name: 'Bridal Makeup', duration_minutes: 120, price: 15000, tax_percentage: 18, gender_target: 'female', sort_order: 1 },
    { business_id: businessId, category_id: makeupCatId, name: 'Party Makeup', duration_minutes: 60, price: 3000, tax_percentage: 18, gender_target: 'female', sort_order: 2 },
  ]);

  // 6. Create default expense categories
  await knex('expense_categories').insert([
    { business_id: businessId, name: 'Rent' },
    { business_id: businessId, name: 'Electricity' },
    { business_id: businessId, name: 'Supplies & Products' },
    { business_id: businessId, name: 'Staff Salary' },
    { business_id: businessId, name: 'Maintenance' },
    { business_id: businessId, name: 'Marketing' },
    { business_id: businessId, name: 'Miscellaneous' },
  ]);

  // 7. Create a default commission profile
  await knex('commission_profiles').insert({
    business_id: businessId,
    name: 'Default 10%',
    type: 'percentage',
    value: 10.00,
    is_active: true,
  });

  // 8. Create service rooms
  await knex('service_rooms').insert([
    { business_id: businessId, name: 'Room 1', capacity: 1 },
    { business_id: businessId, name: 'Room 2', capacity: 1 },
    { business_id: businessId, name: 'Room 3', capacity: 2 },
    { business_id: businessId, name: 'Spa Room', capacity: 1 },
  ]);

  console.log('✅ Seed data inserted successfully');
  console.log(`   🏢 Business: ${businessName}`);
  console.log(`   📧 Admin Email: ${adminEmail}`);
  console.log(`   🔑 Admin Password: ${adminPassword}`);
  console.log(`   ⚠️  Change this password immediately after first login!`);
}
