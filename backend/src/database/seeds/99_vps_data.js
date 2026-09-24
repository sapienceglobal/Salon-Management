export const seed = async function (knex) {
  // Get the first available business dynamically
  const business = await knex('businesses').first();
  if (!business) {
    console.error('No business found. Please register a business or run the initial seeds first.');
    return;
  }
  const BUSINESS_ID = business.id;
  const now = new Date();

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  // 1. SEED USERS (For Staff)
  const users = [
    { business_id: BUSINESS_ID, first_name: 'Rahul', last_name: 'Sharma', email: 'rahul@example.com', phone: '9876543210', role: 'staff', created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, first_name: 'Priya', last_name: 'Singh', email: 'priya@example.com', phone: '9876543211', role: 'staff', created_at: now, updated_at: now }
  ];
  await knex('users').insert(users).onConflict('email').ignore();
  const dbUsers = await knex('users').where({ business_id: BUSINESS_ID, role: 'staff' }).limit(2);

  // 2. SEED STAFF MEMBERS
  if (dbUsers.length > 0) {
    const staff = dbUsers.map(u => ({
      business_id: BUSINESS_ID,
      user_id: u.id,
      designation: 'Senior Stylist',
      salary: 20000,
      is_available: true,
      created_at: now,
      updated_at: now
    }));
    await knex('staff_members').insert(staff).onConflict('user_id').ignore();
  }
  const dbStaff = await knex('staff_members').where({ business_id: BUSINESS_ID }).limit(2);

  // 3. SEED CUSTOMERS
  const customers = [
    { business_id: BUSINESS_ID, first_name: 'Neha', last_name: 'Gupta', phone: '9000000001', email: 'neha@example.com', gender: 'female', is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, first_name: 'Rohan', last_name: 'Verma', phone: '9000000002', email: 'rohan@example.com', gender: 'male', is_active: true, created_at: now, updated_at: now }
  ];
  await knex('customers').insert(customers).onConflict(['business_id', 'phone']).ignore();
  const dbCustomers = await knex('customers').where({ business_id: BUSINESS_ID }).limit(2);

  // 4. SEED WALLETS
  // Note: Wallets table schema might be different. 
  // Let's assume it has customer_id and balance.
  // We'll skip wallets if the schema is complex to guess, but we can try basic fields.

  // 5. SEED SERVICE CATEGORIES
  const categories = [
    { business_id: BUSINESS_ID, name: 'Hair Care', description: 'Hair cut, coloring, styling', is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, name: 'Skin Care', description: 'Facials, cleanup, therapies', is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, name: 'Makeup', description: 'Bridal, party makeup', is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, name: 'Nails', description: 'Manicure, pedicure, nail art', is_active: true, created_at: now, updated_at: now }
  ];
  await knex('service_categories').insert(categories).onConflict('id').ignore();
  const dbCategories = await knex('service_categories').where({ business_id: BUSINESS_ID });

  // 6. SEED SERVICES
  const getCatId = (name) => dbCategories.find(c => c.name === name)?.id;
  const services = [
    { business_id: BUSINESS_ID, category_id: getCatId('Hair Care'), name: 'Men Haircut', price: 250, duration_minutes: 30, is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, category_id: getCatId('Hair Care'), name: 'Women Haircut', price: 500, duration_minutes: 45, is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, category_id: getCatId('Hair Care'), name: 'Hair Spa', price: 1200, duration_minutes: 60, is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, category_id: getCatId('Skin Care'), name: 'Fruit Facial', price: 800, duration_minutes: 45, is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, category_id: getCatId('Skin Care'), name: 'D-Tan Pack', price: 400, duration_minutes: 30, is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, category_id: getCatId('Makeup'), name: 'Bridal Makeup', price: 8000, duration_minutes: 180, is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, category_id: getCatId('Makeup'), name: 'Party Makeup', price: 2500, duration_minutes: 90, is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, category_id: getCatId('Nails'), name: 'Classic Manicure', price: 350, duration_minutes: 45, is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, category_id: getCatId('Nails'), name: 'Gel Nail Art', price: 1500, duration_minutes: 60, is_active: true, created_at: now, updated_at: now }
  ];
  await knex('salon_services').insert(services).onConflict('id').ignore();
  const dbServices = await knex('salon_services').where({ business_id: BUSINESS_ID }).limit(2);

  // 7. SEED INVENTORY (PRODUCTS)
  const products = [
    { business_id: BUSINESS_ID, name: "L'Oréal Professionnel Shampoo", category: "Hair Care", brand: "L'Oréal", sku: 'LO-SH-300', purchase_price: 650.00, selling_price: 950.00, stock_quantity: 24, min_stock_alert: 5, unit: 'ml', is_active: true },
    { business_id: BUSINESS_ID, name: "Kerastase Hair Oil", category: "Hair Treatment", brand: "Kerastase", sku: 'KER-HO-100', purchase_price: 2100.00, selling_price: 3200.00, stock_quantity: 3, min_stock_alert: 5, unit: 'ml', is_active: true },
    { business_id: BUSINESS_ID, name: 'Schwarzkopf Hairspray', category: 'Styling', brand: 'Schwarzkopf', sku: 'SCH-HS-500', purchase_price: 450.00, selling_price: 750.00, stock_quantity: 12, min_stock_alert: 10, unit: 'ml', is_active: true },
    { business_id: BUSINESS_ID, name: 'O3+ Facial Kit', category: 'Skin Care', brand: 'O3+', sku: 'O3-FK-01', purchase_price: 1200.00, selling_price: 1800.00, stock_quantity: 15, min_stock_alert: 3, unit: 'pcs', is_active: true },
    { business_id: BUSINESS_ID, name: 'Lotus Herbals D-Tan Pack', category: 'Skin Care', brand: 'Lotus', sku: 'LOT-DT-200', purchase_price: 350.00, selling_price: 550.00, stock_quantity: 8, min_stock_alert: 4, unit: 'gm', is_active: true }
  ];
  await knex('products').insert(products).onConflict('id').ignore();

  // 8. SEED APPOINTMENTS
  if (dbCustomers.length > 0 && dbStaff.length > 0 && dbServices.length > 0) {
    const appointments = [
      {
        business_id: BUSINESS_ID,
        customer_id: dbCustomers[0].id,
        staff_member_id: dbStaff[0].id,
        appointment_date: now.toISOString().split('T')[0],
        start_time: '10:00:00',
        end_time: '11:00:00',
        status: 'scheduled',
        notes: 'First time customer',
        created_at: now,
        updated_at: now
      }
    ];
    await knex('appointments').insert(appointments).onConflict('id').ignore();
  }

  console.log(`Successfully seeded realistic data (Users, Staff, Customers, Services, Inventory, Appointments) for Business ID: ${BUSINESS_ID}`);
};
