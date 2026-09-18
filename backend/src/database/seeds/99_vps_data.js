export const seed = async function(knex) {
  // Find Kaira Makeover dynamically
  const kairaBusiness = await knex('businesses').where('name', 'like', '%Kaira Makeover%').first();
  if (!kairaBusiness) {
    console.log("Kaira Makeover business not found! Cannot seed.");
    return;
  }
  const BUSINESS_ID = kairaBusiness.id;
  console.log(`Seeding EXTENSIVE VPS data for Kaira Makeover (ID: ${BUSINESS_ID})...`);

  const now = new Date();

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const generateTime = (hour) => `${hour.toString().padStart(2, '0')}:00:00`;

  // 1. SEED USERS (For Staff)
  const users = [
    { business_id: BUSINESS_ID, first_name: 'Rahul', last_name: 'Sharma', email: 'rahul@example.com', phone: '9876543210', role: 'staff', created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, first_name: 'Priya', last_name: 'Singh', email: 'priya@example.com', phone: '9876543211', role: 'staff', created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, first_name: 'Amit', last_name: 'Kumar', email: 'amit@example.com', phone: '9876543212', role: 'staff', created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, first_name: 'Sneha', last_name: 'Reddy', email: 'sneha@example.com', phone: '9876543213', role: 'staff', created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, first_name: 'Vikram', last_name: 'Joshi', email: 'vikram@example.com', phone: '9876543214', role: 'staff', created_at: now, updated_at: now }
  ];
  await knex('users').insert(users).onConflict('email').ignore();
  const dbUsers = await knex('users').where({ business_id: BUSINESS_ID, role: 'staff' }).limit(5);

  // 2. SEED STAFF MEMBERS
  if (dbUsers.length > 0) {
    const staff = dbUsers.map((u, i) => ({
      business_id: BUSINESS_ID,
      user_id: u.id,
      designation: ['Senior Stylist', 'Hair Expert', 'Makeup Artist', 'Massage Therapist', 'Nail Artist'][i % 5],
      salary: 20000 + (i * 2000),
      is_available: true,
      created_at: now,
      updated_at: now
    }));
    await knex('staff_members').insert(staff).onConflict('user_id').ignore();
  }
  const dbStaff = await knex('staff_members').where({ business_id: BUSINESS_ID }).limit(5);

  // 3. SEED CUSTOMERS
  const customers = [
    { business_id: BUSINESS_ID, first_name: 'Neha', last_name: 'Gupta', phone: '9000000001', email: 'neha@example.com', gender: 'female', is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, first_name: 'Rohan', last_name: 'Verma', phone: '9000000002', email: 'rohan@example.com', gender: 'male', is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, first_name: 'Aarti', last_name: 'Desai', phone: '9000000003', email: 'aarti@example.com', gender: 'female', is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, first_name: 'Karan', last_name: 'Malhotra', phone: '9000000004', email: 'karan@example.com', gender: 'male', is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, first_name: 'Simran', last_name: 'Kaur', phone: '9000000005', email: 'simran@example.com', gender: 'female', is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, first_name: 'Aditi', last_name: 'Rao', phone: '9000000006', email: 'aditi@example.com', gender: 'female', is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, first_name: 'Raj', last_name: 'Patel', phone: '9000000007', email: 'raj@example.com', gender: 'male', is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, first_name: 'Pooja', last_name: 'Bhatia', phone: '9000000008', email: 'pooja@example.com', gender: 'female', is_active: true, created_at: now, updated_at: now }
  ];
  await knex('customers').insert(customers).onConflict(['business_id', 'phone']).ignore();
  const dbCustomers = await knex('customers').where({ business_id: BUSINESS_ID }).limit(8);

  // 4. SEED SERVICES
  const services = [
    { business_id: BUSINESS_ID, name: 'Haircut & Styling', price: 500, duration_minutes: 45, is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, name: 'Facial Therapy', price: 1200, duration_minutes: 60, is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, name: 'Bridal Makeup', price: 5000, duration_minutes: 180, is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, name: 'Manicure', price: 300, duration_minutes: 30, is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, name: 'Pedicure', price: 400, duration_minutes: 45, is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, name: 'Hair Spa', price: 1500, duration_minutes: 90, is_active: true, created_at: now, updated_at: now }
  ];
  await knex('salon_services').insert(services).onConflict('id').ignore();
  const dbServices = await knex('salon_services').where({ business_id: BUSINESS_ID }).limit(6);

  // 5. SEED PACKAGES
  const packages = [
    { business_id: BUSINESS_ID, name: 'Bridal Glow Package', description: 'Complete bridal preparation', price: 6000, validity_days: 30, is_active: true, created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, name: 'Weekend Relaxation', description: 'Spa, facial and massage', price: 2500, validity_days: 15, is_active: true, created_at: now, updated_at: now }
  ];
  // Ignore conflict since packages might not have a unique constraint on name easily, we'll just insert if empty or let it error/ignore.
  try {
     await knex('packages').insert(packages).onConflict('id').ignore();
  } catch(e) {}

  // 6. SEED EXPENSES
  const expenses = [
    { business_id: BUSINESS_ID, category: 'Electricity', amount: 3500, date: addDays(now, -5).toISOString().split('T')[0], description: 'Monthly electricity bill', payment_method: 'bank_transfer', created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, category: 'Supplies', amount: 15000, date: addDays(now, -2).toISOString().split('T')[0], description: 'Loreal Shampoos and Creams', payment_method: 'upi', created_at: now, updated_at: now },
    { business_id: BUSINESS_ID, category: 'Maintenance', amount: 1200, date: now.toISOString().split('T')[0], description: 'AC Repair', payment_method: 'cash', created_at: now, updated_at: now }
  ];
  try {
     await knex('expenses').insert(expenses).onConflict('id').ignore();
  } catch(e) {}

  // 7. SEED APPOINTMENTS (10 Appointments across 5 days)
  if (dbCustomers.length >= 5 && dbStaff.length >= 3) {
    const statuses = ['completed', 'scheduled', 'no_show', 'cancelled', 'scheduled'];
    const appointments = [];
    
    for (let i = 0; i < 12; i++) {
      const isPast = i < 5;
      const apptDate = isPast ? addDays(now, -1 * (i + 1)) : addDays(now, i % 5);
      const startHour = 10 + (i % 8); // Spread between 10 AM to 5 PM
      
      appointments.push({
        business_id: BUSINESS_ID,
        customer_id: dbCustomers[i % dbCustomers.length].id,
        staff_member_id: dbStaff[i % dbStaff.length].id,
        appointment_date: apptDate.toISOString().split('T')[0],
        start_time: generateTime(startHour),
        end_time: generateTime(startHour + 1),
        status: isPast ? (i % 4 === 0 ? 'cancelled' : 'completed') : statuses[i % statuses.length],
        notes: `Test appointment ${i + 1}`,
        created_at: now,
        updated_at: now
      });
    }
    try {
      await knex('appointments').insert(appointments).onConflict('id').ignore();
    } catch(e) {}
  }

  console.log(`Successfully seeded EXTENSIVE realistic data for Business ID: ${BUSINESS_ID}`);
};
