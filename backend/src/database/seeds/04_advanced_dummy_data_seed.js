export async function seed(knex) {
  console.log('Seeding packages, memberships, and attendances...');

  const business = await knex('businesses').first();
  if (!business) {
    console.error('No business found. Run 01_initial_seed first.');
    return;
  }
  const businessId = business.id;

  // Clear existing
  await knex('customer_packages').del();
  await knex('customer_memberships').del();
  await knex('package_items').del();
  await knex('packages').del();
  await knex('memberships').del();
  await knex('staff_attendance').del();
  
  // Also add some more leads to hit 10
  const existingLeadsCount = await knex('leads').where('business_id', businessId).count('* as count').first();
  if (existingLeadsCount.count < 10) {
    const moreLeads = [
      { business_id: businessId, name: 'Ankita Singh', phone: '9871112233', source: 'Facebook', status: 'contacted', notes: 'Interested in Hair Color' },
      { business_id: businessId, name: 'Manoj Tiwari', phone: '9871112234', source: 'Walk-in', status: 'converted', notes: 'Booked appointment' },
      { business_id: businessId, name: 'Ritu Gupta', phone: '9871112235', source: 'Instagram', status: 'new', notes: 'Wants to know about bridal packages' },
      { business_id: businessId, name: 'Preeti Sharma', phone: '9871112236', source: 'Website', status: 'lost', notes: 'Too expensive for her' },
      { business_id: businessId, name: 'Naveen Kumar', phone: '9871112237', source: 'Referral', status: 'follow_up', notes: 'Call back next week' },
      { business_id: businessId, name: 'Komal Verma', phone: '9871112238', source: 'Instagram', status: 'new', notes: 'Asked for timings' }
    ];
    await knex('leads').insert(moreLeads);
  }

  // 1. Memberships
  const membershipsData = [
    { business_id: businessId, name: 'Silver Membership', price: 5000, duration_months: 6, discount_percentage: 10, max_members: 100 },
    { business_id: businessId, name: 'Gold Membership', price: 8000, duration_months: 12, discount_percentage: 15, max_members: 50 },
    { business_id: businessId, name: 'Platinum Membership', price: 12000, duration_months: 12, discount_percentage: 25, max_members: 20 },
    { business_id: businessId, name: 'Student Plan', price: 3000, duration_months: 6, discount_percentage: 15, max_members: 200 },
    { business_id: businessId, name: 'VIP Access', price: 20000, duration_months: 24, discount_percentage: 30, max_members: 10 }
  ];
  
  const membershipIds = [];
  for (const m of membershipsData) {
    const [id] = await knex('memberships').insert(m);
    membershipIds.push(id);
  }

  // 2. Packages
  const packagesData = [
    { business_id: businessId, name: 'Bridal Glow Package', total_price: 15000, validity_days: 90, max_uses: 5 },
    { business_id: businessId, name: 'Summer Hair Rescue', total_price: 3500, validity_days: 30, max_uses: 2 },
    { business_id: businessId, name: 'Mens Grooming Kit', total_price: 1500, validity_days: 30, max_uses: 3 },
    { business_id: businessId, name: 'Weekend Spa Retreat', total_price: 4500, validity_days: 15, max_uses: 1 },
    { business_id: businessId, name: 'Festive Prep', total_price: 6000, validity_days: 45, max_uses: 4 }
  ];

  const packageIds = [];
  for (const p of packagesData) {
    const [id] = await knex('packages').insert(p);
    packageIds.push(id);
  }

  // Fetch some services for package items
  const services = await knex('salon_services').where('business_id', businessId).limit(5);
  if (services.length > 0) {
    for (const pid of packageIds) {
      await knex('package_items').insert({
        package_id: pid,
        service_id: services[Math.floor(Math.random() * services.length)].id,
        quantity: 2
      });
      await knex('package_items').insert({
        package_id: pid,
        service_id: services[Math.floor(Math.random() * services.length)].id,
        quantity: 1
      });
    }
  }

  // 3. Customer Memberships & Packages
  const customers = await knex('customers').where('business_id', businessId).limit(10);
  for (let i = 0; i < customers.length; i++) {
    const custId = customers[i].id;
    
    // Assign Membership to every alternate customer
    if (i % 2 === 0) {
      const start = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 6);
      
      await knex('customer_memberships').insert({
        customer_id: custId,
        membership_id: membershipIds[Math.floor(Math.random() * membershipIds.length)],
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        status: 'active'
      });
    }

    // Assign Package to every 3rd customer
    if (i % 3 === 0) {
      await knex('customer_packages').insert({
        customer_id: custId,
        package_id: packageIds[Math.floor(Math.random() * packageIds.length)],
        remaining_uses: 3,
        status: 'active'
      });
    }
  }

  // 4. Staff Attendance
  const staffs = await knex('staff_members').where('business_id', businessId);
  const today = new Date();
  
  for (const staff of staffs) {
    // Generate 7 days of attendance
    for (let i = 0; i < 7; i++) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      
      const isSunday = d.getDay() === 0;
      const status = isSunday ? 'weekly_off' : (Math.random() > 0.1 ? 'present' : 'absent');
      
      await knex('staff_attendance').insert({
        staff_member_id: staff.id,
        business_id: businessId,
        date: dateStr,
        status: status,
        check_in_time: status === 'present' ? '09:30:00' : null,
        check_out_time: status === 'present' ? '18:30:00' : null,
        total_hours: status === 'present' ? 9 : 0
      });
    }
  }

  console.log('✅ Advanced dummy data (packages, memberships, attendances) seeded successfully!');
}
