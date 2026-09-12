import bcrypt from 'bcryptjs';

export async function seed(knex) {
  console.log('Seeding extensive dummy data...');

  // Get business
  const business = await knex('businesses').where({ slug: 'luxe-salon' }).first();
  if (!business) {
    console.error('Luxe Salon business not found. Run 01_initial_seed first.');
    return;
  }
  const businessId = business.id;

  // Clear data created by this script
  await knex('payments').del();
  await knex('invoice_items').del();
  await knex('invoices').del();
  await knex('appointment_services').del();
  await knex('appointments').del();
  await knex('leads').del();
  await knex('expenses').del();
  await knex('customers').del();
  // Don't delete all users/staff, just the dummy ones
  await knex('staff_members').where('business_id', businessId).del();
  await knex('users').where('role', 'staff').del();

  // 1. Create Staff Members
  const staffData = [
    { first_name: 'Neha', last_name: 'Sharma', specialization: 'Hair Specialist', email: 'neha@luxesalon.com', phone: '9876543211', avatar_url: 'https://i.pravatar.cc/150?u=neha' },
    { first_name: 'Aman', last_name: 'Verma', specialization: 'Grooming Expert', email: 'aman@luxesalon.com', phone: '9876543212', avatar_url: 'https://i.pravatar.cc/150?u=aman' },
    { first_name: 'Sneha', last_name: 'Kapoor', specialization: 'Skin Specialist', email: 'sneha@luxesalon.com', phone: '9876543213', avatar_url: 'https://i.pravatar.cc/150?u=sneha' },
    { first_name: 'Vikram', last_name: 'Singh', specialization: 'Senior Stylist', email: 'vikram@luxesalon.com', phone: '9876543214', avatar_url: 'https://i.pravatar.cc/150?u=vikram' },
    { first_name: 'Pooja', last_name: 'Mehta', specialization: 'Nail Artist', email: 'pooja@luxesalon.com', phone: '9876543215', avatar_url: 'https://i.pravatar.cc/150?u=pooja' }
  ];

  const passwordHash = await bcrypt.hash('Staff@123', 12);
  const staffMembers = [];

  for (const staff of staffData) {
    const [userId] = await knex('users').insert({
      business_id: businessId,
      email: staff.email,
      password_hash: passwordHash,
      first_name: staff.first_name,
      last_name: staff.last_name,
      phone: staff.phone,
      role: 'staff',
      avatar_url: staff.avatar_url,
      is_active: true
    });

    const [staffId] = await knex('staff_members').insert({
      business_id: businessId,
      user_id: userId,
      designation: staff.specialization,
      specializations: JSON.stringify([staff.specialization]),
      is_available: true
    });

    staffMembers.push({ id: staffId, ...staff });
  }

  // 2. Create Customers
  const customerNames = [
    'Priya Sharma', 'Rohit Kumar', 'Anjali Mehta', 'Siddharth Jain', 'Meera Verma',
    'Kavya Singh', 'Riya Arora', 'Simran Kaur', 'Arjun Kapoor', 'Alka Rani',
    'Rajat Malhotra', 'Dev Patel', 'Swati Gupta', 'Karan Johar', 'Sunita Rao'
  ];

  const customers = [];
  for (let i = 0; i < customerNames.length; i++) {
    const [first, last] = customerNames[i].split(' ');
    const [customerId] = await knex('customers').insert({
      business_id: businessId,
      first_name: first,
      last_name: last || '',
      phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `${first.toLowerCase()}.${i}@example.com`,
      gender: i % 2 === 0 ? 'female' : 'male',
      created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Random join date in last 90 days
    });
    customers.push({ id: customerId, first_name: first, last_name: last });
  }

  // 3. Fetch Services for appointments
  const services = await knex('salon_services').where({ business_id: businessId });
  const getRandService = () => services[Math.floor(Math.random() * services.length)];
  const getRandCustomer = () => customers[Math.floor(Math.random() * customers.length)];
  const getRandStaff = () => staffMembers[Math.floor(Math.random() * staffMembers.length)];

  // 4. Generate Appointments & Invoices
  // We'll generate appointments for today, yesterday, and tomorrow
  const today = new Date();
  const dates = [
    new Date(today.getTime() - 24 * 60 * 60 * 1000), // Yesterday
    today, // Today
    new Date(today.getTime() + 24 * 60 * 60 * 1000) // Tomorrow
  ];

  const timeSlots = ['10:00:00', '11:00:00', '12:00:00', '13:00:00', '14:00:00', '15:00:00', '16:00:00', '17:00:00'];
  let invoiceCounter = 100;

  for (const date of dates) {
    const dateStr = date.toISOString().split('T')[0];
    const isPast = date < today && date.getDate() !== today.getDate();
    const isToday = date.getDate() === today.getDate();

    // Generate ~10 appointments per day
    for (let i = 0; i < 10; i++) {
      const customer = getRandCustomer();
      const staff = getRandStaff();
      const service = getRandService();
      const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
      
      const startHour = parseInt(timeSlot.split(':')[0]);
      const endHour = startHour + Math.ceil(service.duration_minutes / 60);
      const endTime = `${endHour.toString().padStart(2, '0')}:${(service.duration_minutes % 60).toString().padStart(2, '0')}:00`;

      let status = 'planned';
      if (isPast) status = 'completed';
      if (isToday && startHour < 14) status = 'completed'; // Assumes current time is > 2 PM for demo
      if (isToday && startHour >= 14 && startHour < 16) status = 'ongoing';

      const [appointmentId] = await knex('appointments').insert({
        business_id: businessId,
        customer_id: customer.id,
        staff_member_id: staff.id,
        appointment_date: dateStr,
        start_time: timeSlot,
        end_time: endTime,
        status: status,
        source: Math.random() > 0.7 ? 'walk_in' : 'online',
        created_at: new Date(date.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000)
      });

      await knex('appointment_services').insert({
        appointment_id: appointmentId,
        service_id: service.id,
        staff_member_id: staff.id,
        price: service.price,
        duration_minutes: service.duration_minutes
      });

      // Generate invoice for completed appointments
      if (status === 'completed') {
        const subtotal = Number(service.price);
        const tax = subtotal * 0.18;
        const total = subtotal + tax;

        const [invoiceId] = await knex('invoices').insert({
          business_id: businessId,
          invoice_number: `INV-${invoiceCounter++}`,
          customer_id: customer.id,
          appointment_id: appointmentId,
          subtotal: subtotal,
          tax_amount: tax,
          cgst_amount: tax / 2,
          sgst_amount: tax / 2,
          total_amount: total,
          paid_amount: total,
          due_amount: 0,
          status: 'paid',
          payment_status: 'completed',
          created_at: new Date(`${dateStr}T${endTime}`)
        });

        // Update appointment with invoice_id
        await knex('appointments').where('id', appointmentId).update({ invoice_id: invoiceId });

        await knex('invoice_items').insert({
          invoice_id: invoiceId,
          item_type: 'service',
          item_id: service.id,
          item_name: service.name,
          quantity: 1,
          unit_price: service.price,
          tax_amount: tax,
          total_price: total
        });

        await knex('payments').insert({
          business_id: businessId,
          invoice_id: invoiceId,
          customer_id: customer.id,
          amount: total,
          payment_method: Math.random() > 0.5 ? 'card' : 'upi',
          status: 'success',
          created_at: new Date(`${dateStr}T${endTime}`)
        });
      }
    }
  }

  // 5. Create Expenses
  const expCategories = await knex('expense_categories').where({ business_id: businessId });
  if (expCategories.length > 0) {
    for (let i = 0; i < 5; i++) {
      await knex('expenses').insert({
        business_id: businessId,
        category_id: expCategories[i % expCategories.length].id,
        amount: Math.floor(Math.random() * 5000) + 500,
        payment_method: 'card',
        expense_date: new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Routine expense ${i+1}`
      });
    }
  }

  // 6. Create Leads (Enquiry)
  const leadNames = ['Vikash Dubey', 'Sonal Jain', 'Rahul Dravid', 'Anita Desai'];
  for (let i = 0; i < leadNames.length; i++) {
    await knex('leads').insert({
      business_id: businessId,
      name: leadNames[i],
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      source: i % 2 === 0 ? 'Instagram' : 'Website',
      status: i === 0 ? 'new' : 'follow_up',
      notes: 'Interested in bridal makeup package',
      created_at: new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    });
  }

  console.log('✅ Extensive dummy data seeded successfully!');
}
