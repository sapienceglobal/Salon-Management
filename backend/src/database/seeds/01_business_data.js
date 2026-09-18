export const seed = async function(knex) {
  const BUSINESS_ID = 6;
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

  // 5. SEED SERVICES
  const services = [
    { business_id: BUSINESS_ID, name: 'Haircut & Styling', price: 500, duration_minutes: 45, is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, name: 'Facial Therapy', price: 1200, duration_minutes: 60, is_active: true, created_at: now, updated_at: now }
  ];
  await knex('salon_services').insert(services).onConflict('id').ignore();
  const dbServices = await knex('salon_services').where({ business_id: BUSINESS_ID }).limit(2);

  // 6. SEED APPOINTMENTS
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

  console.log(`Successfully seeded realistic data for Business ID: ${BUSINESS_ID}`);
};
